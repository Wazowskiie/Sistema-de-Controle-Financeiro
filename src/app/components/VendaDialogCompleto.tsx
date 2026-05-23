import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { store, Veiculo } from '../lib/store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent } from './ui/card';

interface VendaDialogCompletoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  veiculos: Veiculo[];
}

export function VendaDialogCompleto({ open, onOpenChange, onSave, veiculos }: VendaDialogCompletoProps) {
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  
  // Dados principais
  const [veiculoId, setVeiculoId] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [clienteNovo, setClienteNovo] = useState(true);
  const [nomeCliente, setNomeCliente] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [vendedorId, setVendedorId] = useState('');
  
  // Valores
  const [valorVenda, setValorVenda] = useState('');
  const [desconto, setDesconto] = useState('0');
  const [motivoDesconto, setMotivoDesconto] = useState('');
  const [valorEntrada, setValorEntrada] = useState('0');
  
  // Financiamento
  const [financiado, setFinanciado] = useState(false);
  const [valorFinanciado, setValorFinanciado] = useState('');
  const [numeroParcelas, setNumeroParcelas] = useState('');
  const [banco, setBanco] = useState('');
  
  // Trade-in
  const [temTradeIn, setTemTradeIn] = useState(false);
  const [tradeInMarca, setTradeInMarca] = useState('');
  const [tradeInModelo, setTradeInModelo] = useState('');
  const [tradeInAno, setTradeInAno] = useState('');
  const [tradeInPlaca, setTradeInPlaca] = useState('');
  const [tradeInKm, setTradeInKm] = useState('');
  const [valorTradeIn, setValorTradeIn] = useState('0');
  const [tradeInObs, setTradeInObs] = useState('');
  
  // Outros
  const [formaPagamento, setFormaPagamento] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (open) {
      setVendedores(store.getVendedores().filter(v => v.ativo));
      setClientes(store.getClientes());
    }
  }, [open]);

  useEffect(() => {
    if (clienteId) {
      const cliente = clientes.find(c => c.id === clienteId);
      if (cliente) {
        setNomeCliente(cliente.nome);
        setCpf(cliente.cpf);
        setTelefone(cliente.telefone);
        setEmail(cliente.email || '');
      }
    }
  }, [clienteId, clientes]);

  const veiculoSelecionado = veiculos.find(v => v.id === veiculoId);
  
  const calcularValorParcela = () => {
    if (valorFinanciado && numeroParcelas) {
      return (parseFloat(valorFinanciado) / parseInt(numeroParcelas)).toFixed(2);
    }
    return '0';
  };

  const calcularLucroEstimado = () => {
    if (!veiculoSelecionado || !valorVenda) return 0;
    
    let lucro = parseFloat(valorVenda) - veiculoSelecionado.precoCompra - parseFloat(desconto);
    if (temTradeIn && valorTradeIn) {
      lucro -= parseFloat(valorTradeIn);
    }
    return lucro;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!veiculoSelecionado) return;

    // Salvar ou atualizar cliente
    let finalClienteId = clienteId;
    if (clienteNovo) {
      const novoCliente = store.saveCliente({
        nome: nomeCliente,
        cpf,
        telefone,
        email,
      });
      finalClienteId = novoCliente.id;
    }

    const vendedor = vendedores.find(v => v.id === vendedorId);
    
    const dadosVenda: any = {
      veiculoId: veiculoSelecionado.id,
      veiculo: `${veiculoSelecionado.marca} ${veiculoSelecionado.modelo} ${veiculoSelecionado.ano}`,
      clienteId: finalClienteId,
      cliente: nomeCliente,
      cpf,
      telefone,
      vendedorId: vendedorId || undefined,
      vendedor: vendedor?.nome,
      valorVenda: parseFloat(valorVenda),
      valorCusto: veiculoSelecionado.precoCompra,
      desconto: parseFloat(desconto),
      motivoDesconto: motivoDesconto || undefined,
      valorEntrada: parseFloat(valorEntrada),
      financiado,
      formaPagamento: formaPagamento as any,
      dataVenda: new Date().toISOString().split('T')[0],
      statusDocumentacao: 'pendente' as const,
      documentosEntregues: [],
      observacoes: observacoes || undefined,
    };

    if (financiado) {
      dadosVenda.valorFinanciado = parseFloat(valorFinanciado);
      dadosVenda.numeroParcelas = parseInt(numeroParcelas);
      dadosVenda.valorParcela = parseFloat(calcularValorParcela());
      dadosVenda.banco = banco;
    }

    if (temTradeIn) {
      dadosVenda.tradeIn = {
        marca: tradeInMarca,
        modelo: tradeInModelo,
        ano: parseInt(tradeInAno),
        placa: tradeInPlaca,
        km: parseInt(tradeInKm),
        valorAvaliado: parseFloat(valorTradeIn),
        observacoes: tradeInObs || undefined,
      };
      dadosVenda.valorTradeIn = parseFloat(valorTradeIn);
    }

    store.saveVenda(dadosVenda);

    // Registrar interação
    store.saveInteracao({
      tipo: 'outros',
      clienteId: finalClienteId,
      vendedorId: vendedorId || undefined,
      vendedor: vendedor?.nome,
      descricao: `Venda realizada: ${veiculoSelecionado.marca} ${veiculoSelecionado.modelo}`,
      data: new Date().toISOString().split('T')[0],
    });

    limparFormulario();
    onSave();
  };

  const limparFormulario = () => {
    setVeiculoId('');
    setClienteId('');
    setClienteNovo(true);
    setNomeCliente('');
    setCpf('');
    setTelefone('');
    setEmail('');
    setVendedorId('');
    setValorVenda('');
    setDesconto('0');
    setMotivoDesconto('');
    setValorEntrada('0');
    setFinanciado(false);
    setValorFinanciado('');
    setNumeroParcelas('');
    setBanco('');
    setTemTradeIn(false);
    setTradeInMarca('');
    setTradeInModelo('');
    setTradeInAno('');
    setTradeInPlaca('');
    setTradeInKm('');
    setValorTradeIn('0');
    setTradeInObs('');
    setFormaPagamento('');
    setObservacoes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Venda Completa</DialogTitle>
          <DialogDescription>
            Registre todos os detalhes da venda incluindo financiamento, trade-in e comissões.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="basico" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basico">Básico</TabsTrigger>
              <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
              <TabsTrigger value="tradein">Trade-in</TabsTrigger>
              <TabsTrigger value="outros">Outros</TabsTrigger>
            </TabsList>

            <TabsContent value="basico" className="space-y-4">
              {/* Veículo */}
              <div className="space-y-2">
                <Label htmlFor="veiculo">Veículo*</Label>
                <Select value={veiculoId} onValueChange={setVeiculoId} required>
                  <SelectTrigger id="veiculo">
                    <SelectValue placeholder="Selecione o veículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {veiculos.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.marca} {v.modelo} {v.ano} - {v.placa}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {veiculoSelecionado && (
                  <Card>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Preço sugerido:</span>
                          <p className="font-medium">
                            {veiculoSelecionado.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Custo:</span>
                          <p className="font-medium">
                            {veiculoSelecionado.precoCompra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Cliente */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="clienteNovo"
                  checked={clienteNovo}
                  onCheckedChange={(checked) => setClienteNovo(checked as boolean)}
                />
                <Label htmlFor="clienteNovo" className="cursor-pointer">
                  Cliente novo (cadastrar)
                </Label>
              </div>

              {!clienteNovo && (
                <div className="space-y-2">
                  <Label htmlFor="clienteExistente">Cliente Existente</Label>
                  <Select value={clienteId} onValueChange={setClienteId}>
                    <SelectTrigger id="clienteExistente">
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome} - {c.cpf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome*</Label>
                  <Input
                    id="nome"
                    value={nomeCliente}
                    onChange={(e) => setNomeCliente(e.target.value)}
                    required
                    disabled={!clienteNovo && !!clienteId}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF*</Label>
                  <Input
                    id="cpf"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    required
                    disabled={!clienteNovo && !!clienteId}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone*</Label>
                  <Input
                    id="telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    required
                    disabled={!clienteNovo && !!clienteId}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!clienteNovo && !!clienteId}
                  />
                </div>
              </div>

              {/* Vendedor */}
              <div className="space-y-2">
                <Label htmlFor="vendedor">Vendedor</Label>
                <Select value={vendedorId} onValueChange={setVendedorId}>
                  <SelectTrigger id="vendedor">
                    <SelectValue placeholder="Selecione o vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendedores.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.nome} ({v.percentualComissao}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="financeiro" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valorVenda">Valor da Venda*</Label>
                  <Input
                    id="valorVenda"
                    type="number"
                    step="0.01"
                    value={valorVenda}
                    onChange={(e) => setValorVenda(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desconto">Desconto</Label>
                  <Input
                    id="desconto"
                    type="number"
                    step="0.01"
                    value={desconto}
                    onChange={(e) => setDesconto(e.target.value)}
                  />
                </div>
              </div>

              {parseFloat(desconto) > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="motivoDesconto">Motivo do Desconto</Label>
                  <Input
                    id="motivoDesconto"
                    value={motivoDesconto}
                    onChange={(e) => setMotivoDesconto(e.target.value)}
                    placeholder="Ex: Cliente fiel, promoção..."
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="valorEntrada">Valor de Entrada</Label>
                <Input
                  id="valorEntrada"
                  type="number"
                  step="0.01"
                  value={valorEntrada}
                  onChange={(e) => setValorEntrada(e.target.value)}
                />
              </div>

              {/* Financiamento */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="financiado"
                  checked={financiado}
                  onCheckedChange={(checked) => setFinanciado(checked as boolean)}
                />
                <Label htmlFor="financiado" className="cursor-pointer">
                  Venda financiada
                </Label>
              </div>

              {financiado && (
                <div className="space-y-4 border-l-2 border-blue-200 pl-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="valorFinanciado">Valor Financiado*</Label>
                      <Input
                        id="valorFinanciado"
                        type="number"
                        step="0.01"
                        value={valorFinanciado}
                        onChange={(e) => setValorFinanciado(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="parcelas">Número de Parcelas*</Label>
                      <Input
                        id="parcelas"
                        type="number"
                        value={numeroParcelas}
                        onChange={(e) => setNumeroParcelas(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="banco">Banco/Financeira</Label>
                    <Input
                      id="banco"
                      value={banco}
                      onChange={(e) => setBanco(e.target.value)}
                    />
                  </div>

                  {valorFinanciado && numeroParcelas && (
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-sm text-blue-900">
                        <strong>Valor da Parcela:</strong>{' '}
                        {parseFloat(calcularValorParcela()).toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL' 
                        })}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="formaPagamento">Forma de Pagamento*</Label>
                <Select value={formaPagamento} onValueChange={setFormaPagamento} required>
                  <SelectTrigger id="formaPagamento">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="financiamento">Financiamento</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Resumo Financeiro */}
              {valorVenda && veiculoSelecionado && (
                <Card className="bg-green-50">
                  <CardContent className="pt-4">
                    <p className="text-sm font-medium text-green-900">
                      <strong>Lucro Estimado:</strong>{' '}
                      {calcularLucroEstimado().toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      })}
                    </p>
                    {vendedorId && (
                      <p className="text-sm text-green-700 mt-1">
                        Comissão:{' '}
                        {(calcularLucroEstimado() * (vendedores.find(v => v.id === vendedorId)?.percentualComissao || 0) / 100)
                          .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="tradein" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="temTradeIn"
                  checked={temTradeIn}
                  onCheckedChange={(checked) => setTemTradeIn(checked as boolean)}
                />
                <Label htmlFor="temTradeIn" className="cursor-pointer">
                  Cliente tem veículo para troca (Trade-in)
                </Label>
              </div>

              {temTradeIn && (
                <div className="space-y-4 border-l-2 border-orange-200 pl-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tradeInMarca">Marca*</Label>
                      <Input
                        id="tradeInMarca"
                        value={tradeInMarca}
                        onChange={(e) => setTradeInMarca(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tradeInModelo">Modelo*</Label>
                      <Input
                        id="tradeInModelo"
                        value={tradeInModelo}
                        onChange={(e) => setTradeInModelo(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tradeInAno">Ano*</Label>
                      <Input
                        id="tradeInAno"
                        type="number"
                        value={tradeInAno}
                        onChange={(e) => setTradeInAno(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tradeInPlaca">Placa*</Label>
                      <Input
                        id="tradeInPlaca"
                        value={tradeInPlaca}
                        onChange={(e) => setTradeInPlaca(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tradeInKm">KM*</Label>
                      <Input
                        id="tradeInKm"
                        type="number"
                        value={tradeInKm}
                        onChange={(e) => setTradeInKm(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valorTradeIn">Valor Avaliado*</Label>
                    <Input
                      id="valorTradeIn"
                      type="number"
                      step="0.01"
                      value={valorTradeIn}
                      onChange={(e) => setValorTradeIn(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tradeInObs">Observações</Label>
                    <Textarea
                      id="tradeInObs"
                      value={tradeInObs}
                      onChange={(e) => setTradeInObs(e.target.value)}
                      rows={3}
                      placeholder="Estado do veículo, problemas identificados..."
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="outros" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações da Venda</Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={4}
                  placeholder="Informações adicionais sobre a venda..."
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Registrar Venda</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
