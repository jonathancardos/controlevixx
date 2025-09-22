import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { FiltroComandas } from '@/types/supabase';
import { Filter, Calendar, CreditCard, User, RotateCcw } from 'lucide-react';

interface FiltrosAvancadosProps {
  filtros: FiltroComandas;
  onFiltrosChange: (filtros: FiltroComandas) => void;
  onAplicar: () => void;
}

export function FiltrosAvancados({ filtros, onFiltrosChange, onAplicar }: FiltrosAvancadosProps) {
  const [open, setOpen] = useState(false);

  const updateFiltro = (campo: keyof FiltroComandas, valor: string) => {
    onFiltrosChange({
      ...filtros,
      [campo]: valor || undefined
    });
  };

  const limparFiltros = () => {
    onFiltrosChange({});
  };

  const aplicarFiltros = () => {
    onAplicar();
    setOpen(false);
  };

  const filtrosAtivos = Object.values(filtros).filter(v => v && v !== 'all').length;

  const getFiltrosRapidos = () => {
    const hoje = new Date().toISOString().split('T')[0];
    const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const inicioSemana = new Date();
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(fimSemana.getDate() + 6);
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    return [
      { label: 'Hoje', dataInicio: hoje, dataFim: hoje },
      { label: 'Ontem', dataInicio: ontem, dataFim: ontem },
      { label: 'Esta Semana', dataInicio: inicioSemana.toISOString().split('T')[0], dataFim: fimSemana.toISOString().split('T')[0] },
      { label: 'Este Mês', dataInicio: inicioMes, dataFim: hoje }
    ];
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
          {filtrosAtivos > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
              {filtrosAtivos}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-[480px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros Avançados
          </SheetTitle>
          <SheetDescription>
            Configure filtros para refinar sua busca de comandas
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Filtros Rápidos */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Períodos Rápidos
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {getFiltrosRapidos().map((periodo) => (
                <Button
                  key={periodo.label}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    updateFiltro('dataInicio', periodo.dataInicio);
                    updateFiltro('dataFim', periodo.dataFim);
                  }}
                  className={
                    filtros.dataInicio === periodo.dataInicio && 
                    filtros.dataFim === periodo.dataFim 
                      ? 'bg-vixxe-primary text-white' 
                      : ''
                  }
                >
                  {periodo.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Período Personalizado */}
          <div className="space-y-3">
            <Label>Período Personalizado</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="dataInicio" className="text-sm">Data Inicial</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={filtros.dataInicio || ''}
                  onChange={(e) => updateFiltro('dataInicio', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataFim" className="text-sm">Data Final</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={filtros.dataFim || ''}
                  onChange={(e) => updateFiltro('dataFim', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Forma de Pagamento
            </Label>
            <Select
              value={filtros.formaPagamento || 'all'}
              onValueChange={(value) => updateFiltro('formaPagamento', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as formas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as formas</SelectItem>
                <SelectItem value="Pix">Pix</SelectItem>
                <SelectItem value="Cartão">Cartão</SelectItem>
                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filtros.status || 'all'}
              onValueChange={(value) => updateFiltro('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Processada">Processada</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cliente */}
          <div className="space-y-2">
            <Label htmlFor="clienteNome" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Nome do Cliente
            </Label>
            <Input
              id="clienteNome"
              value={filtros.clienteNome || ''}
              onChange={(e) => updateFiltro('clienteNome', e.target.value)}
              placeholder="Buscar por nome do cliente..."
            />
          </div>

          {/* Resumo dos Filtros Ativos */}
          {filtrosAtivos > 0 && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Filtros Ativos:</p>
              <div className="flex flex-wrap gap-2">
                {filtros.dataInicio && (
                  <Badge variant="secondary">De: {filtros.dataInicio}</Badge>
                )}
                {filtros.dataFim && (
                  <Badge variant="secondary">Até: {filtros.dataFim}</Badge>
                )}
                {filtros.formaPagamento && filtros.formaPagamento !== 'all' && (
                  <Badge variant="secondary">{filtros.formaPagamento}</Badge>
                )}
                {filtros.status && filtros.status !== 'all' && (
                  <Badge variant="secondary">{filtros.status}</Badge>
                )}
                {filtros.clienteNome && (
                  <Badge variant="secondary">Cliente: {filtros.clienteNome}</Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="gap-2">
          <Button
            variant="outline"
            onClick={limparFiltros}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Limpar
          </Button>
          <Button onClick={aplicarFiltros} variant="vixxe">
            Aplicar Filtros
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}