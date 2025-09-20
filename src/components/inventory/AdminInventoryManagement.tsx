import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  ShoppingCart, 
  AlertTriangle,
  Search,
  Filter,
  Bell,
  Check,
  Clock,
  X,
  ExternalLink,
  User,
  Calendar,
  Link as LinkIcon,
  Eye,
  CheckCircle,
  XCircle,
  Share2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useInventorySupabase } from '@/hooks/useInventorySupabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Usuario, PedidoInsumo, ItemPedidoInsumo } from '@/types/supabase'; // Importar ItemPedidoInsumo
import { EditPedidoInsumoSheet } from './EditPedidoInsumoSheet'; // Importar o novo componente

interface Categoria {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
}

interface Insumo {
  id: string;
  nome: string;
  categoria_id: string;
  descricao: string;
  unidade_medida: string;
  preco_unitario: number;
  estoque_minimo: number;
  estoque_atual: number;
  fornecedor: string;
  codigo_interno: string;
  ativo: boolean;
  categorias_insumos?: Categoria;
}

interface NovoInsumoForm {
  nome: string;
  categoria_id: string;
  descricao: string;
  unidade_medida: string;
  preco_unitario: number;
  estoque_minimo: number;
  estoque_atual: number;
  fornecedor: string;
  codigo_interno: string;
}

interface AdminInventoryManagementProps {
  user: Usuario;
}

export function AdminInventoryManagement({ user }: AdminInventoryManagementProps) {
  const [activeTab, setActiveTab] = useState('pedidos-pendentes');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [pedidos, setPedidos] = useState<PedidoInsumo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<PedidoInsumo | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [activeAccordionItem, setActiveAccordionItem] = useState<string | null>(null);


  // Form states
  const [novoInsumoForm, setNovoInsumoForm] = useState<NovoInsumoForm>({
    nome: '',
    categoria_id: '',
    descricao: '',
    unidade_medida: 'UN',
    preco_unitario: 0,
    estoque_minimo: 0,
    estoque_atual: 0,
    fornecedor: '',
    codigo_interno: ''
  });

  const [novaCategoriaForm, setNovaCategoriaForm] = useState({
    nome: '',
    descricao: ''
  });

  const [observacoesAdmin, setObservacoesAdmin] = useState('');
  const [linkCompra, setLinkCompra] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Carregar categorias
      const { data: categoriasData, error: categoriasError } = await supabase
        .from('categorias_insumos')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (categoriasError) {
        console.error('Erro ao carregar categorias:', categoriasError);
        toast.error('Erro ao carregar categorias');
        return;
      }

      // Carregar insumos
      const { data: insumosData, error: insumosError } = await supabase
        .from('insumos')
        .select(`
          *,
          categorias_insumos (
            id,
            nome,
            descricao,
            ativo
          )
        `)
        .eq('ativo', true)
        .order('nome');

      if (insumosError) {
        console.error('Erro ao carregar insumos:', insumosError);
        toast.error('Erro ao carregar insumos');
        return;
      }

      // Carregar pedidos com itens
      const { data: pedidosData, error: pedidosError } = await supabase
        .from('pedidos_insumos')
        .select(`
          *,
          usuarios (
            nome_usuario
          ),
          itens_pedido_insumos (
            id,
            nome_insumo,
            categoria,
            quantidade,
            unidade_medida,
            preco_unitario_estimado,
            observacoes
          )
        `)
        .order('created_at', { ascending: false });

      if (pedidosError) {
        console.error('Erro ao carregar pedidos:', pedidosError);
        toast.error('Erro ao carregar pedidos');
        return;
      }

      setCategorias(categoriasData || []);
      setInsumos(insumosData || []);
      setPedidos(pedidosData?.map(p => ({
        ...p,
        status: p.status as 'Pendente' | 'Em Análise' | 'Aprovado' | 'Rejeitado' | 'Finalizado',
        prioridade: p.prioridade as 'Baixa' | 'Normal' | 'Alta' | 'Urgente',
        itens: p.itens_pedido_insumos as ItemPedidoInsumo[] // Usar ItemPedidoInsumo aqui
      })) || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCriarCategoria = async () => {
    if (!novaCategoriaForm.nome) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }

    try {
      const { error } = await supabase
        .from('categorias_insumos')
        .insert({
          nome: novaCategoriaForm.nome,
          descricao: novaCategoriaForm.descricao
        });

      if (error) throw error;

      toast.success('Categoria criada com sucesso!');
      setNovaCategoriaForm({ nome: '', descricao: '' });
      carregarDados();
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      toast.error('Erro ao criar categoria');
    }
  };

  const handleExcluirCategoria = async (categoriaId: string, categoriaNome: string) => {
    if (user.role !== 'master') {
      toast.error('Você não tem permissão para excluir categorias.');
      return;
    }
    try {
      // Verificar se existem insumos associados a esta categoria
      const insumosAssociados = insumos.filter(insumo => insumo.categoria_id === categoriaId);
      if (insumosAssociados.length > 0) {
        toast.error(`Não é possível excluir a categoria "${categoriaNome}" pois existem ${insumosAssociados.length} insumos associados.`);
        return;
      }

      const { error } = await supabase
        .from('categorias_insumos')
        .delete()
        .eq('id', categoriaId);

      if (error) throw error;

      toast.success(`Categoria "${categoriaNome}" excluída com sucesso!`);
      carregarDados();
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      toast.error('Erro ao excluir categoria');
    }
  };

  const handleCriarInsumo = async () => {
    if (!novoInsumoForm.nome || !novoInsumoForm.categoria_id) {
      toast.error('Nome e categoria são obrigatórios');
      return;
    }

    try {
      const { error } = await supabase
        .from('insumos')
        .insert(novoInsumoForm);

      if (error) throw error;

      toast.success('Insumo criado com sucesso!');
      setNovoInsumoForm({
        nome: '',
        categoria_id: '',
        descricao: '',
        unidade_medida: 'UN',
        preco_unitario: 0,
        estoque_minimo: 0,
        estoque_atual: 0,
        fornecedor: '',
        codigo_interno: ''
      });
      carregarDados();
    } catch (error) {
      console.error('Erro ao criar insumo:', error);
      toast.error('Erro ao criar insumo');
    }
  };

  const handleExcluirInsumo = async (insumoId: string, insumoNome: string) => {
    if (user.role !== 'master') {
      toast.error('Você não tem permissão para excluir insumos.');
      return;
    }
    try {
      // Em vez de deletar, vamos desativar o insumo
      const { error } = await supabase
        .from('insumos')
        .update({ ativo: false })
        .eq('id', insumoId);

      if (error) throw error;

      toast.success(`Insumo "${insumoNome}" desativado com sucesso!`);
      carregarDados();
    } catch (error) {
      console.error('Erro ao desativar insumo:', error);
      toast.error('Erro ao desativar insumo');
    }
  };

  const atualizarStatusPedido = async (
    pedidoId: string, 
    novoStatus: 'Em Análise' | 'Aprovado' | 'Rejeitado' | 'Finalizado'
  ) => {
    try {
      const updates: any = { 
        status: novoStatus,
        observacoes_admin: observacoesAdmin || undefined
      };

      if (linkCompra && novoStatus === 'Aprovado') {
        updates.link_publico_compra = linkCompra;
      }

      const { error } = await supabase
        .from('pedidos_insumos')
        .update(updates)
        .eq('id', pedidoId);

      if (error) throw error;

      // Criar notificação para o usuário
      const pedido = pedidos.find(p => p.id === pedidoId);
      if (pedido) {
        await supabase
          .from('notificacoes')
          .insert({
            usuario_id: pedido.usuarios?.nome_usuario === 'cardoso' 
              ? (await supabase.from('usuarios').select('id').eq('nome_usuario', 'cardoso').single()).data?.id
              : null,
            tipo: 'aprovacao',
            titulo: `Pedido ${novoStatus}`,
            mensagem: `Seu pedido "${pedido.titulo}" foi ${novoStatus.toLowerCase()}`,
            pedido_relacionado_id: pedidoId
          });
      }

      toast.success(`Pedido ${novoStatus.toLowerCase()} com sucesso!`);
      setObservacoesAdmin('');
      setLinkCompra('');
      carregarDados();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleEditPedido = (pedido: PedidoInsumo) => {
    setSelectedPedido(pedido);
    setIsEditSheetOpen(true);
  };

  const handleSaveEditedPedido = async (id: string, updates: Partial<PedidoInsumo>) => {
    try {
      const { error } = await supabase
        .from('pedidos_insumos')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Pedido atualizado com sucesso!');
      setIsEditSheetOpen(false);
      setSelectedPedido(null);
      carregarDados();
    } catch (error) {
      console.error('Erro ao salvar edição do pedido:', error);
      toast.error('Erro ao salvar edição do pedido');
    }
  };

  const handleDeletePedido = async (pedidoId: string, pedidoTitulo: string) => {
    if (user.role !== 'master') {
      toast.error('Você não tem permissão para excluir pedidos.');
      return;
    }
    try {
      // Primeiro, excluir os itens_pedido_insumos relacionados
      const { error: deleteItemsError } = await supabase
        .from('itens_pedido_insumos')
        .delete()
        .eq('pedido_id', pedidoId);

      if (deleteItemsError) throw deleteItemsError;

      // Depois, excluir o pedido
      const { error: deletePedidoError } = await supabase
        .from('pedidos_insumos')
        .delete()
        .eq('id', pedidoId);

      if (deletePedidoError) throw deletePedidoError;

      toast.success(`Pedido "${pedidoTitulo}" excluído com sucesso!`);
      carregarDados();
    } catch (error) {
      console.error('Erro ao excluir pedido:', error);
      toast.error('Erro ao excluir pedido');
    }
  };

  const handleShareWhatsApp = (pedido: PedidoInsumo) => {
    if (user.role !== 'master') {
      toast.error('Você não tem permissão para compartilhar pedidos.');
      return;
    }
    let message = `*Pedido de Insumos: ${pedido.titulo}*\n\n`;
    message += `*Autor:* ${pedido.usuarios?.nome_usuario || 'Desconhecido'}\n`;
    message += `*Data de Necessidade:* ${format(new Date(pedido.data_necessidade), 'dd/MM/yyyy', { locale: ptBR })}\n\n`;
    message += `*Itens do Pedido:*\n`;
    pedido.itens?.forEach(item => {
      message += `- ${item.quantidade}x ${item.nome_insumo} (${item.unidade_medida}) - R$${((item.preco_unitario_estimado || 0) * item.quantidade).toFixed(2)}\n`;
    });
    message += `\n*Total Estimado:* R$${pedido.total_estimado?.toFixed(2)}`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const handleGeneratePublicLink = async (pedido: PedidoInsumo) => {
    if (user.role !== 'master') {
      toast.error('Você não tem permissão para gerar links públicos.');
      return;
    }
    if (!pedido.id) {
      toast.error('ID do pedido não disponível para gerar link.');
      return;
    }

    const publicLink = `${window.location.origin}/public-order/${pedido.id}`;
    
    try {
      await supabase
        .from('pedidos_insumos')
        .update({ link_publico_compra: publicLink })
        .eq('id', pedido.id);

      toast.success(
        <div className="flex flex-col items-start">
          <p className="font-medium">Link público gerado!</p>
          <a href={publicLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline text-sm break-all">
            {publicLink}
          </a>
          <p className="text-xs text-muted-foreground mt-1">Copie e compartilhe este link para a lista de compras.</p>
        </div>,
        { duration: 8000 }
      );
      carregarDados(); // Recarregar para mostrar o link salvo
    } catch (error) {
      console.error('Erro ao gerar link público:', error);
      toast.error('Erro ao gerar link público');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendente': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Em Análise': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Aprovado': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Rejeitado': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'Finalizado': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case 'Baixa': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Normal': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Alta': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'Urgente': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const pedidosPendentes = pedidos.filter(p => p.status === 'Pendente' || p.status === 'Em Análise');

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Administração de Insumos</h1>
          <p className="text-sm md:text-base text-muted-foreground">Gestão completa de insumos e aprovação de pedidos</p>
        </div>
        <Badge variant="outline" className="bg-red-500/10 text-red-500 text-xs md:text-sm">
          {pedidosPendentes.length} pedidos pendentes
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pedidos-pendentes">
            <Bell className="w-4 h-4 mr-2" />
            Pedidos ({pedidosPendentes.length})
          </TabsTrigger>
          <TabsTrigger value="todos-pedidos">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Todos Pedidos
          </TabsTrigger>
          <TabsTrigger value="insumos">
            <Package className="w-4 h-4 mr-2" />
            Gerenciar Insumos
          </TabsTrigger>
          <TabsTrigger value="categorias">
            <Filter className="w-4 h-4 mr-2" />
            Categorias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pedidos-pendentes" className="space-y-4">
          <Card className="vixxe-shadow rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Pedidos Pendentes de Aprovação
              </CardTitle>
              <CardDescription>
                Aprove, rejeite ou solicite modificações nos pedidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pedidosPendentes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                    <h3 className="text-lg font-medium mb-2">Todos os pedidos foram processados!</h3>
                    <p>Não há pedidos pendentes no momento.</p>
                  </div>
                ) : (
                  <Accordion type="single" collapsible value={activeAccordionItem} onValueChange={setActiveAccordionItem}>
                    {pedidosPendentes.map(pedido => (
                      <AccordionItem key={pedido.id} value={pedido.id} className="border-l-4 border-l-yellow-500 mb-4 rounded-lg overflow-hidden vixxe-shadow hover:scale-[1.01] transition-transform duration-200">
                        <AccordionTrigger className="p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex justify-between items-center w-full pr-4">
                            <div>
                              <h3 className="text-lg font-semibold text-left">{pedido.titulo}</h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-2 text-left">
                                <User className="w-4 h-4" />
                                {pedido.usuarios?.nome_usuario} • 
                                {format(new Date(pedido.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Badge className={getPriorityColor(pedido.prioridade)}>
                                {pedido.prioridade}
                              </Badge>
                              <Badge className={getStatusColor(pedido.status)}>
                                {pedido.status}
                              </Badge>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-6 border-t bg-card/50">
                          {pedido.descricao && (
                            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                              <h4 className="font-medium mb-1">Descrição:</h4>
                              <p className="text-sm">{pedido.descricao}</p>
                            </div>
                          )}

                          <div className="mb-4">
                            <h4 className="font-medium mb-2">Itens Solicitados ({pedido.itens?.length || 0}):</h4>
                            <div className="space-y-2">
                              {pedido.itens?.map((item, index) => (
                                <div key={index} className="flex justify-between items-center text-sm p-2 bg-background rounded hover:bg-muted/50 transition-colors">
                                  <div>
                                    <span className="font-medium">{item.nome_insumo}</span>
                                    <span className="text-muted-foreground ml-2">({item.categoria})</span>
                                  </div>
                                  <div className="text-right">
                                    <div>{item.quantidade} {item.unidade_medida}</div>
                                    <div className="text-muted-foreground">
                                      R$ {((item.quantidade || 0) * (item.preco_unitario_estimado || 0)).toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-between items-center mb-4">
                            <div className="text-sm">
                              {pedido.data_necessidade && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>Necessário até: {format(new Date(pedido.data_necessidade), 'dd/MM/yyyy', { locale: ptBR })}</span>
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">
                                Total: R$ {pedido.total_estimado?.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 border-t pt-4">
                            <div>
                              <Label htmlFor={`obs-${pedido.id}`} className="text-sm">
                                Observações do Administrador (opcional)
                              </Label>
                              <Textarea
                                id={`obs-${pedido.id}`}
                                placeholder="Adicione observações, modificações ou comentários..."
                                value={observacoesAdmin}
                                onChange={(e) => setObservacoesAdmin(e.target.value)}
                                rows={2}
                                className="mt-1"
                              />
                            </div>

                            <div>
                              <Label htmlFor={`link-${pedido.id}`} className="text-sm">
                                Link Público para Compra (opcional)
                              </Label>
                              <Input
                                id={`link-${pedido.id}`}
                                placeholder="https://exemplo.com/carrinho-compras"
                                value={linkCompra}
                                onChange={(e) => setLinkCompra(e.target.value)}
                                className="mt-1"
                              />
                            </div>

                            <div className="flex gap-2 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedPedido(pedido);
                                  setIsViewModalOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Ver Detalhes
                              </Button>

                              <Button
                                size="sm"
                                onClick={() => atualizarStatusPedido(pedido.id, 'Em Análise')}
                                className="bg-blue-500 hover:bg-blue-600"
                              >
                                <Clock className="w-4 h-4 mr-1" />
                                Em Análise
                              </Button>
                              
                              <Button
                                size="sm"
                                onClick={() => atualizarStatusPedido(pedido.id, 'Aprovado')}
                                className="bg-green-500 hover:bg-green-600"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Aprovar
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => atualizarStatusPedido(pedido.id, 'Rejeitado')}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Rejeitar
                              </Button>

                              {user.role === 'master' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditPedido(pedido)}
                                  >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Editar
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                      >
                                        <Trash2 className="w-4 h-4 mr-1" />
                                        Excluir
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Tem certeza que deseja excluir o pedido "{pedido.titulo}"?
                                          Esta ação não pode ser desfeita.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeletePedido(pedido.id, pedido.titulo)} className="bg-red-600 hover:bg-red-700">
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleShareWhatsApp(pedido)}
                                  >
                                    <Share2 className="w-4 h-4 mr-1" />
                                    WhatsApp
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleGeneratePublicLink(pedido)}
                                  >
                                    <LinkIcon className="w-4 h-4 mr-1" />
                                    Link Público
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="todos-pedidos" className="space-y-4">
          <Card className="vixxe-shadow rounded-xl">
            <CardHeader>
              <CardTitle>Histórico Completo de Pedidos</CardTitle>
              <CardDescription>Todos os pedidos do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pedidos.map(pedido => (
                  <Card key={pedido.id} className="border-l-4 border-l-primary/50 vixxe-shadow rounded-xl hover:scale-[1.01] transition-transform duration-200">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{pedido.titulo}</h3>
                          <p className="text-sm text-muted-foreground">
                            {pedido.usuarios?.nome_usuario} • {format(new Date(pedido.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getPriorityColor(pedido.prioridade)}>
                            {pedido.prioridade}
                          </Badge>
                          <Badge className={getStatusColor(pedido.status)}>
                            {pedido.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          {pedido.itens?.length || 0} itens • R$ {pedido.total_estimado?.toFixed(2)}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPedido(pedido);
                              setIsViewModalOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                          
                          {pedido.link_publico_compra && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(pedido.link_publico_compra, '_blank')}
                            >
                              <LinkIcon className="w-4 h-4 mr-1" />
                              Link
                            </Button>
                          )}
                          {user.role === 'master' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditPedido(pedido)}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Editar
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Excluir
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir o pedido "{pedido.titulo}"?
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeletePedido(pedido.id, pedido.titulo)} className="bg-red-600 hover:bg-red-700">
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insumos" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="vixxe-shadow rounded-xl">
              <CardHeader>
                <CardTitle>Novo Insumo</CardTitle>
                <CardDescription>Cadastrar um novo insumo no sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Nome do Insumo</Label>
                    <Input
                      placeholder="Ex: Hambúrguer Artesanal 180g"
                      value={novoInsumoForm.nome}
                      onChange={(e) => setNovoInsumoForm({ ...novoInsumoForm, nome: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label>Categoria</Label>
                    <Select
                      value={novoInsumoForm.categoria_id}
                      onValueChange={(value) => setNovoInsumoForm({ ...novoInsumoForm, categoria_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map(categoria => (
                          <SelectItem key={categoria.id} value={categoria.id}>
                            {categoria.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Unidade</Label>
                    <Select
                      value={novoInsumoForm.unidade_medida}
                      onValueChange={(value) => setNovoInsumoForm({ ...novoInsumoForm, unidade_medida: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UN">Unidade</SelectItem>
                        <SelectItem value="KG">Quilograma</SelectItem>
                        <SelectItem value="G">Grama</SelectItem>
                        <SelectItem value="L">Litro</SelectItem>
                        <SelectItem value="ML">Mililitro</SelectItem>
                        <SelectItem value="PCT">Pacote</SelectItem>
                        <SelectItem value="CX">Caixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Preço Unitário (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={novoInsumoForm.preco_unitario}
                      onChange={(e) => setNovoInsumoForm({ ...novoInsumoForm, preco_unitario: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  
                  <div>
                    <Label>Estoque Mínimo</Label>
                    <Input
                      type="number"
                      min="0"
                      value={novoInsumoForm.estoque_minimo}
                      onChange={(e) => setNovoInsumoForm({ ...novoInsumoForm, estoque_minimo: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  
                  <div>
                    <Label>Estoque Atual</Label>
                    <Input
                      type="number"
                      min="0"
                      value={novoInsumoForm.estoque_atual}
                      onChange={(e) => setNovoInsumoForm({ ...novoInsumoForm, estoque_atual: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  
                  <div>
                    <Label>Fornecedor</Label>
                    <Input
                      placeholder="Nome do fornecedor"
                      value={novoInsumoForm.fornecedor}
                      onChange={(e) => setNovoInsumoForm({ ...novoInsumoForm, fornecedor: e.target.value })}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label>Descrição</Label>
                    <Textarea
                      placeholder="Descrição detalhada do insumo"
                      value={novoInsumoForm.descricao}
                      onChange={(e) => setNovoInsumoForm({ ...novoInsumoForm, descricao: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>
                
                <Button onClick={handleCriarInsumo} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Insumo
                </Button>
              </CardContent>
            </Card>

            <Card className="vixxe-shadow rounded-xl">
              <CardHeader>
                <CardTitle>Insumos Cadastrados</CardTitle>
                <CardDescription>{insumos.length} insumos no sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {insumos.map(insumo => (
                    <div key={insumo.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors hover-scale">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-sm">{insumo.nome}</h4>
                          <p className="text-xs text-muted-foreground">
                            {insumo.categorias_insumos?.nome}
                          </p>
                        </div>
                        <Badge variant={insumo.estoque_atual <= insumo.estoque_minimo ? "destructive" : "secondary"}>
                          {insumo.estoque_atual} {insumo.unidade_medida}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>R$ {insumo.preco_unitario.toFixed(2)}</span>
                        <span className="text-muted-foreground">{insumo.fornecedor}</span>
                      </div>
                      {user.role === 'master' && (
                        <div className="flex justify-end mt-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Desativação</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja desativar o insumo <strong>{insumo.nome}</strong>?
                                  Ele não será mais visível para novos pedidos, mas poderá ser reativado.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleExcluirInsumo(insumo.id, insumo.nome)} className="bg-red-600 hover:bg-red-700">
                                  Desativar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categorias" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="vixxe-shadow rounded-xl">
              <CardHeader>
                <CardTitle>Nova Categoria</CardTitle>
                <CardDescription>Criar uma nova categoria de insumos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Nome da Categoria</Label>
                  <Input
                    placeholder="Ex: Carnes Premium"
                    value={novaCategoriaForm.nome}
                    onChange={(e) => setNovaCategoriaForm({ ...novaCategoriaForm, nome: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    placeholder="Descreva os tipos de insumos desta categoria"
                    value={novaCategoriaForm.descricao}
                    onChange={(e) => setNovaCategoriaForm({ ...novaCategoriaForm, descricao: e.target.value })}
                    rows={3}
                  />
                </div>
                
                <Button onClick={handleCriarCategoria} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Categoria
                </Button>
              </CardContent>
            </Card>

            <Card className="vixxe-shadow rounded-xl">
              <CardHeader>
                <CardTitle>Categorias Existentes</CardTitle>
                <CardDescription>{categorias.length} categorias cadastradas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categorias.map(categoria => (
                    <div key={categoria.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors hover-scale">
                      <h4 className="font-medium">{categoria.nome}</h4>
                      {categoria.descricao && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {categoria.descricao}
                        </p>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        <Badge variant="secondary">
                          {insumos.filter(i => i.categoria_id === categoria.id).length} insumos
                        </Badge>
                        {user.role === 'master' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 w-8 p-0"
                                disabled={insumos.filter(i => i.categoria_id === categoria.id).length > 0}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir a categoria <strong>{categoria.nome}</strong>?
                                  Esta ação não pode ser desfeita.
                                  <br/>
                                  **Atenção:** A categoria só pode ser excluída se não houver insumos associados a ela.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleExcluirCategoria(categoria.id, categoria.nome)} className="bg-red-600 hover:bg-red-700">
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes do Pedido */}
      <Sheet open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <SheetContent className="sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes do Pedido</SheetTitle>
            <SheetDescription>
              Informações completas do pedido de insumos
            </SheetDescription>
          </SheetHeader>
          
          {selectedPedido && (
            <div className="py-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">TÍTULO</Label>
                  <p className="font-medium">{selectedPedido.titulo}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">STATUS</Label>
                  <div className="flex gap-2 mt-1">
                    <Badge className={getStatusColor(selectedPedido.status)}>
                      {selectedPedido.status}
                    </Badge>
                    <Badge className={getPriorityColor(selectedPedido.prioridade)}>
                      {selectedPedido.prioridade}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedPedido.descricao && (
                <div>
                  <Label className="text-xs text-muted-foreground">DESCRIÇÃO</Label>
                  <p className="mt-1">{selectedPedido.descricao}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">SOLICITANTE</Label>
                  <p>{selectedPedido.usuarios?.nome_usuario}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">DATA CRIAÇÃO</Label>
                  <p>{format(new Date(selectedPedido.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                </div>
              </div>

              {selectedPedido.data_necessidade && (
                <div>
                  <Label className="text-xs text-muted-foreground">DATA NECESSÁRIA</Label>
                  <p>{format(new Date(selectedPedido.data_necessidade), 'dd/MM/yyyy', { locale: ptBR })}</p>
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">ITENS SOLICITADOS</Label>
                <div className="space-y-2 mt-2">
                  {selectedPedido.itens?.map((item, index) => (
                    <Card key={index} className="p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-sm">{item.nome_insumo}</h4>
                          <p className="text-xs text-muted-foreground">{item.categoria}</p>
                          {item.observacoes && (
                            <p className="text-xs text-muted-foreground mt-1">{item.observacoes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {item.quantidade} {item.unidade_medida}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            R$ {((item.quantidade || 0) * (item.preco_unitario_estimado || 0)).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                
                <div className="flex justify-between items-center mt-4 p-3 bg-muted rounded-lg">
                  <span className="font-medium">Total Estimado:</span>
                  <span className="text-lg font-bold">R$ {selectedPedido.total_estimado?.toFixed(2)}</span>
                </div>
              </div>

              {selectedPedido.observacoes_admin && (
                <div>
                  <Label className="text-xs text-muted-foreground">OBSERVAÇÕES DO ADMINISTRADOR</Label>
                  <p className="mt-1 p-3 bg-blue-50 rounded-lg text-sm">{selectedPedido.observacoes_admin}</p>
                </div>
              )}

              {selectedPedido.link_publico_compra && (
                <div>
                  <Label className="text-xs text-muted-foreground">LINK DE COMPRA</Label>
                  <Button
                    variant="outline"
                    onClick={() => window.open(selectedPedido.link_publico_compra, '_blank')}
                    className="mt-2 w-full"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir Link de Compra
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Sheet de Edição de Pedido */}
      <EditPedidoInsumoSheet
        open={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
        pedido={selectedPedido}
        onSave={handleSaveEditedPedido}
        loading={loading}
      />
    </div>
  );
}