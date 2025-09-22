import { useState } from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabId } from "@/types/dashboard";
import { Download, MessageSquare, TrendingUp, BarChart3, Clock, Users, Star, Home, Settings, Package, CreditCard, LogOut, DollarSign, ShoppingCart, Bot, UserCircle, Menu } from "lucide-react"; // Importar Menu
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DashboardHeaderProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onExportCSV: () => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  allowedTabs?: TabId[];
  userRole: 'master' | 'admin' | 'gestor' | 'funcionario';
  userName: string;
  onLogout: () => void;
  onToggleSidebar: () => void; // Nova prop para alternar o sidebar
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
  financial: { bg: "bg-gradient-to-r from-yellow-600 to-amber-600", text: "text-white", titleColor: "text-white" }, // Adicionado financial
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
  onLogout,
  onToggleSidebar, // Recebe a função de toggle
}: DashboardHeaderProps) {
  const isMobile = useIsMobile();

  const allTabs: Array<{ id: TabId; label: string; icon: LucideIcon; roles: string[] }> = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, roles: ['master', 'admin', 'gestor', 'funcionario'] },
    { id: 'pdv', label: 'PDV', icon: ShoppingCart, roles: ['master', 'admin', 'gestor', 'funcionario'] },
    { id: 'chat-generator', label: 'Chat Comanda', icon: Bot, roles: ['master', 'admin', 'gestor', 'funcionario'] },
    { id: 'sales', label: 'Vendas', icon: TrendingUp, roles: ['master', 'admin', 'gestor'] },
    { id: 'insights', label: 'Insights', icon: BarChart3, roles: ['master', 'admin', 'gestor'] },
    { id: 'users', label: 'Usuários', icon: Users, roles: ['master', 'admin'] },
    { id: 'clients', label: 'Clientes', icon: Star, roles: ['master', 'admin', 'gestor'] },
    { id: 'inventory', label: userRole === 'funcionario' ? 'Solicitação' : 'Insumos', icon: Package, roles: ['master', 'funcionario'] },
    { id: 'financial', label: 'Financeiro', icon: DollarSign, roles: ['master', 'funcionario'] },
    { id: 'settings', label: 'Configurações', icon: Settings, roles: ['master', 'funcionario'] },
  ];

  const activeTabLabel = allTabs.find(tab => tab.id === activeTab)?.label || 'Dashboard';
  const currentTabStyle = tabStyles[activeTab];

  return (
    <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
      {/* Main Header */}
      <header className={cn(
        "flex flex-col lg:flex-row lg:items-center justify-between gap-3 md:gap-4 p-4 md:p-6 rounded-xl transition-all duration-300 ease-in-out",
        currentTabStyle.text,
        activeTab !== 'dashboard' && 'vixxe-shadow'
      )}>
        <div className="flex items-center gap-3 md:gap-4">
          {isMobile && (
            <Button variant="ghost-sidebar" size="icon" onClick={onToggleSidebar} className="lg:hidden">
              <Menu className="h-6 w-6" />
            </Button>
          )}
          <h1 className="text-4xl md:text-5xl font-extrabold vixxe-gradient bg-clip-text text-transparent">
            {activeTab === 'dashboard' ? 'Vixxe Maria' : activeTabLabel}
          </h1>
          {activeTab === 'dashboard' && (
            <p className="text-xl md:text-2xl font-semibold text-muted-foreground mt-2 sm:mt-0">
              {activeTabLabel}
            </p>
          )}
        </div>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-auto px-3 flex items-center gap-2 rounded-full hover:bg-white/20 transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-white/80 capitalize">{userRole}</p>
              </div>
              <UserCircle className="w-4 h-4 ml-2 text-white/80" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs leading-none text-muted-foreground capitalize">
                  {userRole}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Navigation Tabs - REMOVIDO, agora no Sidebar */}
      {/* <div className="flex gap-1 md:gap-2 overflow-x-auto pb-2 no-scrollbar bg-muted/50 rounded-xl p-1 shadow-inner">
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
      </div> */}
    </div>
  );
}