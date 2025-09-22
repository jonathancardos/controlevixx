import { useState, useCallback, useEffect } from "react";
import { TabId, SavedOrder } from "@/types/dashboard";
import { exportToCSV, loadHistory } from "@/lib/storage";
import { DashboardHeader } from "./dashboard/DashboardHeader";
import { DashboardStats } from "./dashboard/DashboardStats";
import { SalesTab } from "./dashboard/SalesTab";
import { InsightsTab } from "./dashboard/InsightsTab";
import { UserManagement } from "./users/UserManagement";
import { ClientsManagement } from "./clients/ClientsManagement";
import { InventoryManagement } from "./inventory/InventoryManagement";
import { AdminInventoryManagement } from "./inventory/AdminInventoryManagement";
import { SettingsTab } from "./settings/SettingsTab";
import { FinancialTab } from "./financial/FinancialTab";
import { AdminFinancialManagement } from "./financial/AdminFinancialManagement";
import { EmployeeDashboardCard } from "./dashboard/EmployeeDashboardCard"; // New import
import { POSSystem } from "./pos/POSSystem"; // New import for POS
import { ComandaManagementTab } from "./pos/ComandaManagementTab"; // Importar o novo componente
import { ComandaChatGenerator } from "./comandas/ComandaChatGenerator"; // Importar o novo componente de chat
import { Usuario } from "@/types/supabase";
import { useComandas } from "@/hooks/useSupabase";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import burgerBg from '@/assets/burger-blur-bg.jpg'; // Importar a imagem de fundo
import { format, startOfWeek, startOfMonth } from 'date-fns'; // Importar format, startOfWeek, startOfMonth
import { useVipSystem } from "@/hooks/useVipSystem"; // Importar useVipSystem
import { PendingComandasFAB } from '@/components/comandas/PendingComandasFAB'; // Importar PendingComandasFAB

interface VixxeDashboardProps {
  user: Usuario;
  onLogout: () => void;
}

export function VixxeDashboard({ user, onLogout }: VixxeDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  // Abas permitidas para o papel do usuário
  const allowedTabs: TabId[] = (() => {
    switch (user.role) {
      case 'master':
        return ['dashboard','pdv','chat-generator','sales','insights','users','clients','inventory','financial','settings'];
      case 'admin':
        return ['dashboard','pdv','chat-generator','sales','insights','users','clients'];
      case 'gestor':
        return ['dashboard','pdv','chat-generator','sales','insights','clients'];
      case 'funcionario':
        return ['dashboard','pdv','chat-generator','inventory','financial','settings'];
      default:
        return ['dashboard'];
    }
  })();

  // Impede navegação para abas não permitidas
  const safeSetActiveTab = (tab: TabId) => {
    if (allowedTabs.includes(tab)) {
      setActiveTab(tab);
    } else {
      setActiveTab('dashboard');
    }
  };
  const [dateRange, setDateRange] = useState<DateRange>();
  
  const { comandas } = useComandas();
  const { globalVipSettings } = useVipSystem(); // Obter as configurações VIP globais

  // Calcular dados do dashboard baseado nos dados do banco
  const dashboardData = {
    totalValue: comandas.reduce((sum, c) => sum + (c.valor || 0), 0),
    totalOrders: comandas.length,
    totalClients: new Set(comandas.map(c => c.cliente_nome)).size
  };

  // Calcular dados semanais e mensais
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 0 }); // Domingo como início da semana
  const startOfCurrentMonth = startOfMonth(today);

  const comandasSemana = comandas.filter(c => new Date(c.data) >= startOfCurrentWeek);
  const totalValueWeek = comandasSemana.reduce((sum, c) => sum + (c.valor || 0), 0);
  const totalOrdersWeek = comandasSemana.length;

  const comandasMes = comandas.filter(c => new Date(c.data) >= startOfCurrentMonth);
  const totalValueMonth = comandasMes.reduce((sum, c) => sum + (c.valor || 0), 0);
  const totalOrdersMonth = comandasMes.length;


  const handleExportCSV = useCallback(() => {
    const orders = loadHistory();
    if (orders.length === 0) {
      toast.error("Nenhum registro para exportar");
      return;
    }
    
    exportToCSV(orders);
    toast.success("CSV exportado com sucesso!");
  }, []);

  const handleOrderSaved = useCallback(() => {
    // Trigger re-renders for components that need updated data
    // This is a simple approach - in a larger app you might use a state manager
    toast.success("Dados atualizados!");
  }, []);

  const handleViewOrder = useCallback((order: SavedOrder) => {
    // Switch to chat tab and show the order details
    // Esta função não será mais usada diretamente aqui, mas pode ser mantida para referência
    // setActiveTab('chat'); 
    toast.info(`Visualizando comanda de ${order.client}`);
  }, []);

  const handleNavigate = useCallback((section: string) => {
    setActiveTab(section as TabId);
  }, []);

  const [isPendingComandasFABSheetOpen, setIsPendingComandasFABSheetOpen] = useState(false);

  const handleOpenPendingComandas = useCallback(() => {
    safeSetActiveTab('pdv'); // Navega para a aba PDV
    // Ativa a sub-aba de comandas ativas dentro do PDV
    // Isso será tratado pelo POSSystem, que receberá a prop para gerenciar a sub-aba
    setIsPendingComandasFABSheetOpen(true);
  }, [safeSetActiveTab]);

  const handleComandaUpdated = useCallback(() => {
    // Força o recarregamento das comandas no ComandaManagementTab
  }, []);

  return (
    <div 
      className="min-h-screen relative flex flex-col items-center overflow-x-hidden" // Removido justify-center
      style={{
        backgroundImage: `url(${burgerBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />

      <div className="container relative z-10 bg-card/90 border border-primary/20 vixxe-shadow rounded-xl p-4 md:p-6 my-6"> {/* Estilizado o contêiner principal */}
        <DashboardHeader
          activeTab={activeTab}
          onTabChange={safeSetActiveTab}
          onExportCSV={handleExportCSV}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          allowedTabs={allowedTabs}
          userRole={user.role as 'master' | 'admin' | 'gestor' | 'funcionario'}
          userName={user.nome_usuario}
          onLogout={onLogout}
        />

        <main className="space-y-4 md:space-y-6">
          {/* Responsive Layout - Single column for better mobile experience */}
          <div className="w-full">
            {activeTab === 'dashboard' && user.role !== 'funcionario' && (
              <DashboardStats 
                onNavigate={handleNavigate}
                totalValue={dashboardData.totalValue}
                totalOrders={dashboardData.totalOrders}
                totalClients={dashboardData.totalClients}
                totalValueWeek={totalValueWeek} // Passando para DashboardStats
                totalOrdersWeek={totalOrdersWeek} // Passando para DashboardStats
                totalValueMonth={totalValueMonth} // Passando para DashboardStats
                totalOrdersMonth={totalOrdersMonth} // Passando para DashboardStats
                userRole={user.role as 'master' | 'admin' | 'gestor' | 'funcionario'}
                allowedTabs={allowedTabs}
              />
            )}
            {activeTab === 'dashboard' && user.role === 'funcionario' && (
              <EmployeeDashboardCard user={user} />
            )}
            {allowedTabs.includes('pdv') && activeTab === 'pdv' && (
              <POSSystem 
                onComandaUpdated={handleComandaUpdated}
                isPendingComandasFABSheetOpen={isPendingComandasFABSheetOpen}
                setIsPendingComandasFABSheetOpen={setIsPendingComandasFABSheetOpen}
              />
            )}
            {allowedTabs.includes('chat-generator') && activeTab === 'chat-generator' && <ComandaChatGenerator />}
            {allowedTabs.includes('sales') && activeTab === 'sales' && <SalesTab />}
            {allowedTabs.includes('insights') && activeTab === 'insights' && <InsightsTab />}
            {allowedTabs.includes('users') && activeTab === 'users' && <UserManagement />}
            {allowedTabs.includes('clients') && activeTab === 'clients' && <ClientsManagement globalVipSettings={globalVipSettings} />}
            {allowedTabs.includes('inventory') && activeTab === 'inventory' && (
              user.role === 'master' ? (
                <AdminInventoryManagement user={user} />
              ) : (
                <InventoryManagement user={user} />
              )
            )}
            {allowedTabs.includes('financial') && activeTab === 'financial' && (
              user.role === 'master' ? (
                <AdminFinancialManagement user={user} />
              ) : (
                <FinancialTab user={user} />
              )
            )}
            {allowedTabs.includes('settings') && activeTab === 'settings' && <SettingsTab />}
          </div>
        </main>
      </div>

      {/* Pending Comandas FAB (visible across PDV main tabs) */}
      {/* REMOVED: This FAB is now replaced by a fixed button inside POSSystem */}
      {/* {(activeTab === 'pdv' || activeTab === 'inventory' || activeTab === 'dashboard') && (
        <PendingComandasFAB
          open={isPendingComandasFABSheetOpen}
          onOpenChange={setIsPendingComandasFABSheetOpen}
          onNavigateToComandaManagement={handleOpenPendingComandas}
          onComandaUpdated={handleComandaUpdated}
        />
      )} */}
    </div>
  );
}