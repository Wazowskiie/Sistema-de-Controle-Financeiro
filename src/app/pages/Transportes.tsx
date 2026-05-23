import { useState, useEffect } from 'react';
import { Truck, Plus, MapPin, Package, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { store, Transporte, Veiculo } from '../lib/store';
import { toast } from 'sonner';

export default function Transportes() {
  const [transportes, setTransportes] = useState<Transporte[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTransporte, setSelectedTransporte] = useState<Transporte | null>(null);
  const [filtro, setFiltro] = useState<'todos' | 'aguardando_coleta' | 'em_transito' | 'entregue'>('todos');

  // Campos do formulário
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

  // Campos de atualização
  const [localizacaoAtual, setLocalizacaoAtual] = useState('');
  const [statusTransporte, setStatusTransporte] = useState<'aguardando_coleta' | 'em_transito' | 'em_transito_atrasado' | 'entregue' | 'cancelado'>('aguardando_coleta');
  const [dataEntregaReal, setDataEntregaReal] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = () => {
    setTransportes(store.getTransportes());
    setVeiculos(store.getVeiculos());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const veiculo = veiculos.find(v => v.id === veiculoId);
    if (!veiculo) {
      toast.error('Veículo não encontrado');
      return;
    }

    // Obter cidade e estado de origem dos dados do leilão se disponível
    const cidadeOrigem = veiculo.dadosLeilao?.cidadeOrigem || '';
    const estadoOrigem = veiculo.dadosLeilao?.estadoOrigem || '';

    store.saveTransporte({
      veiculoId,
      veiculo: `${veiculo.marca} ${veiculo.modelo}`,
      placa: veiculo.placa,
      transportadora,
      nomeMotorista: nomeMotorista || undefined,
      telefoneMotorista: telefoneMotorista || undefined,
      placaCegonha: placaCegonha || undefined,
      cidadeOrigem,
      estadoOrigem,
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

  const handleUpdateTransporte = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransporte) return;

    const updates: Partial<Transporte> = {
      status: statusTransporte,
      localizacaoAtual: localizacaoAtual || undefined,
      ultimaAtualizacao: new Date().toISOString(),
    };

    if (statusTransporte === 'entregue' && dataEntregaReal) {
      updates.dataEntregaReal = dataEntregaReal;
    }

    store.updateTransporte(selectedTransporte.id, updates);
    toast.success('Transporte atualizado com sucesso!');
    setEditDialogOpen(false);
    setSelectedTransporte(null);
    carregarDados();
  };

  const limparFormulario = () => {
    setVeiculoId('');
    setTransportadora('');
    setNomeMotorista('');
    setTelefoneMotorista('');
    setPlacaCegonha('');
    setCidadeDestino('');
    setEstadoDestino('');
    setDataColeta('');
    setPrevisaoEntrega('');
    setValorFrete('');
    setObservacoes('');
  };

  const abrirEdicao = (transporte: Transporte) => {
    setSelectedTransporte(transporte);
    setStatusTransporte(transporte.status);
    setLocalizacaoAtual(transporte.localizacaoAtual || '');
    setDataEntregaReal(transporte.dataEntregaReal || '');
    setEditDialogOpen(true);
  };

  const getStatusBadge = (status: Transporte['status']) => {
    const statusMap = {
      aguardando_coleta: { label: 'Aguardando Coleta', className: 'bg-yellow-100 text-yellow-800' },
      em_transito: { label: 'Em Trânsito', className: 'bg-blue-100 text-blue-800' },
      em_transito_atrasado: { label: 'Em Trânsito - Atrasado', className: 'bg-orange-100 text-orange-800' },
      entregue: { label: 'Entregue', className: 'bg-green-100 text-green-800' },
      cancelado: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
    };
    const info = statusMap[status];
    return <Badge className={info.className}>{info.label}</Badge>;
  };

  const getStatusIcon = (status: Transporte['status']) => {
    switch (status) {
      case 'aguardando_coleta':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'em_transito':
        return <Truck className="h-5 w-5 text-blue-600" />;
      case 'em_transito_atrasado':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'entregue':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'cancelado':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const verificarAtrasos = () => {
    const hoje = new Date().toISOString().split('T')[0];
    transportes.forEach(t => {
      if ((t.status === 'aguardando_coleta' || t.status === 'em_transito') && t.previsaoEntrega < hoje) {
        store.updateTransporte(t.id, { status: 'em_transito_atrasado' });
      }
    });
    carregarDados();
  };

  useEffect(() => {
    verificarAtrasos();
  }, [transportes.length]);

  const transportesFiltrados = filtro === 'todos'
    ? transportes
    : transportes.filter(t => t.status === filtro || (filtro === 'em_transito' && t.status === 'em_transito_atrasado'));

  const emTransito = transportes.filter(t => t.status === 'em_transito' || t.status === 'em_transito_atrasado').length;
  const aguardandoColeta = transportes.filter(t => t.status === 'aguardando_coleta').length;
  const entregues = transportes.filter(t => t.status === 'entregue').length;

  // Filtrar veículos disponíveis para transporte (origem leilão e não em transporte)
  const veiculosDisponiveis = veiculos.filter(v =>
    v.origem === 'leilao' && v.status !== 'em_transito' && v.status !== 'vendido' && !v.transporteId
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Rastreamento de Transportes</h1>
          <p className="text-muted-foreground">Acompanhe as cegonhas e veículos em trânsito</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Transporte
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Coleta</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aguardandoColeta}</div>
            <p className="text-xs text-muted-foreground">veículos aguardando</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Em Trânsito</CardTitle>
            <Truck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emTransito}</div>
            <p className="text-xs text-muted-foreground">transportes em andamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Entregues</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entregues}</div>
            <p className="text-xs text-muted-foreground">finalizados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <Button variant={filtro === 'todos' ? 'default' : 'outline'} onClick={() => setFiltro('todos')}>
          Todos
        </Button>
        <Button variant={filtro === 'aguardando_coleta' ? 'default' : 'outline'} onClick={() => setFiltro('aguardando_coleta')}>
          Aguardando Coleta
        </Button>
        <Button variant={filtro === 'em_transito' ? 'default' : 'outline'} onClick={() => setFiltro('em_transito')}>
          Em Trânsito
        </Button>
        <Button variant={filtro === 'entregue' ? 'default' : 'outline'} onClick={() => setFiltro('entregue')}>
          Entregues
        </Button>
      </div>

      {/* Lista de Transportes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {transportesFiltrados.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum transporte encontrado</p>
            </CardContent>
          </Card>
        ) : (
          transportesFiltrados.map(transporte => (
            <Card key={transporte.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(transporte.status)}
                    <div>
                      <CardTitle className="text-lg">{transporte.veiculo}</CardTitle>
                      <CardDescription className="text-sm">{transporte.placa}</CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(transporte.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Origem → Destino</p>
                      <p className="text-muted-foreground">
                        {transporte.cidadeOrigem}/{transporte.estadoOrigem} → {transporte.cidadeDestino}/{transporte.estadoDestino}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Transportadora</p>
                      <p className="text-muted-foreground">{transporte.transportadora}</p>
                      {transporte.placaCegonha && (
                        <p className="text-xs text-muted-foreground">Cegonha: {transporte.placaCegonha}</p>
                      )}
                    </div>
                  </div>

                  {transporte.nomeMotorista && (
                    <div className="text-xs">
                      <p className="font-medium">Motorista: {transporte.nomeMotorista}</p>
                      {transporte.telefoneMotorista && (
                        <p className="text-muted-foreground">{transporte.telefoneMotorista}</p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Coleta</p>
                      <p className="font-medium">{new Date(transporte.dataColeta).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Previsão</p>
                      <p className="font-medium">{new Date(transporte.previsaoEntrega).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>

                  {transporte.localizacaoAtual && (
                    <div className="bg-blue-50 p-2 rounded text-xs">
                      <p className="font-medium">Localização Atual</p>
                      <p className="text-muted-foreground">{transporte.localizacaoAtual}</p>
                      {transporte.ultimaAtualizacao && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Atualizado em {new Date(transporte.ultimaAtualizacao).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  )}

                  {transporte.dataEntregaReal && (
                    <div className="bg-green-50 p-2 rounded text-xs">
                      <p className="font-medium">Entregue em</p>
                      <p className="text-muted-foreground">{new Date(transporte.dataEntregaReal).toLocaleDateString('pt-BR')}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t">
                    <p className="font-medium">Valor do Frete</p>
                    <p className="font-bold text-lg">{transporte.valorFrete.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </div>
                </div>

                {transporte.status !== 'entregue' && transporte.status !== 'cancelado' && (
                  <Button className="w-full" variant="outline" onClick={() => abrirEdicao(transporte)}>
                    Atualizar Status
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de Novo Transporte */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Transporte</DialogTitle>
            <DialogDescription>
              Registre um novo transporte de veículo via cegonha
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="veiculoId">Veículo*</Label>
              <Select value={veiculoId} onValueChange={setVeiculoId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o veículo" />
                </SelectTrigger>
                <SelectContent>
                  {veiculosDisponiveis.length === 0 ? (
                    <SelectItem value="none" disabled>Nenhum veículo de leilão disponível</SelectItem>
                  ) : (
                    veiculosDisponiveis.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.marca} {v.modelo} - {v.placa} ({v.dadosLeilao?.cidadeOrigem}/{v.dadosLeilao?.estadoOrigem})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transportadora">Transportadora*</Label>
              <Input
                id="transportadora"
                value={transportadora}
                onChange={(e) => setTransportadora(e.target.value)}
                placeholder="Ex: TransCar Logística"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nomeMotorista">Nome do Motorista</Label>
                <Input
                  id="nomeMotorista"
                  value={nomeMotorista}
                  onChange={(e) => setNomeMotorista(e.target.value)}
                  placeholder="Nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefoneMotorista">Telefone do Motorista</Label>
                <Input
                  id="telefoneMotorista"
                  value={telefoneMotorista}
                  onChange={(e) => setTelefoneMotorista(e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="placaCegonha">Placa da Cegonha</Label>
              <Input
                id="placaCegonha"
                value={placaCegonha}
                onChange={(e) => setPlacaCegonha(e.target.value.toUpperCase())}
                placeholder="ABC-1234"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cidadeDestino">Cidade de Destino*</Label>
                <Input
                  id="cidadeDestino"
                  value={cidadeDestino}
                  onChange={(e) => setCidadeDestino(e.target.value)}
                  placeholder="Ex: Curitiba"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estadoDestino">Estado de Destino*</Label>
                <Input
                  id="estadoDestino"
                  value={estadoDestino}
                  onChange={(e) => setEstadoDestino(e.target.value.toUpperCase())}
                  placeholder="Ex: PR"
                  maxLength={2}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataColeta">Data de Coleta*</Label>
                <Input
                  id="dataColeta"
                  type="date"
                  value={dataColeta}
                  onChange={(e) => setDataColeta(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="previsaoEntrega">Previsão de Entrega*</Label>
                <Input
                  id="previsaoEntrega"
                  type="date"
                  value={previsaoEntrega}
                  onChange={(e) => setPrevisaoEntrega(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorFrete">Valor do Frete*</Label>
              <Input
                id="valorFrete"
                type="number"
                value={valorFrete}
                onChange={(e) => setValorFrete(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Informações adicionais sobre o transporte"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setDialogOpen(false);
                limparFormulario();
              }}>
                Cancelar
              </Button>
              <Button type="submit">Cadastrar Transporte</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Atualizar Transporte */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Atualizar Transporte</DialogTitle>
            <DialogDescription>
              Atualize o status e localização do transporte
            </DialogDescription>
          </DialogHeader>
          {selectedTransporte && (
            <form onSubmit={handleUpdateTransporte} className="space-y-4">
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-medium">{selectedTransporte.veiculo}</p>
                <p className="text-sm text-muted-foreground">{selectedTransporte.placa}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="statusTransporte">Status*</Label>
                <Select value={statusTransporte} onValueChange={(value: any) => setStatusTransporte(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aguardando_coleta">Aguardando Coleta</SelectItem>
                    <SelectItem value="em_transito">Em Trânsito</SelectItem>
                    <SelectItem value="em_transito_atrasado">Em Trânsito - Atrasado</SelectItem>
                    <SelectItem value="entregue">Entregue</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="localizacaoAtual">Localização Atual</Label>
                <Input
                  id="localizacaoAtual"
                  value={localizacaoAtual}
                  onChange={(e) => setLocalizacaoAtual(e.target.value)}
                  placeholder="Ex: BR-116, KM 250 - Registro/SP"
                />
              </div>

              {statusTransporte === 'entregue' && (
                <div className="space-y-2">
                  <Label htmlFor="dataEntregaReal">Data de Entrega Real*</Label>
                  <Input
                    id="dataEntregaReal"
                    type="date"
                    value={dataEntregaReal}
                    onChange={(e) => setDataEntregaReal(e.target.value)}
                    required
                  />
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setEditDialogOpen(false);
                  setSelectedTransporte(null);
                }}>
                  Cancelar
                </Button>
                <Button type="submit">Atualizar</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
