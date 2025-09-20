import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ExtractedOrder, SavedOrder } from "@/types/dashboard";
import { extractFromText, formatCurrency, generateId } from "@/lib/order-parser";
import { loadHistory, saveHistory } from "@/lib/storage";
import { FileText, Trash2, Save, Edit, X, ChevronDown, ChevronUp, AlertTriangleIcon, Smartphone, CreditCard, Banknote, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { PaymentMethodFilter, PaymentMethodType, getPaymentMethodType, getPaymentMethodClass } from "./PaymentMethodFilter";

interface ChatTabProps {
  onOrderSaved: () => void;
}

export function ChatTab({ onOrderSaved }: ChatTabProps) {
  const [text, setText] = useState("");
  const [extracted, setExtracted] = useState<ExtractedOrder | null>(null);
  const [recentOrders, setRecentOrders] = useState<SavedOrder[]>([]);
  const [showRecentOrders, setShowRecentOrders] = useState(true);
  const [editingOrder, setEditingOrder] = useState<SavedOrder | null>(null);
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<PaymentMethodType>('all');
  const [editForm, setEditForm] = useState({
    client: "",
    date: "",
    total: "",
    paymentMethod: ""
  });

  const loadRecentOrders = () => {
    const history = loadHistory();
    setRecentOrders(history.slice(-10).reverse());
  };

  useEffect(() => {
    loadRecentOrders();
  }, []);

  const handleExtract = () => {
    if (!text.trim()) {
      toast.error("Cole o texto da comanda primeiro");
      return;
    }

    const result = extractFromText(text);
    setExtracted(result);
    
    if (!result.client && !result.date && !result.total && result.items.length === 0) {
      toast.warning("Não foi possível extrair dados automaticamente");
    } else {
      toast.success("Dados extraídos com sucesso!");
    }
  };

  const handleSave = () => {
    if (!extracted) {
      toast.error("Nada para salvar");
      return;
    }

    const history = loadHistory();
    const newOrder: SavedOrder = {
      id: generateId(),
      client: extracted.client || `Cliente ${new Date().toLocaleString()}`,
      date: extracted.date || new Date().toLocaleDateString('pt-BR'),
      total: extracted.total || 0,
      paymentMethod: extracted.paymentMethod || 'Não informado',
      items: extracted.items || [],
      raw: extracted.raw || '',
      status: 'Processada',
      createdAt: new Date(),
    };

    history.push(newOrder);
    saveHistory(history);
    
    toast.success(`Comanda salva: ${formatCurrency(newOrder.total)}`);
    handleClear();
    loadRecentOrders();
    onOrderSaved();
  };

  const handleClear = () => {
    setText("");
    setExtracted(null);
  };

  const handleEditExtracted = () => {
    if (!extracted) return;

    const newClient = prompt('Editar cliente:', extracted.client || '');
    if (newClient !== null) extracted.client = newClient;

    const newDate = prompt('Editar data:', extracted.date || '');
    if (newDate !== null) extracted.date = newDate;

    const newTotal = prompt('Editar total (apenas números):', extracted.total?.toString() || '');
    if (newTotal !== null) {
      const parsed = parseFloat(newTotal);
      if (!isNaN(parsed)) extracted.total = parsed;
    }

    const newPayment = prompt('Editar forma de pagamento:', extracted.paymentMethod || '');
    if (newPayment !== null) extracted.paymentMethod = newPayment;

    setExtracted({ ...extracted });
    toast.success("Dados editados!");
  };

  const openEditModal = (order: SavedOrder) => {
    setEditingOrder(order);
    setEditForm({
      client: order.client,
      date: order.date,
      total: order.total.toString(),
      paymentMethod: order.paymentMethod
    });
  };

  const handleEditOrder = () => {
    if (!editingOrder) return;

    const history = loadHistory();
    const orderIndex = history.findIndex(o => o.id === editingOrder.id);
    
    if (orderIndex !== -1) {
      history[orderIndex] = {
        ...editingOrder,
        client: editForm.client,
        date: editForm.date,
        total: parseFloat(editForm.total) || 0,
        paymentMethod: editForm.paymentMethod
      };
      
      saveHistory(history);
      loadRecentOrders();
      setEditingOrder(null);
      toast.success("Comanda editada com sucesso!");
      onOrderSaved();
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    const history = loadHistory();
    const filteredHistory = history.filter(order => order.id !== orderId);
    saveHistory(filteredHistory);
    loadRecentOrders();
    toast.success("Comanda excluída com sucesso!");
    onOrderSaved();
  };

  const getMissingFields = () => {
    if (!extracted) return [];
    const missing = [];
    if (!extracted.client) missing.push('Cliente');
    if (!extracted.date) missing.push('Data');
    if (!extracted.total) missing.push('Total');
    if (!extracted.paymentMethod) missing.push('Pagamento');
    return missing;
  };

  const missingFields = getMissingFields();

  // Filter orders by payment method
  const filteredOrders = recentOrders.filter(order => {
    if (selectedPaymentFilter === 'all') return true;
    return getPaymentMethodType(order.paymentMethod) === selectedPaymentFilter;
  });

  // Count orders by payment method
  const paymentCounts = recentOrders.reduce((acc, order) => {
    const type = getPaymentMethodType(order.paymentMethod);
    acc[type] = (acc[type] || 0) + 1;
    acc.all = recentOrders.length;
    return acc;
  }, {} as Record<PaymentMethodType, number>);

  const getPaymentMethodIcon = (method: string) => {
    const type = getPaymentMethodType(method);
    switch (type) {
      case 'pix': return <Smartphone className="w-3 h-3" />;
      case 'cartão': return <CreditCard className="w-3 h-3" />;
      case 'dinheiro': return <Banknote className="w-3 h-3" />;
      default: return <MoreHorizontal className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Chat Interface */}
      <Card className="vixxe-shadow">
        <CardHeader>
          <CardTitle className="text-lg">Chat de Comandas</CardTitle>
          <CardDescription>
            Cole a comanda (texto). O parser tenta extrair cliente, data, total e forma de pagamento automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Cole aqui o texto da comanda..."
              className="min-h-[120px] resize-none"
              maxLength={1000}
            />
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>{text.length}/1000</span>
              <span>IA extrai dados automaticamente</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleExtract} variant="vixxe">
              <FileText className="w-4 h-4" />
              Extrair Dados
            </Button>
            <Button variant="outline" onClick={handleClear}>
              <Trash2 className="w-4 h-4" />
              Limpar
            </Button>
          </div>

          {/* Missing Fields Alert */}
          {extracted && missingFields.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertTriangleIcon className="w-4 h-4 text-yellow-500" />
              <span className="text-sm">
                Campos não detectados: {missingFields.join(', ')}
              </span>
            </div>
          )}

          {/* Extracted Data Display */}
          {extracted && (
            <div className="space-y-3 p-4 bg-card/50 rounded-lg border">
              <div className="flex justify-between items-center p-3 bg-background/50 rounded-md">
                <div>
                  <div className="text-xs text-muted-foreground">Cliente</div>
                  <div className="font-medium flex items-center gap-2">
                    {extracted.client || 'Não detectado'}
                    {!extracted.client && <Badge variant="secondary" className="text-xs">Pendente</Badge>}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-background/50 rounded-md">
                <div>
                  <div className="text-xs text-muted-foreground">Data</div>
                  <div className="font-medium flex items-center gap-2">
                    {extracted.date || 'Não detectada'}
                    {!extracted.date && <Badge variant="secondary" className="text-xs">Pendente</Badge>}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-background/50 rounded-md">
                <div>
                  <div className="text-xs text-muted-foreground">Valor Total</div>
                  <div className="font-bold text-lg flex items-center gap-2">
                    {extracted.total != null ? formatCurrency(extracted.total) : 'Não detectado'}
                    {extracted.total == null && <Badge variant="secondary" className="text-xs">Pendente</Badge>}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-background/50 rounded-md">
                <div>
                  <div className="text-xs text-muted-foreground">Forma de Pagamento</div>
                  <div className="font-medium flex items-center gap-2">
                    {extracted.paymentMethod || 'Não detectada'}
                    {!extracted.paymentMethod && <Badge variant="secondary" className="text-xs">Pendente</Badge>}
                  </div>
                </div>
              </div>

              {extracted.items.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Itens</div>
                  {extracted.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-background/50 rounded-md">
                      <span>{item.qty}x {item.name}</span>
                      <span className="font-medium">
                        {formatCurrency((item.price || 0) * item.qty)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3">
                <Button variant="outline" size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4" />
                  Salvar
                </Button>
                <Button variant="outline" size="sm" onClick={handleEditExtracted}>
                  <Edit className="w-4 h-4" />
                  Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => setExtracted(null)}>
                  <X className="w-4 h-4" />
                  Remover
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card className="vixxe-shadow">
        <CardHeader>
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">Comandas Recentes</CardTitle>
                <CardDescription>Últimas 10 comandas processadas</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRecentOrders(!showRecentOrders)}
              >
                {showRecentOrders ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
            
            {/* Payment Method Filter */}
            {showRecentOrders && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Filtrar por forma de pagamento:</p>
                <PaymentMethodFilter
                  selectedMethod={selectedPaymentFilter}
                  onMethodChange={setSelectedPaymentFilter}
                  counts={paymentCounts}
                />
              </div>
            )}
          </div>
        </CardHeader>
        {showRecentOrders && (
          <CardContent>
            <div className="space-y-2">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {selectedPaymentFilter === 'all' 
                    ? 'Nenhuma comanda salva' 
                    : `Nenhuma comanda encontrada para: ${selectedPaymentFilter}`
                  }
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex justify-between items-center p-4 bg-background/30 rounded-md hover:bg-background/50 transition-colors hover-scale fade-in"
                  >
                    <div className="flex-1">
                      <div className="font-semibold">{order.client}</div>
                      <div className="text-sm text-muted-foreground">{order.date}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getPaymentMethodClass(order.paymentMethod)}`}
                        >
                          {getPaymentMethodIcon(order.paymentMethod)}
                          {order.paymentMethod}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right mr-4">
                      <div className="font-bold">{formatCurrency(order.total)}</div>
                      <Badge variant="secondary" className="text-xs">
                        {order.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(order)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Editar Comanda</DialogTitle>
                            <DialogDescription>
                              Edite os dados da comanda selecionada.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="client" className="text-right">
                                Cliente
                              </Label>
                              <Input
                                id="client"
                                value={editForm.client}
                                onChange={(e) => setEditForm({...editForm, client: e.target.value})}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="date" className="text-right">
                                Data
                              </Label>
                              <Input
                                id="date"
                                value={editForm.date}
                                onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="total" className="text-right">
                                Total
                              </Label>
                              <Input
                                id="total"
                                value={editForm.total}
                                onChange={(e) => setEditForm({...editForm, total: e.target.value})}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="payment" className="text-right">
                                Pagamento
                              </Label>
                              <Input
                                id="payment"
                                value={editForm.paymentMethod}
                                onChange={(e) => setEditForm({...editForm, paymentMethod: e.target.value})}
                                className="col-span-3"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleEditOrder}>Salvar alterações</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Comanda</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir a comanda de {order.client}? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteOrder(order.id)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}