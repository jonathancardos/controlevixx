import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Download, Star, Trophy, Crown, Gift } from "lucide-react";
import { toast } from "sonner";
import { useVipSystem } from '@/hooks/useVipSystem'; // Importar useVipSystem
import { useEffect, useState } from 'react';
import { format } from 'date-fns'; // Import format

interface Cliente {
  id: string;
  nome: string;
  total_gasto: number;
  total_pedidos: number;
  categoria: 'novo' | 'regular' | 'vip' | 'premium';
  pontos_fidelidade: number;
  ultimo_pedido?: string;
  is_vip?: boolean;
  nivel_vip?: string;
  meta_valor_semanal?: number;
  meta_pedidos_semanal?: number;
  total_gasto_semana?: number;
  total_pedidos_semana?: number;
  vip_combo_available?: boolean;
}

interface FidelityCardProps {
  cliente: Cliente;
  ranking?: number;
}

const categoriaConfig = {
  novo: {
    label: "Novo Cliente",
    color: "bg-gray-100 text-gray-800",
    icon: Gift,
    borderColor: "border-gray-300"
  },
  regular: {
    label: "Cliente Regular", 
    color: "bg-blue-100 text-blue-800",
    icon: Star,
    borderColor: "border-blue-300"
  },
  vip: {
    label: "Cliente VIP",
    color: "bg-purple-100 text-purple-800", 
    icon: Trophy,
    borderColor: "border-purple-300"
  },
  premium: {
    label: "Cliente Premium",
    color: "bg-yellow-100 text-yellow-800",
    icon: Crown,
    borderColor: "border-yellow-300"
  }
};

export function FidelityCard({ cliente, ranking }: FidelityCardProps) {
  const config = categoriaConfig[cliente.categoria];
  const IconComponent = config.icon;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const generatePDF = () => {
    // Aqui seria implementada a geração do PDF
    toast.success(`PDF do cartão fidelidade de ${cliente.nome} será gerado em breve!`);
  };

  const generateDigitalCard = () => {
    const cardContent = `
════════════════════════════
🍔 VIXXE MARIA - FIDELIDADE
════════════════════════════
👤 ${cliente.nome.toUpperCase()}
🏆 ${config.label.toUpperCase()}
════════════════════════════
📊 ESTATÍSTICAS:
• Total de Pedidos: ${cliente.total_pedidos}
• Valor Total Gasto: ${formatCurrency(cliente.total_gasto)}
• Pontos Fidelidade: ${cliente.pontos_fidelidade}
${ranking ? `• Ranking: ${ranking}º Lugar` : ''}
════════════════════════════
⭐ OBRIGADO PELA PREFERÊNCIA!
Você é muito especial para nós!
════════════════════════════
📱 (11) 99999-9999
📧 contato@vixxemaria.com.br
════════════════════════════`;

    // Criar elemento temporário para copiar
    const textArea = document.createElement('textarea');
    textArea.value = cardContent;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);

    toast.success("Cartão de fidelidade copiado para área de transferência!");
  };

  return (
    <Card className={`${config.borderColor} border-2 bg-gradient-to-br from-white to-gray-50 vixxe-shadow rounded-xl`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className={config.color}>
                {cliente.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{cliente.nome}</CardTitle>
              {ranking && (
                <div className="flex items-center gap-1 mt-1">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-600">
                    {ranking}º Lugar
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <Badge className={config.color}>
              <IconComponent className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{cliente.total_pedidos}</div>
            <div className="text-xs text-blue-500">Pedidos</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-lg font-bold text-green-600">
              {formatCurrency(cliente.total_gasto)}
            </div>
            <div className="text-xs text-green-500">Total Gasto</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-lg font-bold text-purple-600">{cliente.pontos_fidelidade}</div>
            <div className="text-xs text-purple-500">Pontos</div>
          </div>
        </div>

        {/* Mensagem de Fidelidade */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-3 rounded-lg text-center">
          <p className="text-sm font-medium text-primary">
            ⭐ Obrigado pela sua preferência!
          </p>
          <p className="text-xs text-muted-foreground">
            Você é muito especial para nós!
          </p>
        </div>

        {/* Último Pedido */}
        {cliente.ultimo_pedido && (
          <div className="text-xs text-center text-muted-foreground">
            Último pedido: {new Date(cliente.ultimo_pedido).toLocaleDateString('pt-BR')}
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={generateDigitalCard} className="flex-1">
            <Gift className="w-4 h-4 mr-2" />
            Copiar Cartão
          </Button>
          <Button variant="default" size="sm" onClick={generatePDF} className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Baixar PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function TopClientsRanking({ clientes }: { clientes: Cliente[] }) {
  const { obterRankingMensal } = useVipSystem();
  const [rankingMensal, setRankingMensal] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      setLoading(true);
      const currentYear = parseInt(format(new Date(), 'yyyy'));
      const currentMonth = parseInt(format(new Date(), 'MM'));
      const data = await obterRankingMensal(currentYear, currentMonth); // Passando ano e mês
      const mappedData: Cliente[] = data.map(item => ({
        id: item.cliente_id,
        nome: item.cliente_nome,
        total_gasto: item.valor_gasto,
        total_pedidos: item.pedidos,
        categoria: item.nivel_vip === 'Premium' ? 'premium' : item.nivel_vip === 'VIP' ? 'vip' : item.nivel_vip === 'Regular' ? 'regular' : 'novo',
        pontos_fidelidade: Math.floor(item.valor_gasto / 10), // Exemplo de cálculo de pontos
        is_vip: item.is_vip,
        nivel_vip: item.nivel_vip,
      }));
      setRankingMensal(mappedData);
      setLoading(false);
    };
    fetchRanking();
  }, [obterRankingMensal]);

  const generateRankingPDF = () => {
    const rankingText = `
🏆 VIXXE MARIA - RANKING DE CLIENTES
════════════════════════════════════
📅 Gerado em: ${new Date().toLocaleDateString('pt-BR')}

${rankingMensal.map((cliente, index) => `
${index + 1}º LUGAR: ${cliente.nome.toUpperCase()}
• Categoria: ${categoriaConfig[cliente.categoria].label}
• Pedidos: ${cliente.total_pedidos}
• Total Gasto: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cliente.total_gasto)}
────────────────────────────────────
`).join('')}

⭐ OBRIGADO A TODOS PELA PREFERÊNCIA!
📱 (11) 99999-9999 | 📧 contato@vixxemaria.com.br
════════════════════════════════════`;

    // Criar elemento temporário para copiar
    const textArea = document.createElement('textarea');
    textArea.value = rankingText;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);

    toast.success("Ranking copiado! Cole no WhatsApp para enviar.");
  };

  return (
    <Card className="vixxe-shadow rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Top 10 Clientes
        </CardTitle>
        <Button onClick={generateRankingPDF} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Gerar PDF
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
            Carregando ranking...
          </div>
        ) : rankingMensal.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum cliente no ranking mensal ainda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rankingMensal.map((cliente, index) => (
              <FidelityCard 
                key={cliente.id} 
                cliente={cliente} 
                ranking={index + 1}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}