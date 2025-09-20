import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Plus, ShoppingCart, X, Trash2, DollarSign, User, Calendar, Clock, MessageSquare, Printer, Send, Edit, CheckCircle, AlertTriangle, Package, Minus, ChevronDown, ChevronRight, Award, Gift, Search, Tag, BellRing } from 'lucide-react'; // Adicionado BellRing
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useProductSupabase } from '@/hooks/useProductSupabase';
import { useComandas, useClientes } from '@/hooks/useSupabase'; // Importar Clientes e Comandas
import { Produto, ComandaInsert, Cliente } from '@/types/supabase'; // Importar Cliente
import { formatCurrency } from '@/lib/order-parser';
import { ExtractedOrder, ServiceType } from '@/types/dashboard'; // Importar ServiceType
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { v4 as uuidv4 } from 'uuid';
import { useIsMobile } from '@/hooks/use-mobile';
import { ProductManagementTab } from './ProductManagementTab';
import { ComandaManagementTab } from './ComandaManagementTab';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CreateClientSheet } from '@/components/clients/CreateClientSheet'; // Importar o novo componente
import { EmptyState } from '@/components/shared/EmptyState'; // Importar EmptyState
import burgerBg from '@/assets/burger-blur-bg.jpg'; // Importar a imagem de fundo
import { OrderDetailsPanel } from './OrderDetailsPanel'; // Importar o novo componente
import { PendingComandasFAB } from '@/components/comandas/PendingComandasFAB'; // Importar PendingComandasFAB para a sheet
import { useActiveOrders } from '@/contexts/ActiveOrdersContext';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  isVipCombo?: boolean;
  observation?: string; // Novo campo para observação do item
  adicionais?: { name: string; price: number | null }[]; // Novo campo para adicionais
}

interface ActiveOrder {
  id: string;
  cliente_id?: string; // Adicionado cliente_id
  cliente_nome: string;
  orderNumber: string; // Novo campo
  date: string; // Novo campo
  serviceType: ServiceType; // Novo campo
  address?: string; // Novo campo
  reference?: string; // Novo campo
  items: OrderItem[];
  deliveryFee?: number; // Novo campo
  total: number;
  createdAt: Date;
  observacoes?: string;
  forma_pagamento: 'Pix' | 'Dinheiro' | 'Cartão' | 'Outros';
  tipo_servico: 'local' | 'retirada' | 'entrega'; // Adicionado tipo_servico
  vipComboApplied: boolean;
  amountReceived?: number; // Novo campo
  changeAmount?: number; // Novo campo
  prepTimeMin: number; // Novo campo
  prepTimeMax: number; // Novo campo
}

interface POSSystemProps {
  onComandaUpdated: () => void;
  isPendingComandasFABSheetOpen: boolean;
  setIsPendingComandasFABSheetOpen: (open: boolean) => void;
}

const generateOrderId = (prefix: string = 'VM') => {
  const randomNum = Math.floor(100 + Math.random() * 900); // Generates a random 3-digit number
  return `${prefix}${randomNum}`;
};

export function POSSystem({ onComandaUpdated, isPendingComandasFABSheetOpen, setIsPendingComandasFABSheetOpen }: POSSystemProps) {
  const { categoriasProdutos, produtos, loading: productsLoading } = useProductSupabase();
  const { salvarComanda, loading: comandasLoading, comandas, carregarComandas } = useComandas(); // Adicionado comandas e carregarComandas
  const { clientes, carregarClientes, marcarComboVIPUsado } = useClientes(); // Usar o hook de clientes
  const { registerTransferHandler } = useActiveOrders(); // Reintroduzido
  const isMobile = useIsMobile();

  const [activeOrders, setActiveOrders] = useState<Record<string, ActiveOrder>>({});
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductForQuantity, setSelectedProductForQuantity] = useState<Produto | null>(null);
  const [quantityInput, setQuantityInput] = useState(1);
  const [observationInput, setObservationInput] = useState(''); // Novo estado para observação do item
  const [isQuantitySheetOpen, setIsQuantitySheetOpen] = useState(false);
  const [isOrderDetailsSheetOpen, setIsOrderDetailsSheetOpen] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState('pdv');
  const [activeProductCategoryTab, setActiveProductCategoryTab] = useState('all'); // Novo estado para a aba de categoria de produtos
  const [activeComandaSubTab, setActiveComandaSubTab] = useState('comandas-ativas'); // Alterado para 'comandas-ativas' como padrão
  const [isCreateClientSheetOpen, setIsCreateClientSheetOpen] = useState(false); // Estado para a sheet de criação de cliente

  // Load active orders from localStorage on mount
  useEffect(() => {
    try {
      const savedOrders = localStorage.getItem('vixxe_pos_active_orders');
      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders);
        // Convert createdAt strings back to Date objects
        const ordersWithDates = Object.fromEntries(
          Object.entries(parsedOrders).map(([key, order]: [string, any]) => [
            key,
            { ...order, createdAt: new Date(order.createdAt) }
          ])
        );
        setActiveOrders(ordersWithDates);
        const savedCurrentOrderId = localStorage.getItem('vixxe_pos_current_order_id');
        if (savedCurrentOrderId && ordersWithDates[savedCurrentOrderId]) {
          setCurrentOrderId(savedCurrentOrderId);
        } else if (Object.keys(ordersWithDates).length > 0) {
          setCurrentOrderId(Object.keys(ordersWithDates)[0]);
        } else {
            // If no saved orders, create a new one
            const newId = generateOrderId();
            const newOrder: ActiveOrder = {
                id: newId,
                cliente_nome: 'Novo Pedido',
                orderNumber: generateOrderId('VM'), // Default
                date: format(new Date(), 'yyyy-MM-dd'), // Default
                serviceType: 'local', // Default
                items: [],
                total: 0,
                createdAt: new Date(),
                forma_pagamento: 'Dinheiro',
                tipo_servico: 'local',
                vipComboApplied: false,
                prepTimeMin: 30, // Default
                prepTimeMax: 60, // Default
            };
            setActiveOrders({ [newId]: newOrder });
            setCurrentOrderId(newId);
        }
      } else {
        // If no saved orders, create a new one
        const newId = generateOrderId();
        const newOrder: ActiveOrder = {
          id: newId,
          cliente_nome: 'Novo Pedido',
          orderNumber: generateOrderId('VM'), // Default
          date: format(new Date(), 'yyyy-MM-dd'), // Default
          serviceType: 'local', // Default
          items: [],
          total: 0,
          createdAt: new Date(),
          forma_pagamento: 'Dinheiro',
          tipo_servico: 'local',
          vipComboApplied: false,
          prepTimeMin: 30, // Default
          prepTimeMax: 60, // Default
        };
        setActiveOrders({ [newId]: newOrder });
        setCurrentOrderId(newId);
        localStorage.removeItem('vixxe_pos_active_orders');
        localStorage.removeItem('vixxe_pos_current_order_id');
      }
    } catch (e) {
      console.error("Failed to load active orders from localStorage", e);
      // Fallback to a fresh state if localStorage is corrupted
      const newId = generateOrderId();
      const newOrder: ActiveOrder = {
        id: newId,
        cliente_nome: 'Novo Pedido',
        orderNumber: generateOrderId('VM'), // Default
        date: format(new Date(), 'yyyy-MM-dd'), // Default
        serviceType: 'local', // Default
        items: [],
        total: 0,
        createdAt: new Date(),
        forma_pagamento: 'Dinheiro',
        tipo_servico: 'local',
        vipComboApplied: false,
        prepTimeMin: 30, // Default
        prepTimeMax: 60, // Default
      };
      setActiveOrders({ [newId]: newOrder });
      setCurrentOrderId(newId);
      localStorage.removeItem('vixxe_pos_active_orders');
      localStorage.removeItem('vixxe_pos_current_order_id');
    }
  }, []);

  // Save active orders to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('vixxe_pos_active_orders', JSON.stringify(activeOrders));
    if (currentOrderId) {
      localStorage.setItem('vixxe_pos_current_order_id', currentOrderId);
    }
  }, [activeOrders, currentOrderId]);

  // Sync activeComandaSubTab with isPendingComandasFABSheetOpen
  useEffect(() => {
    if (isPendingComandasFABSheetOpen) {
      setActiveComandaSubTab('comandas-ativas');
    } else {
      setActiveComandaSubTab('comandas-ativas'); // Reset to default when closed
    }
  }, [isPendingComandasFABSheetOpen]);

  // Carregar comandas pendentes para o contador
  useEffect(() => {
    carregarComandas({ status: 'Pendente' });
  }, [carregarComandas, onComandaUpdated]); // Adicionado onComandaUpdated para recarregar quando uma comanda é atualizada

  const pendingComandasCount = comandas.filter(c => c.status === 'Pendente').length;

  const currentOrder = currentOrderId ? activeOrders[currentOrderId] : null;
  const selectedClientData = currentOrder?.cliente_id ? clientes.find(c => c.id === currentOrder.cliente_id) : null;

  const handleAddOrder = () => {
    const newId = generateOrderId();
    const newOrder: ActiveOrder = {
      id: newId,
      cliente_nome: 'Novo Pedido', // Default name
      orderNumber: generateOrderId('VM'), // Default
      date: format(new Date(), 'yyyy-MM-dd'), // Default
      serviceType: 'local', // Default
      items: [],
      total: 0,
      createdAt: new Date(),
      forma_pagamento: 'Dinheiro',
      tipo_servico: 'local',
      vipComboApplied: false,
      prepTimeMin: 30, // Default
      prepTimeMax: 60, // Default
    };
    setActiveOrders(prev => ({ ...prev, [newId]: newOrder }));
    setCurrentOrderId(newId);
    toast.success(`Novo pedido ${newId} criado!`);
  };

  // Nova função para processar dados extraídos da comanda
  const handleExtractedDataReceived = useCallback((extractedData: {
    client: string;
    orderNumber: string;
    date: string;
    serviceType: ServiceType;
    address?: string;
    reference?: string;
    items: Array<{
      productId: string;
      name: string;
      price: number;
      quantity: number;
      observation?: string;
      adicionais?: { name: string; price: number | null }[];
    }>;
    deliveryFee?: number;
    total: number;
    paymentMethod: 'Pix' | 'Dinheiro' | 'Cartão' | 'Outros';
    amountReceived?: number;
    changeAmount?: number;
    prepTimeMin: number;
    prepTimeMax: number;
    observations?: string;
  }, selectedClient?: Cliente) => {
    console.log('Dados recebidos para transferência:', extractedData, selectedClient);
    const newId = generateOrderId();
    
    // Usar dados do cliente selecionado se disponível, senão usar dados extraídos
    const clienteNome = selectedClient?.nome || extractedData.client || 'Cliente da Comanda';
    const clienteId = selectedClient?.id || undefined;

    const newOrder: ActiveOrder = {
      id: newId,
      cliente_nome: clienteNome,
      cliente_id: clienteId,
      orderNumber: extractedData.orderNumber,
      date: extractedData.date,
      serviceType: extractedData.serviceType,
      address: extractedData.address,
      reference: extractedData.reference,
      items: extractedData.items,
      deliveryFee: extractedData.deliveryFee,
      total: extractedData.total,
      createdAt: new Date(),
      forma_pagamento: extractedData.paymentMethod,
      tipo_servico: extractedData.serviceType === 'consumo_local' ? 'local' : extractedData.serviceType === 'retirada' ? 'retirada' : 'entrega', // Map serviceType
      observacoes: extractedData.observations,
      vipComboApplied: false,
      amountReceived: extractedData.amountReceived,
      changeAmount: extractedData.changeAmount,
      prepTimeMin: extractedData.prepTimeMin,
      prepTimeMax: extractedData.prepTimeMax,
    };

    setActiveOrders(prev => ({ ...prev, [newId]: newOrder }));
    setCurrentOrderId(newId);
    
    console.log('Novo pedido criado:', newOrder);
    toast.success(`Dados transferidos! Cliente: ${clienteNome}, Pagamento: ${extractedData.paymentMethod}`);
  }, []);

  const handleRemoveOrder = (orderId: string) => {
    setActiveOrders(prev => {
      const newOrders = { ...prev };
      delete newOrders[orderId];
      
      if (currentOrderId === orderId) {
        const remainingOrderIds = Object.keys(newOrders);
        setCurrentOrderId(remainingOrderIds.length > 0 ? remainingOrderIds[0] : null);
      }
      
      if (Object.keys(newOrders).length === 0) {
        // If no orders left, create a new default one
        const newId = generateOrderId();
        const newOrder: ActiveOrder = {
          id: newId,
          cliente_nome: 'Novo Pedido',
          orderNumber: generateOrderId('VM'), // Default
          date: format(new Date(), 'yyyy-MM-dd'), // Default
          serviceType: 'local', // Default
          items: [],
          total: 0,
          createdAt: new Date(),
          forma_pagamento: 'Dinheiro',
          tipo_servico: 'local',
          vipComboApplied: false,
          prepTimeMin: 30, // Default
          prepTimeMax: 60, // Default
        };
        newOrders[newId] = newOrder;
        setCurrentOrderId(newId);
      }
      
      return newOrders;
    });
    toast.info(`Pedido ${orderId} removido.`);
  };

  const handleProductSelect = (product: Produto) => {
    setSelectedProductForQuantity(product);
    setQuantityInput(1);
    setObservationInput(''); // Limpa a observação ao selecionar um novo produto
    setIsQuantitySheetOpen(true);
  };

  const handleAddProductToOrder = () => {
    if (!currentOrderId || !selectedProductForQuantity || quantityInput <= 0) return;

    setActiveOrders(prev => {
      const order = { ...prev[currentOrderId] };
      const existingItemIndex = order.items.findIndex(item => item.productId === selectedProductForQuantity.id);

      if (existingItemIndex !== -1) {
        // Se o item já existe, atualiza a quantidade e a observação (se houver)
        order.items[existingItemIndex].quantity += quantityInput;
        if (observationInput.trim()) {
          order.items[existingItemIndex].observation = observationInput.trim();
        }
      } else {
        order.items.push({
          productId: selectedProductForQuantity.id,
          name: selectedProductForQuantity.nome,
          price: selectedProductForQuantity.preco,
          quantity: quantityInput,
          imageUrl: selectedProductForQuantity.imagem_url || undefined,
          observation: observationInput.trim() || undefined, // Adiciona a observação
        });
      }
      order.total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      toast.success(`${quantityInput}x ${selectedProductForQuantity.nome} adicionado ao pedido ${order.cliente_nome}!`);
      return { ...prev, [currentOrderId]: order };
    });

    setIsQuantitySheetOpen(false);
    setSelectedProductForQuantity(null);
    setQuantityInput(1);
    setObservationInput(''); // Limpa a observação após adicionar
  };

  const handleUpdateCartItemQuantity = (orderId: string, productId: string, change: number) => {
    setActiveOrders(prev => {
      const order = { ...prev[orderId] };
      const itemIndex = order.items.findIndex(item => item.productId === productId);

      if (itemIndex !== -1) {
        const newQuantity = order.items[itemIndex].quantity + change;
        if (newQuantity <= 0) {
          order.items.splice(itemIndex, 1); // Remove item if quantity is 0 or less
          toast.info(`Item removido do pedido ${order.cliente_nome}.`);
        } else {
          order.items[itemIndex].quantity = newQuantity;
        }
        order.total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      }
      return { ...prev, [orderId]: order };
    });
  };

  const handleRemoveCartItem = (orderId: string, productId: string) => {
    setActiveOrders(prev => {
      const order = { ...prev[orderId] };
      order.items = order.items.filter(item => item.productId !== productId);
      order.total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      toast.info(`Item removido do pedido ${order.cliente_nome}.`);
      return { ...prev, [orderId]: order };
    });
  };

  const handleUpdateOrderDetails = (orderId: string, updates: Partial<ActiveOrder>) => {
    setActiveOrders(prev => {
      const order = { ...prev[orderId], ...updates };
      return { ...prev, [orderId]: order };
    });
  };

  const saveOrderToSupabase = async (status: 'Pendente' | 'Processada') => {
    if (!currentOrder) {
      toast.error('Nenhum pedido ativo para salvar!');
      return;
    }
    if (currentOrder.items.length === 0) {
      toast.error('O pedido está vazio!');
      return;
    }
    // Validação: Cliente deve ser selecionado
    if (!currentOrder.cliente_id) {
      toast.error('Selecione um cliente para o pedido antes de finalizar ou salvar.');
      return;
    }

    const comandaData: ComandaInsert = {
      cliente_id: currentOrder.cliente_id,
      cliente_nome: currentOrder.cliente_nome,
      valor: currentOrder.total,
      forma_pagamento: currentOrder.forma_pagamento,
      data: currentOrder.date, // Usar a data do pedido
      horario: format(currentOrder.createdAt, 'HH:mm:ss'),
      items: currentOrder.items.map(item => ({
        qty: item.quantity,
        name: item.name,
        price: item.price,
        isVipCombo: item.isVipCombo || false,
        observation: item.observation || undefined,
        adicionais: item.adicionais || undefined, // Incluir adicionais
      })), 
      observacoes: currentOrder.observacoes,
      status: status,
      tipo_servico: currentOrder.tipo_servico,
      status_pagamento: 'Pendente', // Sempre inicia como pendente
      status_entrega: currentOrder.tipo_servico === 'entrega' ? 'Pendente' : null, // Inicia como pendente se for entrega
      texto_original: `Comanda gerada via chat AI ou PDV. Número: ${currentOrder.orderNumber}`, // Adicionar texto original
      orderNumber: currentOrder.orderNumber, // Novo campo
      address: currentOrder.address, // Novo campo
      reference: currentOrder.reference, // Novo campo
      deliveryFee: currentOrder.deliveryFee, // Novo campo
      amountReceived: currentOrder.amountReceived, // Novo campo
      changeAmount: currentOrder.changeAmount, // Novo campo
      prepTimeMin: currentOrder.prepTimeMin, // Novo campo
      prepTimeMax: currentOrder.prepTimeMax, // Novo campo
    };

    const result = await salvarComanda(comandaData);
    if (result) {
      // Se o combo VIP foi aplicado e o cliente é VIP, marcar como usado
      if (currentOrder.vipComboApplied && selectedClientData?.is_vip && selectedClientData?.vip_combo_available && selectedClientData.id) {
        await marcarComboVIPUsado(selectedClientData.id);
      }

      toast.success(`Pedido ${currentOrder.cliente_nome} salvo como ${status.toLowerCase()}!`);
      handleRemoveOrder(currentOrder.id); // Remove from active orders after saving
      setIsOrderDetailsSheetOpen(false);
      onComandaUpdated(); // Notifica o Dashboard que uma comanda foi atualizada

      // Navegar para a aba de Comandas Ativas
      setActiveMainTab('gerenciar-comandas');
      setActiveComandaSubTab('comandas-ativas');
    }
  };

  const handleFinalizeAndProcessOrder = () => saveOrderToSupabase('Processada');
  const handleSavePendingOrder = () => saveOrderToSupabase('Pendente');

  const filteredProductsBySearch = produtos.filter(product =>
    product.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const productsInActiveCategory = useMemo(() => {
    if (activeProductCategoryTab === 'all') {
      return filteredProductsBySearch;
    }
    if (activeProductCategoryTab === 'no-category') {
      return filteredProductsBySearch.filter(product => !product.categoria_id);
    }
    return filteredProductsBySearch.filter(product => product.categoria_id === activeProductCategoryTab);
  }, [activeProductCategoryTab, filteredProductsBySearch]);

  const productsWithoutCategory = filteredProductsBySearch.filter(product => !product.categoria_id);

  const getPaymentMethodClass = (method: string) => {
    switch (method) {
      case 'Pix': return 'payment-pix';
      case 'Cartão': return 'payment-cartao';
      case 'Dinheiro': return 'payment-dinheiro';
      default: return 'payment-outros';
    }
  };

  const handleClientCreated = (newClient: Cliente) => {
    carregarClientes(); // Recarrega a lista de clientes
    if (currentOrderId) {
      handleUpdateOrderDetails(currentOrderId, {
        cliente_id: newClient.id,
        cliente_nome: newClient.nome,
      });
    }
    toast.success(`Cliente "${newClient.nome}" criado e selecionado!`);
  };

  const handleApplyVipCombo = () => {
    if (!currentOrder || !selectedClientData || !selectedClientData.is_vip || !selectedClientData.vip_combo_available) {
      toast.error('Cliente não é VIP ou combo já utilizado/indisponível.');
      return;
    }

    // Verificar se o pedido tem valor mínimo de R$5,00
    const totalExcludingCombo = currentOrder.items.filter(item => !item.isVipCombo).reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (totalExcludingCombo < 5) {
      toast.error('O pedido deve ter um valor mínimo de R$5,00 para aplicar o combo VIP.');
      return;
    }

    // Adicionar um item de desconto ou um item de combo com valor negativo
    const comboItem: OrderItem = {
      productId: 'vip-combo-discount', // ID fictício para o combo
      name: 'Combo VIP (Desconto)',
      price: -27.00, // Desconto de R$27,00
      quantity: 1,
      isVipCombo: true,
    };

    setActiveOrders(prev => {
      const order = { ...prev[currentOrderId!] };
      // Remover qualquer combo VIP anterior para evitar duplicidade
      order.items = order.items.filter(item => !item.isVipCombo);
      order.items.push(comboItem);
      order.total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      order.vipComboApplied = true; // Marcar que o combo foi aplicado
      return { ...prev, [currentOrderId!]: order };
    });
    toast.success('Combo VIP de R$27,00 aplicado!');
  };

  const handleRemoveVipCombo = () => {
    if (!currentOrder || !currentOrder.vipComboApplied) return;

    setActiveOrders(prev => {
      const order = { ...prev[currentOrderId!] };
      order.items = order.items.filter(item => !item.isVipCombo);
      order.total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      order.vipComboApplied = false;
      return { ...prev, [currentOrderId!]: order };
    });
    toast.info('Combo VIP removido.');
  };

  const renderProductGrid = (productsToRender: Produto[]) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {productsToRender.map(product => (
        <Card
          key={product.id}
          className="cursor-pointer hover:shadow-lg transition-shadow duration-200 rounded-xl overflow-hidden bg-card/80 border border-primary/10 hover:border-primary/30 hover:scale-[1.02]"
          onClick={() => handleProductSelect(product)}
        >
          <CardContent className="p-0">
            <div className="w-full h-32 bg-muted flex items-center justify-center overflow-hidden">
              {product.imagem_url ? (
                <img src={product.imagem_url} alt={product.nome} className="w-full h-full object-cover" />
              ) : (
                <Package className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
            <div className="p-3">
              <h3 className="font-semibold text-base truncate">{product.nome}</h3>
              <p className="text-xs text-muted-foreground mt-1">{categoriasProdutos.find(c => c.id === product.categoria_id)?.nome || 'Sem Categoria'}</p>
              <p className="font-bold text-primary mt-2 text-lg">{formatCurrency(product.preco)}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div 
      className="min-h-screen relative flex flex-col items-center overflow-x-hidden" // Removido justify-center
      style={{
        backgroundImage: `url(${burgerBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />

      {/* Wrapper for main content and sidebar */}
      <div className="relative z-10 flex flex-row w-full max-w-7xl mx-auto bg-card/90 border border-primary/20 vixxe-shadow rounded-xl my-6">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-4 md:p-6">
          <h1 className="text-3xl md:text-4xl font-extrabold bg-vixxe-gradient bg-clip-text text-transparent mb-6">
            Sistema PDV
          </h1>

          <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50 rounded-xl p-1 shadow-inner">
              <TabsTrigger value="pdv" className="text-sm data-[state=active]:bg-vixxe-gradient data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:rounded-lg transition-all duration-200">
                <ShoppingCart className="w-4 h-4 mr-2" />
                PDV
              </TabsTrigger>
              <TabsTrigger value="gerenciar-produtos" className="text-sm data-[state=active]:bg-vixxe-gradient data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:rounded-lg transition-all duration-200">
                <Package className="w-4 h-4 mr-2" />
                Gerenciar Produtos
              </TabsTrigger>
              <TabsTrigger value="gerenciar-comandas" className="text-sm data-[state=active]:bg-vixxe-gradient data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:rounded-lg transition-all duration-200">
                <MessageSquare className="w-4 h-4 mr-2" />
                Gerenciar Comandas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pdv" className="flex-1 flex flex-col mt-0">
              {/* Search and Categories */}
              <div className="mb-6 space-y-4">
                <div className="flex items-center gap-2 w-full max-w-md"> {/* Alterado para flex */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar produtos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full h-10 rounded-lg pl-10 bg-input/80 border-primary/20 focus:border-primary/50"
                    />
                  </div>
                  {/* Botão de Comandas Pendentes */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="relative h-10 w-10 flex-shrink-0"
                    onClick={() => setIsPendingComandasFABSheetOpen(true)}
                    aria-label="Comandas Pendentes"
                  >
                    <BellRing className="w-5 h-5" />
                    {pendingComandasCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center text-xs bg-red-600 text-white animate-pulse">
                        {pendingComandasCount}
                      </Badge>
                    )}
                  </Button>
                  {/* Botão do Carrinho (Mobile) */}
                  {isMobile && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="relative h-10 w-10 flex-shrink-0 bg-vixxe-gradient text-white hover:scale-105 transition-transform"
                      onClick={() => setIsOrderDetailsSheetOpen(true)}
                      aria-label="Abrir Carrinho"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      {currentOrder && currentOrder.items.length > 0 && (
                        <Badge className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center text-xs bg-red-500 text-white">
                          {currentOrder.items.length}
                        </Badge>
                      )}
                    </Button>
                  )}
                </div>

                {productsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                    Carregando produtos...
                  </div>
                ) : (
                  <>
                    {produtos.length === 0 ? (
                      <EmptyState
                        icon={Package}
                        title="Nenhum produto cadastrado"
                        description="Comece adicionando produtos na aba 'Gerenciar Produtos'."
                        iconClassName="text-muted-foreground"
                      />
                    ) : (
                      <Tabs value={activeProductCategoryTab} onValueChange={setActiveProductCategoryTab} className="flex-1 flex flex-col">
                        <TabsList className="flex w-full overflow-x-auto whitespace-nowrap p-1 rounded-xl shadow-inner bg-muted/50 mb-4">
                          <TabsTrigger value="all" className="flex-shrink-0 text-sm px-3 py-2 data-[state=active]:bg-vixxe-gradient data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:rounded-lg transition-all duration-200">
                            <Package className="w-4 h-4 mr-2" />
                            Todos
                          </TabsTrigger>
                          {productsWithoutCategory.length > 0 && (
                            <TabsTrigger value="no-category" className="flex-shrink-0 text-sm px-3 py-2 data-[state=active]:bg-vixxe-gradient data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:rounded-lg transition-all duration-200">
                              <X className="w-4 h-4 mr-2" />
                              Sem Categoria
                            </TabsTrigger>
                          )}
                          {categoriasProdutos.map(category => (
                            <TabsTrigger key={category.id} value={category.id} className="flex-shrink-0 text-sm px-3 py-2 data-[state=active]:bg-vixxe-gradient data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:rounded-lg transition-all duration-200">
                              <Tag className="w-4 h-4 mr-2" />
                              {category.nome}
                            </TabsTrigger>
                          ))}
                        </TabsList>

                        <TabsContent value="all" className="mt-0">
                          {productsInActiveCategory.length > 0 ? renderProductGrid(productsInActiveCategory) : (
                            <EmptyState
                              icon={Package}
                              title="Nenhum produto encontrado"
                              description="Ajuste sua busca ou selecione outra categoria."
                              iconClassName="text-muted-foreground"
                            />
                          )}
                        </TabsContent>
                        {productsWithoutCategory.length > 0 && (
                          <TabsContent value="no-category" className="mt-0">
                            {productsInActiveCategory.length > 0 ? renderProductGrid(productsInActiveCategory) : (
                              <EmptyState
                                icon={Package}
                                title="Nenhum produto sem categoria encontrado"
                                description="Todos os produtos estão categorizados ou não há produtos sem categoria."
                                iconClassName="text-muted-foreground"
                              />
                            )}
                          </TabsContent>
                        )}
                        {categoriasProdutos.map(category => (
                          <TabsContent key={category.id} value={category.id} className="mt-0">
                            {productsInActiveCategory.length > 0 ? renderProductGrid(productsInActiveCategory) : (
                              <EmptyState
                                icon={Package}
                                title={`Nenhum produto na categoria "${category.nome}"`}
                                description="Ajuste sua busca ou adicione produtos a esta categoria."
                                iconClassName="text-muted-foreground"
                              />
                            )}
                          </TabsContent>
                        ))}
                      </Tabs>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="gerenciar-produtos" className="flex-1 flex flex-col mt-0">
              <ProductManagementTab />
            </TabsContent>

            <TabsContent value="gerenciar-comandas" className="flex-1 flex flex-col mt-0">
              <ComandaManagementTab 
                activeSubTab={activeComandaSubTab}
                setActiveSubTab={setActiveComandaSubTab}
                onComandaUpdated={onComandaUpdated}
                
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar for Orders (Desktop) */}
        {!isMobile && (
          <Card className="w-96 border-l border-border bg-card flex flex-col p-4 md:p-6 rounded-none">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="flex items-center justify-between text-2xl font-bold">
                Pedidos Ativos
                <Button variant="ghost" size="icon" onClick={handleAddOrder}>
                  <Plus className="w-5 h-5" />
                </Button>
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Gerencie múltiplos pedidos simultaneamente.
              </CardDescription>
            </CardHeader>

            <Tabs value={currentOrderId || ''} onValueChange={setCurrentOrderId} className="flex-1 flex flex-col">
              <TabsList className="flex flex-wrap gap-2 mb-4 p-0 bg-transparent border-b border-border">
                {Object.values(activeOrders).map(order => (
                  <TabsTrigger
                    key={order.id}
                    value={order.id}
                    className="relative group data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/50 border rounded-md px-3 py-1 text-sm"
                  >
                    {order.cliente_nome}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveOrder(order.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
                {currentOrder ? (
                  <TabsContent value={currentOrder.id} className="mt-0">
                    <OrderDetailsPanel
                      order={currentOrder}
                      clientes={clientes}
                      selectedClientData={selectedClientData}
                      handleUpdateOrderDetails={handleUpdateOrderDetails}
                      handleApplyVipCombo={handleApplyVipCombo}
                      handleRemoveVipCombo={handleRemoveVipCombo}
                      handleUpdateCartItemQuantity={handleUpdateCartItemQuantity}
                      handleRemoveCartItem={handleRemoveCartItem}
                      setIsCreateClientSheetOpen={setIsCreateClientSheetOpen}
                      handleClientCreated={handleClientCreated}
                      isMobile={false}
                    />
                  </TabsContent>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">Selecione ou crie um pedido.</div>
                )}
              </div>

              {currentOrder && (
                <div className="mt-auto pt-4 border-t border-border space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="2xl font-bold text-primary">{formatCurrency(currentOrder.total)}</span>
                  </div>
                  <Button
                    onClick={() => setIsOrderDetailsSheetOpen(true)}
                    className="w-full bg-vixxe-gradient text-white hover:opacity-90"
                    disabled={currentOrder.items.length === 0 || comandasLoading || !currentOrder.cliente_id} // Desabilita se não houver cliente
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Finalizar Pedido
                  </Button>
                </div>
              )}
            </Tabs>
          </Card>
        )}
      </div>

      {/* Quantity Input Sheet */}
      <Sheet open={isQuantitySheetOpen} onOpenChange={setIsQuantitySheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Adicionar Quantidade</SheetTitle>
            <SheetDescription>
              Quantas unidades de "{selectedProductForQuantity?.nome}" deseja adicionar?
            </SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-4">
            {selectedProductForQuantity && (
              <div className="flex items-center gap-4">
                <img
                  src={selectedProductForQuantity.imagem_url || '/placeholder.svg'}
                  alt={selectedProductForQuantity.nome}
                  className="w-20 h-20 object-cover rounded-md"
                />
                <div>
                  <p className="font-semibold text-lg">{selectedProductForQuantity.nome}</p>
                  <p className="text-muted-foreground">{formatCurrency(selectedProductForQuantity.preco)}</p>
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantityInput}
                onChange={(e) => setQuantityInput(parseInt(e.target.value) || 1)}
                className="text-lg h-12"
              />
            </div>
            {/* Novo campo de observação */}
            <div>
              <Label htmlFor="item-observation">Observação (opcional)</Label>
              <Textarea
                id="item-observation"
                value={observationInput}
                onChange={(e) => setObservationInput(e.target.value)}
                placeholder="Ex: Sem cebola, bem passado, etc."
                rows={2}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-auto">
            <Button variant="outline" onClick={() => setIsQuantitySheetOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleAddProductToOrder} className="flex-1 bg-vixxe-gradient text-white hover:opacity-90">
              Adicionar ao Pedido
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Order Details Sheet (Mobile & Desktop Finalization) */}
      <Sheet open={isOrderDetailsSheetOpen} onOpenChange={setIsOrderDetailsSheetOpen}>
        <SheetContent className="sm:max-w-lg flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Detalhes do Pedido
              </div>
              <Button variant="ghost" size="icon" onClick={handleAddOrder}>
                <Plus className="w-5 h-5" />
              </Button>
            </SheetTitle>
            <SheetDescription>
              Revise e finalize o pedido atual.
            </SheetDescription>
          </SheetHeader>

          <Tabs value={currentOrderId || ''} onValueChange={setCurrentOrderId} className="flex-1 flex flex-col">
            <TabsList className="flex flex-wrap gap-2 mb-4 p-0 bg-transparent border-b border-border">
              {Object.values(activeOrders).map(order => (
                <TabsTrigger
                  key={order.id}
                  value={order.id}
                  className="relative group data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/50 border rounded-md px-3 py-1 text-sm"
                >
                  {order.cliente_nome}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveOrder(order.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
              {currentOrder ? (
                <TabsContent value={currentOrder.id} className="mt-0">
                  <OrderDetailsPanel
                    order={currentOrder}
                    clientes={clientes}
                    selectedClientData={selectedClientData}
                    handleUpdateOrderDetails={handleUpdateOrderDetails}
                    handleApplyVipCombo={handleApplyVipCombo}
                    handleRemoveVipCombo={handleRemoveVipCombo}
                    handleUpdateCartItemQuantity={handleUpdateCartItemQuantity}
                    handleRemoveCartItem={handleRemoveCartItem}
                    setIsCreateClientSheetOpen={setIsCreateClientSheetOpen}
                    handleClientCreated={handleClientCreated}
                    isMobile={true}
                  />
                </TabsContent>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                  <p>Nenhum pedido ativo para exibir.</p>
                </div>
              )}
            </div>

            {currentOrder && (
              <div className="mt-auto pt-4 border-t border-border space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="2xl font-bold text-primary">{formatCurrency(currentOrder.total)}</span>
                </div>
                <Button
                  onClick={handleSavePendingOrder}
                  className="w-full bg-yellow-600 text-white hover:bg-yellow-700"
                  disabled={!currentOrder || currentOrder.items.length === 0 || comandasLoading || !currentOrder.cliente_id} // Desabilita se não houver cliente
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Salvar como Pendente
                </Button>
                <Button
                  onClick={handleFinalizeAndProcessOrder}
                  className="w-full bg-vixxe-gradient text-white hover:opacity-90"
                  disabled={!currentOrder || currentOrder.items.length === 0 || comandasLoading || !currentOrder.cliente_id} // Desabilita se não houver cliente
                >
                  {comandasLoading ? 'Finalizando...' : 'Finalizar e Enviar para Produção'}
                </Button>
              </div>
            )}
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Create Client Sheet */}
      <CreateClientSheet
        open={isCreateClientSheetOpen}
        onOpenChange={setIsCreateClientSheetOpen}
        onClientCreated={handleClientCreated}
      />

      {/* Pending Comandas FAB (Sheet component, triggered by the new button) */}
      <PendingComandasFAB
        open={isPendingComandasFABSheetOpen}
        onOpenChange={setIsPendingComandasFABSheetOpen}
        onNavigateToComandaManagement={() => setActiveMainTab('gerenciar-comandas')} // Navega para a aba de gerenciamento de comandas
        onComandaUpdated={onComandaUpdated}
      />
    </div>
  );
}