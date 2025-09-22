import { VixxeDashboard } from "@/components/VixxeDashboard";
import { Usuario } from "@/types/supabase";

interface IndexProps {
  user: Usuario;
  onLogout: () => void;
}

const Index = ({ user, onLogout }: IndexProps) => {
  return <VixxeDashboard user={user} onLogout={onLogout} />;
};

export default Index;