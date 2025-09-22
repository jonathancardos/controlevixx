import { useState, useCallback, useEffect } from 'react'; // Adicionado useEffect
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HistoryTab } from '@/components/dashboard/HistoryTab';
import { ActiveComandasTab } from '@/components/comandas/ActiveComandasTab';
import { MessageSquare, History, AlertTriangle, PlusCircle } from 'lucide-react';
import { Comanda } from '@/types/supabase';
import { EditComandaSheet } from '@/components/modals/EditComandaSheet';

interface ComandaManagementTabProps {
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
  onComandaUpdated: () => void;
}

export function ComandaManagementTab({ activeSubTab, setActiveSubTab, onComandaUpdated }: ComandaManagementTabProps) {
  const [selectedComandaForView, setSelectedComandaForView] = useState<Comanda | null>(null);
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Key para forçar re-renderização

  // Atualiza a chave de refresh quando onComandaUpdated é chamado
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [onComandaUpdated]);

  const handleViewOrder = (comanda: Comanda) => {
    setSelectedComandaForView(comanda);
    setIsViewSheetOpen(true);
  };

  // Função dummy para onSave, pois a sheet de visualização não salva diretamente
  const handleSaveViewedComanda = () => {
    // Não faz nada, pois esta sheet é apenas para visualização no contexto do histórico
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 rounded-xl p-1 shadow-inner">
          <TabsTrigger value="comandas-ativas" className="text-sm data-[state=active]:bg-vixxe-gradient data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:rounded-lg transition-all duration-200">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Comandas Ativas
          </TabsTrigger>
          <TabsTrigger value="comandas-finalizadas" className="text-sm data-[state=active]:bg-vixxe-gradient data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:rounded-lg transition-all duration-200">
            <History className="w-4 h-4 mr-2" />
            Comandas Finalizadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comandas-ativas" className="mt-0">
          <ActiveComandasTab key={`active-${refreshKey}`} onComandaUpdated={onComandaUpdated} />
        </TabsContent>

        <TabsContent value="comandas-finalizadas" className="mt-0">
          <HistoryTab key={`finalized-${refreshKey}`} onViewOrder={handleViewOrder} onComandaUpdated={onComandaUpdated} />
        </TabsContent>
      </Tabs>

      {/* Sheet de Visualização/Edição de Comanda (para o histórico) */}
      <EditComandaSheet
        open={isViewSheetOpen}
        onOpenChange={setIsViewSheetOpen}
        comanda={selectedComandaForView}
        onSave={handleSaveViewedComanda}
        loading={false}
      />
    </div>
  );
}