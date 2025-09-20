import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy, Edit, Send, Printer, MapPin, MessageSquare, Tag, Clock, DollarSign, Truck } from "lucide-react"; // Adicionado MapPin, MessageSquare, Tag, Clock, DollarSign, Truck
import { toast } from "sonner";
import { OrderItem, ServiceType } from "@/types/dashboard"; // Importar ServiceType

interface ComandaData {
  id: string;
  orderNumber: string; // Novo campo
  cliente: string;
  data: string;
  serviceType: ServiceType; // Novo campo
  address?: string; // Novo campo
  reference?: string; // Novo campo
  items: OrderItem[];
  deliveryFee?: number; // Novo campo
  total: number;
  formaPagamento: string;
  amountReceived?: number; // Novo campo
  changeAmount?: number; // Novo campo
  observacoes?: string;
  prepTimeMin: number; // Novo campo
  prepTimeMax: number; // Novo campo
}

interface ComandaTemplateProps {
  comanda: ComandaData;
  onEdit: () => void;
  onSendWhatsApp: (formattedText: string) => void; // Agora aceita o texto formatado
  templateString?: string; // Novo prop para o template
}

export function ComandaTemplate({ comanda, onEdit, onSendWhatsApp, templateString }: ComandaTemplateProps) {
  const formatComandaText = () => {
    const servicoTextMap = {
      consumo_local: '🏠 (X) CONSUMO LOCAL  ( ) RETIRADA  ( ) ENTREGA',
      retirada: '🏠 ( ) CONSUMO LOCAL  (X) RETIRADA  ( ) ENTREGA',
      entrega: '🏠 ( ) CONSUMO LOCAL  ( ) RETIRADA  (X) ENTREGA'
    };

    const pagamentoSymbolsMap = {
      'Pix': '💳 PAGAMENTO: (X) PIX  ( ) DINHEIRO  ( ) CRÉDITO  ( ) DÉBITO',
      'Dinheiro': '💳 PAGAMENTO: ( ) PIX  (X) DINHEIRO  ( ) CRÉDITO  ( ) DÉBITO',
      'Cartão': '💳 PAGAMENTO: ( ) PIX  ( ) DINHEIRO  (X) CRÉDITO  ( ) DÉBITO',
      'Débito': '💳 PAGAMENTO: ( ) PIX  ( ) DINHEIRO  ( ) CRÉDITO  (X) DÉBITO',
      'Outros': '💳 PAGAMENTO: ( ) PIX  ( ) DINHEIRO  ( ) CRÉDITO  ( ) DÉBITO (Outros)'
    };

    let itemsFormatted = comanda.items.map(item => {
      let itemLine = `• ${item.qty}x ${item.name} — R$${item.price?.toFixed(2) || '0.00'}`;
      if (item.adicionais && item.adicionais.length > 0) {
        itemLine += '\n' + item.adicionais.map(add => `     ◦ Adicional: ${add.name} — R$${add.price?.toFixed(2) || '0.00'}`).join('\n');
      }
      if (item.observation) {
        itemLine += ` (Obs: ${item.observation})`;
      }
      return itemLine;
    }).join('\n');

    let paymentDetailsText = '';
    if (comanda.formaPagamento === 'Dinheiro' && comanda.amountReceived && comanda.changeAmount !== undefined) {
      paymentDetailsText = `Troco para R$${comanda.amountReceived.toFixed(2)} → Levar R$${comanda.changeAmount.toFixed(2)}`;
    }

    const placeholders: { [key: string]: string } = {
      '{{cliente}}': comanda.cliente,
      '{{orderNumber}}': comanda.orderNumber,
      '{{data}}': comanda.data,
      '{{serviceType}}': servicoTextMap[comanda.serviceType],
      '{{address}}': comanda.address || '',
      '{{reference}}': comanda.reference ? `(${comanda.reference})` : '',
      '{{items}}': itemsFormatted,
      '{{deliveryFee}}': comanda.deliveryFee && comanda.deliveryFee > 0 ? `🚚 TAXA DE ENTREGA — R$${comanda.deliveryFee.toFixed(2)}` : '',
      '{{total}}': comanda.total.toFixed(2),
      '{{paymentMethod}}': pagamentoSymbolsMap[comanda.formaPagamento as keyof typeof pagamentoSymbolsMap] || pagamentoSymbolsMap['Outros'],
      '{{paymentDetails}}': paymentDetailsText,
      '{{prepTimeMin}}': comanda.prepTimeMin.toString(),
      '{{prepTimeMax}}': comanda.prepTimeMax.toString(),
      '{{observacoes}}': comanda.observacoes ? `💬 OBSERVAÇÃO: **${comanda.observacoes}**` : '',
    };

    let finalContent = templateString || `
════════════════════════════
🍔 **VIXXE MARIA – COMANDA**
════════════════════════════
📅 Data: **{{data}}**
🔖 COMANDA **#{{orderNumber}}**
👤 Cliente: **{{cliente}}**
{{serviceType}}
{{address}}
{{reference}}
════════════════════════════
🧾 **PEDIDOS:**
{{items}}

{{observacoes}}
════════════════════════════
{{deliveryFee}}
💰 **TOTAL: R$ {{total}}**
{{paymentMethod}}
{{paymentDetails}}
════════════════════════════
⏱ Tempo de preparo: {{prepTimeMin}} a {{prepTimeMax}} minutos
════════════════════════════`;

    for (const placeholder in placeholders) {
      // Substituir o placeholder, mas apenas se o valor não for vazio para evitar linhas em branco indesejadas
      if (placeholders[placeholder].trim() !== '') {
        finalContent = finalContent.replace(new RegExp(placeholder, 'g'), placeholders[placeholder]);
      } else {
        // Remover a linha inteira se o placeholder estiver sozinho em uma linha e seu valor for vazio
        finalContent = finalContent.replace(new RegExp(`^.*${placeholder}.*$\\n?`, 'gm'), '');
      }
    }
    
    // Remover linhas em branco extras que podem surgir após as substituições
    finalContent = finalContent.replace(/(\n\s*\n){2,}/g, '\n\n').trim();

    return finalContent;
  };

  const formattedText = formatComandaText();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formattedText);
      toast.success("Comanda copiada para área de transferência!");
    } catch (error) {
      toast.error("Erro ao copiar comanda");
    }
  };

  const printComanda = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Comanda #${comanda.orderNumber}</title>
            <style>
              body { font-family: monospace; font-size: 12px; margin: 20px; }
              pre { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <pre>${formattedText}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getServiceBadgeVariant = (type: ServiceType, currentType: ServiceType) => 
    type === currentType ? 'default' : 'outline';

  return (
    <Card className="w-full vixxe-shadow rounded-xl">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Preview do texto formatado */}
          <div className="bg-muted/30 p-4 rounded-lg border font-mono text-sm whitespace-pre-wrap">
            {formattedText}
          </div>

          {/* Ações */}
          <div className="flex flex-wrap gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              <Copy className="w-4 h-4 mr-2" />
              Copiar
            </Button>
            
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            
            <Button variant="default" size="sm" onClick={() => onSendWhatsApp(formattedText)}>
              <Send className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
            
            <Button variant="outline" size="sm" onClick={printComanda}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}