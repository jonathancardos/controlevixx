import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus, Save, X } from "lucide-react";
import { toast } from "sonner";
import { OrderItem } from "@/types/dashboard";

interface ComandaData {
  id: string;
  cliente: string;
  data: string;
  items: OrderItem[];
  total: number;
  formaPagamento: string;
  observacoes?: string;
  tempoPreparo?: string;
  tipoServico: 'local' | 'retirada' | 'entrega';
}

interface EditComandaDialogProps {
  comanda: ComandaData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedComanda: ComandaData) => void;
}

export function EditComandaDialog({ comanda, isOpen, onClose, onSave }: EditComandaDialogProps) {
  const [editForm, setEditForm] = useState<ComandaData>({
    id: "",
    cliente: "",
    data: "",
    items: [],
    total: 0,
    formaPagamento: "Pix",
    observacoes: "",
    tempoPreparo: "30",
    tipoServico: "entrega"
  });

  const [newItem, setNewItem] = useState({ name: "", qty: 1, price: 0 });

  useEffect(() => {
    if (comanda) {
      setEditForm({ ...comanda });
    }
  }, [comanda]);

  const handleAddItem = () => {
    if (!newItem.name.trim()) {
      toast.error("Digite o nome do item");
      return;
    }

    const item: OrderItem = {
      name: newItem.name,
      qty: newItem.qty,
      price: newItem.price
    };

    setEditForm({
      ...editForm,
      items: [...editForm.items, item],
      total: editForm.total + (newItem.price * newItem.qty)
    });

    setNewItem({ name: "", qty: 1, price: 0 });
    toast.success("Item adicionado!");
  };

  const handleRemoveItem = (index: number) => {
    const removedItem = editForm.items[index];
    const newItems = editForm.items.filter((_, i) => i !== index);
    
    setEditForm({
      ...editForm,
      items: newItems,
      total: editForm.total - ((removedItem.price || 0) * removedItem.qty)
    });
    
    toast.success("Item removido!");
  };

  const handleSave = () => {
    if (!editForm.cliente.trim()) {
      toast.error("Digite o nome do cliente");
      return;
    }

    if (editForm.items.length === 0) {
      toast.error("Adicione pelo menos um item");
      return;
    }

    onSave(editForm);
    toast.success("Comanda atualizada com sucesso!");
    onClose();
  };

  const recalculateTotal = () => {
    const total = editForm.items.reduce((sum, item) => sum + ((item.price || 0) * item.qty), 0);
    setEditForm({ ...editForm, total });
  };

  useEffect(() => {
    recalculateTotal();
  }, [editForm.items]);

  if (!comanda) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Comanda #{comanda.id}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold">Informações Básicas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cliente">Cliente</Label>
                  <Input
                    id="cliente"
                    value={editForm.cliente}
                    onChange={(e) => setEditForm({ ...editForm, cliente: e.target.value })}
                    placeholder="Nome do cliente"
                  />
                </div>

                <div>
                  <Label htmlFor="data">Data</Label>
                  <Input
                    id="data"
                    type="date"
                    value={editForm.data}
                    onChange={(e) => setEditForm({ ...editForm, data: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
                  <Select value={editForm.formaPagamento} onValueChange={(value) => setEditForm({ ...editForm, formaPagamento: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pix">PIX</SelectItem>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="Cartão">Cartão de Crédito</SelectItem>
                      <SelectItem value="Débito">Cartão de Débito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tipoServico">Tipo de Serviço</Label>
                  <Select value={editForm.tipoServico} onValueChange={(value: 'local' | 'retirada' | 'entrega') => setEditForm({ ...editForm, tipoServico: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Consumo Local</SelectItem>
                      <SelectItem value="retirada">Retirada</SelectItem>
                      <SelectItem value="entrega">Entrega</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tempoPreparo">Tempo de Preparo (min)</Label>
                  <Input
                    id="tempoPreparo"
                    type="number"
                    value={editForm.tempoPreparo}
                    onChange={(e) => setEditForm({ ...editForm, tempoPreparo: e.target.value })}
                    placeholder="30"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={editForm.observacoes}
                  onChange={(e) => setEditForm({ ...editForm, observacoes: e.target.value })}
                  placeholder="Observações adicionais sobre o pedido"
                />
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold">Itens do Pedido</h3>

              {/* Adicionar Novo Item */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                <div>
                  <Label>Item</Label>
                  <Input
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="Nome do item"
                  />
                </div>
                <div>
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newItem.qty}
                    onChange={(e) => setNewItem({ ...newItem, qty: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <Label>Preço (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <Button onClick={handleAddItem} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              <Separator />

              {/* Lista de Items */}
              <div className="space-y-2">
                {editForm.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <span className="font-medium">{item.qty}x {item.name}</span>
                      <div className="text-sm text-muted-foreground">
                        R${(item.price || 0).toFixed(2)} cada - Total: R${((item.price || 0) * item.qty).toFixed(2)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {editForm.items.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum item adicionado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Total */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Total da Comanda:</span>
                <Badge variant="default" className="text-lg px-3 py-1">
                  R$ {editForm.total.toFixed(2)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}