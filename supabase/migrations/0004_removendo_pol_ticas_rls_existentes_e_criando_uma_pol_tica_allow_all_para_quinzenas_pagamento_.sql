-- Remover políticas RLS existentes para quinzenas_pagamento
DROP POLICY IF EXISTS "Funcionarios podem ver suas proprias quinzenas" ON public.quinzenas_pagamento;
DROP POLICY IF EXISTS "Master e Admin podem inserir quinzenas" ON public.quinzenas_pagamento;
DROP POLICY IF EXISTS "Master e Admin podem atualizar quinzenas" ON public.quinzenas_pagamento;
DROP POLICY IF EXISTS "Master e Admin podem deletar quinzenas" ON public.quinzenas_pagamento;

-- Criar uma nova política RLS que permite todas as operações para todos os usuários (compromisso de segurança)
CREATE POLICY "Allow all for quinzenas_pagamento" ON public.quinzenas_pagamento
FOR ALL
USING (true)
WITH CHECK (true);