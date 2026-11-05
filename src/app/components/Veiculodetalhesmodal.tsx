import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Car, FileText, Image, DollarSign, Truck, Upload, Trash2, Plus, Download, Eye, CreditCard, Pencil, Check, X } from 'lucide-react';
import { store, Veiculo } from '../lib/store';
import { supabase } from '../lib/supabase';
import { VeiculoDialog } from './VeiculoDialog';
import { useAuth } from '../contexts/AuthContext';

export interface ArquivoVeiculo {
  id: string; veiculoId: string; nome: string;
  tipo: 'crlv' | 'nfe' | 'laudo' | 'contrato' | 'outros';
  dataUpload: string; conteudo?: string;
}
export interface MidiaVeiculo {
  id: string; veiculoId: string; nome: string; dataUpload: string; conteudo: string;
}
export interface LancamentoVeiculo {
  id: string; veiculoId: string; descricao: string;
  tipo: 'preparacao' | 'manutencao' | 'documentacao' | 'frete' | 'outros';
  valor: number; data: string; observacoes?: string;
}
export interface EntradaVeiculo {
  veiculoId: string; nomeForncedor: string; cpfCnpjFornecedor: string;
  dataEntrada: string; observacoes?: string;
}
export interface PagamentoVeiculo {
  veiculoId: string; elaPagou?: number; bancoPagou?: number;
  bancoFinanciador?: string; observacoes?: string;
}
export interface RegistroPagamento {
  id: string; veiculoId: string;
  descricao: string;
  quemPagou: 'empresa' | 'banco' | 'cliente';
  valor: number;
  data: string;
  observacoes?: string;
}
export interface PrecosVeiculo {
  veiculoId: string; precoPagoBanco?: number;
  precoRepasseParceiro?: number; precoVendaFinal?: number;
}

async function getExtras(veiculoId: string, tipo: string) {
  const { data } = await supabase.from('veiculo_extras').select('*').eq('veiculo_id', veiculoId).eq('tipo', tipo).order('criado_em', { ascending: false });
  return data ?? [];
}
async function saveExtra(veiculoId: string, tipo: string, dados: any) {
  const { data, error } = await supabase.from('veiculo_extras').insert({ veiculo_id: veiculoId, tipo, dados }).select().single();
  if (error) console.error('saveExtra:', error);
  return data;
}
async function upsertExtra(veiculoId: string, tipo: string, dados: any) {
  await supabase.from('veiculo_extras').delete().eq('veiculo_id', veiculoId).eq('tipo', tipo);
  const { error } = await supabase.from('veiculo_extras').insert({ veiculo_id: veiculoId, tipo, dados });
  if (error) console.error('upsertExtra insert:', error);
}
async function deleteExtra(id: string) {
  await supabase.from('veiculo_extras').delete().eq('id', id);
}
function generateId() { return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; }

const tipoLancamentoLabel: Record<LancamentoVeiculo['tipo'], string> = {
  preparacao: 'Preparação', manutencao: 'Manutenção', documentacao: 'Documentação', frete: 'Frete', outros: 'Outros',
};

interface Props {
  veiculo: Veiculo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export function VeiculoDetalhesModal({ veiculo, open, onOpenChange, onUpdate }: Props) {
  const { isVisualizador } = useAuth();
  const [tab, setTab] = useState('veiculo');
  const [arquivos, setArquivos] = useState<(ArquivoVeiculo & { rowId: string })[]>([]);
  const [midias, setMidias] = useState<(MidiaVeiculo & { rowId: string })[]>([]);
  const [lancamentos, setLancamentos] = useState<(LancamentoVeiculo & { rowId: string })[]>([]);
  const [entrada, setEntrada] = useState<EntradaVeiculo | null>(null);
  const [pagamento, setPagamento] = useState<PagamentoVeiculo | null>(null);
  const [registrosPagamento, setRegistrosPagamento] = useState<(RegistroPagamento & { rowId: string })[]>([]);
  const [precos, setPrecos] = useState<PrecosVeiculo | null>(null);
  const [loading, setLoading] = useState(false);

  const [novoLancamento, setNovoLancamento] = useState({ descricao: '', tipo: 'preparacao' as LancamentoVeiculo['tipo'], valor: '', data: new Date().toISOString().split('T')[0] });
  const [entradaForm, setEntradaForm] = useState({ nomeFornecedor: '', cpfCnpj: '', dataEntrada: '', observacoes: '' });
  const [pagamentoForm, setPagamentoForm] = useState({ bancoFinanciador: '', observacoes: '' });
  const [novoRegistro, setNovoRegistro] = useState({ descricao: '', quemPagou: 'empresa' as 'empresa' | 'banco' | 'cliente', valor: '', data: new Date().toISOString().split('T')[0], observacoes: '' });
  const [precosForm, setPrecosForm] = useState({ precoPagoBanco: '', precoRepasseParceiro: '', precoVendaFinal: '' });
  const [editandoPrecos, setEditandoPrecos] = useState(false);
  const [edicaoVeiculoOpen, setEdicaoVeiculoOpen] = useState(false);
  const midiaRef = useRef<HTMLInputElement>(null);

  const carregarDados = async (v: Veiculo) => {
    setLoading(true);
    const [arqRows, midRows, lanRows, entRows, pagRows, regRows, precRows] = await Promise.all([
      getExtras(v.id, 'arquivo'), getExtras(v.id, 'midia'), getExtras(v.id, 'lancamento'),
      getExtras(v.id, 'entrada'), getExtras(v.id, 'pagamento'), getExtras(v.id, 'registro_pagamento'), getExtras(v.id, 'precos'),
    ]);
    setArquivos(arqRows.map(r => ({ ...r.dados, rowId: r.id })));
    setMidias(midRows.map(r => ({ ...r.dados, rowId: r.id })));
    setLancamentos(lanRows.map(r => ({ ...r.dados, rowId: r.id })));
    setRegistrosPagamento(regRows.map(r => ({ ...r.dados, rowId: r.id })));
    const ent = entRows[0]?.dados ?? null;
    setEntrada(ent);
    setEntradaForm({ nomeFornecedor: ent?.nomeForncedor || '', cpfCnpj: ent?.cpfCnpjFornecedor || '', dataEntrada: ent?.dataEntrada || v.dataEntrada, observacoes: ent?.observacoes || '' });
    const pag = pagRows[0]?.dados ?? null;
    setPagamento(pag);
    setPagamentoForm({ bancoFinanciador: pag?.bancoFinanciador || '', observacoes: pag?.observacoes || '' });
    const prec = precRows[0]?.dados ?? null;
    setPrecos(prec);
    setPrecosForm({ precoPagoBanco: prec?.precoPagoBanco?.toString() || v.precoCompra.toString(), precoRepasseParceiro: prec?.precoRepasseParceiro?.toString() || '', precoVendaFinal: prec?.precoVendaFinal?.toString() || v.preco.toString() });
    setLoading(false);
  };

  useEffect(() => {
    if (open && veiculo) carregarDados(veiculo);
  }, [open, veiculo?.id]);

  if (!veiculo) return null;

  const handleArquivoUpload = async (e: React.ChangeEvent<HTMLInputElement>, tipo: ArquivoVeiculo['tipo']) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dados: ArquivoVeiculo = { id: generateId(), veiculoId: veiculo.id, nome: file.name, tipo, dataUpload: new Date().toISOString().split('T')[0], conteudo: reader.result as string };
      await saveExtra(veiculo.id, 'arquivo', dados);
      const rows = await getExtras(veiculo.id, 'arquivo');
      setArquivos(rows.map(r => ({ ...r.dados, rowId: r.id })));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleVisualizarArquivo = (conteudo: string) => {
    const byteString = atob(conteudo.split(',')[1]);
    const mimeType = conteudo.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    window.open(URL.createObjectURL(new Blob([ab], { type: mimeType })), '_blank');
  };

  const handleMidiaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    for (const file of Array.from(e.target.files || [])) {
      const reader = new FileReader();
      await new Promise<void>(resolve => {
        reader.onload = async () => {
          await saveExtra(veiculo.id, 'midia', { id: generateId(), veiculoId: veiculo.id, nome: file.name, dataUpload: new Date().toISOString().split('T')[0], conteudo: reader.result as string });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    const rows = await getExtras(veiculo.id, 'midia');
    setMidias(rows.map(r => ({ ...r.dados, rowId: r.id })));
    e.target.value = '';
  };

  const handleSaveLancamento = async () => {
    if (!novoLancamento.descricao || !novoLancamento.valor) return;
    await saveExtra(veiculo.id, 'lancamento', { id: generateId(), veiculoId: veiculo.id, descricao: novoLancamento.descricao, tipo: novoLancamento.tipo, valor: parseFloat(novoLancamento.valor), data: novoLancamento.data });
    const rows = await getExtras(veiculo.id, 'lancamento');
    setLancamentos(rows.map(r => ({ ...r.dados, rowId: r.id })));
    setNovoLancamento({ descricao: '', tipo: 'preparacao', valor: '', data: new Date().toISOString().split('T')[0] });
  };

  const handleSaveEntrada = async () => {
    const ent: EntradaVeiculo = { veiculoId: veiculo.id, nomeForncedor: entradaForm.nomeFornecedor, cpfCnpjFornecedor: entradaForm.cpfCnpj, dataEntrada: entradaForm.dataEntrada, observacoes: entradaForm.observacoes || undefined };
    await upsertExtra(veiculo.id, 'entrada', ent);
    setEntrada(ent);
  };

  const recalcularPagamento = async (rows: any[]) => {
    const todos = rows.map(r => r.dados as RegistroPagamento);
    const te = todos.filter(r => r.quemPagou === 'empresa').reduce((s, r) => s + r.valor, 0);
    const tb = todos.filter(r => r.quemPagou === 'banco').reduce((s, r) => s + r.valor, 0);
    const tc = todos.filter(r => r.quemPagou === 'cliente').reduce((s, r) => s + r.valor, 0);
    const total = te + tb + tc;
    const pag: PagamentoVeiculo = { veiculoId: veiculo.id, elaPagou: te + tc, bancoPagou: tb, bancoFinanciador: pagamentoForm.bancoFinanciador || undefined, observacoes: pagamentoForm.observacoes || undefined };
    await upsertExtra(veiculo.id, 'pagamento', pag);
    setPagamento(pag);
    await store.updateVeiculo(veiculo.id, { statusPagamento: total >= veiculo.precoCompra ? 'pago' : 'pendente' });
    return { te, tb, total };
  };

  const handleAddRegistro = async () => {
    if (!novoRegistro.valor || !novoRegistro.data) return;
    const reg: RegistroPagamento = { id: generateId(), veiculoId: veiculo.id, descricao: novoRegistro.descricao || (novoRegistro.quemPagou === 'empresa' ? 'Pagamento da empresa' : novoRegistro.quemPagou === 'banco' ? 'Pagamento do banco' : 'Pagamento do cliente'), quemPagou: novoRegistro.quemPagou, valor: parseFloat(novoRegistro.valor), data: novoRegistro.data, observacoes: novoRegistro.observacoes || undefined };
    await saveExtra(veiculo.id, 'registro_pagamento', reg);
    const rows = await getExtras(veiculo.id, 'registro_pagamento');
    setRegistrosPagamento(rows.map(r => ({ ...r.dados, rowId: r.id })));
    await recalcularPagamento(rows);
    setNovoRegistro({ descricao: '', quemPagou: 'empresa', valor: '', data: new Date().toISOString().split('T')[0], observacoes: '' });
  };

  const handleSavePagamento = async () => {
    const pag: PagamentoVeiculo = { veiculoId: veiculo.id, elaPagou: pagamento?.elaPagou, bancoPagou: pagamento?.bancoPagou, bancoFinanciador: pagamentoForm.bancoFinanciador || undefined, observacoes: pagamentoForm.observacoes || undefined };
    await upsertExtra(veiculo.id, 'pagamento', pag);
    setPagamento(pag);
  };

  const handleSavePrecos = async () => {
    const prec: PrecosVeiculo = { veiculoId: veiculo.id, precoPagoBanco: precosForm.precoPagoBanco ? parseFloat(precosForm.precoPagoBanco) : undefined, precoRepasseParceiro: precosForm.precoRepasseParceiro ? parseFloat(precosForm.precoRepasseParceiro) : undefined, precoVendaFinal: precosForm.precoVendaFinal ? parseFloat(precosForm.precoVendaFinal) : undefined };
    await upsertExtra(veiculo.id, 'precos', prec);
    setPrecos(prec);
    if (prec.precoVendaFinal) await store.updateVeiculo(veiculo.id, { preco: prec.precoVendaFinal });
    setEditandoPrecos(false);
    onUpdate?.();
  };

  const totalLancamentos = lancamentos.reduce((sum, l) => sum + l.valor, 0);
  const tipoArquivoLabel: Record<ArquivoVeiculo['tipo'], string> = { crlv: 'CRLV', nfe: 'NF-e', laudo: 'Laudo', contrato: 'Contrato', outros: 'Outros' };
  const fmt = (v?: number) => v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? '—';

  const totalEmpresaReg = registrosPagamento.filter(r => r.quemPagou === 'empresa').reduce((s, r) => s + r.valor, 0);
  const totalBancoReg = registrosPagamento.filter(r => r.quemPagou === 'banco').reduce((s, r) => s + r.valor, 0);
  const totalClienteReg = registrosPagamento.filter(r => r.quemPagou === 'cliente').reduce((s, r) => s + r.valor, 0);
  const totalPagoReg = totalEmpresaReg + totalBancoReg + totalClienteReg;
  const totalPago = registrosPagamento.length > 0 ? totalPagoReg : (pagamento?.elaPagou ?? 0) + (pagamento?.bancoPagou ?? 0);
  const faltaPagar = Math.max(0, veiculo.precoCompra - totalPago);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      disponivel: { label: 'Disponível', className: 'bg-green-100 text-green-800' },
      vendido: { label: 'Vendido', className: 'bg-gray-100 text-gray-800' },
      reservado: { label: 'Reservado', className: 'bg-yellow-100 text-yellow-800' },
      em_transito: { label: 'Em Trânsito', className: 'bg-blue-100 text-blue-800' },
    };
    const s = map[status] || map.disponivel;
    return <Badge className={s.className}>{s.label}</Badge>;
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-[90vw] max-h-[92vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">{veiculo.marca} {veiculo.modelo} {veiculo.ano}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">Placa: {veiculo.placa} · {veiculo.cor} · {veiculo.km.toLocaleString('pt-BR')} km</p>
            </div>
            <div className="flex items-center gap-2">
              {!isVisualizador && (
                <Button variant="outline" size="sm" onClick={() => setEdicaoVeiculoOpen(true)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" />Editar Veículo
                </Button>
              )}
              {getStatusBadge(veiculo.status)}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 justify-start h-auto flex-wrap gap-1 bg-transparent border-b rounded-none pb-0">
            {[
              { value: 'veiculo', label: 'Veículo', icon: Car },
              { value: 'arquivos', label: 'Arquivos', icon: FileText },
              { value: 'midias', label: 'Mídias', icon: Image },
              { value: 'lancamentos', label: 'Lançamentos', icon: DollarSign },
              { value: 'entrada', label: 'Entrada', icon: Truck },
              { value: 'pagamento', label: 'Pagamento', icon: CreditCard },
            ].map(({ value, label, icon: Icon }) => (
              <button key={value} onClick={() => setTab(value)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors rounded-none ${tab === value ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                <Icon className="h-4 w-4" />{label}
              </button>
            ))}
          </TabsList>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {loading ? (
              <div className="flex items-center justify-center h-40"><p className="text-muted-foreground text-sm">Carregando...</p></div>
            ) : (
              <>
                {/* ABA VEÍCULO */}
                <TabsContent value="veiculo" className="mt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      ['Marca', veiculo.marca], ['Modelo', veiculo.modelo], ['Ano', veiculo.anoModelo || veiculo.ano],
                      ['Cor', veiculo.cor], ['Placa', veiculo.placa], ['Quilometragem', `${veiculo.km.toLocaleString('pt-BR')} km`],
                      ['Data de Entrada', new Date(veiculo.dataEntrada).toLocaleDateString('pt-BR')],
                      ['Origem', veiculo.origem.charAt(0).toUpperCase() + veiculo.origem.slice(1)],
                      ['Cidade', veiculo.origem === 'leilao' && veiculo.dadosLeilao ? veiculo.dadosLeilao.cidadeOrigem : (veiculo.cidadeOrigem || '—')],
                      ['Estado', veiculo.origem === 'leilao' && veiculo.dadosLeilao ? veiculo.dadosLeilao.estadoOrigem : (veiculo.estadoOrigem || '—')],
                    ].map(([label, value]) => (
                      <div key={label as string} className="bg-muted/40 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">{label}</p>
                        <p className="font-medium text-sm">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold">Preços</h4>
                      {!isVisualizador && !editandoPrecos && (
                        <Button variant="ghost" size="sm" onClick={() => setEditandoPrecos(true)}><Pencil className="h-3.5 w-3.5 mr-1" />Editar</Button>
                      )}
                      {!isVisualizador && editandoPrecos && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSavePrecos}><Check className="h-3.5 w-3.5 mr-1" />Salvar</Button>
                          <Button variant="outline" size="sm" onClick={() => setEditandoPrecos(false)}><X className="h-3.5 w-3.5 mr-1" />Cancelar</Button>
                        </div>
                      )}
                    </div>
                    {!editandoPrecos || isVisualizador ? (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-blue-50 rounded-lg p-3"><p className="text-xs text-blue-700 mb-1">Pago ao banco</p><p className="font-bold text-blue-900">{fmt(precos?.precoPagoBanco ?? veiculo.precoCompra)}</p></div>
                        <div className="bg-orange-50 rounded-lg p-3"><p className="text-xs text-orange-700 mb-1">Repasse ao parceiro</p><p className="font-bold text-orange-900">{fmt(precos?.precoRepasseParceiro)}</p></div>
                        <div className="bg-green-50 rounded-lg p-3"><p className="text-xs text-green-700 mb-1">Venda final</p><p className="font-bold text-green-900">{fmt(precos?.precoVendaFinal ?? veiculo.preco)}</p></div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1"><Label className="text-xs">Pago ao banco (R$)</Label><Input type="number" placeholder="0.00" value={precosForm.precoPagoBanco} onChange={e => setPrecosForm(p => ({ ...p, precoPagoBanco: e.target.value }))} /></div>
                        <div className="space-y-1"><Label className="text-xs">Repasse ao parceiro (R$)</Label><Input type="number" placeholder="0.00" value={precosForm.precoRepasseParceiro} onChange={e => setPrecosForm(p => ({ ...p, precoRepasseParceiro: e.target.value }))} /></div>
                        <div className="space-y-1"><Label className="text-xs">Venda final (R$)</Label><Input type="number" placeholder="0.00" value={precosForm.precoVendaFinal} onChange={e => setPrecosForm(p => ({ ...p, precoVendaFinal: e.target.value }))} /></div>
                      </div>
                    )}
                  </div>
                  {veiculo.origem === 'leilao' && veiculo.dadosLeilao && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-sm mb-3">Dados do Leilão</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {[['Evento', veiculo.dadosLeilao.nomeEventoLeilao], ['Lote', veiculo.dadosLeilao.numeroLote], ['Cidade de Origem', veiculo.dadosLeilao.cidadeOrigem], ['Estado', veiculo.dadosLeilao.estadoOrigem], ['Data Arrematação', new Date(veiculo.dadosLeilao.dataArrematacao).toLocaleDateString('pt-BR')]].map(([label, value]) => (
                          <div key={label as string} className="bg-blue-50 rounded p-2"><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium text-sm">{value}</p></div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* ABA ARQUIVOS */}
                <TabsContent value="arquivos" className="mt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{arquivos.length} arquivo(s)</p>
                    {!isVisualizador && (
                      <div className="flex gap-2 flex-wrap">
                        {(['crlv', 'nfe', 'laudo', 'contrato', 'outros'] as ArquivoVeiculo['tipo'][]).map(tipo => (
                          <label key={tipo} className="cursor-pointer">
                            <input type="file" className="hidden" onChange={e => handleArquivoUpload(e, tipo)} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-accent transition-colors"><Upload className="h-3 w-3" />{tipoArquivoLabel[tipo]}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {arquivos.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg"><FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" /><p className="text-sm text-muted-foreground">Nenhum arquivo enviado ainda</p></div>
                  ) : (
                    <div className="space-y-2">
                      {arquivos.map(arq => (
                        <div key={arq.rowId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3"><FileText className="h-4 w-4 text-muted-foreground" /><div><p className="text-sm font-medium">{arq.nome}</p><p className="text-xs text-muted-foreground">{tipoArquivoLabel[arq.tipo]} · {new Date(arq.dataUpload).toLocaleDateString('pt-BR')}</p></div></div>
                          <div className="flex items-center gap-1">
                            {arq.conteudo && (<><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleVisualizarArquivo(arq.conteudo!)}><Eye className="h-3.5 w-3.5" /></Button><a href={arq.conteudo} download={arq.nome}><Button variant="ghost" size="icon" className="h-7 w-7"><Download className="h-3.5 w-3.5" /></Button></a></>)}
                            {!isVisualizador && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={async () => { await deleteExtra(arq.rowId); const rows = await getExtras(veiculo.id, 'arquivo'); setArquivos(rows.map(r => ({ ...r.dados, rowId: r.id }))); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* ABA MÍDIAS */}
                <TabsContent value="midias" className="mt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{midias.length} foto(s)</p>
                    {!isVisualizador && <label className="cursor-pointer"><input ref={midiaRef} type="file" className="hidden" multiple accept="image/*" onChange={handleMidiaUpload} /><Button size="sm" onClick={() => midiaRef.current?.click()} type="button"><Plus className="h-4 w-4 mr-1" />Adicionar Fotos</Button></label>}
                  </div>
                  {midias.length === 0 ? (
                    <div className={`text-center py-12 border-2 border-dashed rounded-lg ${!isVisualizador ? 'cursor-pointer hover:bg-muted/20 transition-colors' : ''}`} onClick={() => !isVisualizador && midiaRef.current?.click()}><Image className="h-10 w-10 mx-auto text-muted-foreground mb-2" /><p className="text-sm text-muted-foreground">{isVisualizador ? 'Nenhuma foto disponível' : 'Clique para adicionar fotos'}</p></div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {midias.map(m => (
                        <div key={m.rowId} className="relative group rounded-lg overflow-hidden border">
                          <img src={m.conteudo} alt={m.nome} className="w-full h-32 object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <a href={m.conteudo} target="_blank" rel="noopener noreferrer"><Button variant="secondary" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button></a>
                            {!isVisualizador && <Button variant="destructive" size="icon" className="h-7 w-7" onClick={async () => { await deleteExtra(m.rowId); const rows = await getExtras(veiculo.id, 'midia'); setMidias(rows.map(r => ({ ...r.dados, rowId: r.id }))); }}><Trash2 className="h-3.5 w-3.5" /></Button>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* ABA LANÇAMENTOS */}
                <TabsContent value="lancamentos" className="mt-0 space-y-4">
                  {!isVisualizador && (
                    <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
                      <h4 className="text-sm font-semibold">Novo Lançamento</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1"><Label className="text-xs">Descrição*</Label><Input placeholder="Ex: Revisão, limpeza..." value={novoLancamento.descricao} onChange={e => setNovoLancamento(p => ({ ...p, descricao: e.target.value }))} /></div>
                        <div className="space-y-1"><Label className="text-xs">Categoria*</Label>
                          <Select value={novoLancamento.tipo} onValueChange={v => setNovoLancamento(p => ({ ...p, tipo: v as LancamentoVeiculo['tipo'] }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="preparacao">Preparação</SelectItem><SelectItem value="manutencao">Manutenção</SelectItem><SelectItem value="documentacao">Documentação</SelectItem><SelectItem value="frete">Frete</SelectItem><SelectItem value="outros">Outros</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1"><Label className="text-xs">Valor*</Label><Input type="number" placeholder="0.00" value={novoLancamento.valor} onChange={e => setNovoLancamento(p => ({ ...p, valor: e.target.value }))} /></div>
                        <div className="space-y-1"><Label className="text-xs">Data*</Label><Input type="date" value={novoLancamento.data} onChange={e => setNovoLancamento(p => ({ ...p, data: e.target.value }))} /></div>
                      </div>
                      <Button size="sm" onClick={handleSaveLancamento}><Plus className="h-4 w-4 mr-1" />Incluir</Button>
                    </div>
                  )}
                  {lancamentos.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">Nenhum lançamento registrado</div>
                  ) : (
                    <div className="space-y-2">
                      {lancamentos.map(l => (
                        <div key={l.rowId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div><p className="text-sm font-medium">{l.descricao}</p><p className="text-xs text-muted-foreground">{tipoLancamentoLabel[l.tipo]} · {new Date(l.data).toLocaleDateString('pt-BR')}</p></div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-sm text-red-600">{l.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            {!isVisualizador && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={async () => { await deleteExtra(l.rowId); const rows = await getExtras(veiculo.id, 'lancamento'); setLancamentos(rows.map(r => ({ ...r.dados, rowId: r.id }))); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>}
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between p-3 rounded-lg font-semibold text-sm bg-red-50 text-red-700"><span>Total de custos</span><span>{totalLancamentos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                    </div>
                  )}
                </TabsContent>

                {/* ABA ENTRADA */}
                <TabsContent value="entrada" className="mt-0 space-y-4">
                  <p className="text-sm text-muted-foreground">Dados do fornecedor e entrada do veículo</p>
                  {!isVisualizador ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1"><Label className="text-xs">Nome do Fornecedor</Label><Input placeholder="Nome completo" value={entradaForm.nomeFornecedor} onChange={e => setEntradaForm(p => ({ ...p, nomeFornecedor: e.target.value }))} /></div>
                        <div className="space-y-1"><Label className="text-xs">CPF / CNPJ</Label><Input placeholder="000.000.000-00" value={entradaForm.cpfCnpj} onChange={e => setEntradaForm(p => ({ ...p, cpfCnpj: e.target.value }))} /></div>
                        <div className="space-y-1"><Label className="text-xs">Data de Entrada</Label><Input type="date" value={entradaForm.dataEntrada} onChange={e => setEntradaForm(p => ({ ...p, dataEntrada: e.target.value }))} /></div>
                      </div>
                      <div className="space-y-1"><Label className="text-xs">Observações</Label><Textarea placeholder="Informações adicionais..." value={entradaForm.observacoes} onChange={e => setEntradaForm(p => ({ ...p, observacoes: e.target.value }))} rows={2} /></div>
                      <Button onClick={handleSaveEntrada}>Salvar Dados de Entrada</Button>
                    </>
                  ) : null}
                  {entrada && (
                    <div className="mt-2 border rounded-lg p-4 bg-muted/20 space-y-2">
                      <h4 className="text-sm font-semibold">Dados salvos</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-muted-foreground">Fornecedor: </span>{entrada.nomeForncedor || '—'}</div>
                        <div><span className="text-muted-foreground">CPF/CNPJ: </span>{entrada.cpfCnpjFornecedor || '—'}</div>
                        <div><span className="text-muted-foreground">Data: </span>{entrada.dataEntrada ? new Date(entrada.dataEntrada).toLocaleDateString('pt-BR') : '—'}</div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* ABA PAGAMENTO */}
                <TabsContent value="pagamento" className="mt-0 space-y-4">
                  <p className="text-sm text-muted-foreground">Controle de quanto foi pago e quanto falta</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-muted/40 rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">Valor do veículo</p><p className="text-lg font-bold">{fmt(veiculo.precoCompra)}</p></div>
                    <div className="bg-green-50 rounded-lg p-3"><p className="text-xs text-green-700 mb-1">Total pago</p><p className="text-lg font-bold text-green-700">{fmt(totalPago)}</p></div>
                    {faltaPagar > 0 ? (
                      <div className="bg-red-50 rounded-lg p-3"><p className="text-xs text-red-700 mb-1">Falta pagar</p><p className="text-lg font-bold text-red-700">{fmt(faltaPagar)}</p></div>
                    ) : totalPago > 0 ? (
                      <div className="bg-green-50 rounded-lg p-3 flex items-center justify-center"><p className="text-sm font-bold text-green-700">✓ Quitado</p></div>
                    ) : (
                      <div className="bg-muted/40 rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">Falta pagar</p><p className="text-lg font-bold">—</p></div>
                    )}
                  </div>

                  {!isVisualizador && (
                    <>
                      <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
                        <h4 className="text-sm font-semibold">Registrar Pagamento</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1"><Label className="text-xs">Descrição</Label><Input placeholder="Ex: Parcela 1, entrada..." value={novoRegistro.descricao} onChange={e => setNovoRegistro(p => ({ ...p, descricao: e.target.value }))} /></div>
                          <div className="space-y-1"><Label className="text-xs">Quem pagou*</Label>
                            <Select value={novoRegistro.quemPagou} onValueChange={(v: any) => setNovoRegistro(p => ({ ...p, quemPagou: v }))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="empresa">Empresa</SelectItem><SelectItem value="banco">Banco</SelectItem><SelectItem value="cliente">Cliente</SelectItem></SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1"><Label className="text-xs">Valor (R$)*</Label><Input type="number" placeholder="0.00" step="0.01" value={novoRegistro.valor} onChange={e => setNovoRegistro(p => ({ ...p, valor: e.target.value }))} /></div>
                          <div className="space-y-1"><Label className="text-xs">Data*</Label><Input type="date" value={novoRegistro.data} onChange={e => setNovoRegistro(p => ({ ...p, data: e.target.value }))} /></div>
                        </div>
                        <div className="space-y-1"><Label className="text-xs">Observações</Label><Input placeholder="Informação adicional..." value={novoRegistro.observacoes} onChange={e => setNovoRegistro(p => ({ ...p, observacoes: e.target.value }))} /></div>
                        <Button size="sm" onClick={handleAddRegistro} disabled={!novoRegistro.valor || !novoRegistro.data}><Plus className="h-4 w-4 mr-1" />Registrar</Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1 col-span-2"><Label className="text-xs">Banco Financiador</Label><Input placeholder="Ex: Banco do Brasil, Bradesco..." value={pagamentoForm.bancoFinanciador} onChange={e => setPagamentoForm(p => ({ ...p, bancoFinanciador: e.target.value }))} /></div>
                      </div>
                      <div className="space-y-1"><Label className="text-xs">Observações gerais</Label><Textarea placeholder="Ex: Parcelas a vencer todo dia 10..." value={pagamentoForm.observacoes} onChange={e => setPagamentoForm(p => ({ ...p, observacoes: e.target.value }))} rows={2} /></div>
                      <Button variant="outline" size="sm" onClick={handleSavePagamento}>Salvar observações</Button>
                    </>
                  )}

                  {registrosPagamento.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Histórico de pagamentos</h4>
                      {registrosPagamento.map(reg => (
                        <div key={reg.rowId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="text-sm font-medium">{reg.descricao}</p>
                            <p className="text-xs text-muted-foreground">
                              {reg.quemPagou === 'empresa' ? '🏢 Empresa' : reg.quemPagou === 'banco' ? '🏦 Banco' : '👤 Cliente'} · {new Date(reg.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                              {reg.observacoes && ` · ${reg.observacoes}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-green-600">{reg.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            {!isVisualizador && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={async () => {
                                await deleteExtra(reg.rowId);
                                const rows = await getExtras(veiculo.id, 'registro_pagamento');
                                setRegistrosPagamento(rows.map(r => ({ ...r.dados, rowId: r.id })));
                                await recalcularPagamento(rows);
                              }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="grid grid-cols-3 gap-3 pt-2">
                        <div className="bg-blue-50 rounded p-2 text-center"><p className="text-xs text-blue-700">Empresa pagou</p><p className="font-bold text-blue-900 text-sm">{fmt(totalEmpresaReg)}</p></div>
                        <div className="bg-purple-50 rounded p-2 text-center"><p className="text-xs text-purple-700">Banco pagou</p><p className="font-bold text-purple-900 text-sm">{fmt(totalBancoReg)}</p></div>
                        {totalClienteReg > 0 && <div className="bg-orange-50 rounded p-2 text-center"><p className="text-xs text-orange-700">Cliente pagou</p><p className="font-bold text-orange-900 text-sm">{fmt(totalClienteReg)}</p></div>}
                        <div className="bg-green-50 rounded p-2 text-center"><p className="text-xs text-green-700">Total pago</p><p className="font-bold text-green-900 text-sm">{fmt(totalPagoReg)}</p></div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>

    {!isVisualizador && (
      <VeiculoDialog
        open={edicaoVeiculoOpen}
        onOpenChange={setEdicaoVeiculoOpen}
        veiculo={veiculo}
        onSave={() => { setEdicaoVeiculoOpen(false); onUpdate?.(); if (veiculo) carregarDados(veiculo); }}
      />
    )}
    </>
  );
}