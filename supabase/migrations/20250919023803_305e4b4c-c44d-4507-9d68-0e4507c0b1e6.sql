-- Enable RLS only on tables that don't have it yet, without creating duplicate policies

-- Check if orders table needs RLS enabled (if the policy creation failed, it means it already has RLS)
DO $$
BEGIN
    -- Check if orders table has RLS enabled, if not, enable it
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'orders' AND relrowsecurity = true
    ) THEN
        ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Check if sales_categories table has RLS enabled, if not, enable it  
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'sales_categories' AND relrowsecurity = true
    ) THEN
        ALTER TABLE public.sales_categories ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies only if they don't exist
DO $$
BEGIN
    -- Policy for orders table
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' AND policyname = 'Allow all operations on orders'
    ) THEN
        CREATE POLICY "Allow all operations on orders" 
        ON public.orders 
        FOR ALL 
        TO authenticated 
        USING (true) 
        WITH CHECK (true);
    END IF;

    -- Policy for sales_categories table
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sales_categories' AND policyname = 'Allow all operations on sales_categories'
    ) THEN
        CREATE POLICY "Allow all operations on sales_categories" 
        ON public.sales_categories 
        FOR ALL 
        TO authenticated 
        USING (true) 
        WITH CHECK (true);
    END IF;
END $$;