import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'; // Importar Sheet
import { Users, Star, Edit, Eye, Phone, Mail, MapPin, Calendar, DollarSign, Award, TrendingUp, Plus, Globe, ShoppingCart, Clock, MessageSquare, RotateCcw, User, Filter, Smartphone, CreditCard, Banknote, MoreHorizontal, Crown, Gift, EyeOff, Search } from "lucide-react"; // Adicionado User, Filter, Smartphone, CreditCard, Banknote, MoreHorizontal, Crown, Gift, EyeOff, Search
import { toast } from "sonner";
import { useClientes, useComandas } from '@/hooks/useSupabase'; // Importar useComandas
import { Cliente, Comanda, FiltroComandas } from '@/types/supabase'; // Importar o tipo Cliente e Comanda do Supabase
import { EmptyState } from '@/components/shared/EmptyState'; // Importar EmptyState
import { CreateClientSheet } from './CreateClientSheet'; // Importar CreateClientSheet
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'; // Importar AlertDialog
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInDays, startOfDay } from 'date-fns'; // Importar funções de data
import { ptBR } from 'date-fns/locale'; // Importar locale para datas
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useVipSystem } from '@/hooks/useVipSystem'; // Importar useVipSystem para getWeekEndDate e getMonthEndDate

const categoriaLabels = {
  novo: "Novo Cliente",
  regular: "Cliente Regular", 
  vip: "Cliente VIP",
  premium: "Cliente Premium"
};

const categoriaColors = {
  novo: "bg-gray-100 text-gray-800",
  regular: "bg-blue-100 text-blue-800",
  vip: "bg-purple-100 text-purple-800",
  premium: "bg-yellow-100 text-yellow-800" // Alterado para yellow-100 para combinar com o tema
};

interface ClientsManagementProps {
  globalVipSettings: {
    default_week_start_date: string;
    default_month_start_date: string;
  };
}

export function ClientsManagement({ globalVipSettings }: ClientsManagementProps) {
  const { clientes, loading, carregarClientes, atualizarCliente } = useClientes(); // Removed atualizarDatasGlobaisClientes
  const { comandas, loading: comandasLoading, carregarComandas } = useComandas(); // Usar useComandas
  const { getWeekEndDate, getMonthEndDate } = useVipSystem(); // Usar useVipSystem para as funções de data
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false); // Alterado para Sheet
  const [isCreateClientSheetOpen, setIsCreateClientSheetOpen] = useState(false);
  const [showSensitiveData, setShowSensitiveData] = useState(false); // Estado para o olho de privacidade
  const [clientSearchTerm, setClientSearchTerm] = useState(''); // Estado para o filtro de busca
  
  const [editForm, setEditForm] = useState({
    nome: "",
    telefone: "",
    endereco: "",
    preferencias: "",
    observacoes: "",
    admin_set_week_start_date: "" as string | null,
    admin_set_month_start_date: "" as string | null,
    meta_valor_semanal: 0,
    meta_pedidos_semanal: 0,
  });

  // Estados para exibir as datas de fim e contagem regressiva no formulário de edição
  const [clientWeekEndDate, setClientWeekEndDate] = useState<Date | null>(null);
  const [clientMonthEndDate, setClientMonthEndDate] = useState<Date | null>(null);
  const [daysUntilClientWeekEnd, setDaysUntilClientWeekEnd] = useState<number | null>(null);
  const [daysUntilClientMonthEnd, setDaysUntilClientMonthEnd] = useState<number | null>(null);


  // Removed globalDatesForm state

  // Estados para filtros de comandas do cliente
  const [clientComandaStartDate, setClientComandaStartDate] = useState<string>('');
  const [clientComandaEndDate, setClientComandaEndDate] = useState<string>('');
  const [filteredClientComandas, setFilteredClientComandas] = useState<Comanda[]>([]);
  const [isClientComandaFilterApplied, setIsClientComandaFilterApplied] = useState(false);
  const [activeComandaAccordionItem, setActiveComandaAccordionItem] = useState<string | null>(null);

  useEffect(() => {
    carregarClientes();
  }, [carregarClientes]);

  // Carregar comandas do cliente quando o sheet é aberto ou filtros mudam
  useEffect(() => {
    if (isEditSheetOpen && selectedClient?.id) {
      const filters: FiltroComandas = { cliente: selectedClient.id };
      if (clientComandaStartDate) filters.dataInicio = clientComandaStartDate;
      if (clientComandaEndDate) filters.dataFim = clientComandaEndDate;
      
      carregarComandas(filters);
    } else {
      setFilteredClientComandas([]); // Limpa as comandas quando o sheet é fechado
    }
  }, [isEditSheetOpen, selectedClient, clientComandaStartDate, clientComandaEndDate, carregarComandas]);

  // Atualizar filteredClientComandas quando 'comandas' do hook useComandas muda
  useEffect(() => {
    if (selectedClient?.id) {
      setFilteredClientComandas(comandas.filter(c => c.cliente_id === selectedClient.id));
    }
  }, [comandas, selectedClient]);

  const handleEditClient = (cliente: Cliente) => {
    setSelectedClient(cliente);
    const effectiveWeekStartDate = cliente.admin_set_week_start_date || globalVipSettings.default_week_start_date;
    const effectiveMonthStartDate = cliente.admin_set_month_start_date || globalVipSettings.default_month_start_date;

    const weekEndDate = getWeekEndDate(effectiveWeekStartDate);
    const monthEndDate = getMonthEndDate(effectiveMonthStartDate);
    const today = startOfDay(new Date());

    setClientWeekEndDate(weekEndDate);
    setClientMonthEndDate(monthEndDate);
    setDaysUntilClientWeekEnd(differenceInDays(weekEndDate, today));
    setDaysUntilClientMonthEnd(differenceInDays(monthEndDate, today));

    setEditForm({
      nome: cliente.nome,
      telefone: cliente.telefone || "",
      endereco: cliente.endereco || "",
      preferencias: cliente.preferencias || "",
      observacoes: cliente.observacoes || "",
      admin_set_week_start_date: cliente.admin_set_week_start_date || globalVipSettings.default_week_start_date,
      admin_set_month_start_date: cliente.admin_set_month_start_date || globalVipSettings.default_month_start_date,
      meta_valor_semanal: cliente.meta_valor_semanal || 0,
      meta_pedidos_semanal: cliente.meta_pedidos_semanal || 0,
    });
    // Definir filtros de data padrão para o cliente (ex: último mês)
    const todayFormatted = new Date();
    setClientComandaEndDate(format(todayFormatted, 'yyyy-MM-dd'));
    setClientComandaStartDate(format(startOfMonth(todayFormatted), 'yyyy-MM-dd'));
    setIsClientComandaFilterApplied(false); // Resetar o estado do filtro
    setIsEditSheetOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedClient) return;

    const updates = {
      nome: editForm.nome,
      telefone: editForm.telefone || null,
      endereco: editForm.endereco || null,
      preferencias: editForm.preferencias || null,
      observacoes: editForm.observacoes || null,
      // Se o campo estiver vazio, salvar como null para usar o global
      admin_set_week_start_date: editForm.admin_set_week_start_date === globalVipSettings.default_week_start_date ? null : editForm.admin_set_week_start_date,
      admin_set_month_start_date: editForm.admin_set_month_start_date === globalVipSettings.default_month_start_date ? null : editForm.admin_set_month_start_date,
      meta_valor_semanal: editForm.meta_valor_semanal,
      meta_pedidos_semanal: editForm.meta_pedidos_semanal,
    };

    const result = await atualizarCliente(selectedClient.id, updates);
    if (result) {
      setIsEditSheetOpen(false);
      setSelectedClient(null);
    }
  };

  // Removed handleApplyGlobalDates function

  const getCategoriaAutomatica = (totalGasto: number, totalPedidos: number) => {
    if (totalGasto >= 1000 || totalPedidos >= 30) return 'premium';
    if (totalGasto >= 500 || totalPedidos >= 15) return 'vip';  
    if (totalPedidos >= 3) return 'regular';
    return 'novo';
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalClientes = clientes.length;
  const clientesVIPPlus = clientes.filter(c => c.is_vip).length;
  const totalGastoGeral = clientes.reduce((acc, c) => acc + (c.total_gasto || 0), 0);
  const totalPedidosGeral = clientes.reduce((acc, c) => acc + (c.total_pedidos || 0), 0);
  const ticketMedioGeral = totalPedidosGeral > 0 ? totalGastoGeral / totalPedidosGeral : 0;

  const handleClientCreated = (newClient: Cliente) => {
    carregarClientes();
    toast.success(`Cliente "${newClient.nome}" criado com sucesso!`);
  };

  // Função para agrupar comandas por data
  const groupComandasByDate = (comandasList: Comanda[]) => {
    const grouped: { [key: string]: Comanda[] } = {};
    comandasList.forEach(comanda => {
      const dateKey = format(parseISO(comanda.data), 'dd/MM/yyyy', { locale: ptBR });
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(comanda);
    });
    return Object.entries(grouped).sort(([dateA], [dateB]) => {
      const d1 = parseISO(dateA.split('/').reverse().join('-'));
      const d2 = parseISO(dateB.split('/').reverse().join('-'));
      return d2.getTime() - d1.getTime(); // Mais recente primeiro
    });
  };

  const groupedClientComandas = groupComandasByDate(filteredClientComandas);

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'Pix': return <Smartphone className="w-3 h-3" />;
      case 'Cartão': return <CreditCard className="w-3 h-3" />;
      case 'Dinheiro': return <Banknote className="w-3 h-3" />;
      default: return <MoreHorizontal className="w-3 h-3" />;
    }
  };

  const getPaymentMethodClass = (method: string) => {
    switch (method) {
      case 'Pix': return 'payment-pix';
      case 'Cartão': return 'payment-cartao';
      case 'Dinheiro': return 'payment-dinheiro';
      default: return 'payment-outros';
    }
  };

  const handleApplyClientComandaFilters = () => {
    setIsClientComandaFilterApplied(true);
    // carregarComandas já é chamado no useEffect quando os estados de filtro mudam
    toast.success('Filtros de comandas aplicados!');
  };

  const handleClearClientComandaFilters = () => {
    const today = new Date();
    setClientComandaEndDate(format(today, 'yyyy-MM-dd'));
    setClientComandaStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
    setIsClientComandaFilterApplied(false);
    toast.info('Filtros de comandas limpos. Exibindo o mês atual.');
  };

  const filteredClients = clientes.filter(client => 
    client.nome.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    client.telefone?.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(clientSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Removed "Configuração Global de Períodos" Card */}

      {/* Estatísticas dos Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="vixxe-shadow rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Clientes</p>
                <p className="text-2xl font-bold">{totalClientes}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="vixxe-shadow rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clientes VIP</p>
                <p className="text-2xl font-bold">
                  {clientesVIPPlus}
                </p>
              </div>
              <Award className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="vixxe-shadow rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(ticketMedioGeral)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="vixxe-shadow rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Gasto Geral</p>
                <p className="text-2xl font-bold">{formatCurrency(totalGastoGeral)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Clientes */}
      <Card className="vixxe-shadow rounded-xl">
        <CardHeader className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Clientes Cadastrados
          </CardTitle>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={clientSearchTerm}
                onChange={(e) => setClientSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowSensitiveData(!showSensitiveData)} 
              title={showSensitiveData ? "Ocultar dados sensíveis" : "Mostrar dados sensíveis"}
            >
              {showSensitiveData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button onClick={() => setIsCreateClientSheetOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
              Carregando clientes...
            </div>
          ) : filteredClients.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nenhum cliente encontrado"
              description="Ajuste seu filtro de busca ou adicione novos clientes."
              iconClassName="text-muted-foreground"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Gasto Semana</TableHead>
                  <TableHead>Pedidos Semana</TableHead>
                  <TableHead>Gasto Mês</TableHead>
                  <TableHead>Pedidos Mês</TableHead>
                  <TableHead>Total Gasto</TableHead>
                  <TableHead>Total Pedidos</TableHead>
                  <TableHead>Último Pedido</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((cliente) => {
                  const categoria = getCategoriaAutomatica(cliente.total_gasto || 0, cliente.total_pedidos || 0);
                  return (
                    <TableRow key={cliente.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div>
                          <div className="font-medium">{cliente.nome}</div>
                          <div className="text-xs text-muted-foreground">ID: {cliente.id.substring(0, 8)}</div>
                          {cliente.is_vip && (
                            <Badge variant="default" className="mt-1 bg-purple-500 text-white">
                              <Crown className="w-3 h-3 mr-1" /> VIP
                            </Badge>
                          )}
                          {cliente.vip_combo_available && (
                            <Badge variant="secondary" className="mt-1 ml-1 bg-green-500 text-white">
                              <Gift className="w-3 h-3 mr-1" /> Combo VIP Disponível
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {cliente.telefone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="w-3 h-3" />
                              {showSensitiveData ? cliente.telefone : '***-****-****'}
                            </div>
                          )}
                          {cliente.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="w-3 h-3" />
                              {showSensitiveData ? cliente.email : '***@****.com'}
                            </div>
                          )}
                          {cliente.endereco && (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="w-3 h-3" />
                              {showSensitiveData ? cliente.endereco : '***'}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={categoriaColors[categoria]}>
                          {categoriaLabels[categoria]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{showSensitiveData ? formatCurrency(cliente.total_gasto_semana) : 'R$ ***,**'}</div>
                        <div className="text-xs text-muted-foreground">semana</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{showSensitiveData ? (cliente.total_pedidos_semana || 0) : '**'}</div>
                        <div className="text-xs text-muted-foreground">semana</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{showSensitiveData ? formatCurrency(cliente.total_gasto_mes) : 'R$ ***,**'}</div>
                        <div className="text-xs text-muted-foreground">mês</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{showSensitiveData ? (cliente.total_pedidos_mes || 0) : '**'}</div>
                        <div className="text-xs text-muted-foreground">mês</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-green-600">
                          {showSensitiveData ? formatCurrency(cliente.total_gasto) : 'R$ ***,**'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="font-medium">{showSensitiveData ? (cliente.total_pedidos || 0) : '**'}</div>
                          <div className="text-xs text-muted-foreground">pedidos</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {cliente.ultimo_pedido 
                          ? new Date(cliente.ultimo_pedido).toLocaleDateString('pt-BR')
                          : 'Nunca'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditClient(cliente)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Sheet de Edição de Cliente e Histórico de Comandas */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar Cliente: {selectedClient?.nome}</SheetTitle>
            <SheetDescription>
              Ajuste os detalhes do cliente e visualize seu histórico de comandas.
            </SheetDescription>
          </SheetHeader>
          <div className="py-6 space-y-6">
            {/* Detalhes do Cliente */}
            <Card className="vixxe-shadow rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informações do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome</Label>
                    <Input
                      id="nome"
                      value={editForm.nome}
                      onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={editForm.telefone}
                      onChange={(e) => setEditForm({ ...editForm, telefone: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={editForm.endereco}
                    onChange={(e) => setEditForm({ ...editForm, endereco: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="preferencias">Preferências</Label>
                  <Textarea
                    id="preferencias"
                    value={editForm.preferencias}
                    onChange={(e) => setEditForm({ ...editForm, preferencias: e.target.value })}
                    placeholder="Ex: Sem cebola, extra molho, etc."
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={editForm.observacoes}
                    onChange={(e) => setEditForm({ ...editForm, observacoes: e.target.value })}
                    placeholder="Observações internas sobre o cliente"
                    rows={2}
                  />
                </div>

                <Separator />

                <h3 className="font-semibold text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Datas de Cálculo Personalizadas
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Defina datas de início específicas para este cliente (sobrescreve as globais).
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="admin_set_week_start_date">Início da Semana</Label>
                    <Input
                      id="admin_set_week_start_date"
                      type="date"
                      value={editForm.admin_set_week_start_date || ''}
                      onChange={(e) => setEditForm({ ...editForm, admin_set_week_start_date: e.target.value })}
                      title={`Defina a data de início para o cálculo semanal. Deixe vazio para usar a configuração global: ${format(parseISO(globalVipSettings.default_week_start_date), 'dd/MM/yyyy', { locale: ptBR })}.`}
                    />
                    {clientWeekEndDate && (
                      <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Fim: {format(clientWeekEndDate, 'dd/MM/yyyy', { locale: ptBR })}
                        {daysUntilClientWeekEnd !== null && (
                          <Badge variant="secondary" className="ml-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {daysUntilClientWeekEnd === 0 ? 'Hoje!' : `${daysUntilClientWeekEnd} dia(s)`}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="admin_set_month_start_date">Início do Mês</Label>
                    <Input
                      id="admin_set_month_start_date"
                      type="date"
                      value={editForm.admin_set_month_start_date || ''}
                      onChange={(e) => setEditForm({ ...editForm, admin_set_month_start_date: e.target.value })}
                      title={`Defina a data de início para o cálculo mensal. Deixe vazio para usar a configuração global: ${format(parseISO(globalVipSettings.default_month_start_date), 'dd/MM/yyyy', { locale: ptBR })}.`}
                    />
                    {clientMonthEndDate && (
                      <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Fim: {format(clientMonthEndDate, 'dd/MM/yyyy', { locale: ptBR })}
                        {daysUntilClientMonthEnd !== null && (
                          <Badge variant="secondary" className="ml-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {daysUntilClientMonthEnd === 0 ? 'Hoje!' : `${daysUntilClientMonthEnd} dia(s)`}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <h3 className="font-semibold text-base flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Metas VIP Personalizadas
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Defina metas VIP específicas para este cliente (sobrescreve as globais).
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="meta_valor_semanal">Meta Valor Semanal (R$)</Label>
                    <Input
                      id="meta_valor_semanal"
                      type="number"
                      step="0.01"
                      value={editForm.meta_valor_semanal}
                      onChange={(e) => setEditForm({ ...editForm, meta_valor_semanal: parseFloat(e.target.value) || 0 })}
                      title="Meta de valor para o status VIP semanal."
                    />
                  </div>
                  <div>
                    <Label htmlFor="meta_pedidos_semanal">Meta Pedidos Semanal</Label>
                    <Input
                      id="meta_pedidos_semanal"
                      type="number"
                      value={editForm.meta_pedidos_semanal}
                      onChange={(e) => setEditForm({ ...editForm, meta_pedidos_semanal: parseInt(e.target.value) || 0 })}
                      title="Meta de pedidos para o status VIP semanal."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Histórico de Comandas do Cliente */}
            <Card className="vixxe-shadow rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Histórico de Comandas
                </CardTitle>
                <CardDescription>
                  Comandas registradas para {selectedClient?.nome}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filtros de Data para Comandas do Cliente */}
                <div className="flex flex-wrap gap-2 items-end">
                  <div className="flex-1 min-w-[120px]">
                    <Label htmlFor="client-comanda-start-date" className="text-xs">De</Label>
                    <Input
                      id="client-comanda-start-date"
                      type="date"
                      value={clientComandaStartDate}
                      onChange={(e) => setClientComandaStartDate(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <Label htmlFor="client-comanda-end-date" className="text-xs">Até</Label>
                    <Input
                      id="client-comanda-end-date"
                      type="date"
                      value={clientComandaEndDate}
                      onChange={(e) => setClientComandaEndDate(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleApplyClientComandaFilters} size="sm">
                    <Filter className="w-4 h-4" />
                    Filtrar
                  </Button>
                  {isClientComandaFilterApplied && (
                    <Button onClick={handleClearClientComandaFilters} variant="outline" size="sm">
                      <RotateCcw className="w-4 h-4" />
                      Limpar
                    </Button>
                  )}
                </div>

                {comandasLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                    Carregando comandas...
                  </div>
                ) : groupedClientComandas.length === 0 ? (
                  <EmptyState
                    icon={ShoppingCart}
                    title="Nenhuma comanda encontrada"
                    description="Nenhuma comanda registrada para este cliente no período selecionado."
                    iconClassName="text-muted-foreground"
                  />
                ) : (
                  <Accordion type="single" collapsible value={activeComandaAccordionItem} onValueChange={setActiveComandaAccordionItem}>
                    {groupedClientComandas.map(([date, comandasDoDia]) => (
                      <AccordionItem key={date} value={date} className="border-b last:border-b-0">
                        <AccordionTrigger className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                          <h4 className="font-semibold text-base">{date} ({comandasDoDia.length} comandas)</h4>
                          <span className="font-bold text-lg text-primary">
                            {formatCurrency(comandasDoDia.reduce((sum, c) => sum + c.valor, 0))}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 border-t bg-card/50 space-y-3">
                          {comandasDoDia.map(comanda => (
                            <div key={comanda.id} className="p-3 bg-background rounded-lg border">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {comanda.horario?.substring(0, 5) || 'N/A'}
                                </div>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs flex items-center gap-1 ${getPaymentMethodClass(comanda.forma_pagamento || 'Outros')}`}
                                >
                                  {getPaymentMethodIcon(comanda.forma_pagamento || 'Outros')}
                                  {comanda.forma_pagamento}
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <div className="flex-1">
                                  <p className="font-medium text-base">Total: {formatCurrency(comanda.valor)}</p>
                                  <p className="text-xs text-muted-foreground">Status: {comanda.status}</p>
                                </div>
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4 mr-1" />
                                  Ver Detalhes
                                </Button>
                              </div>
                              {comanda.observacoes && (
                                <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  {comanda.observacoes}
                                </div>
                              )}
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </div>
          <SheetFooter className="gap-2 mt-auto">
            <Button variant="outline" onClick={() => setIsEditSheetOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} variant="vixxe">
              Salvar Alterações
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Sheet de Criação de Cliente */}
      <CreateClientSheet
        open={isCreateClientSheetOpen}
        onOpenChange={setIsCreateClientSheetOpen}
        onClientCreated={handleClientCreated}
      />
    </div>
  );
}