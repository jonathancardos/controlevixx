-- Remover políticas RLS existentes para pagamentos_diarios
DROP POLICY IF EXISTS "Funcionarios podem ver seus proprios pagamentos" ON public.pagamentos_diarios;
DROP POLICY IF EXISTS "Master e Admin podem atualizar pagamentos" ON public.pagamentos_diarios;
DROP POLICY IF EXISTS "Master e Admin podem deletar pagamentos" ON public.pagamentos_diarios;
DROP POLICY IF EXISTS "Master e Admin podem inserir pagamentos" ON public.pagamentos_diarios;

-- Criar uma nova política RLS que permite todas as operações para todos os usuários (compromisso de segurança)
CREATE POLICY "Allow all for pagamentos_diarios" ON public.pagamentos_diarios
FOR ALL
USING (true)
WITH CHECK (true);