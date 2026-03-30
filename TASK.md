# Vibe Importer — V1 搭建任务

## 目标
搭建一个 Shopify 商品自动化工具的完整 Next.js 应用（V1）。

---

## 技术栈
- Next.js 14 (App Router, TypeScript)
- shadcn/ui + Tailwind CSS
- Supabase（PostgreSQL）
- sharp（图片处理）
- Vercel 部署

---

## 初始化步骤

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --import-alias "@/*" --no-src-dir
npx shadcn@latest init -d
npx shadcn@latest add button badge card table tabs input select dialog separator sheet skeleton label toast --overwrite
npm install @supabase/supabase-js sharp chokidar
```

---

## 目录结构（必须严格按照）

```
vibe-importer/
├── app/
│   ├── page.tsx                    # 商品列表页
│   ├── import/page.tsx             # 导入扫描页
│   ├── products/[id]/page.tsx      # 商品编辑页
│   └── api/
│       ├── scan/route.ts           # 扫描 workspace/imports/
│       ├── parse/route.ts          # 解析单个商品文件夹
│       ├── products/route.ts       # 商品 CRUD
│       ├── images/route.ts         # 图片处理（sharp）
│       └── export/route.ts         # 生成 Shopify CSV
├── components/
│   ├── ui/                         # shadcn 自动生成
│   ├── ProductTable.tsx            # 商品列表表格
│   ├── ProductCard.tsx             # 商品卡片
│   ├── ImageEditor.tsx             # 图片预览+裁剪
│   └── CsvExportButton.tsx         # 导出 CSV 按钮
├── lib/
│   ├── supabase.ts                 # Supabase 客户端
│   ├── parser.ts                   # 解析引擎
│   ├── csvGenerator.ts             # Shopify CSV 生成
│   └── imageProcessor.ts           # sharp 图片处理
├── workspace/
│   └── imports/
│       └── .gitkeep
├── exports/
│   └── .gitkeep
├── .env.local.example
├── .gitignore
└── README.md
```

---

## Supabase 建表 SQL（写入 lib/supabase-schema.sql）

```sql
-- 商品主表
create table vi_products (
  id uuid primary key default gen_random_uuid(),
  folder_name text not null,
  title text not null,
  vendor text,
  type text,
  tags text,
  body_html text,
  option_name text default 'Color',
  status text default 'pending' check (status in ('pending', 'ready', 'exported')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 变体表
create table vi_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references vi_products(id) on delete cascade,
  option_value text,
  sku text,
  price numeric(10,2),
  inventory_qty int default 0
);

-- 图片表
create table vi_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references vi_products(id) on delete cascade,
  filename text,
  local_path text,
  sort_order int default 1,
  processed boolean default false
);
```

---

## 核心逻辑实现

### lib/parser.ts

解析商品文件夹，支持两种格式：

**product.json 格式（优先级高）：**
```json
{
  "title": "Silk Eye Mask",
  "vendor": "Clouduvet",
  "type": "Eye Mask",
  "tags": "sleep, silk",
  "bodyHtml": "<p>Soft silk eye mask</p>",
  "optionName": "Color",
  "variants": [
    { "optionValue": "Black", "sku": "EM-BLK-01", "price": "39.00", "inventoryQty": "120" }
  ]
}
```

**info.txt 格式（备用）：**
```
TITLE: Premium Goose Down Pillow
VENDOR: Clouduvet
TYPE: Pillow
TAGS: down, luxury, hotel
PRICE: 129.00
OPTION_NAME: Color

VARIANTS:
- White | PILLOW_WHITE_01 | 129.00 | 100
- Grey  | PILLOW_GREY_01  | 129.00 | 80

DESCRIPTION:
Premium goose down pillow with breathable cotton shell.
```

解析后，图片从 `images/` 子目录读取，按文件名数字排序（1.jpg < 2.jpg < 10.jpg）。

### lib/csvGenerator.ts

生成 Shopify 标准 CSV，字段顺序：
`Handle, Title, Body (HTML), Vendor, Type, Tags, Published, Option1 Name, Option1 Value, Variant SKU, Variant Price, Variant Inventory Qty, Image Src, Image Position`

- Handle = title 转小写，空格换连字符，去除特殊字符
- 多变体商品：第一行完整，后续行只填 Handle + Option1 Value + Variant SKU + Variant Price + Variant Inventory Qty
- 多图片：每张图片单独一行，只填 Handle + Image Src + Image Position
- 导出为 UTF-8 with BOM（Excel 打开不乱码）

### app/api/scan/route.ts (GET)

- 扫描 `workspace/imports/` 下所有子目录
- 判断是否为有效商品文件夹：含 `product.json` 或 `info.txt`
- 返回 `{ folders: string[], count: number }`

### app/api/parse/route.ts (POST)

- 接受 `{ folderName: string }`
- 调用 parser.ts 解析
- 写入 Supabase（vi_products + vi_variants + vi_images）
- 返回创建的 product id

### app/api/products/route.ts

- `GET` → 查询所有商品（含变体数量、图片数量）
- `PATCH /api/products/[id]` → 更新商品信息
- `DELETE /api/products/[id]` → 删除商品（级联）

### app/api/export/route.ts (POST)

- 接受 `{ productIds: string[] }`（空数组 = 全部 ready 状态）
- 生成 Shopify CSV
- 返回 CSV 文件流（`Content-Type: text/csv`）
- 下载后将对应商品状态改为 `exported`

### app/api/images/route.ts (POST)

- 接受 `{ imagePath: string, width?: number, height?: number, format?: 'webp'|'jpg' }`
- 用 sharp 处理图片（resize + 压缩）
- 返回处理后的图片 base64 或保存到 `exports/images/`

---

## 页面实现

### app/page.tsx — 商品列表

- 顶部：标题 "Vibe Importer" + 右上角 "Go to Import" 按钮 + "Export CSV" 按钮
- 筛选：状态 Tab（全部 / pending / ready / exported）
- 商品表格（ProductTable.tsx）：
  - 列：缩略图（第一张图）、标题、供应商、类型、变体数、状态 Badge、创建时间、操作（编辑/删除）
  - 支持行选择（checkbox），批量导出
- 使用 shadcn Table + Badge + Button 组件

### app/import/page.tsx — 导入页

- 标题 "Import Products"
- "Scan imports folder" 按钮 → 调用 /api/scan
- 展示扫描结果：文件夹列表，每行有 "Parse" 按钮
- 解析中显示 loading spinner（shadcn Skeleton）
- 解析完成后显示成功/失败状态
- 底部 "Back to Products" 链接

### app/products/[id]/page.tsx — 编辑页

- 左列：商品基本信息表单（Title, Vendor, Type, Tags, Description）
- 右列：图片列表（可拖拽排序，暂用上下移动按钮）+ 图片预览
- 底部：变体列表（可内联编辑 Price / SKU / Inventory）
- 保存按钮 → PATCH /api/products/[id]
- 使用 shadcn Input + Label + Card + Dialog 组件

---

## 环境变量（.env.local.example）

```
NEXT_PUBLIC_SUPABASE_URL=https://tllpqdkixomfyhhbucsc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

---

## .gitignore（追加）

```
workspace/imports/
exports/
.env.local
```

---

## README.md 内容

标题：Vibe Importer
描述：Shopify 商品自动化工具，将本地商品素材（图片 + info.txt / product.json）自动解析并生成 Shopify 可导入 CSV。

安装和运行说明（中文）：
1. clone 仓库
2. npm install
3. cp .env.local.example .env.local 并填入 Supabase 配置
4. 在 Supabase 执行 lib/supabase-schema.sql 建表
5. npm run dev
6. 访问 http://localhost:3000

---

## 完成后执行

```bash
git add -A
git commit -m "feat: V1 initial setup - Next.js + shadcn + Supabase"
git push -u origin main
openclaw system event --text "Done: vibe-importer V1 搭建完成，已推送到 GitHub" --mode now
```
