import { useState, useMemo } from "react"; // Importar useMemo
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Users, 
  Package, 
  ShoppingBag, 
  CreditCard, 
  Star,
  FileText,
  Settings,
  CalendarDays,
  DollarSign,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

import { TabId } from "@/types/dashboard";

interface DashboardStatsProps {
  onNavigate: (section: string) => void;
  totalValue: number;
  totalOrders: number;
  totalClients: number;
  totalValueWeek: number;
  totalOrdersWeek: number;
  totalValueMonth: number;
  totalOrdersMonth: number;
  userRole: 'master' | 'admin' | 'gestor' | 'funcionario';
  allowedTabs?: TabId[];
}

export function DashboardStats({ onNavigate, totalValue, totalOrders, totalClients, totalValueWeek, totalOrdersWeek, totalValueMonth, totalOrdersMonth, userRole, allowedTabs }: DashboardStatsProps) {
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [expandAll, setExpandAll] = useState(false);
  const isMobile = useIsMobile();

  const handleCardClick = (id: string) => {
    if (!isMobile) return;

    if (expandAll) {
      setExpandAll(false);
      setExpandedCardId(id);
    } else {
      setExpandedCardId(prevId => (prevId === id ? null : id));
    }
  };

  const handleToggleExpandAll = () => {
    setExpandAll(prev => !prev);
    setExpandedCardId(null);
  };

  // Removido allQuickActions pois a seção de Atalhos Rápidos será removida.
  // const allQuickActions = [
  //   {
  //     id: 'inventory',
  //     title: "Insumos",
  //     icon: Package,
  //     color: "bg-gradient-to-br from-purple-500 to-purple-600",
  //     description: "Controle de estoque",
  //     action: () => onNavigate("inventory"),
  //   },
  //   {
  //     id: 'chat',
  //     title: "Pedidos",
  //     icon: ShoppingBag,
  //     color: "bg-gradient-to-br from-orange-500 to-red-500",
  //     description: "Comandas e pedidos",
  //     action: () => onNavigate("chat"),
  //   },
  //   {
  //     id: 'financial',
  //     title: "Financeiro",
  //     icon: CreditCard,
  //     color: "bg-gradient-to-br from-red-500 to-red-600",
  //     description: "Controle financeiro",
  //     action: () => onNavigate("financial"),
  //   },
  //   {
  //     id: 'settings',
  //     title: "Configurações",
  //     icon: Settings,
  //     color: "bg-gradient-to-br from-gray-500 to-gray-600",
  //     description: "Configurar sistema",
  //     action: () => onNavigate("settings"),
  //   },
  //   {
  //     id: 'sales',
  //     title: "Relatórios",
  //     icon: FileText,
  //     color: "bg-gradient-to-br from-blue-500 to-blue-600",
  //     description: "Visualizar relatórios",
  //     action: () => onNavigate("sales"),
  //   },
  //   {
  //     id: 'users',
  //     title: "Usuários",
  //     icon: Users,
  //     color: "bg-gradient-to-br from-green-500 to-green-600",
  //     description: "Gerenciar usuários",
  //     action: () => onNavigate("users"),
  //   },
  //   {
  //     id: 'clients',
  //     title: "Clientes",
  //     icon: Star,
  //     color: "bg-gradient-to-br from-pink-500 to-pink-600",
  //     description: "Gestão de clientes",
  //     action: () => onNavigate("clients"),
  //   },
  //   {
  //     id: 'insights',
  //     title: "Insights",
  //     icon: TrendingUp,
  //     color: "bg-gradient-to-br from-indigo-500 to-indigo-600",
  //     description: "Análises e métricas",
  //     action: () => onNavigate("insights"),
  //   },
  // ];

  // const quickActions = allQuickActions.filter(action => (allowedTabs ?? []).includes(action.id as TabId));

  const showMainStats = userRole !== 'funcionario';

  const statCards = [
    { id: 'total-value-general', title: 'Valor Total (Geral)', value: totalValue, badgeText: 'Todos os tempos', badgeIcon: TrendingUp, valuePrefix: 'R$ ', valueFormatter: (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), color: "bg-gradient-to-br from-emerald-500 to-emerald-600" },
    { id: 'total-orders-general', title: 'Total de Pedidos (Geral)', value: totalOrders, badgeText: 'Comandas', badgeIcon: ShoppingBag, valuePrefix: '', valueFormatter: (val: number) => val.toString(), color: "bg-gradient-to-br from-blue-500 to-blue-600" },
    { id: 'clients-active', title: 'Clientes Ativos', value: totalClients, badgeText: 'Cadastrados', badgeIcon: Users, valuePrefix: '', valueFormatter: (val: number) => val.toString(), color: "bg-gradient-to-br from-purple-500 to-purple-600" },
    { id: 'total-value-week', title: 'Valor Semana', value: totalValueWeek, badgeText: 'Esta semana', badgeIcon: DollarSign, valuePrefix: 'R$ ', valueFormatter: (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), color: "bg-gradient-to-br from-orange-500 to-orange-600" },
    { id: 'total-orders-week', title: 'Pedidos Semana', value: totalOrdersWeek, badgeText: 'Esta semana', badgeIcon: ShoppingBag, valuePrefix: '', valueFormatter: (val: number) => val.toString(), color: "bg-gradient-to-br from-red-500 to-red-600" },
    { id: 'total-value-month', title: 'Valor Mês', value: totalValueMonth, badgeText: 'Este mês', badgeIcon: DollarSign, valuePrefix: 'R$ ', valueFormatter: (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), color: "bg-gradient-to-br from-indigo-500 to-indigo-600" },
    { id: 'total-orders-month', title: 'Pedidos Mês', value: totalOrdersMonth, badgeText: 'Este mês', badgeIcon: ShoppingBag, valuePrefix: '', valueFormatter: (val: number) => val.toString(), color: "bg-gradient-to-br from-teal-500 to-teal-600" },
  ];

  // Reordena os cards para que o expandido fique no topo
  const displayCards = useMemo(() => {
    if (isMobile && expandedCardId && !expandAll) {
      const expanded = statCards.find(card => card.id === expandedCardId);
      const others = statCards.filter(card => card.id !== expandedCardId);
      return expanded ? [expanded, ...others] : statCards;
    }
    return statCards;
  }, [statCards, isMobile, expandedCardId, expandAll]);

  return (
    <div className="space-y-4 md:space-y-6 relative">
      {/* Cards de Estatísticas Principais */}
      {showMainStats && (
        <>
          {isMobile && (
            <div className="flex justify-end mb-4"> {/* Adicionado flex e mb-4 */}
              <Button variant="ghost" size="icon" onClick={handleToggleExpandAll} className="text-muted-foreground hover:bg-muted/10">
                {expandAll ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span className="sr-only">{expandAll ? 'Reduzir Todos' : 'Expandir Todos'}</span> {/* Acessibilidade */}
              </Button>
            </div>
          )}
          <div className="flex flex-wrap gap-3 md:grid md:grid-cols-3 md:gap-4"> {/* Alterado para flex flex-wrap no mobile */}
            {displayCards.map(card => { // Renderiza a lista reordenada
              const isCardExpanded = isMobile && (expandAll || expandedCardId === card.id);
              const Icon = card.badgeIcon;

              return (
                <Card
                  key={card.id}
                  className={cn(
                    "vixxe-shadow rounded-xl cursor-pointer transition-all duration-300 ease-in-out",
                    card.color,
                    isMobile && !isCardExpanded && "h-16 w-[calc(50%-0.375rem)] overflow-hidden", // Largura de 50% menos o gap
                    isMobile && isCardExpanded && "h-auto w-full", // Largura total quando expandido
                    !isMobile && "w-full" // No desktop, mantém a largura total da coluna do grid
                  )}
                  onClick={() => handleCardClick(card.id)}
                >
                  <CardHeader className="pb-2 mobile-compact flex flex-row items-center justify-between">
                    <CardTitle className="text-[10px] md:text-sm font-medium opacity-90 text-white">
                      {card.title}
                    </CardTitle>
                    {isMobile && (
                      <div className="text-white">
                        {isCardExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className={cn(
                    "mobile-compact",
                    isMobile && !isCardExpanded && "py-0"
                  )}>
                    <div className={cn(
                      "font-bold text-white",
                      isMobile && !isCardExpanded ? "text-base" : "text-2xl"
                    )}>
                      {card.valuePrefix}{card.valueFormatter(card.value)}
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "mt-1 md:mt-2 bg-white/20 text-white border-0 text-xs",
                        isMobile && !isCardExpanded && "hidden"
                      )}
                    >
                      <Icon className="w-2 h-2 md:w-3 md:h-3 mr-1" />
                      {card.badgeText}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Atalhos Rápidos - REMOVIDO */}
      {/* <Card className="vixxe-shadow rounded-xl">
        <CardHeader className="mobile-compact-card">
          <CardTitle className="text-base md:text-lg font-semibold bg-vixxe-gradient bg-clip-text text-transparent">Atalhos Rápidos</CardTitle>
        </CardHeader>
        <CardContent className="mobile-compact-card">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={cn(
                  "p-3 md:p-4 rounded-xl text-white text-left transition-all duration-200 hover:scale-105 hover:shadow-lg",
                  action.color
                )}
              >
                <div className="flex items-center justify-between mb-1 md:mb-2">
                  <action.icon className="w-4 h-4 md:w-6 md:h-6" />
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white/30 rounded-full"></div>
                </div>
                <h3 className="font-semibold text-xs md:text-sm mb-0.5 md:mb-1">{action.title}</h3>
                <p className="text-[10px] md:text-xs opacity-90 leading-tight">{action.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card> */}

      {/* Botão "Expandir Todos" na parte inferior */}
      {isMobile && showMainStats && (
        <div className="flex justify-end mt-4"> {/* Adicionado mt-4 para espaçamento */}
          <Button variant="ghost" size="icon" onClick={handleToggleExpandAll} className="text-muted-foreground hover:bg-muted/10">
            {expandAll ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span className="sr-only">{expandAll ? 'Reduzir Todos' : 'Expandir Todos'}</span>
          </Button>
        </div>
      )}
    </div>
  );
}