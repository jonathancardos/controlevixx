-- Tabela para pagamentos diários de funcionários
CREATE TABLE public.pagamentos_diarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  valor NUMERIC(10, 2) NOT NULL,
  data_pagamento DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security) para a tabela pagamentos_diarios
ALTER TABLE public.pagamentos_diarios ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para pagamentos_diarios
-- Funcionários podem ver seus próprios pagamentos
CREATE POLICY "Funcionarios podem ver seus proprios pagamentos" ON public.pagamentos_diarios
FOR SELECT TO authenticated USING (auth.uid() = usuario_id);

-- Master/Admin podem inserir pagamentos
CREATE POLICY "Master e Admin podem inserir pagamentos" ON public.pagamentos_diarios
FOR INSERT TO authenticated WITH CHECK (
  auth.uid() IN (SELECT id FROM public.usuarios WHERE role = 'master' OR role = 'admin')
);

-- Master/Admin podem atualizar pagamentos
CREATE POLICY "Master e Admin podem atualizar pagamentos" ON public.pagamentos_diarios
FOR UPDATE TO authenticated USING (
  auth.uid() IN (SELECT id FROM public.usuarios WHERE role = 'master' OR role = 'admin')
);

-- Master/Admin podem deletar pagamentos
CREATE POLICY "Master e Admin podem deletar pagamentos" ON public.pagamentos_diarios
FOR DELETE TO authenticated USING (
  auth.uid() IN (SELECT id FROM public.usuarios WHERE role = 'master' OR role = 'admin')
);

-- Trigger para atualizar 'updated_at' automaticamente
CREATE TRIGGER update_pagamentos_diarios_updated_at
BEFORE UPDATE ON public.pagamentos_diarios
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();