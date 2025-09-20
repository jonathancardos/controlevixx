-- Criar tabelas para sistema de insumos e pedidos
-- Categorias de insumos
CREATE TABLE public.categorias_insumos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insumos
CREATE TABLE public.insumos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria_id UUID NOT NULL REFERENCES public.categorias_insumos(id) ON DELETE CASCADE,
  descricao TEXT,
  unidade_medida TEXT NOT NULL DEFAULT 'UN', -- KG, L, UN, etc.
  preco_unitario NUMERIC(10,2),
  estoque_minimo INTEGER DEFAULT 0,
  estoque_atual INTEGER DEFAULT 0,
  fornecedor TEXT,
  codigo_interno TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(nome, categoria_id)
);

-- Pedidos de insumos
CREATE TABLE public.pedidos_insumos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id),
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em Análise', 'Aprovado', 'Rejeitado', 'Finalizado')),
  prioridade TEXT DEFAULT 'Normal' CHECK (prioridade IN ('Baixa', 'Normal', 'Alta', 'Urgente')),
  data_necessidade DATE,
  observacoes_admin TEXT,
  total_estimado NUMERIC(10,2) DEFAULT 0,
  link_publico_compra TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Itens do pedido de insumos
CREATE TABLE public.itens_pedido_insumos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.pedidos_insumos(id) ON DELETE CASCADE,
  insumo_id UUID REFERENCES public.insumos(id),
  nome_insumo TEXT NOT NULL, -- Para casos onde insumo não existe ainda
  categoria TEXT,
  quantidade INTEGER NOT NULL DEFAULT 1,
  unidade_medida TEXT NOT NULL DEFAULT 'UN',
  preco_unitario_estimado NUMERIC(10,2),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notificações do sistema
CREATE TABLE public.notificacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES public.usuarios(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('pedido_insumo', 'sistema', 'aprovacao')),
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  pedido_relacionado_id UUID REFERENCES public.pedidos_insumos(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS para todas as tabelas
ALTER TABLE public.categorias_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_pedido_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permitir todas as operações por enquanto)
CREATE POLICY "Permitir todas operações em categorias_insumos" ON public.categorias_insumos FOR ALL USING (true);
CREATE POLICY "Permitir todas operações em insumos" ON public.insumos FOR ALL USING (true);
CREATE POLICY "Permitir todas operações em pedidos_insumos" ON public.pedidos_insumos FOR ALL USING (true);
CREATE POLICY "Permitir todas operações em itens_pedido_insumos" ON public.itens_pedido_insumos FOR ALL USING (true);
CREATE POLICY "Permitir todas operações em notificacoes" ON public.notificacoes FOR ALL USING (true);

-- Triggers para atualizar updated_at
CREATE TRIGGER update_categorias_insumos_updated_at
  BEFORE UPDATE ON public.categorias_insumos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_insumos_updated_at
  BEFORE UPDATE ON public.insumos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pedidos_insumos_updated_at
  BEFORE UPDATE ON public.pedidos_insumos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir algumas categorias padrão
INSERT INTO public.categorias_insumos (nome, descricao) VALUES
('Carnes', 'Carnes bovinas, suínas, aves e frutos do mar'),
('Pães e Massas', 'Pães artesanais, massas para hambúrguer'),
('Vegetais e Saladas', 'Verduras, legumes e ingredientes para saladas'),
('Laticínios', 'Queijos, manteigas, cremes e molhos'),
('Condimentos', 'Temperos, molhos, azeites e condimentos'),
('Bebidas', 'Refrigerantes, sucos, águas e outras bebidas'),
('Descartáveis', 'Embalagens, guardanapos, copos e utensílios'),
('Limpeza', 'Produtos de limpeza e higienização'),
('Outros', 'Outros insumos diversos');

-- Inserir alguns insumos exemplo
INSERT INTO public.insumos (nome, categoria_id, descricao, unidade_medida, preco_unitario, estoque_minimo) 
SELECT 
  'Hambúrguer Artesanal 180g', 
  c.id, 
  'Hambúrguer artesanal de carne bovina 180g',
  'UN',
  8.50,
  50
FROM public.categorias_insumos c WHERE c.nome = 'Carnes'
LIMIT 1;

INSERT INTO public.insumos (nome, categoria_id, descricao, unidade_medida, preco_unitario, estoque_minimo) 
SELECT 
  'Pão de Hambúrguer Brioche', 
  c.id, 
  'Pão brioche artesanal para hambúrguer',
  'UN',
  2.80,
  100
FROM public.categorias_insumos c WHERE c.nome = 'Pães e Massas'
LIMIT 1;

INSERT INTO public.insumos (nome, categoria_id, descricao, unidade_medida, preco_unitario, estoque_minimo) 
SELECT 
  'Queijo Cheddar Fatia', 
  c.id, 
  'Fatias de queijo cheddar para hambúrguer',
  'UN',
  1.20,
  200
FROM public.categorias_insumos c WHERE c.nome = 'Laticínios'
LIMIT 1;