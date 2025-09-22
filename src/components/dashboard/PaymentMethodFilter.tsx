import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Banknote, Smartphone, MoreHorizontal } from "lucide-react";

export type PaymentMethodType = 'all' | 'pix' | 'cartão' | 'dinheiro' | 'outros';

interface PaymentMethodFilterProps {
  selectedMethod: PaymentMethodType;
  onMethodChange: (method: PaymentMethodType) => void;
  counts?: Partial<Record<PaymentMethodType, number>>;
}

export function PaymentMethodFilter({ 
  selectedMethod, 
  onMethodChange, 
  counts = {} 
}: PaymentMethodFilterProps) {
  const methods = [
    { id: 'all' as PaymentMethodType, label: 'Todos', icon: null },
    { id: 'pix' as PaymentMethodType, label: 'PIX', icon: Smartphone },
    { id: 'cartão' as PaymentMethodType, label: 'Cartão', icon: CreditCard },
    { id: 'dinheiro' as PaymentMethodType, label: 'Dinheiro', icon: Banknote },
    { id: 'outros' as PaymentMethodType, label: 'Outros', icon: MoreHorizontal },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {methods.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          variant={selectedMethod === id ? "default" : "outline"}
          size="sm"
          onClick={() => onMethodChange(id)}
          className="flex items-center gap-2"
        >
          {Icon && <Icon className="w-4 h-4" />}
          {label}
          {counts[id] !== undefined && counts[id]! > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs">
              {counts[id]}
            </Badge>
          )}
        </Button>
      ))}
    </div>
  );
}

export function getPaymentMethodType(paymentMethod: string): PaymentMethodType {
  const method = paymentMethod.toLowerCase();
  if (method.includes('pix')) return 'pix';
  if (method.includes('cart') || method.includes('debito') || method.includes('credito')) return 'cartão';
  if (method.includes('dinheiro') || method.includes('especie')) return 'dinheiro';
  return 'outros';
}

export function getPaymentMethodClass(paymentMethod: string): string {
  const type = getPaymentMethodType(paymentMethod);
  switch (type) {
    case 'pix': return 'payment-pix';
    case 'cartão': return 'payment-cartao';
    case 'dinheiro': return 'payment-dinheiro';
    default: return 'payment-outros';
  }
}