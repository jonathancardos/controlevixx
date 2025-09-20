-- Criar tabela para armazenar comandas/pedidos
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  order_date DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  items JSONB NOT NULL,
  raw_text TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para categorias de vendas
CREATE TABLE public.sales_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  max_value DECIMAL(10,2) NOT NULL,
  current_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para clientes
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  total_spent DECIMAL(10,2) NOT NULL DEFAULT 0,
  last_order_date DATE,
  order_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Criar políticas para permitir acesso público (para começar)
-- Nota: Depois implementaremos autenticação adequada
CREATE POLICY "Allow all operations on orders" ON public.orders FOR ALL USING (true);
CREATE POLICY "Allow all operations on sales_categories" ON public.sales_categories FOR ALL USING (true);
CREATE POLICY "Allow all operations on clients" ON public.clients FOR ALL USING (true);

-- Inserir categorias padrão
INSERT INTO public.sales_categories (category_key, label, max_value, current_value) VALUES
  ('hamburguer', 'Hambúrguers', 15000, 12500),
  ('pizzas', 'Pizzas', 12000, 9200),
  ('acai', 'Açaí', 10000, 7800),
  ('bebidas', 'Bebidas', 8000, 6500);

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_categories_updated_at
  BEFORE UPDATE ON public.sales_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para atualizar dados do cliente quando um pedido é criado/atualizado
CREATE OR REPLACE FUNCTION public.update_client_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir ou atualizar cliente
  INSERT INTO public.clients (name, total_spent, last_order_date, order_count)
  VALUES (NEW.client_name, NEW.total_amount, NEW.order_date, 1)
  ON CONFLICT (name) DO UPDATE SET
    total_spent = clients.total_spent + NEW.total_amount,
    last_order_date = GREATEST(clients.last_order_date, NEW.order_date),
    order_count = clients.order_count + 1,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger para atualizar estatísticas do cliente
CREATE TRIGGER update_client_stats_on_order
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_stats();