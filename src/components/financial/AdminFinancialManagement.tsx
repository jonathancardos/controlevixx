import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, DollarSign, CalendarDays, Trash2, Users, MinusCircle, CheckCircle, XCircle, User, Tag, Target, Archive, RotateCcw, History, Edit, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO, addDays, isPast, isSameDay, startOfDay, endOfDay, isBefore, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFinancialSupabase } from '@/hooks/useFinancialSupabase';
import { useUserSupabase } from '@/hooks/useUserSupabase';
import { Usuario, QuinzenaPagamento, PagamentoDiarioInsert, PagamentoDiario } from '@/types/supabase';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface AdminFinancialManagementProps {
  user: Usuario;
}

export function AdminFinancialManagement({ user }: AdminFinancialManagementProps) {
  const {
    pagamentosDiarios,
    setPagamentosDiarios,
    quinzenasPagamento,
    setQuinzenasPagamento,
    loading,
    carregarPagamentosDiarios,
    carregarQuinzenasPagamento,
    criarPagamentoDiario,
    criarQuinzenaPagamento,
    criarDeducao,
    marcarPagamentoComoPago,
    atualizarStatusQuinzena,
    arquivarQuinzena,
    excluirPagamentoDiario,
    excluirQuinzenaPagamento,
  } = useFinancialSupabase();
  const { usuarios, carregarUsuarios } = useUserSupabase();

  const [activeTab, setActiveTab] = useState('pagamentos');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newPaymentForm, setNewPaymentForm] = useState({
    valor: '',
    data_pagamento: format(new Date(), 'yyyy-MM-dd'),
  });
  const [newQuinzenaForm, setNewQuinzenaForm] = useState({
    quinzena1: {
      data_inicio: format(new Date(), 'yyyy-MM-dd'),
      data_fim: format(addDays(new Date(), 14), 'yyyy-MM-dd'), // Sugestão de 15 dias de período
      valor_meta: '',
    },
    quinzena2: {
      data_inicio: format(addDays(new Date(), 15), 'yyyy-MM-dd'),
      data_fim: format(addDays(new Date(), 29), 'yyyy-MM-dd'), // Sugestão de 15 dias de período
      valor_meta: '',
    }
  });
  const [newDeductionForm, setNewDeductionForm] = useState({
    deductionType: 'falta' as 'falta' | 'atraso' | 'outros', // This will drive UI logic
    valor: '50.00',
    data: format(new Date(), 'yyyy-MM-dd'),
    observacao: '', // This will be used for custom reasons
  });

  const [isEditDeductionSheetOpen, setIsEditDeductionSheetOpen] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState<PagamentoDiario | null>(null);
  const [editDeductionForm, setEditDeductionForm] = useState({
    valor: '',
    data_pagamento: '',
    tipo: 'deducao_falta' as 'deducao_falta' | 'deducao_atraso' | 'deducao_outros',
    observacoes: '',
  });

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  useEffect(() => {
    if (selectedUserId) {
      carregarPagamentosDiarios(selectedUserId);
      carregarQuinzenasPagamento(selectedUserId); // Carrega todas as quinzenas para o admin
    } else {
      setPagamentosDiarios([]);
      setQuinzenasPagamento([]);
    }
  }, [selectedUserId, carregarPagamentosDiarios, carregarQuinzenasPagamento, setPagamentosDiarios, setQuinzenasPagamento]);

  // Automatic date calculation for quinzenas
  useEffect(() => {
    const { quinzena1, quinzena2 } = newQuinzenaForm;

    // Calculate 1st Quinzena Data Fim
    if (quinzena1.data_inicio) {
      const startDate1 = parseISO(quinzena1.data_inicio);
      const endDate1 = addDays(startDate1, 14); // 15 dias incluindo o dia de início
      setNewQuinzenaForm(prev => ({
        ...prev,
        quinzena1: { ...prev.quinzena1, data_fim: format(endDate1, 'yyyy-MM-dd') },
      }));
    }

    // Calculate 2nd Quinzena Data Início and Data Fim
    if (quinzena1.data_fim) {
      const endDate1 = parseISO(quinzena1.data_fim);
      const startDate2 = addDays(endDate1, 1);
      const endDate2 = addDays(startDate2, 14); // 15 dias incluindo o dia de início
      setNewQuinzenaForm(prev => ({
        ...prev,
        quinzena2: {
          ...prev.quinzena2,
          data_inicio: format(startDate2, 'yyyy-MM-dd'),
          data_fim: format(endDate2, 'yyyy-MM-dd'),
        },
      }));
    }
  }, [newQuinzenaForm.quinzena1.data_inicio, newQuinzenaForm.quinzena1.data_fim]);


  const handleAddPayment = async () => {
    if (!selectedUserId || !newPaymentForm.valor || !newPaymentForm.data_pagamento) {
      toast.error('Preencha todos os campos para adicionar o pagamento.');
      return;
    }
    const valorNumerico = parseFloat(newPaymentForm.valor.replace(',', '.'));
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      toast.error('Valor inválido.');
      return;
    }

    const success = await criarPagamentoDiario({
      usuario_id: selectedUserId,
      valor: valorNumerico,
      data_pagamento: newPaymentForm.data_pagamento,
    });
    if (success) {
      setNewPaymentForm({ valor: '', data_pagamento: format(new Date(), 'yyyy-MM-dd') });
    }
  };

  const handleAddQuinzenas = async () => {
    if (!selectedUserId) {
      toast.error('Selecione um funcionário primeiro.');
      return;
    }

    const quinzenasToCreate = [];
    let hasError = false;

    // Validar e adicionar 1ª Quinzena
    if (!newQuinzenaForm.quinzena1.data_inicio || !newQuinzenaForm.quinzena1.data_fim || newQuinzenaForm.quinzena1.valor_meta === '') {
      toast.error('Preencha as datas de início, fim e o valor da meta para a 1ª Quinzena.');
      hasError = true;
    } else {
      const valorMeta1 = parseFloat(newQuinzenaForm.quinzena1.valor_meta.replace(',', '.'));
      if (isNaN(valorMeta1) || valorMeta1 < 0) {
        toast.error('Valor da meta da 1ª Quinzena inválido (deve ser um número positivo ou zero).');
        hasError = true;
      } else {
        quinzenasToCreate.push({
          usuario_id: selectedUserId,
          data_inicio: newQuinzenaForm.quinzena1.data_inicio,
          data_fim: newQuinzenaForm.quinzena1.data_fim,
          valor_meta: valorMeta1,
        });
      }
    }

    // Validar e adicionar 2ª Quinzena
    if (!newQuinzenaForm.quinzena2.data_inicio || !newQuinzenaForm.quinzena2.data_fim || newQuinzenaForm.quinzena2.valor_meta === '') {
      toast.error('Preencha as datas de início, fim e o valor da meta para a 2ª Quinzena.');
      hasError = true;
    } else {
      const valorMeta2 = parseFloat(newQuinzenaForm.quinzena2.valor_meta.replace(',', '.'));
      if (isNaN(valorMeta2) || valorMeta2 < 0) {
        toast.error('Valor da meta da 2ª Quinzena inválido (deve ser um número positivo ou zero).');
        hasError = true;
      } else {
        quinzenasToCreate.push({
          usuario_id: selectedUserId,
          data_inicio: newQuinzenaForm.quinzena2.data_inicio,
          data_fim: newQuinzenaForm.quinzena2.data_fim,
          valor_meta: valorMeta2,
        });
      }
    }

    if (hasError) return;

    let allSuccess = true;
    for (const quinzena of quinzenasToCreate) {
      const success = await criarQuinzenaPagamento(quinzena);
      if (!success) {
        allSuccess = false;
      }
    }

    if (allSuccess) {
      toast.success('Quinzenas de pagamento registradas com sucesso!');
      setNewQuinzenaForm({
        quinzena1: {
          data_inicio: format(new Date(), 'yyyy-MM-dd'),
          data_fim: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
          valor_meta: '',
        },
        quinzena2: {
          data_inicio: format(addDays(new Date(), 15), 'yyyy-MM-dd'),
          data_fim: format(addDays(new Date(), 29), 'yyyy-MM-dd'),
          valor_meta: '',
        }
      });
    } else {
      toast.error('Ocorreu um erro ao registrar uma ou mais quinzenas.');
    }
  };

  const handleAddDeduction = async () => {
    if (!selectedUserId || !newDeductionForm.valor || !newDeductionForm.data) {
      toast.error('Preencha todos os campos para adicionar a dedução.');
      return;
    }
    if (newDeductionForm.deductionType === 'outros' && !newDeductionForm.observacao.trim()) {
      toast.error('Por favor, especifique o motivo da dedução "Outros".');
      return;
    }

    const valorNumerico = parseFloat(newDeductionForm.valor.replace(',', '.'));
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      toast.error('Valor inválido.');
      return;
    }

    let dbTipo: PagamentoDiarioInsert['tipo'];
    let dbObservacao: string | undefined = newDeductionForm.observacao.trim() || undefined;

    switch (newDeductionForm.deductionType) {
      case 'falta':
        dbTipo = 'deducao_falta';
        if (!dbObservacao) dbObservacao = 'Dedução por falta'; // Default observation
        break;
      case 'atraso':
        dbTipo = 'deducao_atraso';
        if (!dbObservacao) dbObservacao = 'Dedução por atraso'; // Default observation
        break;
      case 'outros':
        dbTipo = 'deducao_outros';
        // dbObservacao is already set from newDeductionForm.observacao
        break;
      default:
        dbTipo = 'deducao_outros'; // Fallback
        if (!dbObservacao) dbObservacao = 'Dedução por motivo não especificado';
    }

    const success = await criarDeducao(
      selectedUserId,
      valorNumerico,
      dbTipo, // Pass the determined DB type
      newDeductionForm.data,
      dbObservacao
    );
    if (success) {
      setNewDeductionForm({
        deductionType: 'falta',
        valor: '50.00',
        data: format(new Date(), 'yyyy-MM-dd'),
        observacao: '',
      });
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (selectedUserId) {
      await excluirPagamentoDiario(id, selectedUserId);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    if (selectedUserId) {
      await marcarPagamentoComoPago(id, selectedUserId);
    }
  };

  const handleArchiveQuinzena = async (id: string) => {
    if (selectedUserId) {
      await atualizarStatusQuinzena(id, selectedUserId, 'paga');
    }
  };

  const handleUnarchiveQuinzena = async (id: string) => {
    if (selectedUserId) {
      await atualizarStatusQuinzena(id, selectedUserId, 'agendada');
    }
  };

  const handleDeleteQuinzena = async (id: string) => {
    if (selectedUserId) {
      await excluirQuinzenaPagamento(id, selectedUserId);
    }
  };

  const handleEditDeduction = (deduction: PagamentoDiario) => {
    setEditingDeduction(deduction);
    setEditDeductionForm({
      valor: Math.abs(deduction.valor).toFixed(2).replace('.', ','),
      data_pagamento: deduction.data_pagamento,
      tipo: deduction.tipo as 'deducao_falta' | 'deducao_atraso' | 'deducao_outros',
      observacoes: deduction.observacoes || '',
    });
    setIsEditDeductionSheetOpen(true);
  };

  const handleSaveEditedDeduction = async () => {
    if (!editingDeduction || !selectedUserId) return;

    const valorNumerico = parseFloat(editDeductionForm.valor.replace(',', '.'));
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      toast.error('Valor inválido.');
      return;
    }
    if (editDeductionForm.tipo === 'deducao_outros' && !editDeductionForm.observacoes.trim()) {
      toast.error('Por favor, especifique o motivo da dedução "Outros".');
      return;
    }

    const updates: Partial<PagamentoDiario> = {
      valor: -Math.abs(valorNumerico),
      data_pagamento: editDeductionForm.data_pagamento,
      tipo: editDeductionForm.tipo,
      observacoes: editDeductionForm.observacoes.trim() || null,
    };

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { error } = await supabase
        .from('pagamentos_diarios')
        .update(updates)
        .eq('id', editingDeduction.id);

      if (error) throw error;

      toast.success('Dedução atualizada com sucesso!');
      setIsEditDeductionSheetOpen(false);
      setEditingDeduction(null);
      carregarPagamentosDiarios(selectedUserId);
    } catch (error) {
      console.error('Erro ao salvar dedução editada:', error);
      toast.error('Erro ao salvar dedução editada.');
    }
  };

  const filteredUsuarios = usuarios.filter(u => u.role !== 'master');
  const selectedUser = filteredUsuarios.find(u => u.id === selectedUserId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente': return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pendente</Badge>;
      case 'pago': return <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">Pago</Badge>;
      case 'agendada': return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Agendada</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'diaria': return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Diária</Badge>;
      case 'deducao_falta': return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Falta</Badge>;
      case 'deducao_atraso': return <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">Atraso</Badge>;
      case 'deducao_outros': return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">Outros</Badge>;
      default: return <Badge variant="outline">{tipo}</Badge>;
    }
  };

  const calculateQuinzenaSummary = (quinzena: QuinzenaPagamento) => {
    // Ensure data_inicio is not null before parsing
    const startDate = quinzena.data_inicio ? parseISO(quinzena.data_inicio) : null;
    const endDate = parseISO(quinzena.data_fim); // data_fim is always string

    if (!startDate) { // If start date is missing, we can't calculate the period
      return { valorAcumulado: 0, totalDeducoes: 0, totalPeriodValue: 0, valorRestante: quinzena.valor_meta };
    }
    
    let valorAcumulado = 0;
    let totalDeducoes = 0;

    pagamentosDiarios
      .filter(p => p.usuario_id === quinzena.usuario_id &&
                (isAfter(startOfDay(parseISO(p.data_pagamento)), startOfDay(startDate)) || isSameDay(startOfDay(parseISO(p.data_pagamento)), startOfDay(startDate))) &&
                (isBefore(endOfDay(parseISO(p.data_pagamento)), endOfDay(endDate)) || isSameDay(endOfDay(parseISO(p.data_pagamento)), endOfDay(endDate))))
      .forEach(p => {
        if (p.valor > 0) {
          valorAcumulado += p.valor;
        } else {
          totalDeducoes += p.valor;
        }
      });
    
    const totalPeriodValue = valorAcumulado + totalDeducoes;
    const valorRestante = quinzena.valor_meta - totalPeriodValue;

    return { valorAcumulado, totalDeducoes, totalPeriodValue, valorRestante };
  };

  const activeQuinzenas = quinzenasPagamento.filter(q => q.status === 'agendada');
  const archivedQuinzenas = quinzenasPagamento.filter(q => q.status === 'paga');
  const deductionsHistory = pagamentosDiarios.filter(p => p.tipo && p.tipo.startsWith('deducao'));

  return (
    <div className="space-y-6">
      <Card className="vixxe-shadow rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-bold">
            <DollarSign className="w-5 h-5" />
            Gestão Financeira de Funcionários
          </CardTitle>
          <CardDescription>
            Gerencie pagamentos diários, deduções e datas de quinzena para seus funcionários.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seleção de Funcionário */}
          <div className="space-y-2">
            <Label htmlFor="select-user" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Selecionar Funcionário
            </Label>
            <Select value={selectedUserId || ''} onValueChange={setSelectedUserId}>
              <SelectTrigger id="select-user" className="h-12 text-base">
                <User className="w-5 h-5 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Selecione um funcionário">
                  {selectedUser ? (
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{selectedUser.nome_usuario}</span>
                      <span className="text-xs text-muted-foreground capitalize">{selectedUser.role}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Selecione um funcionário</span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {filteredUsuarios.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{u.nome_usuario}</div>
                        <div className="text-xs text-muted-foreground capitalize">{u.role}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedUserId && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="flex w-full overflow-x-auto whitespace-nowrap p-1 rounded-xl shadow-inner bg-muted/50">
                <TabsTrigger value="pagamentos" className="flex-shrink-0 text-sm px-3 py-2 data-[state=active]:bg-vixxe-gradient data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:rounded-lg transition-all duration-200">
                  <Wallet className="w-4 h-4 mr-2" />
                  Pagamentos
                </TabsTrigger>
                <TabsTrigger value="deducoes" className="flex-shrink-0 text-sm px-3 py-2 data-[state=active]:bg-vixxe-gradient data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:rounded-lg transition-all duration-200">
                  <MinusCircle className="w-4 h-4 mr-2" />
                  Deduções
                </TabsTrigger>
                <TabsTrigger value="historico-deducoes" className="flex-shrink-0 text-sm px-3 py-2 data-[state=active]:bg-vixxe-gradient data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:rounded-lg transition-all duration-200">
                  <History className="w-4 h-4 mr-2" />
                  Histórico Deduções
                </TabsTrigger>
                <TabsTrigger value="quinzenas" className="flex-shrink-0 text-sm px-3 py-2 data-[state=active]:bg-vixxe-gradient data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:rounded-lg transition-all duration-200">
                  <CalendarDays className="w-4 h-4 mr-2" />
                  Quinzenas
                </TabsTrigger>
                <TabsTrigger value="historico-quinzenas" className="flex-shrink-0 text-sm px-3 py-2 data-[state=active]:bg-vixxe-gradient data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:rounded-lg transition-all duration-200">
                  <Archive className="w-4 h-4 mr-2" />
                  Histórico Quinzenas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pagamentos" className="space-y-4 mt-4">
                <Card className="vixxe-shadow rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-lg">Adicionar Pagamento Diário</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="payment-value">Valor (R$)</Label>
                        <Input
                          id="payment-value"
                          type="text"
                          value={newPaymentForm.valor}
                          onChange={(e) => setNewPaymentForm({ ...newPaymentForm, valor: e.target.value })}
                          placeholder="Ex: 150,00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="payment-date">Data do Pagamento</Label>
                        <Input
                          id="payment-date"
                          type="date"
                          value={newPaymentForm.data_pagamento}
                          onChange={(e) => setNewPaymentForm({ ...newPaymentForm, data_pagamento: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button onClick={handleAddPayment} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Pagamento
                    </Button>
                  </CardContent>
                </Card>

                <Card className="vixxe-shadow rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-lg">Histórico de Pagamentos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <div className="flex items-center gap-1">
                              <CalendarDays className="w-4 h-4" /> Data
                            </div>
                          </TableHead>
                          <TableHead>
                            <div className="flex items-center gap-1">
                              <Tag className="w-4 h-4" /> Tipo
                            </div>
                          </TableHead>
                          <TableHead className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <DollarSign className="w-4 h-4" /> Valor
                            </div>
                          </TableHead>
                          <TableHead>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" /> Status
                            </div>
                          </TableHead>
                          <TableHead className="w-[120px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4">
                              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                              Carregando pagamentos...
                            </TableCell>
                          </TableRow>
                        ) : pagamentosDiarios.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4">
                              <EmptyState
                                icon={DollarSign}
                                title="Nenhum pagamento registrado"
                                description="Adicione pagamentos diários ou deduções para este funcionário."
                                iconClassName="text-muted-foreground"
                              />
                            </TableCell>
                          </TableRow>
                        ) : (
                          pagamentosDiarios.filter(p => p.tipo === 'diaria').map(p => ( // Only show 'diaria' payments here
                            <TableRow key={p.id} className={cn(
                              p.tipo && p.tipo.startsWith('deducao') ? 'bg-red-500/5' : '',
                              'hover:bg-muted/50 transition-colors'
                            )}>
                              <TableCell>{format(parseISO(p.data_pagamento), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                              <TableCell>{getTipoBadge(p.tipo || '')}</TableCell>
                              <TableCell className={`text-right font-medium ${p.valor < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                R$ {p.valor.toFixed(2).replace('.', ',')}
                              </TableCell>
                              <TableCell>{getStatusBadge(p.status || '')}</TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {p.status === 'pendente' && p.tipo === 'diaria' && (
                                    <Button variant="ghost" size="sm" onClick={() => handleMarkAsPaid(p.id)} title="Marcar como pago">
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                    </Button>
                                  )}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" title="Excluir">
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Tem certeza que deseja excluir este registro de R$ {p.valor.toFixed(2).replace('.', ',')} em {format(parseISO(p.data_pagamento), 'dd/MM/yyyy', { locale: ptBR })} ({p.tipo})?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeletePayment(p.id)} className="bg-red-600 hover:bg-red-700">
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="deducoes" className="space-y-4 mt-4">
                <Card className="vixxe-shadow rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-lg">Adicionar Dedução</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="deduction-type">Tipo de Dedução</Label>
                        <Select
                          value={newDeductionForm.deductionType}
                          onValueChange={(value: 'falta' | 'atraso' | 'outros') => setNewDeductionForm(prev => ({
                            ...prev,
                            deductionType: value,
                            valor: value === 'falta' ? '50.00' : '0.00', // Default value for 'falta'
                            observacao: value !== 'outros' ? '' : prev.observacao // Clear obs if not 'outros'
                          }))}
                        >
                          <SelectTrigger id="deduction-type">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="falta">Falta (R$ 50,00)</SelectItem>
                            <SelectItem value="atraso">Atraso</SelectItem>
                            <SelectItem value="outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="deduction-value">Valor (R$)</Label>
                        <Input
                          id="deduction-value"
                          type="text"
                          value={newDeductionForm.valor}
                          onChange={(e) => setNewDeductionForm({ ...newDeductionForm, valor: e.target.value })}
                          placeholder="Ex: 50,00"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="deduction-date">Data da Dedução</Label>
                      <Input
                        id="deduction-date"
                        type="date"
                        value={newDeductionForm.data}
                        onChange={(e) => setNewDeductionForm({ ...newDeductionForm, data: e.target.value })}
                      />
                    </div>
                    {newDeductionForm.deductionType === 'outros' && (
                      <div>
                        <Label htmlFor="deduction-obs">Motivo da Dedução (obrigatório para 'Outros')</Label>
                        <Textarea
                          id="deduction-obs"
                          value={newDeductionForm.observacao}
                          onChange={(e) => setNewDeductionForm({ ...newDeductionForm, observacao: e.target.value })}
                          placeholder="Especifique o motivo da dedução..."
                        />
                      </div>
                    )}
                    <Button onClick={handleAddDeduction} className="w-full bg-red-600 hover:bg-red-700">
                      <MinusCircle className="w-4 h-4 mr-2" />
                      Adicionar Dedução
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* New Tab: Histórico de Deduções */}
              <TabsContent value="historico-deducoes" className="space-y-4 mt-4">
                <Card className="vixxe-shadow rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <History className="w-5 h-5" />
                      Histórico de Deduções
                    </CardTitle>
                    <CardDescription>
                      Visualize, edite e exclua deduções para este funcionário.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <div className="flex items-center gap-1">
                              <CalendarDays className="w-4 h-4" /> Data
                            </div>
                          </TableHead>
                          <TableHead>
                            <div className="flex items-center gap-1">
                              <Tag className="w-4 h-4" /> Tipo
                            </div>
                          </TableHead>
                          <TableHead>Observação</TableHead>
                          <TableHead className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <DollarSign className="w-4 h-4" /> Valor
                            </div>
                          </TableHead>
                          <TableHead className="w-[120px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4">
                              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                              Carregando deduções...
                            </TableCell>
                          </TableRow>
                        ) : deductionsHistory.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4">
                              <EmptyState
                                icon={MinusCircle}
                                title="Nenhuma dedução registrada"
                                description="Adicione deduções para este funcionário na aba 'Deduções'."
                                iconClassName="text-muted-foreground"
                              />
                            </TableCell>
                          </TableRow>
                        ) : (
                          deductionsHistory.map(d => (
                            <TableRow key={d.id} className="bg-red-500/5 hover:bg-red-500/10 transition-colors">
                              <TableCell>{format(parseISO(d.data_pagamento), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                              <TableCell>{getTipoBadge(d.tipo || '')}</TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                                {d.observacoes || 'N/A'}
                              </TableCell>
                              <TableCell className="text-right font-medium text-red-600">
                                R$ {Math.abs(d.valor).toFixed(2).replace('.', ',')}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => handleEditDeduction(d)} title="Editar dedução">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" title="Excluir dedução">
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Tem certeza que deseja excluir esta dedução de R$ {Math.abs(d.valor).toFixed(2).replace('.', ',')} em {format(parseISO(d.data_pagamento), 'dd/MM/yyyy', { locale: ptBR })} ({d.tipo})?
                                          Esta ação não pode ser desfeita.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeletePayment(d.id)} className="bg-red-600 hover:bg-red-700">
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="quinzenas" className="space-y-4 mt-4">
                <Card className="vixxe-shadow rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-lg">Adicionar Quinzenas do Mês</CardTitle>
                    <CardDescription>Programe as duas datas de quinzena para o funcionário.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* 1ª Quinzena */}
                    <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                      <h4 className="font-semibold text-base">1ª Quinzena</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="quinzena1-inicio">Data Início</Label>
                          <Input
                            id="quinzena1-inicio"
                            type="date"
                            value={newQuinzenaForm.quinzena1.data_inicio}
                            onChange={(e) => setNewQuinzenaForm(prev => ({
                              ...prev,
                              quinzena1: { ...prev.quinzena1, data_inicio: e.target.value }
                            }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="quinzena1-fim">Data Fim</Label>
                          <Input
                            id="quinzena1-fim"
                            type="date"
                            value={newQuinzenaForm.quinzena1.data_fim}
                            onChange={(e) => setNewQuinzenaForm(prev => ({
                              ...prev,
                              quinzena1: { ...prev.quinzena1, data_fim: e.target.value }
                            }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="quinzena1-meta">Valor Meta (R$)</Label>
                        <Input
                          id="quinzena1-meta"
                          type="text"
                          value={newQuinzenaForm.quinzena1.valor_meta}
                          onChange={(e) => setNewQuinzenaForm(prev => ({
                            ...prev,
                            quinzena1: { ...prev.quinzena1, valor_meta: e.target.value }
                          }))}
                          placeholder="Ex: 1500,00"
                        />
                      </div>
                    </div>

                    {/* 2ª Quinzena */}
                    <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                      <h4 className="font-semibold text-base">2ª Quinzena</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="quinzena2-inicio">Data Início</Label>
                          <Input
                            id="quinzena2-inicio"
                            type="date"
                            value={newQuinzenaForm.quinzena2.data_inicio}
                            onChange={(e) => setNewQuinzenaForm(prev => ({
                              ...prev,
                              quinzena2: { ...prev.quinzena2, data_inicio: e.target.value }
                            }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="quinzena2-fim">Data Fim</Label>
                          <Input
                            id="quinzena2-fim"
                            type="date"
                            value={newQuinzenaForm.quinzena2.data_fim}
                            onChange={(e) => setNewQuinzenaForm(prev => ({
                              ...prev,
                              quinzena2: { ...prev.quinzena2, data_fim: e.target.value }
                            }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="quinzena2-meta">Valor Meta (R$)</Label>
                        <Input
                          id="quinzena2-meta"
                          type="text"
                          value={newQuinzenaForm.quinzena2.valor_meta}
                          onChange={(e) => setNewQuinzenaForm(prev => ({
                            ...prev,
                            quinzena2: { ...prev.quinzena2, valor_meta: e.target.value }
                          }))}
                          placeholder="Ex: 1500,00"
                        />
                      </div>
                    </div>

                    <Button onClick={handleAddQuinzenas} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Quinzenas
                    </Button>
                  </CardContent>
                </Card>

                <Card className="vixxe-shadow rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-lg">Quinzenas Ativas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <div className="flex items-center gap-1">
                              <CalendarDays className="w-4 h-4" /> Período
                            </div>
                          </TableHead>
                          <TableHead>
                            <div className="flex items-center gap-1">
                              <Target className="w-4 h-4" /> Meta
                            </div>
                          </TableHead>
                          <TableHead>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" /> Acumulado
                            </div>
                          </TableHead>
                          <TableHead>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" /> Status
                            </div>
                          </TableHead>
                          <TableHead className="w-[160px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4">
                              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                              Carregando quinzenas...
                            </TableCell>
                          </TableRow>
                        ) : activeQuinzenas.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4">
                              <EmptyState
                                icon={CalendarDays}
                                title="Nenhuma quinzena ativa"
                                description="Programe as datas de quinzena para este funcionário."
                                iconClassName="text-muted-foreground"
                              />
                            </TableCell>
                          </TableRow>
                        ) : (
                          activeQuinzenas.map(q => {
                            const { totalPeriodValue, valorRestante } = calculateQuinzenaSummary(q);
                            const isReadyToArchive = isPast(endOfDay(parseISO(q.data_fim))) && q.status === 'agendada';

                            return (
                              <TableRow key={q.id} className="hover:bg-muted/50 transition-colors">
                                <TableCell>
                                  {q.data_inicio && format(parseISO(q.data_inicio), 'dd/MM/yyyy', { locale: ptBR })} - {format(parseISO(q.data_fim), 'dd/MM/yyyy', { locale: ptBR })}
                                </TableCell>
                                <TableCell className="font-medium">R$ {q.valor_meta?.toFixed(2).replace('.', ',')}</TableCell>
                                <TableCell className={`font-medium ${totalPeriodValue < q.valor_meta ? 'text-red-600' : 'text-green-600'}`}>
                                  R$ {totalPeriodValue.toFixed(2).replace('.', ',')}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    <Badge variant="secondary" className={q.status === 'agendada' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}>
                                      {q.status === 'agendada' ? 'Agendada' : 'Paga'}
                                    </Badge>
                                    {isReadyToArchive && (
                                      <Badge variant="destructive" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                                        Pronta para Arquivar
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    {isReadyToArchive && (
                                      <Button variant="ghost" size="sm" onClick={() => handleArchiveQuinzena(q.id)} title="Arquivar Quinzena">
                                        <Archive className="w-4 h-4 text-blue-600" />
                                      </Button>
                                    )}
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" title="Excluir">
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Tem certeza que deseja excluir a quinzena de {q.data_inicio && format(parseISO(q.data_inicio), 'dd/MM/yyyy', { locale: ptBR })} a {format(parseISO(q.data_fim), 'dd/MM/yyyy', { locale: ptBR })}?
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeleteQuinzena(q.id)} className="bg-red-600 hover:bg-red-700">
                                            Excluir
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="historico-quinzenas" className="space-y-4 mt-4">
                <Card className="vixxe-shadow rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-lg">Histórico de Quinzenas Arquivadas</CardTitle>
                    <CardDescription>Quinzenas que já foram pagas e arquivadas.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <div className="flex items-center gap-1">
                              <CalendarDays className="w-4 h-4" /> Período
                            </div>
                          </TableHead>
                          <TableHead>
                            <div className="flex items-center gap-1">
                              <Target className="w-4 h-4" /> Meta
                            </div>
                          </TableHead>
                          <TableHead>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" /> Acumulado
                            </div>
                          </TableHead>
                          <TableHead>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" /> Status
                            </div>
                          </TableHead>
                          <TableHead className="w-[160px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4">
                              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                              Carregando histórico...
                            </TableCell>
                          </TableRow>
                        ) : archivedQuinzenas.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4">
                              <EmptyState
                                icon={Archive}
                                title="Nenhum histórico de quinzena"
                                description="Quinzenas arquivadas aparecerão aqui."
                                iconClassName="text-muted-foreground"
                              />
                            </TableCell>
                          </TableRow>
                        ) : (
                          archivedQuinzenas.map(q => {
                            const { totalPeriodValue } = calculateQuinzenaSummary(q);
                            return (
                              <TableRow key={q.id} className="hover:bg-muted/50 transition-colors">
                                <TableCell>
                                  {q.data_inicio && format(parseISO(q.data_inicio), 'dd/MM/yyyy', { locale: ptBR })} - {format(parseISO(q.data_fim), 'dd/MM/yyyy', { locale: ptBR })}
                                </TableCell>
                                <TableCell className="font-medium">R$ {q.valor_meta?.toFixed(2).replace('.', ',')}</TableCell>
                                <TableCell className={`font-medium ${totalPeriodValue < q.valor_meta ? 'text-red-600' : 'text-green-600'}`}>
                                  R$ {totalPeriodValue.toFixed(2).replace('.', ',')}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                                    Paga
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => handleUnarchiveQuinzena(q.id)} title="Desarquivar Quinzena">
                                      <RotateCcw className="w-4 h-4 text-blue-600" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" title="Excluir do histórico">
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Tem certeza que deseja excluir esta quinzena do histórico? Esta ação não pode ser desfeita.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeleteQuinzena(q.id)} className="bg-red-600 hover:bg-red-700">
                                            Excluir
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Sheet de Edição de Dedução */}
      <Sheet open={isEditDeductionSheetOpen} onOpenChange={setIsEditDeductionSheetOpen}>
        <SheetContent className="sm:max-w-[480px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Editar Dedução
            </SheetTitle>
            <SheetDescription>
              Ajuste os detalhes da dedução selecionada.
            </SheetDescription>
          </SheetHeader>
          {editingDeduction && (
            <div className="py-6 space-y-4">
              <div>
                <Label htmlFor="edit-deduction-type">Tipo de Dedução</Label>
                <Select
                  value={editDeductionForm.tipo}
                  onValueChange={(value: 'deducao_falta' | 'deducao_atraso' | 'deducao_outros') => setEditDeductionForm(prev => ({
                    ...prev,
                    tipo: value,
                    observacoes: value !== 'deducao_outros' ? '' : prev.observacoes // Clear obs if not 'outros'
                  }))}
                >
                  <SelectTrigger id="edit-deduction-type">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deducao_falta">Falta</SelectItem>
                    <SelectItem value="deducao_atraso">Atraso</SelectItem>
                    <SelectItem value="deducao_outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-deduction-value">Valor (R$)</Label>
                <Input
                  id="edit-deduction-value"
                  type="text"
                  value={editDeductionForm.valor}
                  onChange={(e) => setEditDeductionForm({ ...editDeductionForm, valor: e.target.value })}
                  placeholder="Ex: 50,00"
                />
              </div>
              <div>
                <Label htmlFor="edit-deduction-date">Data da Dedução</Label>
                <Input
                  id="edit-deduction-date"
                  type="date"
                  value={editDeductionForm.data_pagamento}
                  onChange={(e) => setEditDeductionForm({ ...editDeductionForm, data_pagamento: e.target.value })}
                />
              </div>
              {editDeductionForm.tipo === 'deducao_outros' && (
                <div>
                  <Label htmlFor="edit-deduction-obs">Motivo da Dedução (obrigatório para 'Outros')</Label>
                  <Textarea
                    id="edit-deduction-obs"
                    value={editDeductionForm.observacoes}
                    onChange={(e) => setEditDeductionForm({ ...editDeductionForm, observacoes: e.target.value })}
                    placeholder="Especifique o motivo da dedução..."
                  />
                </div>
              )}
            </div>
          )}
          <SheetFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditDeductionSheetOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEditedDeduction} variant="vixxe">
              Salvar Alterações
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}