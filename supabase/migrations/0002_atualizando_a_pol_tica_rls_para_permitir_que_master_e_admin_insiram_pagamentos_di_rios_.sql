-- Desabilitar RLS temporariamente para modificar a política (se necessário, mas geralmente não é preciso para DROP/CREATE POLICY)
-- ALTER TABLE public.pagamentos_diarios DISABLE ROW LEVEL SECURITY;

-- Remover a política de INSERT existente (se houver uma com o mesmo nome ou que cause conflito)
DROP POLICY IF EXISTS "Master e Admin podem inserir pagamentos" ON public.pagamentos_diarios;

-- Criar a nova política de INSERT para pagamentos_diarios
CREATE POLICY "Master e Admin podem inserir pagamentos" ON public.pagamentos_diarios
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.usuarios
    WHERE role = 'master' OR role = 'admin'
  )
);

-- Reabilitar RLS (se foi desabilitado)
-- ALTER TABLE public.pagamentos_diarios ENABLE ROW LEVEL SECURITY;