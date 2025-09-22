// Export types from the auto-generated supabase types
export type { Database } from '@/integrations/supabase/types';
import { Database } from '@/integrations/supabase/types';
import { OrderItem, ServiceType } from '@/types/dashboard'; // Importar OrderItem e ServiceType

// Export commonly used types
export type Usuario = Database['public']['Tables']['usuarios']['Row'];
export type UsuarioInsert = Database['public']['Tables']['usuarios']['Insert'];
export type UsuarioUpdate = Database['public']['Tables']['usuarios']['Update'];

export type Comanda = Database['public']['Tables']['comandas']['Row'] & {
  tipo_servico: 'local' | 'retirada' | 'entrega';
  status_pagamento: 'Pendente' | 'Confirmado';
  status_entrega: 'Pendente' | 'Em Rota' | 'Entregue';
  orderNumber?: string | null; // Novo campo
  address?: string | null; // Novo campo
  reference?: string | null; // Novo campo
  deliveryFee?: number | null; // Novo campo
  amountReceived?: number | null; // Novo campo
  changeAmount?: number | null; // Novo campo
  prepTimeMin?: number | null; // Novo campo
  prepTimeMax?: number | null; // Novo campo
};
export type ComandaInsert = Omit<Database['public']['Tables']['comandas']['Insert'], 'items'> & {
  items?: OrderItem[] | null; // Agora é um array de OrderItem
  orderNumber?: string | null; // Novo campo
  address?: string | null; // Novo campo
  reference?: string | null; // Novo campo
  deliveryFee?: number | null; // Novo campo
  amountReceived?: number | null; // Novo campo
  changeAmount?: number | null; // Novo campo
  prepTimeMin?: number | null; // Novo campo
  prepTimeMax?: number | null; // Novo campo
};
export type ComandaUpdate = Omit<Database['public']['Tables']['comandas']['Update'], 'items'> & {
  items?: OrderItem[] | null; // Agora é um array de OrderItem
  orderNumber?: string | null; // Novo campo
  address?: string | null; // Novo campo
  reference?: string | null; // Novo campo
  deliveryFee?: number | null; // Novo campo
  amountReceived?: number | null; // Novo campo
  changeAmount?: number | null; // Novo campo
  prepTimeMin?: number | null; // Novo campo
  prepTimeMax?: number | null; // Novo campo
};

export type Cliente = Database['public']['Tables']['clientes']['Row'] & {
  endereco?: string | null;
  preferencias?: string | null;
  observacoes?: string | null;
  total_gasto_semana: number | null;
  total_pedidos_semana: number | null;
  total_gasto_mes: number | null;
  total_pedidos_mes: number | null;
  last_week_reset_date: string | null;
  last_month_reset_date: string | null;
  is_vip: boolean | null;
  vip_combo_available: boolean | null;
  admin_set_week_start_date?: string | null; // Nova coluna
  admin_set_month_start_date?: string | null; // Nova coluna
  meta_valor_semanal: number | null; // Nova coluna
  meta_pedidos_semanal: number | null; // Nova coluna
  nivel_vip: string | null; // Nova coluna
  historico_vip: any | null; // Nova coluna
};
export type ClienteInsert = Database['public']['Tables']['clientes']['Insert'];
export type ClienteUpdate = Database['public']['Tables']['clientes']['Update'];

export type Insumo = Database['public']['Tables']['insumos']['Row'];
export type InsumoInsert = Database['public']['Tables']['insumos']['Insert'];
export type InsumoUpdate = Database['public']['Tables']['insumos']['Update'];

export type CategoriaInsumo = Database['public']['Tables']['categorias_insumos']['Row'];
export type CategoriaInsumoInsert = Database['public']['Tables']['categorias_insumos']['Insert'];
export type CategoriaInsumoUpdate = Database['public']['Tables']['categorias_insumos']['Update'];

// PedidoInsumo agora inclui as relações 'usuarios' e 'itens_pedido_insumos'
export type PedidoInsumo = Database['public']['Tables']['pedidos_insumos']['Row'] & {
  usuarios?: { nome_usuario: string } | null;
  itens?: ItemPedidoInsumo[] | null; // Renomeado de itens_pedido_insumos para itens para consistência com o uso
};
export type PedidoInsumoInsert = Database['public']['Tables']['pedidos_insumos']['Insert'];
export type PedidoInsumoUpdate = Database['public']['Tables']['pedidos_insumos']['Update'];

export type ItemPedidoInsumo = Database['public']['Tables']['itens_pedido_insumos']['Row'];
export type ItemPedidoInsumoInsert = Database['public']['Tables']['itens_pedido_insumos']['Insert'];
export type ItemPedidoInsumoUpdate = Database['public']['Tables']['itens_pedido_insumos']['Update'];

export type Notificacao = Database['public']['Tables']['notificacoes']['Row'];
export type NotificacaoInsert = Database['public']['Tables']['notificacoes']['Insert'];
export type NotificacaoUpdate = Database['public']['Tables']['notificacoes']['Update'];

// New types for financial features
export type PagamentoDiario = Database['public']['Tables']['pagamentos_diarios']['Row'];
export type PagamentoDiarioInsert = Database['public']['Tables']['pagamentos_diarios']['Insert'] & {
  tipo?: 'diaria' | 'deducao_falta' | 'deducao_atraso' | 'deducao_outros' | null;
};
export type PagamentoDiarioUpdate = Database['public']['Tables']['pagamentos_diarios']['Update'];

export type QuinzenaPagamento = Database['public']['Tables']['quinzenas_pagamento']['Row'];
export type QuinzenaPagamentoInsert = Database['public']['Tables']['quinzenas_pagamento']['Insert'];
export type QuinzenaPagamentoUpdate = Database['public']['Tables']['quinzenas_pagamento']['Update'];

// New types for PDV system
export type Produto = Database['public']['Tables']['produtos']['Row'];
export type ProdutoInsert = Database['public']['Tables']['produtos']['Insert'];
export type ProdutoUpdate = Database['public']['Tables']['produtos']['Update'];

export type CategoriaProduto = Database['public']['Tables']['categorias_produtos']['Row'];
export type CategoriaProdutoInsert = Database['public']['Tables']['categorias_produtos']['Insert'];
export type CategoriaProdutoUpdate = Database['public']['Tables']['categorias_produtos']['Update'];

// New types for Comanda Templates
export type ComandaTemplate = Database['public']['Tables']['comanda_templates']['Row'];
export type ComandaTemplateInsert = Database['public']['Tables']['comanda_templates']['Insert'];
export type ComandaTemplateUpdate = Database['public']['Tables']['comanda_templates']['Update'];


// Interfaces for filters and other types
export interface FiltroComandas {
  dataInicio?: string;
  dataFim?: string;
  cliente?: string;
  clienteNome?: string;
  status?: string;
  formaPagamento?: string;
  valorMinimo?: number;
  valorMaximo?: number;
}