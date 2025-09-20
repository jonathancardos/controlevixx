// Interface para tipagem da tabela solicitacoes_novo_insumo
interface SolicitacaoNovoInsumo {
  id: string;
  titulo: string;
  descricao: string;
  prioridade: 'Baixa' | 'Normal' | 'Alta' | 'Urgente';
  data_necessidade: string;
  usuario_id: string;
  created_at?: string;
}
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'; // Importar Tooltip
import { 
  Package, 
  Plus, 
  Minus,
  ShoppingCart, 
  Search,
  ChevronDown,
  ChevronRight,
  Calendar,
  User,
  Check,
  X,
  AlertTriangle,
  History, // Adicionado para a aba de histórico
  Eye, // Adicionado para visualizar detalhes
  CheckCircle, // Ícone para itens escolhidos
  AlertCircle, // Ícone para itens restantes
  Trash2, // Adicionado para remover tudo
  MoreHorizontal // Ícone para o dropdown de opções
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useInventorySupabase } from '@/hooks/useInventorySupabase';
import { Usuario, PedidoInsumo } from '@/types/supabase'; // Importar PedidoInsumo
import { PedidoHistoricoSheet } from './PedidoHistoricoSheet'; // Importar o novo componente
import { useIsMobile } from '@/hooks/use-mobile'; // Importar o hook useIsMobile
import burgerBg from '@/assets/burger-blur-bg.jpg'; // Importar a imagem de fundo

interface ItemPedido {
  id?: string; // ID opcional para itens que ainda não foram salvos no banco
  nome_insumo: string;
  categoria: string;
  quantidade: number;
  unidade_medida: string;
  preco_unitario_estimado: number;
  observacoes?: string;
  insumo_id?: string;
}

interface NovoItemForm {
  nome: string;
  descricao: string;
  categoria_id: string;
  unidade_medida: string;
  prioridade: 'Baixa' | 'Normal' | 'Alta' | 'Urgente';
  data_necessidade: string;
  justificativa: string;
}

interface InventoryManagementProps {
  user: Usuario;
}

const LOCAL_STORAGE_CART_KEY = 'vixxe_inventory_cart';

export function InventoryManagement({ user }: InventoryManagementProps) {
  const { categorias, insumos, loading, carregarPedidosPorUsuario } = useInventorySupabase();
  const [activeTab, setActiveTab] = useState('pedido');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [itensPedido, setItensPedido] = useState<ItemPedido[]>([]);
  const [quantities, setQuantities] = useState<{ [id: string]: number }>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Estados para o histórico de pedidos
  const [historicoPedidos, setHistoricoPedidos] = useState<PedidoInsumo[]>([]);
  const [selectedHistoricoPedido, setSelectedHistoricoPedido] = useState<PedidoInsumo | null>(null);
  const [isHistoricoSheetOpen, setIsHistoricoSheetOpen] = useState(false);

  const isMobile = useIsMobile(); // Usar o hook para detectar mobile

  // Estados para o diálogo de redução de quantidade
  const [isReduceQuantityDialogOpen, setIsReduceQuantityDialogOpen] = useState(false);
  const [itemToReduce, setItemToReduce] = useState<any | null>(null); // Armazena o insumo completo
  const [quantityToRemove, setQuantityToRemove] = useState(1);

  // Formulário de novo pedido
  const [newPedidoForm, setNewPedidoForm] = useState({
    titulo: `Pedido de Insumos - ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}`, // Título predefinido
    data_necessidade: format(new Date(), 'yyyy-MM-dd') // Set default to today's date
  });

  // Formulário de novo item (mantido como estava, pois se refere a solicitação de um novo insumo)
  const [novoItemForm, setNovoItemForm] = useState<NovoItemForm>({
    nome: '',
    descricao: '',
    categoria_id: '',
    unidade_medida: 'UN',
    prioridade: 'Normal',
    data_necessidade: '',
    justificativa: ''
  });

  // Cria um Set de IDs de itens que estão atualmente no carrinho para busca rápida
  const itensNoCarrinhoIds = new Set(itensPedido.map(item => item.insumo_id));

  // Agrupar insumos por categoria e calcular contagens
  const insumosPorCategoria = categorias.map(categoria => {
    const insumosCategoria = insumos.filter(insumo => 
      insumo.categoria_id === categoria.id &&
      (searchTerm === '' || 
       insumo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
       insumo.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    const chosenItemsCount = insumosCategoria.filter(insumo => 
      itensNoCarrinhoIds.has(insumo.id)
    ).length;

    const totalItemsInCartFromCategory = itensPedido.filter(item => 
      insumosCategoria.some(insumo => insumo.id === item.insumo_id)
    ).reduce((sum, item) => sum + item.quantidade, 0);

    const remainingItemsCount = insumosCategoria.length - chosenItemsCount;

    return {
      ...categoria,
      insumos: insumosCategoria,
      totalCount: insumosCategoria.length,
      chosenItemsCount,
      remainingItemsCount,
      hasChosenItems: chosenItemsCount > 0,
      totalItemsInCartFromCategory, // Total de unidades no carrinho para esta categoria
    };
  }).filter(categoria => categoria.totalCount > 0 || searchTerm === '');

  // Carregar histórico de pedidos do usuário quando a aba 'historico' é ativada
  useEffect(() => {
    if (activeTab === 'historico' && user?.id) {
      const fetchHistorico = async () => {
        const pedidosDoUsuario = await carregarPedidosPorUsuario(user.id);
        setHistoricoPedidos(pedidosDoUsuario);
      };
      fetchHistorico();
    }
  }, [activeTab, user?.id, carregarPedidosPorUsuario]);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(LOCAL_STORAGE_CART_KEY);
      if (savedCart) {
        setItensPedido(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error("Failed to load cart from localStorage", e);
      localStorage.removeItem(LOCAL_STORAGE_CART_KEY); // Clear corrupted data
    }
  }, []);

  // Save cart to localStorage whenever itensPedido changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CART_KEY, JSON.stringify(itensPedido));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }, [itensPedido]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const updateQuantity = (insumoId: string, change: number) => {
    setQuantities(prev => {
      const current = prev[insumoId] || 1;
      const newValue = Math.max(1, current + change);
      return { ...prev, [insumoId]: newValue };
    });
  };

  const updateCartItemQuantity = (index: number, change: number) => {
    setItensPedido(prev => {
      const newItens = [...prev];
      const currentItem = newItens[index];
      if (currentItem) {
        const newQuantity = Math.max(1, currentItem.quantidade + change);
        newItens[index] = { ...currentItem, quantidade: newQuantity };
      }
      return newItens;
    });
  };

  const addToCart = (insumo: any) => {
    const quantidade = quantities[insumo.id] || 1;
    const categoria = categorias.find(c => c.id === insumo.categoria_id);
    
    // Verifica se o item já está no carrinho
    const existingItemIndex = itensPedido.findIndex(item => item.insumo_id === insumo.id);

    if (existingItemIndex !== -1) {
      // Se o item já existe, atualiza a quantidade
      setItensPedido(prev => {
        const newItens = [...prev];
        const currentItem = newItens[existingItemIndex];
        if (currentItem) {
          newItens[existingItemIndex] = { ...currentItem, quantidade: currentItem.quantidade + quantidade };
        }
        return newItens;
      });
      toast.success(`Quantidade de ${insumo.nome} atualizada no carrinho!`);
    } else {
      // Se o item não existe, adiciona um novo
      const novoItem: ItemPedido = {
        nome_insumo: insumo.nome,
        categoria: categoria?.nome || 'Sem categoria',
        quantidade,
        unidade_medida: insumo.unidade_medida,
        preco_unitario_estimado: insumo.preco_unitario || 0,
        observacoes: '',
        insumo_id: insumo.id
      };
      setItensPedido(prev => [...prev, novoItem]);
      toast.success(`${insumo.nome} adicionado ao carrinho!`);
    }
    setQuantities(prev => ({ ...prev, [insumo.id]: 1 })); // Reset quantity selector
  };

  const removeFromCart = (index: number) => {
    setItensPedido(prev => prev.filter((_, i) => i !== index));
    toast.success("Item removido do carrinho!");
  };

  const removeItemFromCartById = (insumoIdToRemove: string) => {
    setItensPedido(prev => {
      const updatedItens = prev.filter(item => item.insumo_id !== insumoIdToRemove);
      if (updatedItens.length < prev.length) {
        toast.success("Item removido do carrinho!");
      }
      return updatedItens;
    });
  };

  const handleReduceQuantity = (insumoIdToReduce: string, amountToRemove: number) => {
    setItensPedido(prev => {
      const updatedItens = prev.map(item => {
        if (item.insumo_id === insumoIdToReduce) {
          const newQuantity = item.quantidade - amountToRemove;
          if (newQuantity <= 0) {
            return null; // Marcar para remoção
          }
          return { ...item, quantidade: newQuantity };
        }
        return item;
      }).filter(Boolean) as ItemPedido[]; // Filtrar itens marcados para remoção

      const originalItem = prev.find(item => item.insumo_id === insumoIdToReduce);
      if (originalItem) {
        if (originalItem.quantidade - amountToRemove <= 0) {
          toast.success(`"${originalItem.nome_insumo}" removido do carrinho!`);
        } else {
          toast.success(`Quantidade de "${originalItem.nome_insumo}" reduzida para ${originalItem.quantidade - amountToRemove}!`);
        }
      }
      return updatedItens;
    });
  };

  const handleCreatePedido = async () => {
    if (!newPedidoForm.titulo) {
      toast.error('Preencha o título do pedido');
      return;
    }

    if (itensPedido.length === 0) {
      toast.error('Adicione pelo menos um item ao pedido');
      return;
    }

    try {
      // Calcular total estimado antes de salvar
      const totalEstimadoCalculado = itensPedido.reduce((sum, item) => sum + (item.preco_unitario_estimado * item.quantidade), 0);

      // Criar pedido
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos_insumos')
        .insert({
          titulo: newPedidoForm.titulo,
          descricao: `Pedido de insumos gerado automaticamente pelo sistema por ${user.nome_usuario}.`, // Descrição automática
          prioridade: 'Normal', // Prioridade padrão
          data_necessidade: newPedidoForm.data_necessidade,
          usuario_id: user.id, // ID do usuário logado
          total_estimado: totalEstimadoCalculado, // Salvar total estimado
          status: 'Pendente'
        })
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      // Criar itens do pedido
      const itensComPedidoId = itensPedido.map(item => ({
        nome_insumo: item.nome_insumo,
        categoria: item.categoria,
        quantidade: item.quantidade,
        unidade_medida: item.unidade_medida,
        preco_unitario_estimado: item.preco_unitario_estimado,
        observacoes: item.observacoes || '',
        pedido_id: pedido.id,
        insumo_id: item.insumo_id
      }));

      const { error: itensError } = await supabase
        .from('itens_pedido_insumos')
        .insert(itensComPedidoId);

      if (itensError) throw itensError;

      toast.success('Pedido criado com sucesso!');
      setNewPedidoForm({ titulo: `Pedido de Insumos - ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}`, data_necessidade: format(new Date(), 'yyyy-MM-dd') });
      setItensPedido([]);
      localStorage.removeItem(LOCAL_STORAGE_CART_KEY); // Clear cart from localStorage
      setActiveTab('historico');
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      toast.error('Erro ao criar pedido');
    }
  };

  const handleSolicitarNovoItem = async () => {
    if (!novoItemForm.nome || !novoItemForm.categoria_id || !novoItemForm.justificativa) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const { error } = await supabase
        .from('pedidos_insumos')
        .insert({
          titulo: `Solicitação: ${novoItemForm.nome}`,
          descricao: `Nome: ${novoItemForm.nome}\nDescrição: ${novoItemForm.descricao}\nUnidade: ${novoItemForm.unidade_medida}\nJustificativa: ${novoItemForm.justificativa}`,
          prioridade: novoItemForm.prioridade,
          data_necessidade: novoItemForm.data_necessidade,
          usuario_id: user.id, // ID do usuário logado
          status: 'Pendente'
        });

      if (error) throw error;

      toast.success('Solicitação enviada para aprovação!');
      setNovoItemForm({
        nome: '',
        descricao: '',
        categoria_id: '',
        unidade_medida: 'UN',
        prioridade: 'Normal',
        data_necessidade: '',
        justificativa: ''
      });
    } catch (error) {
      console.error('Erro ao solicitar novo item:', error);
      toast.error('Erro ao enviar solicitação');
    }
  };

  const handleViewHistoricoPedido = (pedido: PedidoInsumo) => {
    setSelectedHistoricoPedido(pedido);
    setIsHistoricoSheetOpen(true);
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

  const totalItensCarrinho = itensPedido.length;
  const totalEstimadoCarrinho = itensPedido.reduce((sum, item) => sum + (item.preco_unitario_estimado * item.quantidade), 0);

  return (
    <div 
      className="min-h-screen relative flex flex-col items-center justify-center p-3 md:p-5"
      style={{
        backgroundImage: `url(${burgerBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
      
      <div className="relative w-full max-w-4xl mx-auto p-3 md:p-6 bg-card/90 rounded-xl vixxe-shadow">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold bg-vixxe-gradient bg-clip-text text-transparent">
            Gestão de Insumos
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mt-2">
            Controle e solicite seus ingredientes com facilidade
          </p>
          
          {/* Botão do Carrinho - Mobile (FAB) */}
          {isMobile && (
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button 
                  className="fixed bottom-4 right-4 z-50 rounded-full w-14 h-14 shadow-lg bg-vixxe-gradient text-white hover:scale-105 transition-transform" 
                  aria-label="Abrir Carrinho"
                >
                  <ShoppingCart className="w-6 h-6" />
                  {totalItensCarrinho > 0 && (
                    <Badge className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center text-xs bg-red-500 text-white">
                      {totalItensCarrinho}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full max-w-lg flex flex-col">
                <SheetHeader>
                  <SheetTitle>Carrinho de Pedido</SheetTitle>
                  <SheetDescription>
                    {totalItensCarrinho} {totalItensCarrinho === 1 ? 'item' : 'itens'} adicionados
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4 flex-1 overflow-y-auto">
                  {itensPedido.map((item, index) => (
                    <div key={item.insumo_id || index} className="flex justify-between items-center p-3 bg-muted rounded-lg hover:bg-muted/50 transition-colors hover-scale">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.nome_insumo}</p>
                        <p className="text-xs text-muted-foreground">
                          R$ {(item.preco_unitario_estimado || 0).toFixed(2)}/un
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <div className="flex items-center border rounded-lg">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => updateCartItemQuantity(index, -1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="px-2 text-sm min-w-[2rem] text-center">
                            {item.quantidade}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => updateCartItemQuantity(index, 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromCart(index)}
                        >
                          <X className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {totalItensCarrinho === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Carrinho vazio
                    </p>
                  )}
                </div>

                {totalItensCarrinho > 0 && (
                  <div className="mt-6 pt-4 border-t space-y-4">
                    <h3 className="text-lg font-semibold">Finalizar Pedido</h3>
                    <p className="text-sm opacity-90 text-muted-foreground">
                      Autor do Pedido: {user.nome_usuario}
                    </p>
                    <div>
                      <Label htmlFor="titulo-mobile">Título do Pedido*</Label>
                      <Input
                        id="titulo-mobile"
                        value={newPedidoForm.titulo}
                        onChange={(e) => setNewPedidoForm(prev => ({ ...prev, titulo: e.target.value }))}
                        placeholder="Ex: Pedido semanal"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="data-mobile">Data de Necessidade*</Label>
                      <Input
                        id="data-mobile"
                        type="date"
                        value={newPedidoForm.data_necessidade}
                        onChange={(e) => setNewPedidoForm(prev => ({ ...prev, data_necessidade: e.target.value }))}
                      />
                    </div>

                    <div className="flex justify-between items-center mt-4 p-3 bg-primary/10 rounded-lg">
                      <span className="font-medium text-lg">Total Estimado:</span>
                      <span className="text-xl font-bold text-primary">R$ {totalEstimadoCarrinho.toFixed(2)}</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button 
                        onClick={handleCreatePedido} 
                        disabled={!newPedidoForm.titulo || totalItensCarrinho === 0}
                        className="w-full bg-vixxe-gradient text-white hover:opacity-90"
                        size="lg"
                      >
                        Enviar Pedido
                      </Button>
                    </div>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50 rounded-xl p-1 shadow-inner">
            <TabsTrigger value="pedido" className="text-sm data-[state=active]:bg-vixxe-gradient data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:rounded-lg transition-all duration-200">Pedido</TabsTrigger>
            <TabsTrigger value="historico" className="text-sm data-[state=active]:bg-vixxe-gradient data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:rounded-lg transition-all duration-200">Histórico</TabsTrigger>
            <TabsTrigger value="solicitar" className="text-sm data-[state=active]:bg-vixxe-gradient data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:rounded-lg transition-all duration-200">Solicitar Item</TabsTrigger>
          </TabsList>

          <TabsContent value="pedido" className="space-y-6">
            {/* Header do Formulário */}
            <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 vixxe-shadow rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl md:text-2xl">Formulário de Compra</CardTitle>
                <p className="text-sm opacity-90">
                  Data: {format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
                <p className="text-sm opacity-90">
                  Autor do Pedido: {user.nome_usuario}
                </p>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lista de Insumos */}
              <div className="lg:col-span-2 space-y-4">
                {/* Campo de Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar insumo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 rounded-lg"
                  />
                </div>

                {/* Categorias Expansíveis */}
                <div className="space-y-2">
                  {insumosPorCategoria.map(categoria => (
                    <Card 
                      key={categoria.id} 
                      className={`overflow-hidden vixxe-shadow transition-all duration-200 rounded-xl
                        ${categoria.hasChosenItems ? 'bg-primary/5 border-l-4 border-primary' : ''}
                      `}
                    >
                      <button
                        onClick={() => toggleCategory(categoria.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Package className="w-5 h-5 text-primary" />
                          <span className="font-medium text-left text-lg">{categoria.nome}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {categoria.hasChosenItems && (
                            <Badge 
                              variant="default" 
                              className="text-xs px-3 py-1 flex items-center gap-1 bg-emerald-600 text-white shadow-sm"
                            >
                              <CheckCircle className="w-3 h-3" />
                              {categoria.chosenItemsCount} itens ({categoria.totalItemsInCartFromCategory} un.)
                            </Badge>
                          )}
                          {categoria.remainingItemsCount > 0 && (
                            <Badge 
                              variant="outline" 
                              className="text-xs px-3 py-1 flex items-center gap-1 bg-red-500/10 text-red-400 border-red-500/20"
                            >
                              <AlertCircle className="w-3 h-3" />
                              {categoria.remainingItemsCount} restantes
                            </Badge>
                          )}
                          {expandedCategories.includes(categoria.id) ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>
                      
                      {expandedCategories.includes(categoria.id) && (
                        <div className="border-t bg-muted/30 p-4 space-y-3">
                          {categoria.insumos.map(insumo => {
                            const isInCart = itensNoCarrinhoIds.has(insumo.id);
                            const itemInCart = itensPedido.find(item => item.insumo_id === insumo.id);
                            return (
                              <div 
                                key={insumo.id} 
                                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border transition-all duration-200 space-y-2 sm:space-y-0
                                  ${isInCart ? 'bg-green-500/10 border-green-500/30 vixxe-shadow-sm' : 'bg-background border-border vixxe-shadow-sm'}
                                `}
                              >
                                <div className="flex-1">
                                  <h4 className="font-semibold text-base">{insumo.nome}</h4>
                                  {insumo.descricao && (
                                    <p className="text-xs text-muted-foreground mt-1">{insumo.descricao}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge 
                                      variant={insumo.estoque_atual <= insumo.estoque_minimo ? "destructive" : "secondary"}
                                      className="text-xs"
                                    >
                                      Estoque: {insumo.estoque_atual} {insumo.unidade_medida}
                                    </Badge>
                                    {insumo.preco_unitario && (
                                      <span className="text-sm font-medium text-primary">
                                        R$ {insumo.preco_unitario.toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 ml-0 sm:ml-4 mt-2 sm:mt-0">
                                  {isInCart ? (
                                    itemInCart && itemInCart.quantidade > 0 ? ( // Check if quantity is greater than 0
                                      <DropdownMenu>
                                        <Tooltip>
                                          <DropdownMenuTrigger asChild>
                                            <TooltipTrigger asChild>
                                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"> {/* Modern icon button */}
                                                  <MoreHorizontal className="w-4 h-4" />
                                                  <span className="sr-only">Opções</span> {/* Accessibility */}
                                              </Button>
                                            </TooltipTrigger>
                                          </DropdownMenuTrigger>
                                          <TooltipContent>
                                            Opções do item
                                          </TooltipContent>
                                        </Tooltip>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem 
                                            onSelect={(e) => {
                                              e.preventDefault(); // Prevent dropdown from closing immediately
                                              setItemToReduce(insumo); // Set the item for the dialog
                                              setQuantityToRemove(1); // Default to 1
                                              setIsReduceQuantityDialogOpen(true); // Open the dialog
                                            }}
                                          >
                                            <Minus className="w-4 h-4 mr-2" /> Reduzir Quantidade
                                          </DropdownMenuItem>
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                <Trash2 className="w-4 h-4 mr-2" /> Remover Tudo
                                              </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>Remover Item</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  Tem certeza que deseja remover *todos* os "{insumo.nome}" do carrinho?
                                                  Esta ação não pode ser desfeita.
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => removeItemFromCartById(insumo.id)} className="bg-red-600 hover:bg-red-700">
                                                  Remover Tudo
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    ) : (
                                      // If item is in cart but quantity is 0 (shouldn't happen with filter(Boolean) but for safety)
                                      <Button
                                          size="sm"
                                          variant="destructive"
                                          className="h-8"
                                          onClick={() => removeItemFromCartById(insumo.id)}
                                      >
                                          <X className="w-3 h-3 mr-1" />
                                          Remover
                                      </Button>
                                    )
                                  ) : (
                                    <>
                                      <div className="flex items-center border rounded-lg">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 w-8 p-0"
                                          onClick={() => updateQuantity(insumo.id, -1)}
                                        >
                                          <Minus className="w-3 h-3" />
                                        </Button>
                                        <span className="px-2 text-sm min-w-[2rem] text-center">
                                          {quantities[insumo.id] || 1}
                                        </span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 w-8 p-0"
                                          onClick={() => updateQuantity(insumo.id, 1)}
                                        >
                                          <Plus className="w-3 h-3" />
                                        </Button>
                                      </div>
                                      <Button
                                        size="sm"
                                        onClick={() => addToCart(insumo)}
                                        className="h-8 bg-vixxe-gradient text-white hover:opacity-90"
                                      >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Adicionar
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>

              {/* Carrinho - Desktop */}
              <div className="hidden lg:block">
                <Card className="sticky top-6 border-2 border-primary/50 bg-primary/5 vixxe-shadow rounded-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl font-bold text-primary">
                      <ShoppingCart className="w-6 h-6 text-primary" />
                      Carrinho ({totalItensCarrinho})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Formulário do Pedido */}
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="titulo" className="text-xs">Título do Pedido*</Label>
                        <Input
                          id="titulo"
                          value={newPedidoForm.titulo}
                          onChange={(e) => setNewPedidoForm(prev => ({ ...prev, titulo: e.target.value }))}
                          placeholder="Ex: Pedido semanal"
                          className="text-sm rounded-lg"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="data_necessidade" className="text-xs">Data de Necessidade*</Label>
                        <Input
                          id="data_necessidade"
                          type="date"
                          value={newPedidoForm.data_necessidade}
                          onChange={(e) => setNewPedidoForm(prev => ({ ...prev, data_necessidade: e.target.value }))}
                          className="text-sm rounded-lg"
                        />
                      </div>
                    </div>

                    {/* Itens do Carrinho */}
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {itensPedido.map((item, index) => (
                        <div key={item.insumo_id || index} className="flex justify-between items-center p-3 bg-muted rounded-lg hover:bg-muted/50 transition-colors hover-scale">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.nome_insumo}</p>
                            <p className="text-xs text-muted-foreground">
                              R$ {(item.preco_unitario_estimado || 0).toFixed(2)}/un
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <div className="flex items-center border rounded-lg">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => updateCartItemQuantity(index, -1)}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="px-2 text-sm min-w-[2rem] text-center">
                                {item.quantidade}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => updateCartItemQuantity(index, 1)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFromCart(index)}
                              className="h-8 w-8 p-0"
                            >
                              <X className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {totalItensCarrinho === 0 && (
                        <p className="text-center text-muted-foreground py-4 text-sm">
                          Adicione itens ao carrinho
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-4 p-3 bg-primary/10 rounded-lg">
                      <span className="font-medium text-lg">Total Estimado:</span>
                      <span className="text-xl font-bold text-primary">R$ {totalEstimadoCarrinho.toFixed(2)}</span>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex flex-col gap-2">
                      <Button 
                        onClick={handleCreatePedido} 
                        disabled={totalItensCarrinho === 0 || !newPedidoForm.titulo}
                        className="w-full bg-vixxe-gradient text-white hover:opacity-90"
                      >
                        Enviar Pedido
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="historico">
            <Card className="vixxe-shadow rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl md:text-2xl font-bold">
                  <History className="w-5 h-5" />
                  Meus Pedidos de Insumos
                </CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Visualize o status dos seus pedidos de insumos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                      Carregando seus pedidos...
                    </div>
                  ) : historicoPedidos.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum pedido encontrado</p>
                      <p className="text-sm">Seus pedidos aparecerão aqui após serem criados</p>
                    </div>
                  ) : (
                    historicoPedidos.map(pedido => (
                      <Card key={pedido.id} className={`border-l-4 ${getStatusColor(pedido.status)} vixxe-shadow rounded-xl hover:scale-[1.01] transition-transform duration-200`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold">{pedido.titulo}</h3>
                              <p className="text-sm text-muted-foreground">
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
                          
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-muted-foreground">
                              {pedido.itens?.length || 0} itens • R$ {pedido.total_estimado.toFixed(2)}
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewHistoricoPedido(pedido)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Ver Detalhes
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="solicitar" className="space-y-6">
            <Card className="vixxe-shadow rounded-xl">
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl font-bold">Solicitar Novo Item</CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Solicite a inclusão de um novo item no catálogo de insumos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome-item">Nome do Item*</Label>
                    <Input
                      id="nome-item"
                      value={novoItemForm.nome}
                      onChange={(e) => setNovoItemForm(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Ex: Açúcar cristal orgânico"
                      className="rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="categoria-item">Categoria*</Label>
                    <Select 
                      value={novoItemForm.categoria_id} 
                      onValueChange={(value) => setNovoItemForm(prev => ({ ...prev, categoria_id: value }))}
                    >
                      <SelectTrigger className="rounded-lg">
                        <SelectValue placeholder="Selecione uma categoria" />
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
                </div>

                <div>
                  <Label htmlFor="descricao-item">Descrição</Label>
                  <Textarea
                    id="descricao-item"
                    value={novoItemForm.descricao}
                    onChange={(e) => setNovoItemForm(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Descreva o item detalhadamente..."
                    rows={3}
                    className="rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="unidade-item">Unidade de Medida</Label>
                    <Select 
                      value={novoItemForm.unidade_medida} 
                      onValueChange={(value) => setNovoItemForm(prev => ({ ...prev, unidade_medida: value }))}
                    >
                      <SelectTrigger className="rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UN">Unidade</SelectItem>
                        <SelectItem value="KG">Quilograma</SelectItem>
                        <SelectItem value="G">Grama</SelectItem>
                        <SelectItem value="L">Litro</SelectItem>
                        <SelectItem value="ML">Mililitro</SelectItem>
                        <SelectItem value="CX">Caixa</SelectItem>
                        <SelectItem value="PCT">Pacote</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="prioridade-item">Prioridade*</Label>
                    <Select 
                      value={novoItemForm.prioridade} 
                      onValueChange={(value: any) => setNovoItemForm(prev => ({ ...prev, prioridade: value }))}
                    >
                      <SelectTrigger className="rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baixa">Baixa</SelectItem>
                        <SelectItem value="Normal">Normal</SelectItem>
                        <SelectItem value="Alta">Alta</SelectItem>
                        <SelectItem value="Urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="data-item">Data de Necessidade</Label>
                    <Input
                      id="data-item"
                      type="date"
                      value={novoItemForm.data_necessidade}
                      onChange={(e) => setNovoItemForm(prev => ({ ...prev, data_necessidade: e.target.value }))}
                      className="rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="justificativa">Justificativa*</Label>
                  <Textarea
                    id="justificativa"
                    value={novoItemForm.justificativa}
                    onChange={(e) => setNovoItemForm(prev => ({ ...prev, justificativa: e.target.value }))}
                    placeholder="Explique por que este item é necessário..."
                    rows={4}
                    className="rounded-lg"
                  />
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleSolicitarNovoItem}
                    disabled={!novoItemForm.nome || !novoItemForm.categoria_id || !novoItemForm.justificativa}
                    className="min-w-32 bg-vixxe-gradient text-white hover:opacity-90 rounded-lg"
                  >
                    Enviar Solicitação
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Sheet para exibir detalhes do histórico de pedidos */}
        <PedidoHistoricoSheet
          open={isHistoricoSheetOpen}
          onOpenChange={setIsHistoricoSheetOpen}
          pedido={selectedHistoricoPedido}
        />

        {/* AlertDialog para reduzir quantidade */}
        {itemToReduce && (
          <AlertDialog open={isReduceQuantityDialogOpen} onOpenChange={setIsReduceQuantityDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reduzir Quantidade de "{itemToReduce.nome}"</AlertDialogTitle>
                <AlertDialogDescription>
                  Quantas unidades de "{itemToReduce.nome}" você deseja remover do carrinho?
                  (Atualmente: {itensPedido.find(item => item.insumo_id === itemToReduce.id)?.quantidade || 0} unidades)
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quantity-to-remove" className="text-right">
                    Quantidade
                  </Label>
                  <Input
                    id="quantity-to-remove"
                    type="number"
                    min="1"
                    max={itensPedido.find(item => item.insumo_id === itemToReduce.id)?.quantidade || 1}
                    value={quantityToRemove}
                    onChange={(e) => setQuantityToRemove(parseInt(e.target.value) || 1)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsReduceQuantityDialogOpen(false)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => {
                    const currentQuantity = itensPedido.find(item => item.insumo_id === itemToReduce.id)?.quantidade || 0;
                    const amount = Math.min(quantityToRemove, currentQuantity); // Garante que não se remova mais do que o disponível
                    if (amount > 0) {
                      handleReduceQuantity(itemToReduce.id, amount);
                    }
                    setIsReduceQuantityDialogOpen(false);
                  }}
                  disabled={quantityToRemove <= 0 || quantityToRemove > (itensPedido.find(item => item.insumo_id === itemToReduce.id)?.quantidade || 0)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}