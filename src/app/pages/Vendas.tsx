// Vendas.tsx — AutoGestão com Supabase
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Trash2, Pencil, Eye, Download, FileText } from 'lucide-react';
import { store, Venda, Veiculo } from '../lib/store';
import { useAuth } from '../contexts/AuthContext';
import { VendaDialogCompleto } from '../components/VendaDialogCompleto';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { supabase } from '../lib/supabase';

const formaPagamentoLabel: Record<string, string> = {
  dinheiro: 'Dinheiro', financiamento: 'Financiamento', cartao: 'Cartão', transferencia: 'Transferência'
};

const tipoDocLabel: Record<string, string> = {
  identidade: 'Identidade (RG)',
  cnh: 'CNH',
  comprovante_endereco: 'Comprovante de Endereço',
  comprovante_renda: 'Comprovante de Renda',
  contrato: 'Contrato',
  cartao_cnpj: 'Cartão CNPJ',
  contrato_social: 'Contrato Social',
  comprovante_pagamento: 'Comprovante de Pagamento',
  outros: 'Outros',
};

const statusDocLabel: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
};

interface DocVenda {
  id: string;
  nome: string;
  tipo: string;
  conteudo: string;
  dataUpload: string;
}

function VendaDetalhesModal({ venda, open, onOpenChange, onUpdate }: {
  venda: Venda | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpdate?: () => void;
}) {
  const [docs, setDocs] = useState<DocVenda[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [statusAtual, setStatusAtual] = useState<string>('pendente');
  const [salvandoStatus, setSalvandoStatus] = useState(false);
  const { isVisualizador } = useAuth();

  useEffect(() => {
    if (!venda || !open) { setDocs([]); return; }
    setStatusAtual(venda.statusDocumentacao);
    setLoadingDocs(true);
    supabase
      .from('vendas')
      .select('documentos')
      .eq('id', venda.id)
      .single()
      .then(({ data }) => {
        const docsEncontrados = (data?.documentos ?? []) as DocVenda[];
        setDocs(docsEncontrados.filter(d => d?.conteudo));
        setLoadingDocs(false);
      });
  }, [venda, open]);

  if (!venda) return null;

  const handleVisualizarDoc = (conteudo: string) => {
    const byteString = atob(conteudo.split(',')[1]);
    const mimeType = conteudo.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    window.open(URL.createObjectURL(new Blob([ab], { type: mimeType })), '_blank');
  };

  const handleChangeStatus = async (novoStatus: string) => {
    setSalvandoStatus(true);
    const statusMap: Record<string, string> = {
      pendente: 'pendente',
      em_andamento: 'em_andamento',
      concluida: 'concluido',
    };
    const { error } = await supabase
      .from('vendas')
      .update({ status_doc: statusMap[novoStatus] })
      .eq('id', venda.id);
    if (error) {
      console.error('updateStatusDoc:', error);
    } else {
      setStatusAtual(novoStatus);
      onUpdate?.();
    }
    setSalvandoStatus(false);
  };

  const linha = (label: string, valor: string | undefined | null) =>
    valor ? (
      <div className="flex justify-between py-2 border-b last:border-0 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-right max-w-[60%]">{valor}</span>
      </div>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Venda</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Veículo */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Veículo</p>
            <div className="bg-muted rounded-lg px-4 py-1">
              {linha('Veículo', venda.veiculo)}
              {linha('Data da venda', new Date(venda.dataVenda + 'T12:00:00').toLocaleDateString('pt-BR'))}
            </div>
          </div>

          {/* Cliente */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Cliente</p>
            <div className="bg-muted rounded-lg px-4 py-1">
              {linha('Nome', venda.cliente)}
              {linha('CPF / CNPJ', venda.cpf)}
              {linha('Telefone', venda.telefone)}
            </div>
          </div>

          {/* Financeiro */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Financeiro</p>
            <div className="bg-muted rounded-lg px-4 py-1">
              {linha('Valor da venda', venda.valorVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))}
              {linha('Custo (com despesas)', venda.valorCusto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))}
              {venda.desconto > 0 && linha('Desconto', venda.desconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))}
              {venda.motivoDesconto && linha('Motivo desconto', venda.motivoDesconto)}
              {linha('Lucro líquido', venda.lucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))}
              {linha('Forma de pagamento', formaPagamentoLabel[venda.formaPagamento] ?? venda.formaPagamento)}
              {venda.valorEntrada > 0 && linha('Entrada', venda.valorEntrada.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))}
              {venda.financiado && linha('Financiado', 'Sim')}
              {venda.valorFinanciado && linha('Valor financiado', venda.valorFinanciado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))}
              {venda.numeroParcelas && linha('Parcelas', `${venda.numeroParcelas}x de ${venda.valorParcela?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? '—'}`)}
              {venda.banco && linha('Banco/Financeira', venda.banco)}
              {venda.comissao && linha('Comissão', venda.comissao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))}
            </div>
          </div>

          {/* Vendedor */}
          {venda.vendedor && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Vendedor</p>
              <div className="bg-muted rounded-lg px-4 py-1">
                {linha('Vendedor', venda.vendedor)}
              </div>
            </div>
          )}

          {/* Trade-in */}
          {venda.tradeIn && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Trade-in</p>
              <div className="bg-muted rounded-lg px-4 py-1">
                {linha('Veículo', `${venda.tradeIn.marca} ${venda.tradeIn.modelo} ${venda.tradeIn.ano}`)}
                {linha('Placa', venda.tradeIn.placa)}
                {linha('KM', venda.tradeIn.km.toLocaleString('pt-BR') + ' km')}
                {linha('Valor avaliado', venda.tradeIn.valorAvaliado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))}
                {venda.tradeIn.observacoes && linha('Obs.', venda.tradeIn.observacoes)}
              </div>
            </div>
          )}

          {/* Documentação */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Documentação</p>
            <div className="bg-muted rounded-lg px-4 py-2 flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Status</span>
              {isVisualizador ? (
                <span className="text-sm font-medium">{statusDocLabel[statusAtual] ?? statusAtual}</span>
              ) : (
                <Select value={statusAtual} onValueChange={handleChangeStatus} disabled={salvandoStatus}>
                  <SelectTrigger className="w-[180px] h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_andamento">Em andamento</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Arquivos salvos */}
            {loadingDocs ? (
              <p className="text-xs text-muted-foreground mt-2 px-1">Carregando documentos...</p>
            ) : docs.length > 0 ? (
              <div className="mt-3 space-y-2">
                {docs.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{doc.nome}</p>
                        <p className="text-xs text-muted-foreground">{tipoDocLabel[doc.tipo] ?? doc.tipo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleVisualizarDoc(doc.conteudo)}
                        title="Visualizar"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <a href={doc.conteudo} download={doc.nome}>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" title="Baixar">
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-2 px-1">Nenhum documento anexado</p>
            )}
          </div>

          {/* Observações */}
          {venda.observacoes && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Observações</p>
              <div className="bg-muted rounded-lg px-4 py-3 text-sm">{venda.observacoes}</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Vendas() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [vendaEditando, setVendaEditando] = useState<Venda | null>(null);
  const [vendaVisualizando, setVendaVisualizando] = useState<Venda | null>(null);
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isVisualizador } = useAuth();

  const loadData = async () => {
    setLoading(true);
    const [v, ve] = await Promise.all([store.getVendasAsync(), store.getVeiculosAsync()]);
    setVendas(v);
    setVeiculos(ve);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (id: string) => { await store.deleteVenda(id); loadData(); };

  const handleVendaSaved = () => {
    loadData();
    setDialogOpen(false);
    setVendaEditando(null);
  };

  const abrirEdicao = (venda: Venda) => { setVendaEditando(venda); setDialogOpen(true); };
  const abrirNova = () => { setVendaEditando(null); setDialogOpen(true); };
  const abrirDetalhes = (venda: Venda) => { setVendaVisualizando(venda); setDetalhesOpen(true); };

  const veiculosDisponiveis = veiculos.filter(v => v.status === 'disponivel');
  const totalVendas = vendas.reduce((sum, v) => sum + v.valorVenda, 0);
  const totalLucro = vendas.reduce((sum, v) => sum + v.lucro, 0);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Carregando vendas...</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Vendas</h1><p className="text-muted-foreground">Gerencie as vendas de veículos</p></div>
        {!isVisualizador && <Button onClick={abrirNova} disabled={veiculosDisponiveis.length === 0}><Plus className="mr-2 h-4 w-4" />Nova Venda</Button>}
      </div>

      {veiculosDisponiveis.length === 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6"><p className="text-sm text-orange-900">Não há veículos disponíveis. Adicione veículos no estoque primeiro.</p></CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total de Vendas</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div><p className="text-xs text-muted-foreground">{vendas.length} vendas</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Lucro Total</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{totalLucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div><p className="text-xs text-muted-foreground">Margem: {vendas.length > 0 ? ((totalLucro / totalVendas) * 100).toFixed(1) : 0}%</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Ticket Médio</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{vendas.length > 0 ? (totalVendas / vendas.length).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}</div><p className="text-xs text-muted-foreground">Por venda</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Lista de Vendas</CardTitle></CardHeader>
        <CardContent>
          {vendas.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Lucro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendas.map((venda) => (
                    <TableRow key={venda.id}>
                      <TableCell>{new Date(venda.dataVenda + 'T12:00:00').toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="font-medium">{venda.veiculo}</TableCell>
                      <TableCell className="text-muted-foreground text-sm font-mono">{venda.placaVeiculo || '—'}</TableCell>
                      <TableCell>{venda.cliente}</TableCell>
                      <TableCell><Badge variant="outline">{formaPagamentoLabel[venda.formaPagamento] ?? venda.formaPagamento}</Badge></TableCell>
                      <TableCell>{venda.valorVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                      <TableCell className="text-green-600 font-medium">{venda.lucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => abrirDetalhes(venda)} title="Visualizar venda">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </Button>
{!isVisualizador && (
                          <Button variant="ghost" size="icon" onClick={() => abrirEdicao(venda)} title="Editar venda">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          )}
{!isVisualizador && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" title="Excluir venda">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>Tem certeza que deseja excluir a venda de <strong>{venda.veiculo}</strong>? Esta ação não pode ser desfeita.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(venda.id)}>Excluir</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Nenhuma venda registrada ainda</p>
{!isVisualizador && <Button onClick={abrirNova} disabled={veiculosDisponiveis.length === 0}><Plus className="mr-2 h-4 w-4" />Registrar Primeira Venda</Button>}
            </div>
          )}
        </CardContent>
      </Card>

      <VendaDetalhesModal
        venda={vendaVisualizando}
        open={detalhesOpen}
        onOpenChange={(v) => { if (!v) setVendaVisualizando(null); setDetalhesOpen(v); }}
        onUpdate={loadData}
      />

      <VendaDialogCompleto
        open={dialogOpen}
        onOpenChange={(v) => { if (!v) setVendaEditando(null); setDialogOpen(v); }}
        onSave={handleVendaSaved}
        veiculos={veiculosDisponiveis}
        vendaParaEditar={vendaEditando}
      />
    </div>
  );
}