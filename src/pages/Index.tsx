import { VixxeDashboard } from "@/components/VixxeDashboard";
import { Usuario } from "@/types/supabase";
import { TabId } from "@/types/dashboard"; // Importar TabId

interface IndexProps {
  user: Usuario;
  onLogout: () => void;
  activeTab: TabId; // Receber activeTab como prop
}

const Index = ({ user, onLogout, activeTab }: IndexProps) => {
  return <VixxeDashboard user={user} onLogout={onLogout} activeTab={activeTab} />;
};

export default Index;