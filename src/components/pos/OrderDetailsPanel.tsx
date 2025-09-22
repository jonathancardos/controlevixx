import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Trash2, DollarSign, User, Calendar, Clock, MessageSquare, Printer, Send, Edit, CheckCircle, AlertTriangle, Package, X, Award, Gift, ShoppingCart, Truck, MapPin, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/order-parser';
import { Cliente } from '@/types/supabase';
import { CreateClientSheet } from '@/components/clients/CreateClientSheet';
import { ServiceType } from '@/types/dashboard';

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
  cliente_id?: string;
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

interface OrderDetailsPanelProps {
  order: ActiveOrder;
  clientes: Cliente[];
  selectedClientData: Cliente | null;
  handleUpdateOrderDetails: (orderId: string, updates: Partial<ActiveOrder>) => void;
  handleApplyVipCombo: () => void;
  handleRemoveVipCombo: () => void;
  handleUpdateCartItemQuantity: (orderId: string, productId: string, change: number) => void;
  handleRemoveCartItem: (orderId: string, productId: string) => void;
  setIsCreateClientSheetOpen: (open: boolean) => void;
  handleClientCreated: (newClient: Cliente) => void;
  isMobile?: boolean; // Para ajustar o layout se necessário
}

export function OrderDetailsPanel({
  order,
  clientes,
  selectedClientData,
  handleUpdateOrderDetails,
  handleApplyVipCombo,
  handleRemoveVipCombo,
  handleUpdateCartItemQuantity,
  handleRemoveCartItem,
  setIsCreateClientSheetOpen,
  handleClientCreated,
  isMobile = false,
}: OrderDetailsPanelProps) {
  const [isLocalCreateClientSheetOpen, setIsLocalCreateClientSheetOpen] = React.useState(false);

  const handleLocalClientCreated = (newClient: Cliente) => {
    handleClientCreated(newClient);
    setIsLocalCreateClientSheetOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cliente_nome" className="flex items-center gap-1 text-accent">
          <User className="w-3 h-3" /> Cliente
        </Label>
        <Select
          value={order.cliente_id || ''}
          onValueChange={(value) => {
            if (value === 'new-client') {
              setIsLocalCreateClientSheetOpen(true);
            } else {
              const selectedClient = clientes.find(c => c.id === value);
              handleUpdateOrderDetails(order.id, {
                cliente_id: selectedClient?.id,
                cliente_nome: selectedClient?.nome || 'Novo Pedido',
              });
            }
          }}
        >
          <SelectTrigger className={isMobile ? "h-10" : "h-9"}>
            <SelectValue placeholder="Selecione ou crie um cliente">
              {order.cliente_nome === 'Novo Pedido' && !order.cliente_id
                ? 'Novo Pedido'
                : order.cliente_nome}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new-client" className="font-semibold text-primary">
              <Plus className="w-4 h-4 mr-2 inline-block" /> Criar Novo Cliente
            </SelectItem>
            <Separator />
            {clientes.map(client => (
              <SelectItem key={client.id} value={client.id}>
                {client.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedClientData && (
          <div className="mt-2 flex items-center gap-2">
            {selectedClientData.is_vip ? (
              <Badge className="bg-purple-500 text-white flex items-center gap-1">
                <Award className="w-3 h-3" /> Cliente VIP
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1">
                <User className="w-3 h-3" /> Cliente Regular
              </Badge>
            )}
            {selectedClientData.vip_combo_available && selectedClientData.is_vip && (
              <Badge className="bg-green-500 text-white flex items-center gap-1">
                <Gift className="w-3 h-3" /> Combo VIP Disponível!
              </Badge>
            )}
          </div>
        )}
      </div>

      {selectedClientData?.is_vip && selectedClientData?.vip_combo_available && !order.vipComboApplied && (
        <Button
          onClick={handleApplyVipCombo}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          disabled={order.items.filter(item => !item.isVipCombo).reduce((sum, item) => sum + (item.price * item.quantity), 0) < 5}
        >
          <Gift className="w-4 h-4 mr-2" /> Aplicar Combo VIP (-R$27)
        </Button>
      )}
      {order.vipComboApplied && (
        <Button
          onClick={handleRemoveVipCombo}
          variant="outline"
          className="w-full text-red-500 border-red-500/50 hover:bg-red-500/10"
        >
          <X className="w-4 h-4 mr-2" /> Remover Combo VIP
        </Button>
      )}

      {/* Order Number and Date */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="order_number" className="flex items-center gap-1 text-accent">
            <Tag className="w-3 h-3" /> Comanda #
          </Label>
          <Input
            id="order_number"
            value={order.orderNumber}
            onChange={(e) => handleUpdateOrderDetails(order.id, { orderNumber: e.target.value })}
            readOnly // Usually generated by AI or system
            className={isMobile ? "h-10" : "h-9"}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="order_date" className="flex items-center gap-1 text-accent">
            <Calendar className="w-3 h-3" /> Data
          </Label>
          <Input
            id="order_date"
            type="date"
            value={order.date}
            onChange={(e) => handleUpdateOrderDetails(order.id, { date: e.target.value })}
            className={isMobile ? "h-10" : "h-9"}
          />
        </div>
      </div>

      {/* Service Type */}
      <div className="space-y-2">
        <Label htmlFor="service_type" className="flex items-center gap-1 text-accent">
          <Truck className="w-3 h-3" /> Tipo de Serviço
        </Label>
        <Select
          value={order.serviceType}
          onValueChange={(value: ServiceType) => handleUpdateOrderDetails(order.id, { serviceType: value, tipo_servico: value === 'consumo_local' ? 'local' : value === 'retirada' ? 'retirada' : 'entrega' })}
        >
          <SelectTrigger className={isMobile ? "h-10" : "h-9"}>
            <SelectValue placeholder="Selecione o tipo de serviço" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="consumo_local">Consumo Local</SelectItem>
            <SelectItem value="retirada">Retirada</SelectItem>
            <SelectItem value="entrega">Entrega</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Address and Reference (if delivery) */}
      {order.serviceType === 'entrega' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-1 text-accent">
              <MapPin className="w-3 h-3" /> Endereço
            </Label>
            <Input
              id="address"
              value={order.address || ''}
              onChange={(e) => handleUpdateOrderDetails(order.id, { address: e.target.value })}
              placeholder="Endereço completo"
              className={isMobile ? "h-10" : "h-9"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reference" className="flex items-center gap-1 text-accent">
              <MessageSquare className="w-3 h-3" /> Referência
            </Label>
            <Input
              id="reference"
              value={order.reference || ''}
              onChange={(e) => handleUpdateOrderDetails(order.id, { reference: e.target.value })}
              placeholder="Ponto de referência (opcional)"
              className={isMobile ? "h-10" : "h-9"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="delivery_fee" className="flex items-center gap-1 text-accent">
              <DollarSign className="w-3 h-3" /> Taxa de Entrega
            </Label>
            <Input
              id="delivery_fee"
              type="number"
              step="0.01"
              value={order.deliveryFee || 0}
              onChange={(e) => handleUpdateOrderDetails(order.id, { deliveryFee: parseFloat(e.target.value) || 0 })}
              className={isMobile ? "h-10" : "h-9"}
            />
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="forma_pagamento" className="flex items-center gap-1 text-accent">
          <DollarSign className="w-3 h-3" /> Pagamento
        </Label>
        <Select
          value={order.forma_pagamento}
          onValueChange={(value: 'Pix' | 'Dinheiro' | 'Cartão' | 'Outros') => handleUpdateOrderDetails(order.id, { forma_pagamento: value })}
        >
          <SelectTrigger className={isMobile ? "h-10" : "h-9"}>
            <SelectValue placeholder="Forma de Pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Pix">Pix</SelectItem>
            <SelectItem value="Dinheiro">Dinheiro</SelectItem>
            <SelectItem value="Cartão">Cartão</SelectItem>
            <SelectItem value="Outros">Outros</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {order.forma_pagamento === 'Dinheiro' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount_received" className="flex items-center gap-1 text-accent">
              <DollarSign className="w-3 h-3" /> Valor Recebido
            </Label>
            <Input
              id="amount_received"
              type="number"
              step="0.01"
              value={order.amountReceived || ''}
              onChange={(e) => {
                const received = parseFloat(e.target.value) || 0;
                const change = received > order.total ? received - order.total : 0;
                handleUpdateOrderDetails(order.id, { amountReceived: received, changeAmount: change });
              }}
              placeholder="Valor recebido"
              className={isMobile ? "h-10" : "h-9"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="change_amount" className="flex items-center gap-1 text-accent">
              <DollarSign className="w-3 h-3" /> Troco
            </Label>
            <Input
              id="change_amount"
              type="text"
              value={formatCurrency(order.changeAmount || 0)}
              readOnly
              className={isMobile ? "h-10" : "h-9"}
            />
          </div>
        </div>
      )}

      {/* Preparation Time */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="prep_time_min" className="flex items-center gap-1 text-accent">
            <Clock className="w-3 h-3" /> Tempo Mín. Preparo
          </Label>
          <Input
            id="prep_time_min"
            type="number"
            min="0"
            value={order.prepTimeMin}
            onChange={(e) => handleUpdateOrderDetails(order.id, { prepTimeMin: parseInt(e.target.value) || 0 })}
            className={isMobile ? "h-10" : "h-9"}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prep_time_max" className="flex items-center gap-1 text-accent">
            <Clock className="w-3 h-3" /> Tempo Máx. Preparo
          </Label>
          <Input
            id="prep_time_max"
            type="number"
            min="0"
            value={order.prepTimeMax}
            onChange={(e) => handleUpdateOrderDetails(order.id, { prepTimeMax: parseInt(e.target.value) || 0 })}
            className={isMobile ? "h-10" : "h-9"}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes" className="flex items-center gap-1 text-accent">
          <MessageSquare className="w-3 h-3" /> Observações
        </Label>
        <Textarea
          id="observacoes"
          value={order.observacoes || ''}
          onChange={(e) => handleUpdateOrderDetails(order.id, { observacoes: e.target.value })}
          placeholder="Observações do pedido..."
          rows={2}
        />
      </div>

      <Separator />

      <h3 className="font-semibold text-lg flex items-center gap-2">
        <ShoppingCart className="w-5 h-5" /> Itens do Pedido
      </h3>
      {order.items.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-4">Adicione itens ao pedido.</p>
      ) : (
        <div className="space-y-2">
          {order.items.map((item, index) => ( // Added index for key
            <div key={item.productId + index} className="flex flex-col p-2 bg-muted/30 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.name} {item.isVipCombo && <Badge variant="outline" className="ml-1 bg-green-500/10 text-green-500">VIP Combo</Badge>}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(item.price)}/un</p>
                </div>
                <div className="flex items-center gap-2">
                  {!item.isVipCombo && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 p-0"
                      onClick={() => handleUpdateCartItemQuantity(order.id, item.productId, -1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                  )}
                  <span className="text-sm font-medium">{item.quantity}</span>
                  {!item.isVipCombo && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 p-0"
                      onClick={() => handleUpdateCartItemQuantity(order.id, item.productId, 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 p-0 text-destructive"
                    onClick={() => handleRemoveCartItem(order.id, item.productId)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              {item.observation && (
                <p className="text-xs text-muted-foreground mt-1 ml-1">
                  <MessageSquare className="w-3 h-3 inline-block mr-1" />
                  {item.observation}
                </p>
              )}
              {item.adicionais && item.adicionais.length > 0 && (
                <div className="ml-4 mt-1 text-xs text-muted-foreground">
                  <p className="font-semibold">Adicionais:</p>
                  <ul className="list-disc list-inside">
                    {item.adicionais.map((add, addIdx) => (
                      <li key={addIdx}>{add.name} - {formatCurrency(add.price)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <CreateClientSheet
        open={isLocalCreateClientSheetOpen}
        onOpenChange={setIsLocalCreateClientSheetOpen}
        onClientCreated={handleLocalClientCreated}
      />
    </div>
  );
}