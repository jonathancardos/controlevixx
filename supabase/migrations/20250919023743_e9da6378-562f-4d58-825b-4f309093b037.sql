-- Enable RLS on remaining tables that still need it

-- Based on the table schema, these tables don't have RLS enabled yet:
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_categories ENABLE ROW LEVEL SECURITY;

-- Add policies for these tables
CREATE POLICY "Allow all operations on clients" 
ON public.clients 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on orders" 
ON public.orders 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on sales_categories" 
ON public.sales_categories 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);