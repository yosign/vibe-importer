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
