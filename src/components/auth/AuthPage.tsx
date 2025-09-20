import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Lock, User, ChefHat } from 'lucide-react';
import burgerBg from '@/assets/burger-blur-bg.jpg';

// Tipo para os dados do usuário retornados pelo login
interface UserData {
  id: string;
  nome_usuario: string;
  senha: string;
  role: string;
  ativo: boolean;
  // Adicione outros campos conforme necessário
}

interface AuthPageProps {
  onLogin: (userData: UserData) => void;
}

export function AuthPage({ onLogin }: AuthPageProps) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!usuario || !senha) {
      setError('Preencha usuário e senha');
      setLoading(false);
      return;
    }

    try {
      // Normalizar o nome de usuário para comparação (remover espaços e converter para minúsculas)
      const normalizedUsuario = usuario.trim().toLowerCase();

      // Verificar usuário na tabela usuarios
      const {
        data,
        error: dbError // Renomeado para evitar conflito com a variável 'error' do estado
      } = await supabase.from('usuarios').select('*').eq('nome_usuario', normalizedUsuario).eq('ativo', true).single();

      if (dbError || !data) {
        // Se o erro for 'PGRST116', significa que nenhuma linha foi encontrada
        if (dbError && dbError.code === 'PGRST116') {
          setError('Usuário não encontrado ou inativo');
        } else {
          console.error('Erro ao buscar usuário:', dbError);
          setError('Erro ao buscar usuário. Tente novamente.');
        }
        setLoading(false);
        return;
      }

      // Para desenvolvimento, comparar senha informada com a salva no banco
      // Em produção, implementar verificação de hash bcrypt
      if (senha === data.senha) {
        toast.success(`Bem-vindo, ${data.nome_usuario}!`);
        onLogin(data);
      } else {
        setError('Senha incorreta');
      }
    } catch (err: any) { // Captura erros inesperados
      console.error('Erro no login:', err);
      setError(`Erro interno: ${err.message || 'Tente novamente.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen relative flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${burgerBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
      
      <Card className="relative w-full max-w-md vixxe-shadow border-primary/20 bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-vixxe-gradient rounded-full flex items-center justify-center mb-2 vixxe-glow">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-vixxe-gradient bg-clip-text text-transparent">
              VixxeMaria
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Sistema de Gestão de Restaurante
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="usuario" className="text-sm font-medium">Nome de Usuário</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="usuario" 
                  type="text" 
                  placeholder="Digite seu usuário" 
                  value={usuario} 
                  onChange={e => setUsuario(e.target.value)} 
                  className="pl-9 h-12 border-primary/20 focus:border-primary/50" 
                  disabled={loading} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha" className="text-sm font-medium">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="senha" 
                  type="password" 
                  placeholder="Digite sua senha" 
                  value={senha} 
                  onChange={e => setSenha(e.target.value)} 
                  className="pl-9 h-12 border-primary/20 focus:border-primary/50" 
                  disabled={loading} 
                />
              </div>
            </div>

            {error && <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>}

            <Button type="submit" className="w-full h-12 text-base font-medium" variant="vixxe" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </div>
              ) : 'Entrar no Sistema'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Sistema seguro de gestão de restaurante
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}