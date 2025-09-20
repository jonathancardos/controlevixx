export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      categorias_insumos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      categorias_produtos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          admin_set_month_start_date: string | null
          admin_set_week_start_date: string | null
          combo_vip_usado_semana: boolean | null
          created_at: string | null
          data_inicio_semana_personalizada: string | null
          email: string | null
          endereco: string | null
          historico_vip: Json | null
          id: string
          is_vip: boolean | null
          last_month_reset_date: string | null
          last_week_reset_date: string | null
          meta_pedidos_semanal: number | null
          meta_valor_semanal: number | null
          nivel_vip: string | null
          nome: string
          observacoes: string | null
          pontos_acumulados: number | null
          preferencias: string | null
          telefone: string | null
          total_gasto: number | null
          total_gasto_mes: number | null
          total_gasto_semana: number | null
          total_pedidos: number | null
          total_pedidos_mes: number | null
          total_pedidos_semana: number | null
          ultimo_pedido: string | null
          updated_at: string | null
          vip_combo_available: boolean | null
        }
        Insert: {
          admin_set_month_start_date?: string | null
          admin_set_week_start_date?: string | null
          combo_vip_usado_semana?: boolean | null
          created_at?: string | null
          data_inicio_semana_personalizada?: string | null
          email?: string | null
          endereco?: string | null
          historico_vip?: Json | null
          id?: string
          is_vip?: boolean | null
          last_month_reset_date?: string | null
          last_week_reset_date?: string | null
          meta_pedidos_semanal?: number | null
          meta_valor_semanal?: number | null
          nivel_vip?: string | null
          nome: string
          observacoes?: string | null
          pontos_acumulados?: number | null
          preferencias?: string | null
          telefone?: string | null
          total_gasto?: number | null
          total_gasto_mes?: number | null
          total_gasto_semana?: number | null
          total_pedidos?: number | null
          total_pedidos_mes?: number | null
          total_pedidos_semana?: number | null
          ultimo_pedido?: string | null
          updated_at?: string | null
          vip_combo_available?: boolean | null
        }
        Update: {
          admin_set_month_start_date?: string | null
          admin_set_week_start_date?: string | null
          combo_vip_usado_semana?: boolean | null
          created_at?: string | null
          data_inicio_semana_personalizada?: string | null
          email?: string | null
          endereco?: string | null
          historico_vip?: Json | null
          id?: string
          is_vip?: boolean | null
          last_month_reset_date?: string | null
          last_week_reset_date?: string | null
          meta_pedidos_semanal?: number | null
          meta_valor_semanal?: number | null
          nivel_vip?: string | null
          nome?: string
          observacoes?: string | null
          pontos_acumulados?: number | null
          preferencias?: string | null
          telefone?: string | null
          total_gasto?: number | null
          total_gasto_mes?: number | null
          total_gasto_semana?: number | null
          total_pedidos?: number | null
          total_pedidos_mes?: number | null
          total_pedidos_semana?: number | null
          ultimo_pedido?: string | null
          updated_at?: string | null
          vip_combo_available?: boolean | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          created_at: string
          id: string
          last_order_date: string | null
          name: string
          order_count: number
          phone: string | null
          total_spent: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_order_date?: string | null
          name: string
          order_count?: number
          phone?: string | null
          total_spent?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_order_date?: string | null
          name?: string
          order_count?: number
          phone?: string | null
          total_spent?: number
          updated_at?: string
        }
        Relationships: []
      }
      comandas: {
        Row: {
          cliente_id: string | null
          cliente_nome: string
          created_at: string | null
          data: string
          deliveryFee: number | null
          forma_pagamento: string | null
          horario: string | null
          id: string
          items: Json | null
          observacoes: string | null
          orderNumber: string | null
          prepTimeMax: number | null
          prepTimeMin: number | null
          reference: string | null
          status: string | null
          status_entrega: string | null
          status_pagamento: string | null
          texto_original: string | null
          tipo_servico: string | null
          updated_at: string | null
          valor: number
          address: string | null
          amountReceived: number | null
          changeAmount: number | null
        }
        Insert: {
          cliente_id?: string | null
          cliente_nome: string
          created_at?: string | null
          data?: string
          deliveryFee?: number | null
          forma_pagamento?: string | null
          horario?: string | null
          id?: string
          items?: Json | null
          observacoes?: string | null
          orderNumber?: string | null
          prepTimeMax?: number | null
          prepTimeMin?: number | null
          reference?: string | null
          status?: string | null
          status_entrega?: string | null
          status_pagamento?: string | null
          texto_original?: string | null
          tipo_servico?: string | null
          updated_at?: string | null
          valor: number
          address?: string | null
          amountReceived?: number | null
          changeAmount?: number | null
        }
        Update: {
          cliente_id?: string | null
          cliente_nome?: string
          created_at?: string | null
          data?: string
          deliveryFee?: number | null
          forma_pagamento?: string | null
          horario?: string | null
          id?: string
          items?: Json | null
          observacoes?: string | null
          orderNumber?: string | null
          prepTimeMax?: number | null
          prepTimeMin?: number | null
          reference?: string | null
          status?: string | null
          status_entrega?: string | null
          status_pagamento?: string | null
          texto_original?: string | null
          tipo_servico?: string | null
          updated_at?: string | null
          valor?: number
          address?: string | null
          amountReceived?: number | null
          changeAmount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "comandas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      comanda_templates: {
        Row: {
          created_at: string | null
          id: string
          is_active_daily: boolean | null
          template_content: string
          template_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active_daily?: boolean | null
          template_content: string
          template_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active_daily?: boolean | null
          template_content?: string
          template_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comanda_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      insumos: {
        Row: {
          ativo: boolean | null
          categoria_id: string
          codigo_interno: string | null
          created_at: string | null
          descricao: string | null
          estoque_atual: number | null
          estoque_minimo: number | null
          fornecedor: string | null
          id: string
          nome: string
          preco_unitario: number | null
          unidade_medida: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          categoria_id: string
          codigo_interno?: string | null
          created_at?: string | null
          descricao?: string | null
          estoque_atual?: number | null
          estoque_minimo?: number | null
          fornecedor?: string | null
          id?: string
          nome: string
          preco_unitario?: number | null
          unidade_medida?: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          categoria_id?: string
          codigo_interno?: string | null
          created_at?: string | null
          descricao?: string | null
          estoque_atual?: number | null
          estoque_minimo?: number | null
          fornecedor?: string | null
          id?: string
          nome?: string
          preco_unitario?: number | null
          unidade_medida?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insumos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_insumos"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_pedido_insumos: {
        Row: {
          categoria: string | null
          created_at: string | null
          id: string
          insumo_id: string | null
          nome_insumo: string
          observacoes: string | null
          pedido_id: string | null
          preco_unitario_estimado: number | null
          quantidade: number
          unidade_medida: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          id?: string
          insumo_id?: string | null
          nome_insumo: string
          observacoes?: string | null
          pedido_id?: string | null
          preco_unitario_estimado?: number | null
          quantidade?: number
          unidade_medida?: string
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          id?: string
          insumo_id?: string | null
          nome_insumo?: string
          observacoes?: string | null
          pedido_id?: string | null
          preco_unitario_estimado?: number | null
          quantidade?: number
          unidade_medida?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_pedido_insumos_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_pedido_insumos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_insumos"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string | null
          id: string
          lida: boolean | null
          mensagem: string
          pedido_relacionado_id: string | null
          tipo: string
          titulo: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lida?: boolean | null
          mensagem: string
          pedido_relacionado_id?: string | null
          tipo: string
          titulo: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lida?: boolean | null
          mensagem?: string
          pedido_relacionado_id?: string | null
          tipo?: string
          titulo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_pedido_relacionado_id_fkey"
            columns: ["pedido_relacionado_id"]
            isOneToOne: false
            referencedRelation: "pedidos_insumos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          client_name: string
          created_at: string
          id: string
          items: Json
          order_date: string
          payment_method: string
          raw_text: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          client_name: string
          created_at?: string
          id?: string
          items: Json
          order_date: string
          payment_method: string
          raw_text?: string | null
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          client_name?: string
          created_at?: string
          id?: string
          items?: Json
          order_date?: string
          payment_method?: string
          raw_text?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      pagamentos_diarios: {
        Row: {
          created_at: string | null
          data_pagamento: string
          id: string
          observacoes: string | null
          status: string | null
          tipo: string | null
          updated_at: string | null
          usuario_id: string | null
          valor: number
        }
        Insert: {
          created_at?: string | null
          data_pagamento: string
          id?: string
          observacoes?: string | null
          status?: string | null
          tipo?: string | null
          updated_at?: string | null
          usuario_id?: string | null
          valor: number
        }
        Update: {
          created_at?: string | null
          data_pagamento?: string
          id?: string
          observacoes?: string | null
          status?: string | null
          tipo?: string | null
          updated_at?: string | null
          usuario_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_diarios_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_insumos: {
        Row: {
          created_at: string | null
          data_necessidade: string | null
          descricao: string | null
          id: string
          link_publico_compra: string | null
          observacoes_admin: string | null
          prioridade: string | null
          status: string | null
          titulo: string
          total_estimado: number | null
          updated_at: string | null
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          data_necessidade?: string | null
          descricao?: string | null
          id?: string
          link_publico_compra?: string | null
          observacoes_admin?: string | null
          prioridade?: string | null
          status?: string | null
          titulo: string
          total_estimado?: number | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          data_necessidade?: string | null
          descricao?: string | null
          id?: string
          link_publico_compra?: string | null
          observacoes_admin?: string | null
          prioridade?: string | null
          status?: string | null
          titulo?: string
          total_estimado?: number | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_insumos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean | null
          categoria_id: string | null
          created_at: string | null
          descricao: string | null
          id: string
          imagem_url: string | null
          nome: string
          preco: number
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          categoria_id?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          nome: string
          preco?: number
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          categoria_id?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          nome?: string
          preco?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      quinzenas_pagamento: {
        Row: {
          created_at: string | null
          data_fim: string
          data_inicio: string | null
          id: string
          status: string
          updated_at: string | null
          usuario_id: string | null
          valor_meta: number
        }
        Insert: {
          created_at?: string | null
          data_fim: string
          data_inicio?: string | null
          id?: string
          status?: string
          updated_at?: string | null
          usuario_id?: string | null
          valor_meta?: number
        }
        Update: {
          created_at?: string | null
          data_fim?: string
          data_inicio?: string | null
          id?: string
          status?: string
          updated_at?: string | null
          usuario_id?: string | null
          valor_meta?: number
        }
        Relationships: [
          {
            foreignKeyName: "quinzenas_pagamento_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_categories: {
        Row: {
          category_key: string
          created_at: string
          current_value: number
          id: string
          label: string
          max_value: number
          updated_at: string
        }
        Insert: {
          category_key: string
          created_at?: string
          current_value?: number
          id?: string
          label: string
          max_value: number
          updated_at?: string
        }
        Update: {
          category_key?: string
          created_at?: string
          current_value?: number
          id?: string
          label?: string
          max_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      solicitacoes_novo_insumo: {
        Row: {
          created_at: string | null
          data_necessidade: string | null
          descricao: string
          id: string
          prioridade: string
          titulo: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          data_necessidade?: string | null
          descricao: string
          id?: string
          prioridade?: string
          titulo: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          data_necessidade?: string | null
          descricao?: string
          id?: string
          prioridade?: string
          titulo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_novo_insumo_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string
          nome_usuario: string
          role: string | null
          senha: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome_usuario: string
          role?: string | null
          senha: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome_usuario?: string
          role?: string | null
          senha?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      atualizar_status_vip_cliente: {
        Args: { cliente_uuid: string }
        Returns: boolean
      }
      calcular_status_vip: {
        Args:
          | { cliente_uuid: string; pedidos_meta?: number; valor_meta?: number }
          | { p_cliente_id: string; p_data_inicio_semana?: string }
        Returns: {
          is_vip: boolean
          pedidos_semana: number
          progresso_pedidos: number
          progresso_valor: number
          valor_gasto_semana: number
          vip_combo_available: boolean
        }[]
      }
      marcar_combo_vip_usado: {
        Args: { cliente_uuid: string }
        Returns: boolean
      }
      ranking_clientes_mensal: {
        Args:
          | { month_param: number; year_param: number }
          | { p_ano?: number; p_limite?: number; p_mes?: number }
        Returns: {
          cliente_id: string
          cliente_nome: string
          pedidos: number
          posicao: number
          valor_gasto: number
        }[]
      }
      ranking_clientes_semanal: {
        Args:
          | { default_week_start_date?: string }
          | { p_data_inicio?: string; p_limite?: number }
        Returns: {
          cliente_id: string
          cliente_nome: string
          is_vip: boolean
          nivel_vip: string
          pedidos: number
          posicao: number
          valor_gasto: number
        }[]
      }
      resetar_status_vip_semanal: {
        Args: Record<PropertyKey, never> | { cliente_uuid: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const