import { useState } from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabId } from "@/types/dashboard";
import { Download, MessageSquare, TrendingUp, BarChart3, Clock, Users, Star, Home, Settings, Package, CreditCard, LogOut, DollarSign, ShoppingCart, Bot } from "lucide-react"; // Importar LogOut, DollarSign e ShoppingCart
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardHeaderProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onExportCSV: () => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  allowedTabs?: TabId[];
  userRole: 'master' | 'admin' | 'gestor' | 'funcionario';
  userName: string; // Adicionar userName
  onLogout: () => void; // Adicionar onLogout
}

// Definindo os estilos para cada aba
const tabStyles: Record<TabId, { bg: string; text: string; titleColor: string }> = {
  dashboard: { bg: "bg-vixxe-gradient-subtle", text: "text-white", titleColor: "text-transparent" },
  pdv: { bg: "bg-gradient-to-r from-emerald-500 to-green-600", text: "text-white", titleColor: "text-white" }, // Novo estilo para PDV
  'chat-generator': { bg: "bg-gradient-to-r from-purple-500 to-indigo-600", text: "text-white", titleColor: "text-white" }, // Novo estilo para Chat Generator
  chat: { bg: "bg-gradient-to-r from-orange-500 to-red-500", text: "text-white", titleColor: "text-white" },
  sales: { bg: "bg-gradient-to-r from-blue-600 to-cyan-600", text: "text-white", titleColor: "text-white" },
  insights: { bg: "bg-gradient-to-r from-indigo-600 to-purple-600", text: "text-white", titleColor: "text-white" },
  history: { bg: "bg-gradient-to-r from-gray-700 to-gray-900", text: "text-white", titleColor: "text-white" },
  users: { bg: "bg-gradient-to-r from-green-600 to-emerald-600", text: "text-white", titleColor: "text-white" },
  clients: { bg: "bg-gradient-to-r from-pink-600 to-rose-600", text: "text-white", titleColor: "text-white" },
  inventory: { bg: "bg-gradient-to-r from-purple-600 to-fuchsia-600", text: "text-white", titleColor: "text-white" },
  financial: { bg: "bg-gradient-to-r from-yellow-600 to-amber-600", text: "text-white", titleColor: "text-white" }, // Adicionado estilo para financial
  settings: { bg: "bg-gradient-to-r from-slate-600 to-zinc-600", text: "text-white", titleColor: "text-white" },
};

export function DashboardHeader({
  activeTab,
  onTabChange,
  onExportCSV,
  dateRange,
  onDateRangeChange,
  allowedTabs,
  userRole,
  userName,
  onLogout
}: DashboardHeaderProps) {
  const isMobile = useIsMobile();
  const [hoveredTabId, setHoveredTabId] = useState<TabId | null>(null);
  const [mobileExpandedTabId, setMobileExpandedTabId] = useState<TabId | null>(null);

  const allTabs: Array<{ id: TabId; label: string; icon: LucideIcon; roles: string[] }> = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, roles: ['master', 'admin', 'gestor', 'funcionario'] },
    { id: 'pdv', label: 'PDV', icon: ShoppingCart, roles: ['master', 'admin', 'gestor', 'funcionario'] }, // Nova aba PDV
    { id: 'chat-generator', label: 'Chat Comanda', icon: Bot, roles: ['master', 'admin', 'gestor', 'funcionario'] }, // Nova aba Chat Generator
    // As abas 'chat' e 'history' foram movidas para dentro do PDV
    { id: 'sales', label: 'Vendas', icon: TrendingUp, roles: ['master', 'admin', 'gestor'] },
    { id: 'insights', label: 'Insights', icon: BarChart3, roles: ['master', 'admin', 'gestor'] },
    { id: 'users', label: 'Usuários', icon: Users, roles: ['master', 'admin'] },
    { id: 'clients', label: 'Clientes', icon: Star, roles: ['master', 'admin', 'gestor'] },
    { id: 'inventory', label: userRole === 'funcionario' ? 'Solicitação' : 'Insumos', icon: Package, roles: ['master', 'funcionario'] },
    { id: 'financial', label: 'Financeiro', icon: DollarSign, roles: ['master', 'funcionario'] }, // Adicionado financial
    { id: 'settings', label: 'Configurações', icon: Settings, roles: ['master', 'funcionario'] },
  ];

  const tabs = allTabs.filter(tab => (allowedTabs ?? allTabs.map(t => t.id)).includes(tab.id));
  const activeTabLabel = tabs.find(tab => tab.id === activeTab)?.label || 'Dashboard';

  const currentTabStyle = tabStyles[activeTab];

  return (
    <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
      {/* Main Header */}
      <header className={cn(
        "flex flex-col lg:flex-row lg:items-center justify-between gap-3 md:gap-4 p-4 md:p-6 rounded-xl transition-all duration-300 ease-in-out",
        currentTabStyle.text, // Mantém a cor do texto para outros elementos
        activeTab !== 'dashboard' && 'vixxe-shadow' // Adiciona sombra apenas para abas não-dashboard
      )}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
          {/* Título principal sempre com gradiente Vixxe Maria */}
          <h1 className="text-4xl md:text-5xl font-extrabold vixxe-gradient bg-clip-text text-transparent">
            {activeTab === 'dashboard' ? 'Vixxe Maria' : activeTabLabel}
          </h1>
          {activeTab === 'dashboard' && (
            <p className="text-xl md:text-2xl font-semibold text-muted-foreground mt-2 sm:mt-0">
              {activeTabLabel}
            </p>
          )}
        </div>

        {/* User Info and Logout Button */}
        <div className="flex items-center gap-2 md:gap-4 mt-3 lg:mt-0">
          <div className="text-right">
            <p className="text-xs md:text-sm font-medium">{userName}</p>
            <p className="text-[10px] md:text-xs text-white/80 capitalize">{userRole}</p>
          </div>
          <Button variant="outline" size="sm" onClick={onLogout} className="h-8 md:h-9 bg-white/20 hover:bg-white/30 text-white border-white/30">
            <LogOut className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            <span className="hidden md:inline">Sair</span>
          </Button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex gap-1 md:gap-2 overflow-x-auto pb-2 no-scrollbar bg-muted/50 rounded-xl p-1 shadow-inner"> {/* Adicionado styling aqui */}
        {tabs.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={activeTab === id ? "vixxe-tab" : "ghost"}
            onClick={() => {
              onTabChange(id);
              if (isMobile) {
                setMobileExpandedTabId(id === mobileExpandedTabId ? null : id);
              }
            }}
            onMouseEnter={() => !isMobile && setHoveredTabId(id)}
            onMouseLeave={() => !isMobile && setHoveredTabId(null)}
            className={cn(
              "relative flex items-center justify-center transition-all duration-200 ease-in-out flex-shrink-0",
              isMobile ? [
                "w-10 h-10 p-0 rounded-full",
                mobileExpandedTabId === id && "w-auto h-12 px-4 rounded-lg"
              ] : [
                "sm:w-auto sm:h-9 sm:px-3 sm:rounded-lg",
                activeTab !== id && hoveredTabId === id && "sm:scale-105 sm:shadow-lg sm:bg-muted/50"
              ]
            )}
          >
            <Icon className="w-4 h-4" />
            <span className={cn(
              "ml-1 md:ml-2",
              isMobile && (mobileExpandedTabId === id ? "inline" : "hidden"),
              !isMobile && "inline"
            )}>
              {label}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}