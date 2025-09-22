import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Eye, Users } from "lucide-react";
import { toast } from "sonner";
import { useUserSupabase } from "@/hooks/useUserSupabase";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface User {
  id: string;
  nome_usuario: string;
  role: 'master' | 'admin' | 'gestor' | 'funcionario';
  ativo: boolean;
  created_at: string;
  ultimo_acesso?: string;
}

const roleLabels = {
  master: "Controle Total",
  admin: "Administrador", 
  gestor: "Gestor",
  funcionario: "Funcionário"
};

const roleDescriptions = {
  master: "Acesso completo ao sistema",
  admin: "Gerenciar usuários e configurações",
  gestor: "Editar informações e relatórios", 
  funcionario: "Registrar pedidos apenas"
};

const roleColors = {
  master: "bg-red-100 text-red-800",
  admin: "bg-blue-100 text-blue-800", 
  gestor: "bg-green-100 text-green-800",
  funcionario: "bg-gray-100 text-gray-800"
};

export function UserManagement() {
  const { usuarios, loading, criarUsuario, toggleUsuarioAtivo, excluirUsuario } = useUserSupabase();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome_usuario: "",
    senha: "",
    role: "funcionario" as 'master' | 'admin' | 'gestor' | 'funcionario'
  });

  const handleCreateUser = async () => {
    const success = await criarUsuario(formData);
    if (success) {
      setFormData({ nome_usuario: "", senha: "", role: "funcionario" });
      setIsCreateModalOpen(false);
    }
  };

  const handleToggleActive = async (userId: string) => {
    const user = usuarios.find(u => u.id === userId);
    if (user) {
      await toggleUsuarioAtivo(userId, !user.ativo);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    await excluirUsuario(userId);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="vixxe-shadow rounded-xl">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mobile-compact-card">
          <div className="mobile-full-width">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Users className="w-4 h-4 md:w-5 md:h-5" />
              Gestão de Usuários
            </CardTitle>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Gerencie usuários e suas permissões no sistema
            </p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username">Nome de usuário</Label>
                  <Input
                    id="username"
                    value={formData.nome_usuario}
                    onChange={(e) => setFormData({ ...formData, nome_usuario: e.target.value })}
                    placeholder="Digite o nome de usuário"
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    placeholder="Digite a senha"
                  />
                </div>
                
                <div>
                  <Label htmlFor="role">Função</Label>
                  <Select value={formData.role} onValueChange={(value: User['role']) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="funcionario">
                        <div>
                          <div className="font-medium">Funcionário</div>
                          <div className="text-xs text-muted-foreground">Registrar pedidos apenas</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="gestor">
                        <div>
                          <div className="font-medium">Gestor</div>
                          <div className="text-xs text-muted-foreground">Editar informações e relatórios</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div>
                          <div className="font-medium">Administrador</div>
                          <div className="text-xs text-muted-foreground">Gerenciar usuários e configurações</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleCreateUser} className="flex-1">
                    Criar Usuário
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                    Carregando usuários...
                  </TableCell>
                </TableRow>
              ) : usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                usuarios.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm md:text-base">{user.nome_usuario}</div>
                        <div className="text-[10px] md:text-xs text-muted-foreground">ID: {user.id.slice(0, 8)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleColors[user.role]} variant="secondary">
                        {roleLabels[user.role]}
                      </Badge>
                      <div className="text-[10px] md:text-xs text-muted-foreground mt-1 hidden md:block">
                        {roleDescriptions[user.role]}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.ativo}
                          onCheckedChange={() => handleToggleActive(user.id)}
                          disabled={user.role === 'master' || loading}
                        />
                        <span className="text-xs md:text-sm">
                          {user.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs md:text-sm">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-xs md:text-sm hidden md:table-cell">
                      {user.updated_at 
                        ? new Date(user.updated_at).toLocaleDateString('pt-BR')
                        : 'Nunca'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="w-3 h-3 md:w-4 md:h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" disabled={user.role === 'master'} className="h-8 w-8 p-0">
                          <Edit className="w-3 h-3 md:w-4 md:h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              disabled={user.role === 'master' || loading}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o usuário <strong>{user.nome_usuario}</strong>?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-red-600 hover:bg-red-700">
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}