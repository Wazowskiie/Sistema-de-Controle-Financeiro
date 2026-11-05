import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { store, Veiculo, Venda } from '../lib/store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent } from './ui/card';
import { Upload, Trash2, Eye, Download, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DocVenda {
  id: string;
  nome: string;
  tipo: 'identidade' | 'cnh' | 'comprovante_endereco' | 'comprovante_renda' | 'contrato' | 'cartao_cnpj' | 'contrato_social' | 'comprovante_pagamento' | 'outros';
  conteudo: string;
  dataUpload: string;
}

const tipoDocLabel: Record<DocVenda['tipo'], string> = {
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

interface VendaDialogCompletoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  veiculos: Veiculo[];
  vendaParaEditar?: Venda | null;
}

export function VendaDialogCompleto({ open, onOpenChange, onSave, veiculos, vendaParaEditar }: VendaDialogCompletoProps) {
  const modoEdicao = !!vendaParaEditar;

  const [vendedores, setVendedores] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [docs, setDocs] = useState<DocVenda[]>([]);
  const [tipoDocSelecionado, setTipoDocSelecionado] = useState<DocVenda['tipo']>('identidade');

  // Total de lançamentos/despesas extras do veículo (preparação, manutenção, frete, etc.)
  const [totalLancamentosVeiculo, setTotalLancamentosVeiculo] = useState(0);

  const [tipoPessoa, setTipoPessoa] = useState<'fisica' | 'juridica'>('fisica');
  const [veiculoId, setVeiculoId] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [clienteNovo, setClienteNovo] = useState(true);

  const [nomeCliente, setNomeCliente] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');

  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [telefonePJ, setTelefonePJ] = useState('');
  const [emailPJ, setEmailPJ] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cep, setCep] = useState('');

  const [vendedorId, setVendedorId] = useState('');
  const [valorVenda, setValorVenda] = useState('');
  const [desconto, setDesconto] = useState('0');
  const [motivoDesconto, setMotivoDesconto] = useState('');
  const [valorEntrada, setValorEntrada] = useState('0');
  const [financiado, setFinanciado] = useState(false);
  const [valorFinanciado, setValorFinanciado] = useState('');
  const [numeroParcelas, setNumeroParcelas] = useState('');
  const [banco, setBanco] = useState('');
  const [temTradeIn, setTemTradeIn] = useState(false);
  const [tradeInMarca, setTradeInMarca] = useState('');
  const [tradeInModelo, setTradeInModelo] = useState('');
  const [tradeInAno, setTradeInAno] = useState('');
  const [tradeInPlaca, setTradeInPlaca] = useState('');
  const [tradeInKm, setTradeInKm] = useState('');
  const [valorTradeIn, setValorTradeIn] = useState('0');
  const [tradeInObs, setTradeInObs] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [dataVenda, setDataVenda] = useState('');

  useEffect(() => {
    if (open) {
      Promise.all([store.getVendedoresAsync(), store.getClientesAsync()]).then(([v, c]) => {
        setVendedores(v.filter(v => v.ativo));
        setClientes(c);
      });

      if (vendaParaEditar) {
        setVeiculoId(vendaParaEditar.veiculoId);
        setClienteId(vendaParaEditar.clienteId);
        setClienteNovo(false);
        setNomeCliente(vendaParaEditar.cliente);
        setCpf(vendaParaEditar.cpf);
        setTelefone(vendaParaEditar.telefone);
        setVendedorId(vendaParaEditar.vendedorId || '');
        setValorVenda(String(vendaParaEditar.valorVenda));
        setDesconto(String(vendaParaEditar.desconto || 0));
        setMotivoDesconto(vendaParaEditar.motivoDesconto || '');
        setValorEntrada(String(vendaParaEditar.valorEntrada || 0));
        setFinanciado(vendaParaEditar.financiado);
        setValorFinanciado(String(vendaParaEditar.valorFinanciado || ''));
        setNumeroParcelas(String(vendaParaEditar.numeroParcelas || ''));
        setBanco(vendaParaEditar.banco || '');
        setFormaPagamento(vendaParaEditar.formaPagamento);
        setObservacoes(vendaParaEditar.observacoes || '');
        setDataVenda(vendaParaEditar.dataVenda);
        setBuscaCliente(vendaParaEditar.cliente);

        // Carrega docs já salvos na venda
        supabase.from('vendas').select('documentos').eq('id', vendaParaEditar.id).single().then(({ data }) => {
          if (data?.documentos && Array.isArray(data.documentos)) {
            setDocs(data.documentos as DocVenda[]);
          }
        });

        // Busca lançamentos extras do veículo desta venda (para exibir o custo real)
        if (vendaParaEditar.veiculoId) {
          supabase.from('veiculo_extras').select('dados').eq('veiculo_id', vendaParaEditar.veiculoId).eq('tipo', 'lancamento').then(({ data }) => {
            const total = (data ?? []).reduce((sum: number, row: any) => sum + (row.dados?.valor ?? 0), 0);
            setTotalLancamentosVeiculo(total);
          });
        }

        if (vendaParaEditar.tradeIn) {
          setTemTradeIn(true);
          setTradeInMarca(vendaParaEditar.tradeIn.marca);
          setTradeInModelo(vendaParaEditar.tradeIn.modelo);
          setTradeInAno(String(vendaParaEditar.tradeIn.ano));
          setTradeInPlaca(vendaParaEditar.tradeIn.placa);
          setTradeInKm(String(vendaParaEditar.tradeIn.km));
          setValorTradeIn(String(vendaParaEditar.tradeIn.valorAvaliado));
          setTradeInObs(vendaParaEditar.tradeIn.observacoes || '');
        }
      } else {
        const d = new Date();
        setDataVenda(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
      }
    }
  }, [open, vendaParaEditar]);

  useEffect(() => {
    if (clienteId && !modoEdicao) {
      const cliente = clientes.find(c => c.id === clienteId);
      if (cliente) {
        setNomeCliente(cliente.nome);
        setCpf(cliente.cpf);
        setTelefone(cliente.telefone);
        setEmail(cliente.email || '');
      }
    }
  }, [clienteId, clientes]);

  // Busca o total de lançamentos/despesas extras sempre que o veículo selecionado mudar (modo cadastro)
  useEffect(() => {
    if (!veiculoId || modoEdicao) return;
    supabase.from('veiculo_extras').select('dados').eq('veiculo_id', veiculoId).eq('tipo', 'lancamento').then(({ data }) => {
      const total = (data ?? []).reduce((sum: number, row: any) => sum + (row.dados?.valor ?? 0), 0);
      setTotalLancamentosVeiculo(total);
    });
  }, [veiculoId, modoEdicao]);

  const veiculoSelecionado = veiculos.find(v => v.id === veiculoId)
    ?? (modoEdicao ? { marca: vendaParaEditar?.veiculo ?? '', modelo: '', precoCompra: vendaParaEditar?.valorCusto ?? 0, preco: vendaParaEditar?.valorVenda ?? 0 } as any : undefined);

  // Custo real = preço de compra do veículo + despesas/lançamentos lançados no estoque (preparação, manutenção, frete, etc.)
  const custoRealVeiculo = () => {
    const precoCompraBase = veiculoSelecionado?.precoCompra ?? vendaParaEditar?.valorCusto ?? 0;
    // No modo edição, valorCusto já salvo pode já incluir os lançamentos de uma edição anterior.
    // Para sempre refletir o estado atual do estoque, somamos preço de compra do veículo + lançamentos atuais.
    if (modoEdicao && !veiculos.find(v => v.id === veiculoId)) {
      // Veículo pode já estar vendido e não aparecer na lista de disponíveis — usamos valorCusto base salvo na venda
      // mas ainda assim garantimos que lançamentos atuais sejam refletidos.
      return precoCompraBase;
    }
    return precoCompraBase + totalLancamentosVeiculo;
  };

  const calcularValorParcela = () => valorFinanciado && numeroParcelas ? (parseFloat(valorFinanciado) / parseInt(numeroParcelas)).toFixed(2) : '0';

  const calcularLucroEstimado = () => {
    if (!valorVenda) return 0;
    const custo = custoRealVeiculo();
    let lucro = parseFloat(valorVenda) - custo - parseFloat(desconto || '0');
    if (temTradeIn && valorTradeIn) lucro -= parseFloat(valorTradeIn);
    return lucro;
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setDocs(prev => [...prev, {
        id: `${Date.now()}`,
        nome: file.name,
        tipo: tipoDocSelecionado,
        conteudo: reader.result as string,
        dataUpload: new Date().toISOString().split('T')[0],
      }]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleVisualizarDoc = (conteudo: string) => {
    const byteString = atob(conteudo.split(',')[1]);
    const mimeType = conteudo.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    window.open(URL.createObjectURL(new Blob([ab], { type: mimeType })), '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);

    const nomeParaSalvar = tipoPessoa === 'juridica' ? (nomeFantasia || razaoSocial) : nomeCliente;
    const cpfParaSalvar = tipoPessoa === 'juridica' ? cnpj : cpf;
    const telefoneParaSalvar = tipoPessoa === 'juridica' ? telefonePJ : telefone;
    const emailParaSalvar = tipoPessoa === 'juridica' ? emailPJ : email;

    const vendedor = vendedores.find(v => v.id === vendedorId);
    const custoFinal = custoRealVeiculo();
    const lucro = calcularLucroEstimado();
    const comissao = vendedor ? lucro * vendedor.percentualComissao / 100 : 0;

    // Docs sem o campo conteudo para não estourar o campo (guardamos tudo incluindo conteudo)
    const docsParaSalvar = docs.map(d => ({ ...d }));

    if (modoEdicao && vendaParaEditar) {
      await supabase.from('vendas').update({
        preco_venda: parseFloat(valorVenda),
        preco_custo: custoFinal,
        comissao_valor: comissao || null,
        tipo_pagamento: financiado ? 'financiado' : 'avista',
        entrada: parseFloat(valorEntrada || '0'),
        num_parcelas: numeroParcelas ? parseInt(numeroParcelas) : 0,
        valor_parcela: numeroParcelas && valorFinanciado ? parseFloat(calcularValorParcela()) : 0,
        banco_financeira: banco || null,
        vendedor_id: vendedorId || null,
        observacoes: observacoes || null,
        data_venda: dataVenda,
        status_doc: docs.length > 0 ? 'em_andamento' : 'pendente',
        documentos: docsParaSalvar,
      }).eq('id', vendaParaEditar.id);

    } else {
      let finalClienteId = clienteId;
      if (clienteNovo) {
        const novoCliente = await store.saveCliente({
          nome: nomeParaSalvar,
          cpf: cpfParaSalvar,
          telefone: telefoneParaSalvar,
          email: emailParaSalvar,
        });
        finalClienteId = novoCliente.id;
      }

      const dadosVenda: any = {
        veiculoId: veiculoId,
        veiculo: veiculoSelecionado ? `${veiculoSelecionado.marca} ${veiculoSelecionado.modelo} ${veiculoSelecionado.ano}` : '',
        clienteId: finalClienteId,
        cliente: nomeParaSalvar,
        cpf: cpfParaSalvar,
        telefone: telefoneParaSalvar,
        vendedorId: vendedorId || undefined,
        vendedor: vendedor?.nome,
        valorVenda: parseFloat(valorVenda),
        valorCusto: custoFinal,
        desconto: parseFloat(desconto || '0'),
        motivoDesconto: motivoDesconto || undefined,
        valorEntrada: parseFloat(valorEntrada || '0'),
        financiado,
        formaPagamento: formaPagamento as any,
        dataVenda,
        statusDocumentacao: docs.length > 0 ? 'em_andamento' as const : 'pendente' as const,
        documentosEntregues: docs.map(d => d.tipo),
        observacoes: observacoes || undefined,
        lucro,
        comissao: comissao || undefined,
      };

      if (financiado) {
        dadosVenda.valorFinanciado = parseFloat(valorFinanciado);
        dadosVenda.numeroParcelas = parseInt(numeroParcelas);
        dadosVenda.valorParcela = parseFloat(calcularValorParcela());
        dadosVenda.banco = banco;
      }

      if (temTradeIn) {
        dadosVenda.tradeIn = {
          marca: tradeInMarca, modelo: tradeInModelo, ano: parseInt(tradeInAno),
          placa: tradeInPlaca, km: parseInt(tradeInKm),
          valorAvaliado: parseFloat(valorTradeIn), observacoes: tradeInObs || undefined,
        };
        dadosVenda.valorTradeIn = parseFloat(valorTradeIn);
      }

      await store.saveVenda(dadosVenda);

      // Salva documentos diretamente na venda recém-criada
      if (docsParaSalvar.length > 0) {
        const { data: vendaCriada } = await supabase
          .from('vendas')
          .select('id')
          .eq('veiculo_id', veiculoId)
          .eq('cliente_id', finalClienteId)
          .order('criado_em', { ascending: false })
          .limit(1)
          .single();

        if (vendaCriada) {
          await supabase.from('vendas').update({ documentos: docsParaSalvar }).eq('id', vendaCriada.id);
        }
      }

      // Salva interação (ignora erro se tabela com problema)
      try {
        await store.saveInteracao({
          tipo: 'outros',
          clienteId: finalClienteId,
          vendedorId: vendedorId || undefined,
          vendedor: vendedor?.nome,
          descricao: `Venda realizada: ${veiculoSelecionado?.marca} ${veiculoSelecionado?.modelo}`,
          data: dataVenda,
        });
      } catch (_) {}
    }

    limparFormulario();
    setSalvando(false);
    onSave();
  };

  const limparFormulario = () => {
    setVeiculoId(''); setClienteId(''); setClienteNovo(true); setTipoPessoa('fisica');
    setNomeCliente(''); setCpf(''); setTelefone(''); setEmail('');
    setRazaoSocial(''); setNomeFantasia(''); setCnpj(''); setTelefonePJ(''); setEmailPJ('');
    setEndereco(''); setCidade(''); setEstado(''); setCep('');
    setVendedorId(''); setValorVenda(''); setDesconto('0'); setMotivoDesconto('');
    setValorEntrada('0'); setFinanciado(false); setValorFinanciado(''); setNumeroParcelas('');
    setBanco(''); setTemTradeIn(false); setTradeInMarca(''); setTradeInModelo('');
    setTradeInAno(''); setTradeInPlaca(''); setTradeInKm(''); setValorTradeIn('0');
    setTradeInObs(''); setFormaPagamento(''); setObservacoes(''); setDocs([]);
    setBuscaCliente(''); setTotalLancamentosVeiculo(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{modoEdicao ? 'Editar Venda' : 'Nova Venda Completa'}</DialogTitle>
          <DialogDescription>{modoEdicao ? 'Atualize os dados da venda.' : 'Registre todos os detalhes da venda incluindo financiamento, trade-in e comissões.'}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="basico" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basico">Básico</TabsTrigger>
              <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
              <TabsTrigger value="tradein">Trade-in</TabsTrigger>
              <TabsTrigger value="documentos">
                Documentos {docs.length > 0 && <span className="ml-1 bg-primary text-primary-foreground rounded-full text-xs px-1">{docs.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="outros">Outros</TabsTrigger>
            </TabsList>

            {/* ABA BÁSICO */}
            <TabsContent value="basico" className="space-y-4">
              {modoEdicao ? (
                <div className="bg-muted p-3 rounded">
                  <p className="font-medium">{vendaParaEditar?.veiculo}</p>
                  <p className="text-sm text-muted-foreground">Cliente: {vendaParaEditar?.cliente}</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Veículo*</Label>
                    <Select value={veiculoId} onValueChange={setVeiculoId} required>
                      <SelectTrigger><SelectValue placeholder="Selecione o veículo" /></SelectTrigger>
                      <SelectContent>{veiculos.map(v => <SelectItem key={v.id} value={v.id}>{v.marca} {v.modelo} {v.ano} - {v.placa}</SelectItem>)}</SelectContent>
                    </Select>
                    {veiculoSelecionado && (
                      <Card><CardContent className="pt-4"><div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-muted-foreground">Preço sugerido:</span><p className="font-medium">{veiculoSelecionado.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
                        <div><span className="text-muted-foreground">Custo (compra + despesas):</span><p className="font-medium">{custoRealVeiculo().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
                        {totalLancamentosVeiculo > 0 && (
                          <div className="col-span-2 text-xs text-muted-foreground">
                            Inclui {totalLancamentosVeiculo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} em despesas lançadas no estoque (preparação, manutenção, frete, etc.)
                          </div>
                        )}
                      </div></CardContent></Card>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de cliente*</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="tipoPessoa" value="fisica" checked={tipoPessoa === 'fisica'} onChange={() => setTipoPessoa('fisica')} />
                        <span className="text-sm">Pessoa Física</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="tipoPessoa" value="juridica" checked={tipoPessoa === 'juridica'} onChange={() => setTipoPessoa('juridica')} />
                        <span className="text-sm">Pessoa Jurídica (Lojista)</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="clienteNovo" checked={clienteNovo} onCheckedChange={c => setClienteNovo(c as boolean)} />
                    <Label htmlFor="clienteNovo" className="cursor-pointer">Cliente novo (cadastrar)</Label>
                  </div>
                  {!clienteNovo && (
                    <div className="space-y-2">
                      <Label>Cliente Existente</Label>
                      <Input placeholder="Digite o nome ou CPF para buscar..." value={buscaCliente} onChange={e => setBuscaCliente(e.target.value)} />
                      {buscaCliente && (
                        <div className="border rounded-lg max-h-40 overflow-y-auto">
                          {clientes.filter(c => c.nome.toLowerCase().includes(buscaCliente.toLowerCase()) || c.cpf?.toLowerCase().includes(buscaCliente.toLowerCase())).length === 0 ? (
                            <p className="text-sm text-muted-foreground p-3">Nenhum cliente encontrado</p>
                          ) : clientes.filter(c => c.nome.toLowerCase().includes(buscaCliente.toLowerCase()) || c.cpf?.toLowerCase().includes(buscaCliente.toLowerCase())).map(c => (
                            <button key={c.id} type="button"
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${clienteId === c.id ? 'bg-muted font-medium' : ''}`}
                              onClick={() => { setClienteId(c.id); setBuscaCliente(c.nome); }}>
                              <span className="font-medium">{c.nome}</span>
                              {c.cpf && <span className="text-muted-foreground ml-2">{c.cpf}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {tipoPessoa === 'fisica' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Nome*</Label><Input value={nomeCliente} onChange={e => setNomeCliente(e.target.value)} required disabled={!clienteNovo && !!clienteId} /></div>
                        <div className="space-y-2"><Label>CPF*</Label><Input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" required disabled={!clienteNovo && !!clienteId} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Telefone*</Label><Input value={telefone} onChange={e => setTelefone(e.target.value)} required disabled={!clienteNovo && !!clienteId} /></div>
                        <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={!clienteNovo && !!clienteId} /></div>
                      </div>
                    </>
                  )}
                  {tipoPessoa === 'juridica' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Razão Social*</Label><Input value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} required /></div>
                        <div className="space-y-2"><Label>Nome Fantasia</Label><Input value={nomeFantasia} onChange={e => setNomeFantasia(e.target.value)} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>CNPJ*</Label><Input value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" required /></div>
                        <div className="space-y-2"><Label>Telefone*</Label><Input value={telefonePJ} onChange={e => setTelefonePJ(e.target.value)} required /></div>
                      </div>
                      <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={emailPJ} onChange={e => setEmailPJ(e.target.value)} /></div>
                      <div className="space-y-2"><Label>Endereço</Label><Input value={endereco} onChange={e => setEndereco(e.target.value)} /></div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2"><Label>Cidade</Label><Input value={cidade} onChange={e => setCidade(e.target.value)} /></div>
                        <div className="space-y-2"><Label>Estado</Label><Input value={estado} onChange={e => setEstado(e.target.value.toUpperCase())} maxLength={2} /></div>
                        <div className="space-y-2"><Label>CEP</Label><Input value={cep} onChange={e => setCep(e.target.value)} /></div>
                      </div>
                    </>
                  )}
                </>
              )}
              <div className="space-y-2">
                <Label>Vendedor</Label>
                <Select value={vendedorId} onValueChange={setVendedorId}>
                  <SelectTrigger><SelectValue placeholder="Selecione o vendedor" /></SelectTrigger>
                  <SelectContent>{vendedores.map(v => <SelectItem key={v.id} value={v.id}>{v.nome} ({v.percentualComissao}%)</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data da Venda*</Label>
                <Input type="date" value={dataVenda} onChange={e => setDataVenda(e.target.value)} required />
              </div>
            </TabsContent>

            {/* ABA FINANCEIRO */}
            <TabsContent value="financeiro" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Valor da Venda*</Label><Input type="number" step="0.01" value={valorVenda} onChange={e => setValorVenda(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Desconto</Label><Input type="number" step="0.01" value={desconto} onChange={e => setDesconto(e.target.value)} /></div>
              </div>
              {parseFloat(desconto) > 0 && <div className="space-y-2"><Label>Motivo do Desconto</Label><Input value={motivoDesconto} onChange={e => setMotivoDesconto(e.target.value)} /></div>}
              <div className="space-y-2"><Label>Valor de Entrada</Label><Input type="number" step="0.01" value={valorEntrada} onChange={e => setValorEntrada(e.target.value)} /></div>
              <div className="flex items-center space-x-2">
                <Checkbox id="financiado" checked={financiado} onCheckedChange={c => setFinanciado(c as boolean)} />
                <Label htmlFor="financiado" className="cursor-pointer">Venda financiada</Label>
              </div>
              {financiado && (
                <div className="space-y-4 border-l-2 border-blue-200 pl-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Valor Financiado*</Label><Input type="number" step="0.01" value={valorFinanciado} onChange={e => setValorFinanciado(e.target.value)} required /></div>
                    <div className="space-y-2"><Label>Número de Parcelas*</Label><Input type="number" value={numeroParcelas} onChange={e => setNumeroParcelas(e.target.value)} required /></div>
                  </div>
                  <div className="space-y-2"><Label>Banco/Financeira</Label><Input value={banco} onChange={e => setBanco(e.target.value)} /></div>
                  {valorFinanciado && numeroParcelas && <div className="bg-blue-50 p-3 rounded"><p className="text-sm text-blue-900"><strong>Valor da Parcela:</strong> {parseFloat(calcularValorParcela()).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>}
                </div>
              )}
              <div className="space-y-2">
                <Label>Forma de Pagamento*</Label>
                <Select value={formaPagamento} onValueChange={setFormaPagamento} required>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="financiamento">Financiamento</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {valorVenda && (
                <Card className="bg-green-50"><CardContent className="pt-4">
                  <p className="text-sm text-green-900"><strong>Custo total (compra + despesas):</strong> {custoRealVeiculo().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  <p className="text-sm font-medium text-green-900 mt-1"><strong>Lucro Líquido Estimado:</strong> {calcularLucroEstimado().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  {vendedorId && <p className="text-sm text-green-700 mt-1">Comissão: {(calcularLucroEstimado() * (vendedores.find(v => v.id === vendedorId)?.percentualComissao || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>}
                </CardContent></Card>
              )}
            </TabsContent>

            {/* ABA TRADE-IN */}
            <TabsContent value="tradein" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="temTradeIn" checked={temTradeIn} onCheckedChange={c => setTemTradeIn(c as boolean)} />
                <Label htmlFor="temTradeIn" className="cursor-pointer">Cliente tem veículo para troca (Trade-in)</Label>
              </div>
              {temTradeIn && (
                <div className="space-y-4 border-l-2 border-orange-200 pl-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Marca*</Label><Input value={tradeInMarca} onChange={e => setTradeInMarca(e.target.value)} required /></div>
                    <div className="space-y-2"><Label>Modelo*</Label><Input value={tradeInModelo} onChange={e => setTradeInModelo(e.target.value)} required /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Ano*</Label><Input type="number" value={tradeInAno} onChange={e => setTradeInAno(e.target.value)} required /></div>
                    <div className="space-y-2"><Label>Placa*</Label><Input value={tradeInPlaca} onChange={e => setTradeInPlaca(e.target.value)} required /></div>
                    <div className="space-y-2"><Label>KM*</Label><Input type="number" value={tradeInKm} onChange={e => setTradeInKm(e.target.value)} required /></div>
                  </div>
                  <div className="space-y-2"><Label>Valor Avaliado*</Label><Input type="number" step="0.01" value={valorTradeIn} onChange={e => setValorTradeIn(e.target.value)} required /></div>
                  <div className="space-y-2"><Label>Observações</Label><Textarea value={tradeInObs} onChange={e => setTradeInObs(e.target.value)} rows={3} /></div>
                </div>
              )}
            </TabsContent>

            {/* ABA DOCUMENTOS */}
            <TabsContent value="documentos" className="space-y-4">
              <p className="text-sm text-muted-foreground">Anexe os documentos do comprador para esta venda.</p>
              <div className="flex gap-3 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Tipo de documento</Label>
                  <Select value={tipoDocSelecionado} onValueChange={(v: any) => setTipoDocSelecionado(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(tipoDocLabel) as DocVenda['tipo'][]).map(tipo => (
                        <SelectItem key={tipo} value={tipo}>{tipoDocLabel[tipo]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <label className="cursor-pointer">
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleDocUpload} />
                  <Button type="button" size="sm" asChild><span><Upload className="h-4 w-4 mr-1" />Anexar arquivo</span></Button>
                </label>
              </div>
              {docs.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                  <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum documento anexado ainda</p>
                  <p className="text-xs text-muted-foreground">Selecione o tipo e clique em Anexar arquivo</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {docs.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div><p className="text-sm font-medium">{doc.nome}</p><p className="text-xs text-muted-foreground">{tipoDocLabel[doc.tipo]}</p></div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleVisualizarDoc(doc.conteudo)}><Eye className="h-3.5 w-3.5" /></Button>
                        <a href={doc.conteudo} download={doc.nome}><Button type="button" variant="ghost" size="icon" className="h-7 w-7"><Download className="h-3.5 w-3.5" /></Button></a>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDocs(prev => prev.filter(d => d.id !== doc.id))}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">{docs.length} documento(s) — serão salvos ao {modoEdicao ? 'atualizar' : 'registrar'} a venda</p>
                </div>
              )}
            </TabsContent>

            {/* ABA OUTROS */}
            <TabsContent value="outros" className="space-y-4">
              <div className="space-y-2"><Label>Observações da Venda</Label><Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={4} placeholder="Informações adicionais..." /></div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => { onOpenChange(false); limparFormulario(); }}>Cancelar</Button>
            <Button type="submit" disabled={salvando}>{salvando ? 'Salvando...' : modoEdicao ? 'Salvar alterações' : 'Registrar Venda'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}