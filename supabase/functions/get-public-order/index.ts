import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      auth: {
        persistSession: false,
      },
    }
  );

  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get('id');

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'ID do pedido não fornecido' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { data: pedido, error: pedidoError } = await supabaseClient
      .from('pedidos_insumos')
      .select(`
        id,
        titulo,
        descricao,
        prioridade,
        data_necessidade,
        total_estimado,
        created_at,
        usuarios ( nome_usuario ),
        itens_pedido_insumos (
          nome_insumo,
          categoria,
          quantidade,
          unidade_medida,
          preco_unitario_estimado,
          observacoes
        )
      `)
      .eq('id', orderId)
      .single();

    if (pedidoError) {
      console.error('Erro ao buscar pedido:', pedidoError);
      return new Response(JSON.stringify({ error: 'Pedido não encontrado ou erro no servidor' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    return new Response(JSON.stringify(pedido), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro na função Edge:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});