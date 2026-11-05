import { useState, useEffect, useRef } from 'react';
import { Truck, Plus, AlertCircle, CheckCircle2, Clock, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { store, Transporte, Veiculo } from '../lib/store';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export default function Transportes() {
  const [transportes, setTransportes] = useState<Transporte[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTransporte, setSelectedTransporte] = useState<Transporte | null>(null);
  const [filtro, setFiltro] = useState<'todos' | 'aguardando_coleta' | 'em_transito' | 'entregue'>('todos');
  const [loading, setLoading] = useState(true);
  const { isVisualizador } = useAuth();
  const atrasosVerificados = useRef(false);

  const [veiculoId, setVeiculoId] = useState('');
  const [transportadora, setTransportadora] = useState('');
  const [nomeMotorista, setNomeMotorista] = useState('');
  const [telefoneMotorista, setTelefoneMotorista] = useState('');
  const [placaCegonha, setPlacaCegonha] = useState('');
  const [cidadeDestino, setCidadeDestino] = useState('');
  const [estadoDestino, setEstadoDestino] = useState('');
  const [dataColeta, setDataColeta] = useState('');
  const [previsaoEntrega, setPrevisaoEntrega] = useState('');
  const [valorFrete, setValorFrete] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const [statusTransporte, setStatusTransporte] = useState<Transporte['status']>('aguardando_coleta');
  const [localizacaoAtual, setLocalizacaoAtual] = useState('');
  const [dataEntregaReal, setDataEntregaReal] = useState('');
  const [editTransportadora, setEditTransportadora] = useState('');
  const [editNomeMotorista, setEditNomeMotorista] = useState('');
  const [editTelefoneMotorista, setEditTelefoneMotorista] = useState('');
  const [editPlacaCegonha, setEditPlacaCegonha] = useState('');
  const [editCidadeDestino, setEditCidadeDestino] = useState('');
  const [editEstadoDestino, setEditEstadoDestino] = useState('');
  const [editDataColeta, setEditDataColeta] = useState('');
  const [editPrevisaoEntrega, setEditPrevisaoEntrega] = useState('');
  const [editValorFrete, setEditValorFrete] = useState('');
  const [editObservacoes, setEditObservacoes] = useState('');

  const carregarDados = async () => {
    setLoading(true);
    const [t, v] = await Promise.all([store.getTransportesAsync(), store.getVeiculosAsync()]);
    setTransportes(t);
    setVeiculos(v);
    setLoading(false);
  };

  useEffect(() => { carregarDados(); }, []);

  useEffect(() => {
    if (transportes.length > 0 && !atrasosVerificados.current) {
      atrasosVerificados.current = true;
      verificarAtrasos();
    }
  }, [transportes]);

  const verificarAtrasos = async () => {
    const hoje = new Date().toISOString().split('T')[0];
    const atualizacoes = transportes.filter(t =>
      (t.status === 'aguardando_coleta' || t.status === 'em_transito') && t.previsaoEntrega < hoje
    );
    await Promise.all(atualizacoes.map(t => store.updateTransporte(t.id, { status: 'em_transito_atrasado' })));
    if (atualizacoes.length > 0) carregarDados();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const veiculo = veiculos.find(v => v.id === veiculoId);
    if (!veiculo) { toast.error('Veículo não encontrado'); return; }
    await store.saveTransporte({
      veiculoId,
      veiculo: `${veiculo.marca} ${veiculo.modelo}`,
      placa: veiculo.placa,
      transportadora,
      nomeMotorista: nomeMotorista || undefined,
      telefoneMotorista: telefoneMotorista || undefined,
      placaCegonha: placaCegonha || undefined,
      cidadeOrigem: veiculo.dadosLeilao?.cidadeOrigem || veiculo.cidadeOrigem || '',
      estadoOrigem: veiculo.dadosLeilao?.estadoOrigem || veiculo.estadoOrigem || '',
      cidadeDestino,
      estadoDestino,
      dataColeta,
      previsaoEntrega,
      status: 'aguardando_coleta',
      valorFrete: parseFloat(valorFrete),
      observacoes: observacoes || undefined,
    });
    toast.success('Transporte cadastrado com sucesso!');
    limparFormulario();
    setDialogOpen(false);
    carregarDados();
  };

  const handleUpdateTransporte = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransporte) return;
    await store.updateTransporte(selectedTransporte.id, {
      status: statusTransporte,
      transportadora: editTransportadora,
      nomeMotorista: editNomeMotorista || undefined,
      telefoneMotorista: editTelefoneMotorista || undefined,
      placaCegonha: editPlacaCegonha || undefined,
      cidadeDestino: editCidadeDestino,
      estadoDestino: editEstadoDestino,
      dataColeta: editDataColeta,
      previsaoEntrega: editPrevisaoEntrega,
      valorFrete: parseFloat(editValorFrete),
      observacoes: editObservacoes || undefined,
      localizacaoAtual: localizacaoAtual || undefined,
      ultimaAtualizacao: new Date().toISOString(),
      ...(statusTransporte === 'entregue' && dataEntregaReal ? { dataEntregaReal } : {}),
    });
    toast.success('Transporte atualizado com sucesso!');
    setEditDialogOpen(false);
    setSelectedTransporte(null);
    carregarDados();
  };

  const handleDelete = async (id: string, veiculoId: string) => {
    await store.deleteTransporte(id);
    // Volta o veículo para disponível se estava em trânsito
    await store.updateVeiculo(veiculoId, { status: 'disponivel' });
    toast.success('Transporte excluído');
    carregarDados();
  };

  const limparFormulario = () => {
    setVeiculoId(''); setTransportadora(''); setNomeMotorista(''); setTelefoneMotorista('');
    setPlacaCegonha(''); setCidadeDestino(''); setEstadoDestino(''); setDataColeta('');
    setPrevisaoEntrega(''); setValorFrete(''); setObservacoes('');
  };

  const abrirEdicao = (transporte: Transporte, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedTransporte(transporte);
    setStatusTransporte(transporte.status);
    setLocalizacaoAtual(transporte.localizacaoAtual || '');
    setDataEntregaReal(transporte.dataEntregaReal || '');
    setEditTransportadora(transporte.transportadora);
    setEditNomeMotorista(transporte.nomeMotorista || '');
    setEditTelefoneMotorista(transporte.telefoneMotorista || '');
    setEditPlacaCegonha(transporte.placaCegonha || '');
    setEditCidadeDestino(transporte.cidadeDestino);
    setEditEstadoDestino(transporte.estadoDestino);
    setEditDataColeta(transporte.dataColeta);
    setEditPrevisaoEntrega(transporte.previsaoEntrega);
    setEditValorFrete(String(transporte.valorFrete));
    setEditObservacoes(transporte.observacoes || '');
    setEditDialogOpen(true);
  };

  const getStatusBadge = (status: Transporte['status']) => {
    const map = {
      aguardando_coleta: { label: 'Aguardando Coleta', className: 'bg-yellow-100 text-yellow-800' },
      em_transito: { label: 'Em Trânsito', className: 'bg-blue-100 text-blue-800' },
      em_transito_atrasado: { label: 'Em Trânsito - Atrasado', className: 'bg-orange-100 text-orange-800' },
      entregue: { label: 'Entregue', className: 'bg-green-100 text-green-800' },
      cancelado: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
    };
    const info = map[status];
    return <Badge className={info.className}>{info.label}</Badge>;
  };

  const getStatusIcon = (status: Transporte['status']) => {
    switch (status) {
      case 'aguardando_coleta': return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'em_transito': return <Truck className="h-5 w-5 text-blue-600" />;
      case 'em_transito_atrasado': return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'entregue': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'cancelado': return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const transportesFiltrados = filtro === 'todos'
    ? transportes
    : transportes.filter(t => t.status === filtro || (filtro === 'em_transito' && t.status === 'em_transito_atrasado'));

  const emTransito = transportes.filter(t => t.status === 'em_transito' || t.status === 'em_transito_atrasado').length;
  const aguardandoColeta = transportes.filter(t => t.status === 'aguardando_coleta').length;
  const entregues = transportes.filter(t => t.status === 'entregue').length;

  const veiculosDisponiveis = veiculos.filter(v =>
    (v.origem === 'leilao' || v.origem === 'netcarros') &&
    v.status !== 'em_transito' &&
    v.status !== 'vendido'
  );

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Carregando transportes...</p></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Rastreamento de Transportes</h1>
          <p className="text-muted-foreground">Acompanhe as cegonhas e veículos em trânsito</p>
        </div>
        {!isVisualizador && <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Novo Transporte</Button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Coleta</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{aguardandoColeta}</div><p className="text-xs text-muted-foreground">veículos aguardando</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Em Trânsito</CardTitle>
            <Truck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{emTransito}</div><p className="text-xs text-muted-foreground">transportes em andamento</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Entregues</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{entregues}</div><p className="text-xs text-muted-foreground">finalizados</p></CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        {(['todos', 'aguardando_coleta', 'em_transito', 'entregue'] as const).map((f) => (
          <Button key={f} variant={filtro === f ? 'default' : 'outline'} onClick={() => setFiltro(f)} size="sm">
            {f === 'todos' ? 'Todos' : f === 'aguardando_coleta' ? 'Aguardando Coleta' : f === 'em_transito' ? 'Em Trânsito' : 'Entregues'}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {transportesFiltrados.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhum transporte encontrado</div>
        ) : (
          transportesFiltrados.map((transporte) => (
            <Card key={transporte.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(transporte.status)}
                    <div>
                      <h3 className="font-semibold text-lg">{transporte.veiculo}</h3>
                      <p className="text-sm text-muted-foreground">{transporte.placa}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(transporte.status)}
{!isVisualizador && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => abrirEdicao(transporte, e)}
                      title="Editar transporte"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    )}
{!isVisualizador && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Excluir transporte"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o transporte de <strong>{transporte.veiculo}</strong>?
                            O veículo voltará para o status <strong>Disponível</strong>. Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(transporte.id, transporte.veiculoId)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Origem → Destino</p>
                    <p className="text-muted-foreground">{transporte.cidadeOrigem}/{transporte.estadoOrigem} → {transporte.cidadeDestino}/{transporte.estadoDestino}</p>
                  </div>
                  <div>
                    <p className="font-medium">Transportadora</p>
                    <p className="text-muted-foreground">{transporte.transportadora}</p>
                    {transporte.placaCegonha && <p className="text-muted-foreground">Cegonha: {transporte.placaCegonha}</p>}
                  </div>
                  {transporte.nomeMotorista && (
                    <div>
                      <p className="font-medium">Motorista: {transporte.nomeMotorista}</p>
                      <p className="text-muted-foreground">{transporte.telefoneMotorista}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Coleta: <strong>{new Date(transporte.dataColeta + 'T12:00:00').toLocaleDateString('pt-BR')}</strong></p>
                    <p className="text-muted-foreground">Previsão: <strong>{new Date(transporte.previsaoEntrega + 'T12:00:00').toLocaleDateString('pt-BR')}</strong></p>
                  </div>
                </div>
                {transporte.localizacaoAtual && (
                  <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                    <p className="font-medium">Localização Atual</p>
                    <p className="text-muted-foreground">{transporte.localizacaoAtual}</p>
                    {transporte.ultimaAtualizacao && <p className="text-xs text-muted-foreground">Atualizado em {new Date(transporte.ultimaAtualizacao).toLocaleString('pt-BR')}</p>}
                  </div>
                )}
                {transporte.dataEntregaReal && (
                  <div className="mt-3 p-2 bg-green-50 rounded text-sm">
                    <p className="font-medium">Entregue em</p>
                    <p className="text-green-700">{new Date(transporte.dataEntregaReal + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                  </div>
                )}
                <div className="mt-3 flex justify-between items-center">
                  <span className="font-medium">Valor do Frete</span>
                  <span className="font-bold">{transporte.valorFrete.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog: Novo Transporte */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Transporte</DialogTitle><DialogDescription>Cadastre um novo transporte de veículo</DialogDescription></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Veículo*</Label>
              <Select value={veiculoId} onValueChange={setVeiculoId} required>
                <SelectTrigger><SelectValue placeholder="Selecione o veículo" /></SelectTrigger>
                <SelectContent>
                  {veiculosDisponiveis.length === 0
                    ? <SelectItem value="_none" disabled>Nenhum veículo de leilão ou Netcarros disponível</SelectItem>
                    : veiculosDisponiveis.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.marca} {v.modelo} - {v.placa} ({v.dadosLeilao?.cidadeOrigem || v.cidadeOrigem || ''}/{v.dadosLeilao?.estadoOrigem || v.estadoOrigem || ''})
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Transportadora*</Label><Input value={transportadora} onChange={e => setTransportadora(e.target.value)} placeholder="Ex: TransCar Logística" required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nome do Motorista</Label><Input value={nomeMotorista} onChange={e => setNomeMotorista(e.target.value)} placeholder="Nome completo" /></div>
              <div className="space-y-2"><Label>Telefone do Motorista</Label><Input value={telefoneMotorista} onChange={e => setTelefoneMotorista(e.target.value)} placeholder="(11) 99999-9999" /></div>
            </div>
            <div className="space-y-2"><Label>Placa da Cegonha</Label><Input value={placaCegonha} onChange={e => setPlacaCegonha(e.target.value.toUpperCase())} placeholder="ABC-1234" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Cidade de Destino*</Label><Input value={cidadeDestino} onChange={e => setCidadeDestino(e.target.value)} placeholder="Ex: Fortaleza" required /></div>
              <div className="space-y-2"><Label>Estado*</Label><Input value={estadoDestino} onChange={e => setEstadoDestino(e.target.value.toUpperCase())} placeholder="CE" maxLength={2} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Data de Coleta*</Label><Input type="date" value={dataColeta} onChange={e => setDataColeta(e.target.value)} required /></div>
              <div className="space-y-2"><Label>Previsão de Entrega*</Label><Input type="date" value={previsaoEntrega} onChange={e => setPrevisaoEntrega(e.target.value)} required /></div>
            </div>
            <div className="space-y-2"><Label>Valor do Frete*</Label><Input type="number" value={valorFrete} onChange={e => setValorFrete(e.target.value)} placeholder="0.00" step="0.01" min="0" required /></div>
            <div className="space-y-2"><Label>Observações</Label><Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Informações adicionais" rows={3} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); limparFormulario(); }}>Cancelar</Button>
              <Button type="submit">Cadastrar Transporte</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Transporte */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Transporte</DialogTitle><DialogDescription>Atualize os dados do transporte</DialogDescription></DialogHeader>
          {selectedTransporte && (
            <form onSubmit={handleUpdateTransporte} className="space-y-4">
              <div className="bg-muted p-3 rounded">
                <p className="font-medium">{selectedTransporte.veiculo}</p>
                <p className="text-sm text-muted-foreground">{selectedTransporte.placa}</p>
              </div>
              <div className="space-y-2">
                <Label>Status*</Label>
                <Select value={statusTransporte} onValueChange={(v: any) => setStatusTransporte(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aguardando_coleta">Aguardando Coleta</SelectItem>
                    <SelectItem value="em_transito">Em Trânsito</SelectItem>
                    <SelectItem value="em_transito_atrasado">Em Trânsito - Atrasado</SelectItem>
                    <SelectItem value="entregue">Entregue</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Transportadora*</Label><Input value={editTransportadora} onChange={e => setEditTransportadora(e.target.value)} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nome do Motorista</Label><Input value={editNomeMotorista} onChange={e => setEditNomeMotorista(e.target.value)} /></div>
                <div className="space-y-2"><Label>Telefone do Motorista</Label><Input value={editTelefoneMotorista} onChange={e => setEditTelefoneMotorista(e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>Placa da Cegonha</Label><Input value={editPlacaCegonha} onChange={e => setEditPlacaCegonha(e.target.value.toUpperCase())} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Cidade de Destino*</Label><Input value={editCidadeDestino} onChange={e => setEditCidadeDestino(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Estado*</Label><Input value={editEstadoDestino} onChange={e => setEditEstadoDestino(e.target.value.toUpperCase())} maxLength={2} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Data de Coleta*</Label><Input type="date" value={editDataColeta} onChange={e => setEditDataColeta(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Previsão de Entrega*</Label><Input type="date" value={editPrevisaoEntrega} onChange={e => setEditPrevisaoEntrega(e.target.value)} required /></div>
              </div>
              <div className="space-y-2"><Label>Valor do Frete*</Label><Input type="number" value={editValorFrete} onChange={e => setEditValorFrete(e.target.value)} step="0.01" min="0" required /></div>
              <div className="space-y-2"><Label>Localização Atual</Label><Input value={localizacaoAtual} onChange={e => setLocalizacaoAtual(e.target.value)} placeholder="Ex: BR-116, KM 250" /></div>
              {statusTransporte === 'entregue' && (
                <div className="space-y-2"><Label>Data de Entrega Real*</Label><Input type="date" value={dataEntregaReal} onChange={e => setDataEntregaReal(e.target.value)} required /></div>
              )}
              <div className="space-y-2"><Label>Observações</Label><Textarea value={editObservacoes} onChange={e => setEditObservacoes(e.target.value)} rows={3} /></div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setEditDialogOpen(false); setSelectedTransporte(null); }}>Cancelar</Button>
                <Button type="submit">Salvar alterações</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}