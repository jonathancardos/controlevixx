import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PedidoInsumo, ItemPedidoInsumo } from '@/types/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Package, User, Calendar, DollarSign, Download, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader } from '@/components/ui/card'; // Adicionado CardHeader aqui
import { toast } from 'sonner';

interface PedidoHistoricoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedido: PedidoInsumo | null;
}

export function PedidoHistoricoSheet({ 
  open, 
  onOpenChange, 
  pedido 
}: PedidoHistoricoSheetProps) {

  if (!pedido) return null;

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case 'Baixa': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Normal': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Alta': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'Urgente': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendente': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Em Análise': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Aprovado': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Rejeitado': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'Finalizado': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Pedido de Insumos #${pedido.id.substring(0, 8)}</title>
            <style>
              body { font-family: 'Inter', sans-serif; margin: 20px; color: #333; }
              .header { text-align: center; margin-bottom: 20px; }
              .header h1 { color: #6b46c1; font-size: 24px; margin-bottom: 5px; }
              .header p { font-size: 14px; color: #666; }
              .section-title { font-size: 18px; font-weight: bold; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
              .info-item { font-size: 13px; }
              .info-item strong { color: #555; }
              .item-list { margin-top: 10px; }
              .item-card { border: 1px solid #eee; border-radius: 8px; padding: 10px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
              .item-card h4 { font-size: 14px; font-weight: 600; margin: 0; }
              .item-card p { font-size: 12px; color: #777; margin: 0; }
              .item-card .qty-price { text-align: right; }
              .total-card { background-color: #f0f4f8; border: 1px solid #e0e7ef; border-radius: 8px; padding: 15px; margin-top: 20px; display: flex; justify-content: space-between; align-items: center; }
              .total-card span { font-size: 16px; font-weight: bold; }
              .total-card .value { font-size: 22px; color: #6b46c1; }
              .badge { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; margin-left: 5px; }
              .badge-yellow { background-color: #fff3cd; color: #856404; border: 1px solid #ffeeba; }
              .badge-blue { background-color: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
              .badge-green { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
              .badge-orange { background-color: #ffe0b2; color: #e65100; border: 1px solid #ffcc80; }
              .badge-red { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
              .badge-gray { background-color: #e2e3e5; color: #383d41; border: 1px solid #d6d8db; }
              .obs-admin { background-color: #e0f7fa; border-left: 4px solid #00bcd4; padding: 10px; margin-top: 15px; font-size: 13px; }
              .link-compra { margin-top: 15px; font-size: 13px; }
              .link-compra a { color: #007bff; text-decoration: underline; word-break: break-all; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Pedido de Insumos Vixxe Maria</h1>
              <p>Detalhes do pedido de compra</p>
            </div>
            <hr/>
            
            <h2 class="section-title">Informações do Pedido</h2>
            <div class="info-grid">
              <div class="info-item"><strong>Título:</strong> ${pedido.titulo}</div>
              <div class="info-item"><strong>Solicitante:</strong> ${pedido.usuarios?.nome_usuario || 'Desconhecido'}</div>
              <div class="info-item"><strong>Data de Criação:</strong> ${format(new Date(pedido.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</div>
              <div class="info-item"><strong>Data Necessária:</strong> ${pedido.data_necessidade ? format(new Date(pedido.data_necessidade), 'dd/MM/yyyy', { locale: ptBR }) : 'Não informada'}</div>
              <div class="info-item"><strong>Prioridade:</strong> <span class="badge ${getPriorityColor(pedido.prioridade)}">${pedido.prioridade}</span></div>
              <div class="info-item"><strong>Status:</strong> <span class="badge ${getStatusColor(pedido.status)}">${pedido.status}</span></div>
            </div>

            ${pedido.descricao ? `
              <h2 class="section-title">Descrição</h2>
              <p>${pedido.descricao}</p>
            ` : ''}

            <h2 class="section-title">Itens do Pedido (${pedido.itens?.length || 0})</h2>
            <div class="item-list">
              ${pedido.itens?.map(item => `
                <div class="item-card">
                  <div>
                    <h4>${item.nome_insumo}</h4>
                    <p>${item.quantidade} ${item.unidade_medida} (${item.categoria})</p>
                    ${item.observacoes ? `<p>Obs: ${item.observacoes}</p>` : ''}
                  </div>
                  <div class="qty-price">
                    <p>R$ ${(item.preco_unitario_estimado || 0).toFixed(2)}/un</p>
                    <h4>R$ ${((item.preco_unitario_estimado || 0) * item.quantidade).toFixed(2)}</h4>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="total-card">
              <span>Total Estimado:</span>
              <span class="value">R$ ${pedido.total_estimado.toFixed(2)}</span>
            </div>

            ${pedido.observacoes_admin ? `
              <div class="obs-admin">
                <strong>Observações do Administrador:</strong>
                <p>${pedido.observacoes_admin}</p>
              </div>
            ` : ''}

            ${pedido.link_publico_compra ? `
              <div class="link-compra">
                <strong>Link Público para Compra:</strong>
                <a href="${pedido.link_publico_compra}" target="_blank">${pedido.link_publico_compra}</a>
              </div>
            ` : ''}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      toast.success('PDF gerado com sucesso!');
    } else {
      toast.error('Não foi possível abrir a janela de impressão.');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Detalhes do Pedido #{pedido.id.substring(0, 8)}
          </SheetTitle>
          <SheetDescription>
            Informações completas do seu pedido de insumos.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Informações do Pedido */}
          <Card className="vixxe-shadow rounded-xl">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">TÍTULO</Label>
                  <p className="font-medium">{pedido.titulo}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">SOLICITANTE</Label>
                  <p>{pedido.usuarios?.nome_usuario || 'Desconhecido'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">DATA DE CRIAÇÃO</Label>
                  <p>{format(new Date(pedido.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">DATA NECESSÁRIA</Label>
                  <p>{pedido.data_necessidade ? format(new Date(pedido.data_necessidade), 'dd/MM/yyyy', { locale: ptBR }) : 'Não informada'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">PRIORIDADE</Label>
                  <Badge className={getPriorityColor(pedido.prioridade)}>
                    {pedido.prioridade}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">STATUS</Label>
                  <Badge className={getStatusColor(pedido.status)}>
                    {pedido.status}
                  </Badge>
                </div>
              </div>

              {pedido.descricao && (
                <div>
                  <Label className="text-xs text-muted-foreground">DESCRIÇÃO</Label>
                  <p className="mt-1 text-sm">{pedido.descricao}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Itens do Pedido */}
          <Card className="vixxe-shadow rounded-xl">
            <CardHeader className="pb-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Package className="w-5 h-5" />
                Itens Solicitados ({pedido.itens?.length || 0})
              </h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {pedido.itens?.map((item, index) => (
                <div key={item.id || index} className="flex justify-between items-center p-3 bg-muted rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.nome_insumo}</h4>
                    <p className="text-xs text-muted-foreground">
                      {item.quantidade} {item.unidade_medida} ({item.categoria})
                    </p>
                    {item.observacoes && (
                      <p className="text-xs text-muted-foreground mt-1">Obs: {item.observacoes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      R$ {(item.preco_unitario_estimado || 0).toFixed(2)}/un
                    </div>
                    <div className="text-base font-bold">
                      R$ {((item.preco_unitario_estimado || 0) * item.quantidade).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
              {pedido.itens?.length === 0 && (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  Nenhum item neste pedido.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Total Estimado */}
          <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
            <span className="font-semibold text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Total Estimado:
            </span>
            <span className="text-xl font-bold text-primary">
              R$ {pedido.total_estimado.toFixed(2)}
            </span>
          </div>

          {pedido.observacoes_admin && (
            <Card className="vixxe-shadow rounded-xl">
              <CardContent className="p-4">
                <Label className="text-xs text-muted-foreground">OBSERVAÇÕES DO ADMINISTRADOR</Label>
                <p className="mt-1 text-sm p-2 bg-blue-50/10 rounded-lg">{pedido.observacoes_admin}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={handleDownloadPDF} variant="vixxe">
            <Download className="w-4 h-4 mr-2" />
            Baixar PDF
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}