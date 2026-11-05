import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Trash2, Eye, Search, X } from 'lucide-react';
import { store, Veiculo } from '../lib/store';
import { useAuth } from '../contexts/AuthContext';
import { VeiculoDialog } from '../components/VeiculoDialog';
import { VeiculoDetalhesModal } from '../components/Veiculodetalhesmodal';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';

// Formata o ano do veículo como "2025" ou "2024/25" dependendo se tem anoModelo
function formatarAno(veiculo: Veiculo): string {
  const anoFab = veiculo.ano;
  const anoMod = veiculo.anoModelo?.trim();

  if (!anoMod) return String(anoFab);

  // Se anoModelo já contém "/" (ex: "2025/26"), usa direto
  if (anoMod.includes('/')) return anoMod;

  // Se anoModelo é igual ao ano de fabricação, exibe só um
  if (anoMod === String(anoFab)) return String(anoFab);

  // Caso contrário: "2024/25" (ano fab + 2 últimos dígitos do modelo)
  const sufixo = anoMod.length === 4 ? anoMod.slice(2) : anoMod;
  return `${anoFab}/${sufixo}`;
}

export function Estoque() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<Veiculo | null>(null);
  const [loading, setLoading] = useState(true);
  const { isVisualizador } = useAuth();
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroOrigem, setFiltroOrigem] = useState('todos');
  const [filtroPagamento, setFiltroPagamento] = useState('todos');
  const [filtroCidade, setFiltroCidade] = useState('todos');

  const loadData = async () => {
    setLoading(true);
    setVeiculos(await store.getVeiculosAsync());
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (id: string) => { await store.deleteVeiculo(id); loadData(); };
  const handleVeiculoSaved = () => { loadData(); setDialogOpen(false); };
  const handleVerDetalhes = (veiculo: Veiculo) => { setVeiculoSelecionado(veiculo); setDetalhesOpen(true); };
  const limparFiltros = () => { setBusca(''); setFiltroStatus('todos'); setFiltroOrigem('todos'); setFiltroPagamento('todos'); setFiltroCidade('todos'); };

  const cidadesUnicas = Array.from(new Set(
    veiculos
      .map(v => {
        if (v.origem === 'leilao' && v.dadosLeilao?.cidadeOrigem) {
          return `${v.dadosLeilao.cidadeOrigem.toUpperCase()}/${v.dadosLeilao.estadoOrigem.toUpperCase()}`;
        }
        if (v.cidadeOrigem) {
          return `${v.cidadeOrigem.toUpperCase()}${v.estadoOrigem ? `/${v.estadoOrigem.toUpperCase()}` : ''}`;
        }
        return null;
      })
      .filter(Boolean) as string[]
  )).sort();

  const veiculosFiltrados = veiculos.filter(v => {
    const termo = busca.toLowerCase();
    const matchBusca = !busca ||
      v.marca.toLowerCase().includes(termo) ||
      v.modelo.toLowerCase().includes(termo) ||
      v.placa.toLowerCase().includes(termo) ||
      v.cor.toLowerCase().includes(termo) ||
      v.ano.toString().includes(termo) ||
      (v.cidadeOrigem?.toLowerCase().includes(termo) ?? false) ||
      (v.anoModelo?.toLowerCase().includes(termo) ?? false);
    const matchStatus = filtroStatus === 'todos' || v.status === filtroStatus;
    const matchOrigem = filtroOrigem === 'todos' || v.origem === filtroOrigem;
    const matchPagamento = filtroPagamento === 'todos' || v.statusPagamento === filtroPagamento;
    const cidadeVeiculo = v.origem === 'leilao' && v.dadosLeilao?.cidadeOrigem
      ? `${v.dadosLeilao.cidadeOrigem.toUpperCase()}/${v.dadosLeilao.estadoOrigem.toUpperCase()}`
      : v.cidadeOrigem
        ? `${v.cidadeOrigem.toUpperCase()}${v.estadoOrigem ? `/${v.estadoOrigem.toUpperCase()}` : ''}`
        : null;
    const matchCidade = filtroCidade === 'todos' || cidadeVeiculo === filtroCidade;
    return matchBusca && matchStatus && matchOrigem && matchPagamento && matchCidade;
  });

  const temFiltroAtivo = !!(busca || filtroStatus !== 'todos' || filtroOrigem !== 'todos' || filtroPagamento !== 'todos' || filtroCidade !== 'todos');

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = { disponivel: 'default', vendido: 'secondary', reservado: 'outline', em_transito: 'outline' };
    const labels: Record<string, string> = { disponivel: 'Disponível', vendido: 'Vendido', reservado: 'Reservado', em_transito: 'Em Transporte' };
    return <Badge variant={variants[status]} className={status === 'em_transito' ? 'bg-blue-100 text-blue-800' : ''}>{labels[status]}</Badge>;
  };

  const getCidadeEstado = (v: Veiculo) => {
    if (v.origem === 'leilao' && v.dadosLeilao) {
      return `${v.dadosLeilao.cidadeOrigem}/${v.dadosLeilao.estadoOrigem}`;
    }
    if (v.cidadeOrigem) {
      return `${v.cidadeOrigem}${v.estadoOrigem ? `/${v.estadoOrigem}` : ''}`;
    }
    return '—';
  };

  const veiculosDisponiveis = veiculos.filter(v => v.status === 'disponivel');
  const valorEstoque = veiculosDisponiveis.reduce((sum, v) => sum + v.preco, 0);
  const valorCusto = veiculosDisponiveis.reduce((sum, v) => sum + v.precoCompra, 0);
  const margemPotencial = valorEstoque - valorCusto;

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Carregando estoque...</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Estoque</h1>
          <p className="text-muted-foreground">Gerencie o estoque de veículos</p>
        </div>
        {!isVisualizador && <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Adicionar Veículo</Button>}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Veículos Disponíveis</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{veiculosDisponiveis.length}</div><p className="text-xs text-muted-foreground">Total de {veiculos.length} veículos</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Valor em Estoque</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{valorEstoque.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div><p className="text-xs text-muted-foreground">Preço de venda</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Margem Potencial</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{margemPotencial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div><p className="text-xs text-muted-foreground">{veiculosDisponiveis.length > 0 ? ((margemPotencial / valorEstoque) * 100).toFixed(1) : 0}% de margem</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-3 flex-wrap items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por marca, modelo, placa, cor, cidade..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9" />
            </div>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="disponivel">Disponível</SelectItem>
                <SelectItem value="vendido">Vendido</SelectItem>
                <SelectItem value="reservado">Reservado</SelectItem>
                <SelectItem value="em_transito">Em Transporte</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroOrigem} onValueChange={setFiltroOrigem}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Origem" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as origens</SelectItem>
                <SelectItem value="leilao">Leilão</SelectItem>
                <SelectItem value="particular">Particular</SelectItem>
                <SelectItem value="troca">Troca</SelectItem>
                <SelectItem value="concessionaria">Concessionária</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
            {cidadesUnicas.length > 0 && (
              <Select value={filtroCidade} onValueChange={setFiltroCidade}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Cidade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as cidades</SelectItem>
                  {cidadesUnicas.map(cidade => (
                    <SelectItem key={cidade} value={cidade}>{cidade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={filtroPagamento} onValueChange={setFiltroPagamento}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Pagamento" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os pagamentos</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="pendente">Falta pagar</SelectItem>
              </SelectContent>
            </Select>
            {temFiltroAtivo && (
              <Button variant="ghost" size="sm" onClick={limparFiltros} className="text-muted-foreground">
                <X className="h-4 w-4 mr-1" />Limpar
              </Button>
            )}
          </div>
          {temFiltroAtivo && (
            <p className="text-xs text-muted-foreground mt-2">Mostrando {veiculosFiltrados.length} de {veiculos.length} veículos</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Lista de Veículos</CardTitle></CardHeader>
        <CardContent>
          {veiculosFiltrados.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Placa</TableHead><TableHead>Veículo</TableHead><TableHead>Ano</TableHead>
                    <TableHead>Cor</TableHead><TableHead>KM</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Preço Compra</TableHead><TableHead>Preço Venda</TableHead>
                    <TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {veiculosFiltrados.map((veiculo) => (
                    <TableRow key={veiculo.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleVerDetalhes(veiculo)}>
                      <TableCell className="font-medium">{veiculo.placa}</TableCell>
                      <TableCell>{veiculo.marca} {veiculo.modelo}</TableCell>
                      {/* FIX: mostra "2024/25" em vez de só "2025" */}
                      <TableCell>{formatarAno(veiculo)}</TableCell>
                      <TableCell>{veiculo.cor}</TableCell>
                      <TableCell>{veiculo.km.toLocaleString('pt-BR')} km</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{getCidadeEstado(veiculo)}</TableCell>
                      <TableCell>{veiculo.precoCompra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                      <TableCell>{veiculo.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                      <TableCell>{getStatusBadge(veiculo.status)}</TableCell>
                      <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleVerDetalhes(veiculo)}>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </Button>
{!isVisualizador && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={veiculo.status === 'vendido'}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(veiculo.id)}>Excluir</AlertDialogAction>
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
              <p className="text-muted-foreground mb-4">{temFiltroAtivo ? 'Nenhum veículo encontrado com esses filtros' : 'Nenhum veículo no estoque'}</p>
              {temFiltroAtivo ? (
                <Button variant="outline" onClick={limparFiltros}>Limpar filtros</Button>
              ) : (
                !isVisualizador ? <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Adicionar Primeiro Veículo</Button> : null
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <VeiculoDialog open={dialogOpen} onOpenChange={setDialogOpen} onSave={handleVeiculoSaved} />
      <VeiculoDetalhesModal veiculo={veiculoSelecionado} open={detalhesOpen} onOpenChange={setDetalhesOpen} onUpdate={loadData} />
    </div>
  );
}