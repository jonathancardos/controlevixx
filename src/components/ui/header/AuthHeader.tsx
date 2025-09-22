import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/components/auth/AuthProvider';
import { LogOut, Settings, User } from 'lucide-react';

export function AuthHeader() {
  const { usuario, logout } = useAuth();

  if (!usuario) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'master': return 'Master';
      case 'admin': return 'Admin';
      case 'gestor': return 'Gestor';
      default: return 'Usuário';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'master': return 'text-red-600';
      case 'admin': return 'text-blue-600';
      case 'gestor': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <p className="text-sm font-medium">{usuario.nome_usuario}</p>
        <p className={`text-xs ${getRoleColor(usuario.role)}`}>
          {getRoleBadge(usuario.role)}
        </p>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar>
              <AvatarFallback>
                {getInitials(usuario.nome_usuario)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              <p className="font-medium">{usuario.nome_usuario}</p>
              <p className={`text-xs leading-none ${getRoleColor(usuario.role)}`}>
                {getRoleBadge(usuario.role)}
              </p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <User className="mr-2 h-4 w-4" />
            <span>Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurações</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}