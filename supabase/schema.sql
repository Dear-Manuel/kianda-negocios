-- Kianda Negócios — schema Supabase
-- Corre este ficheiro no editor SQL do teu projeto Supabase (uma vez).
-- Ativa "Email" em Authentication > Providers para login por email.

-- ========== NEGÓCIO ==========

create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  owner_name text not null,
  business_name text not null,
  sector text,
  phone text,
  start_date date not null default current_date,
  initial_cash numeric not null default 0,
  created_at timestamptz default now()
);

-- ========== PRODUTOS ==========

create table if not exists categories (
  id text primary key,
  user_id uuid references auth.users not null,
  name text not null,
  color text not null,
  created_at timestamptz default now()
);

create table if not exists products (
  id text primary key,
  user_id uuid references auth.users not null,
  category_id text references categories(id),
  name text not null,
  unit text default 'unidade',
  sale_price numeric not null default 0,
  low_stock_threshold numeric default 3,
  created_at timestamptz default now()
);

-- Lote de compra — cada abastecimento de stock cria um lote com o seu
-- próprio preço de compra. As vendas consomem lotes por ordem FIFO.
create table if not exists batches (
  id text primary key,
  user_id uuid references auth.users not null,
  product_id text references products(id) not null,
  purchase_price numeric not null,
  quantity numeric not null,
  quantity_remaining numeric not null,
  purchase_date date not null,
  source text default 'compra', -- 'compra' | 'stock_inicial' | 'ajuste'
  purchase_session_id text,
  supplier_id text,
  created_at timestamptz default now()
);

-- Kardex — histórico completo de entradas e saídas por produto
create table if not exists stock_movements (
  id text primary key,
  user_id uuid references auth.users not null,
  product_id text references products(id) not null,
  type text not null, -- 'compra' | 'stock_inicial' | 'ajuste_entrada' | 'ajuste_saida' | 'venda' | 'estorno_venda'
  quantity numeric not null,
  date date not null,
  note text,
  related_id text,
  created_at timestamptz default now()
);

-- ========== COMPRAS (sessões de abastecimento / "dia de compra") ==========

create table if not exists purchase_sessions (
  id text primary key,
  user_id uuid references auth.users not null,
  date date not null,
  notes text,
  transport_cost numeric default 0,
  food_cost numeric default 0,
  other_cost numeric default 0,
  payment_method text default 'vista',
  supplier_id text,
  created_at timestamptz default now()
);

-- ========== VENDAS ==========

create table if not exists sales (
  id text primary key,
  user_id uuid references auth.users not null,
  product_id text references products(id) not null,
  quantity numeric not null,
  unit_price numeric not null,
  unit_cost numeric not null,
  total numeric not null,
  customer_id text,
  is_on_credit boolean default false,
  date date not null,
  created_at timestamptz default now()
);

create table if not exists sale_batch_consumptions (
  id text primary key,
  user_id uuid references auth.users not null,
  sale_id text references sales(id) not null,
  batch_id text references batches(id) not null,
  quantity numeric not null,
  unit_cost numeric not null
);

-- ========== CAIXA ==========

create table if not exists cash_transactions (
  id text primary key,
  user_id uuid references auth.users not null,
  type text check (type in ('entrada', 'saida')) not null,
  category text not null,
  amount numeric not null,
  description text,
  date date not null,
  related_id text,
  created_at timestamptz default now()
);

-- ========== CLIENTES (contas a receber) ==========

create table if not exists customers (
  id text primary key,
  user_id uuid references auth.users not null,
  name text not null,
  phone text,
  created_at timestamptz default now()
);

create table if not exists customer_debts (
  id text primary key,
  user_id uuid references auth.users not null,
  customer_id text references customers(id) not null,
  amount numeric not null,
  amount_paid numeric default 0,
  description text,
  due_date date,
  date date not null,
  sale_id text,
  created_at timestamptz default now()
);

-- ========== FORNECEDORES (contas a pagar) ==========

create table if not exists suppliers (
  id text primary key,
  user_id uuid references auth.users not null,
  name text not null,
  phone text,
  created_at timestamptz default now()
);

create table if not exists supplier_debts (
  id text primary key,
  user_id uuid references auth.users not null,
  supplier_id text references suppliers(id) not null,
  amount numeric not null,
  amount_paid numeric default 0,
  description text,
  due_date date,
  date date not null,
  created_at timestamptz default now()
);

-- ========== LEMBRETES ==========

create table if not exists reminders (
  id text primary key,
  user_id uuid references auth.users not null,
  title text not null,
  datetime timestamptz not null,
  repeat text check (repeat in ('nenhuma', 'semanal', 'mensal')) default 'nenhuma',
  done boolean default false,
  related_type text,
  related_id text
);

-- ========== ROW LEVEL SECURITY ==========

alter table businesses enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table batches enable row level security;
alter table stock_movements enable row level security;
alter table purchase_sessions enable row level security;
alter table sales enable row level security;
alter table sale_batch_consumptions enable row level security;
alter table cash_transactions enable row level security;
alter table customers enable row level security;
alter table customer_debts enable row level security;
alter table suppliers enable row level security;
alter table supplier_debts enable row level security;
alter table reminders enable row level security;

create policy "own_businesses" on businesses for all using (auth.uid() = user_id);
create policy "own_categories" on categories for all using (auth.uid() = user_id);
create policy "own_products" on products for all using (auth.uid() = user_id);
create policy "own_batches" on batches for all using (auth.uid() = user_id);
create policy "own_stock_movements" on stock_movements for all using (auth.uid() = user_id);
create policy "own_purchase_sessions" on purchase_sessions for all using (auth.uid() = user_id);
create policy "own_sales" on sales for all using (auth.uid() = user_id);
create policy "own_sale_batch_consumptions" on sale_batch_consumptions for all using (auth.uid() = user_id);
create policy "own_cash_transactions" on cash_transactions for all using (auth.uid() = user_id);
create policy "own_customers" on customers for all using (auth.uid() = user_id);
create policy "own_customer_debts" on customer_debts for all using (auth.uid() = user_id);
create policy "own_suppliers" on suppliers for all using (auth.uid() = user_id);
create policy "own_supplier_debts" on supplier_debts for all using (auth.uid() = user_id);
create policy "own_reminders" on reminders for all using (auth.uid() = user_id);
