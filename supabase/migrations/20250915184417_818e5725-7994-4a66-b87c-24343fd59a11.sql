-- Criar tabela de clientes
CREATE TABLE public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  email text,
  total_gasto numeric(10,2) default 0,
  total_pedidos integer default 0,
  ultimo_pedido timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Criar tabela de comandas
CREATE TABLE public.comandas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id) on delete set null,
  cliente_nome text not null,
  valor numeric(10,2) not null,
  forma_pagamento text check (
    forma_pagamento in ('Pix','Cartão','Dinheiro','Outros')
  ),
  texto_original text,
  items jsonb default '[]'::jsonb,
  data date not null default current_date,
  horario time with time zone default current_time,
  status text default 'Processada' check (status in ('Processada','Cancelada','Pendente')),
  observacoes text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Criar tabela de usuários
CREATE TABLE public.usuarios (
  id uuid primary key default gen_random_uuid(),
  nome_usuario text unique not null,
  senha text not null,
  role text check (role in ('master','admin','gestor','funcionario')) default 'gestor',
  ativo boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permissivo para desenvolvimento, ajustar conforme necessário)
CREATE POLICY "Permitir todas operações em clientes" ON public.clientes FOR ALL USING (true);
CREATE POLICY "Permitir todas operações em comandas" ON public.comandas FOR ALL USING (true);
CREATE POLICY "Permitir todas operações em usuarios" ON public.usuarios FOR ALL USING (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comandas_updated_at BEFORE UPDATE ON public.comandas 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON public.usuarios 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para atualizar estatísticas do cliente
CREATE OR REPLACE FUNCTION public.atualizar_stats_cliente()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir ou atualizar cliente
  INSERT INTO public.clientes (nome, total_gasto, total_pedidos, ultimo_pedido)
  VALUES (NEW.cliente_nome, NEW.valor, 1, NEW.created_at)
  ON CONFLICT (nome) DO UPDATE SET
    total_gasto = public.clientes.total_gasto + NEW.valor,
    total_pedidos = public.clientes.total_pedidos + 1,
    ultimo_pedido = GREATEST(public.clientes.ultimo_pedido, NEW.created_at),
    updated_at = timezone('utc'::text, now());
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar stats do cliente quando uma comanda é inserida
CREATE TRIGGER atualizar_stats_cliente_trigger
  AFTER INSERT ON public.comandas
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_stats_cliente();

-- Inserir usuário master inicial (senha: 1234, usando hash bcrypt básico)
INSERT INTO public.usuarios (nome_usuario, senha, role)
VALUES ('cardoso', '$2b$10$rOLnl.VkTnVcvSk8O5J8Lu0h0YYMcvJOBK5Vb6lO9cqQdFzQ7OXIm', 'master');

-- Índices para performance
CREATE INDEX idx_comandas_data ON public.comandas(data);
CREATE INDEX idx_comandas_cliente_nome ON public.comandas(cliente_nome);
CREATE INDEX idx_comandas_forma_pagamento ON public.comandas(forma_pagamento);
CREATE INDEX idx_clientes_nome ON public.clientes(nome);
CREATE INDEX idx_usuarios_nome_usuario ON public.usuarios(nome_usuario);