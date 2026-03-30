# Vibe Importer

Shopify 商品自动化工具，将本地商品素材（图片 + `info.txt` / `product.json`）自动解析并生成 Shopify 可导入 CSV。

## 技术栈

- Next.js 14 + App Router + TypeScript
- Tailwind CSS + shadcn 风格基础组件
- Supabase PostgreSQL
- `sharp` 图片处理
- Vercel 部署

## 安装与运行

1. clone 仓库
2. 执行 `npm install`
3. 执行 `cp .env.local.example .env.local` 并填入 Supabase 配置
4. 在 Supabase 执行 `lib/supabase-schema.sql` 建表
5. 执行 `npm run dev`
6. 访问 `http://localhost:3000`

## 目录说明

- `app/`: 页面与 API 路由
- `components/`: 业务组件与基础 UI 组件
- `lib/`: Supabase、解析器、CSV 生成和图片处理逻辑
- `workspace/imports/`: 待扫描导入的本地商品目录
- `exports/`: 导出 CSV 与处理后的图片输出目录
