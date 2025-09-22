import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Plus, User, Phone, Mail } from 'lucide-react';
import { useClientes } from '@/hooks/useSupabase';
import { toast } from 'sonner';
import { Cliente } from '@/types/supabase';

interface CreateClientSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated: (client: Cliente) => void;
}

export function CreateClientSheet({ open, onOpenChange, onClientCreated }: CreateClientSheetProps) {
  const { criarCliente, loading } = useClientes();
  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    // email: '', // Removido
  });

  const handleCreateClient = async () => {
    if (!form.nome.trim()) {
      toast.error('O nome do cliente é obrigatório.');
      return;
    }

    const newClient = await criarCliente(form);
    if (newClient) {
      onClientCreated(newClient);
      setForm({ nome: '', telefone: '' }); // Removido email
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Novo Cliente
          </SheetTitle>
          <SheetDescription>
            Adicione um novo cliente ao sistema.
          </SheetDescription>
        </SheetHeader>
        <div className="py-6 space-y-4">
          <div>
            <Label htmlFor="client-name" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Nome do Cliente*
            </Label>
            <Input
              id="client-name"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Nome completo do cliente"
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="client-phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Telefone
            </Label>
            <Input
              id="client-phone"
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              placeholder="(XX) XXXXX-XXXX"
              disabled={loading}
            />
          </div>
          {/* <div>
            <Label htmlFor="client-email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              E-mail
            </Label>
            <Input
              id="client-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@exemplo.com"
              disabled={loading}
            />
          </div> */}
        </div>
        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleCreateClient} disabled={loading || !form.nome.trim()} variant="vixxe">
            {loading ? 'Criando...' : 'Criar Cliente'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}