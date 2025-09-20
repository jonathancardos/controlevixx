import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, User, Calendar, DollarSign, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PublicOrderItem {
  nome_insumo: string;
  categoria: string;
  quantidade: number;
  unidade_medida: string;
  preco_unitario_estimado: number;
  observacoes?: string;
}

interface PublicOrder {
  id: string;
  titulo: string;
  descricao: string;
  prioridade: 'Baixa' | 'Normal' | 'Alta' | 'Urgente';
  data_necessidade: string;
  total_estimado: number;
  created_at: string;
  usuarios: { nome_usuario: string };
  itens_pedido_insumos: PublicOrderItem[];
}

export function PublicOrderView() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) {
        setError('ID do pedido não fornecido.');
        setLoading(false);
        return;
      }

      try {
        // A URL da sua função Edge do Supabase
        // Substitua 'jynukooqgcdeecmjizbi' pelo seu Project ID do Supabase
        const response = await fetch(`https://jynukooqgcdeecmjizbi.supabase.co/functions/v1/get-public-order?id=${id}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao carregar pedido.');
        }

        const data: PublicOrder = await response.json();
        setOrder(data);
      } catch (err: any) {
        console.error('Erro ao buscar pedido público:', err);
        setError(err.message || 'Não foi possível carregar os detalhes do pedido.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando lista de compras...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
        <Card className="w-full max-w-md text-center vixxe-shadow rounded-xl">
          <CardHeader>
            <CardTitle className="text-red-500 text-2xl font-bold">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Verifique se o link está correto ou tente novamente mais tarde.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
        <Card className="w-full max-w-md text-center vixxe-shadow rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Pedido Não Encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">A lista de compras que você está procurando não existe ou foi removida.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case 'Baixa': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Normal': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Alta': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'Urgente': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-vixxe-gradient-subtle p-4 flex items-center justify-center">
      <Card className="w-full max-w-3xl vixxe-shadow border-primary/20 bg-card/95 backdrop-blur-sm rounded-xl">
        <CardHeader className="text-center space-y-2">
          <ShoppingCart className="w-12 h-12 mx-auto text-primary mb-2" />
          <CardTitle className="text-3xl font-bold bg-vixxe-gradient bg-clip-text text-transparent">
            Lista de Compras: {order.titulo}
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            Detalhes do pedido de insumos para compra.
          </CardDescription>
          <Separator className="my-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-base text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <User className="w-4 h-4" />
              <span>Solicitante: {order.usuarios?.nome_usuario || 'Desconhecido'}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Criado em: {format(new Date(order.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {order.descricao && (
            <div>
              <h3 className="font-semibold text-xl mb-2">Descrição do Pedido:</h3>
              <p className="p-3 bg-muted rounded-lg text-base">{order.descricao}</p>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-xl mb-2 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Itens Necessários ({order.itens_pedido_insumos.length})
            </h3>
            <div className="space-y-3">
              {order.itens_pedido_insumos.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-background/50 rounded-lg border hover:bg-background/70 transition-colors hover-scale">
                  <div>
                    <p className="font-medium text-base">{item.nome_insumo}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantidade} {item.unidade_medida} ({item.categoria})
                    </p>
                    {item.observacoes && (
                      <p className="text-xs text-muted-foreground mt-1">Obs: {item.observacoes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      R$ {(item.preco_unitario_estimado * item.quantidade).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      (R$ {item.preco_unitario_estimado.toFixed(2)}/un)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
            <span className="font-semibold text-xl flex items-center gap-2">
              <DollarSign className="w-6 h-6" />
              Total Estimado:
            </span>
            <span className="text-2xl font-bold text-primary">
              R$ {order.total_estimado.toFixed(2)}
            </span>
          </div>

          <div className="text-center text-base text-muted-foreground mt-6">
            <p>Prioridade: <Badge className={getPriorityColor(order.prioridade)}>{order.prioridade}</Badge></p>
            {order.data_necessidade && (
              <p className="mt-2">Necessário até: {format(new Date(order.data_necessidade), 'dd/MM/yyyy', { locale: ptBR })}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PublicOrderView;