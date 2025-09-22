-- Tabela para datas de quinzena de pagamento
CREATE TABLE public.quinzenas_pagamento (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  data_quinzena DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security) para a tabela quinzenas_pagamento
ALTER TABLE public.quinzenas_pagamento ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para quinzenas_pagamento
-- Funcionários podem ver suas próprias quinzenas
CREATE POLICY "Funcionarios podem ver suas proprias quinzenas" ON public.quinzenas_pagamento
FOR SELECT TO authenticated USING (auth.uid() = usuario_id);

-- Master/Admin podem inserir quinzenas
CREATE POLICY "Master e Admin podem inserir quinzenas" ON public.quinzenas_pagamento
FOR INSERT TO authenticated WITH CHECK (
  auth.uid() IN (SELECT id FROM public.usuarios WHERE role = 'master' OR role = 'admin')
);

-- Master/Admin podem atualizar quinzenas
CREATE POLICY "Master e Admin podem atualizar quinzenas" ON public.quinzenas_pagamento
FOR UPDATE TO authenticated USING (
  auth.uid() IN (SELECT id FROM public.usuarios WHERE role = 'master' OR role = 'admin')
);

-- Master/Admin podem deletar quinzenas
CREATE POLICY "Master e Admin podem deletar quinzenas" ON public.quinzenas_pagamento
FOR DELETE TO authenticated USING (
  auth.uid() IN (SELECT id FROM public.usuarios WHERE role = 'master' OR role = 'admin')
);

-- Trigger para atualizar 'updated_at' automaticamente
CREATE TRIGGER update_quinzenas_pagamento_updated_at
BEFORE UPDATE ON public.quinzenas_pagamento
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();