import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Car, FileText, Image, DollarSign, Truck,
  Upload, Trash2, Plus, Download, Eye
} from 'lucide-react';
import { store, Veiculo } from '../lib/store';

// ─── Tipos extras (adicione também ao store.ts) ───────────────────────────────
export interface ArquivoVeiculo {
  id: string;
  veiculoId: string;
  nome: string;
  tipo: 'crlv' | 'nfe' | 'laudo' | 'contrato' | 'outros';
  dataUpload: string;
  // Em produção seria uma URL; aqui salvamos base64 pequeno ou só o nome
  conteudo?: string;
}

export interface MidiaVeiculo {
  id: string;
  veiculoId: string;
  nome: string;
  dataUpload: string;
  conteudo: string; // base64
}

export interface LancamentoVeiculo {
  id: string;
  veiculoId: string;
  descricao: string;
  tipo: 'despesa' | 'receita';
  valor: number;
  data: string;
  observacoes?: string;
}

export interface EntradaVeiculo {
  veiculoId: string;
  nomeForncedor: string;
  cpfCnpjFornecedor: string;
  dataEntrada: string;
  documentoNome?: string;
  observacoes?: string;
}

// ─── Helpers localStorage ──────────────────────────────────────────────────────
function getArquivos(veiculoId: string): ArquivoVeiculo[] {
  const all: ArquivoVeiculo[] = JSON.parse(localStorage.getItem('arquivos_veiculos') || '[]');
  return all.filter(a => a.veiculoId === veiculoId);
}
function saveArquivo(arq: ArquivoVeiculo) {
  const all: ArquivoVeiculo[] = JSON.parse(localStorage.getItem('arquivos_veiculos') || '[]');
  all.push(arq);
  localStorage.setItem('arquivos_veiculos', JSON.stringify(all));
}
function deleteArquivo(id: string) {
  const all: ArquivoVeiculo[] = JSON.parse(localStorage.getItem('arquivos_veiculos') || '[]');
  localStorage.setItem('arquivos_veiculos', JSON.stringify(all.filter(a => a.id !== id)));
}

function getMidias(veiculoId: string): MidiaVeiculo[] {
  const all: MidiaVeiculo[] = JSON.parse(localStorage.getItem('midias_veiculos') || '[]');
  return all.filter(m => m.veiculoId === veiculoId);
}
function saveMidia(m: MidiaVeiculo) {
  const all: MidiaVeiculo[] = JSON.parse(localStorage.getItem('midias_veiculos') || '[]');
  all.push(m);
  localStorage.setItem('midias_veiculos', JSON.stringify(all));
}
function deleteMidia(id: string) {
  const all: MidiaVeiculo[] = JSON.parse(localStorage.getItem('midias_veiculos') || '[]');
  localStorage.setItem('midias_veiculos', JSON.stringify(all.filter(m => m.id !== id)));
}

function getLancamentos(veiculoId: string): LancamentoVeiculo[] {
  const all: LancamentoVeiculo[] = JSON.parse(localStorage.getItem('lancamentos_veiculos') || '[]');
  return all.filter(l => l.veiculoId === veiculoId);
}
function saveLancamento(l: LancamentoVeiculo) {
  const all: LancamentoVeiculo[] = JSON.parse(localStorage.getItem('lancamentos_veiculos') || '[]');
  all.push(l);
  localStorage.setItem('lancamentos_veiculos', JSON.stringify(all));
}
function deleteLancamento(id: string) {
  const all: LancamentoVeiculo[] = JSON.parse(localStorage.getItem('lancamentos_veiculos') || '[]');
  localStorage.setItem('lancamentos_veiculos', JSON.stringify(all.filter(l => l.id !== id)));
}

function getEntrada(veiculoId: string): EntradaVeiculo | null {
  const all: EntradaVeiculo[] = JSON.parse(localStorage.getItem('entradas_veiculos') || '[]');
  return all.find(e => e.veiculoId === veiculoId) || null;
}
function saveEntrada(e: EntradaVeiculo) {
  const all: EntradaVeiculo[] = JSON.parse(localStorage.getItem('entradas_veiculos') || '[]');
  const idx = all.findIndex(x => x.veiculoId === e.veiculoId);
  if (idx !== -1) all[idx] = e; else all.push(e);
  localStorage.setItem('entradas_veiculos', JSON.stringify(all));
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ─── Componente principal ──────────────────────────────────────────────────────
interface Props {
  veiculo: Veiculo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export function VeiculoDetalhesModal({ veiculo, open, onOpenChange, onUpdate }: Props) {
  const [tab, setTab] = useState('veiculo');
  const [arquivos, setArquivos] = useState<ArquivoVeiculo[]>([]);
  const [midias, setMidias] = useState<MidiaVeiculo[]>([]);
  const [lancamentos, setLancamentos] = useState<LancamentoVeiculo[]>([]);
  const [entrada, setEntrada] = useState<EntradaVeiculo | null>(null);
  const [novoLancamento, setNovoLancamento] = useState({ descricao: '', tipo: 'despesa', valor: '', data: new Date().toISOString().split('T')[0], observacoes: '' });
  const [entradaForm, setEntradaForm] = useState({ nomeFornecedor: '', cpfCnpj: '', dataEntrada: '', observacoes: '' });
  const fileRef = useRef<HTMLInputElement>(null);
  const midiaRef = useRef<HTMLInputElement>(null);

  // Carrega dados quando abre
  const handleOpenChange = (o: boolean) => {
    if (o && veiculo) {
      setArquivos(getArquivos(veiculo.id));
      setMidias(getMidias(veiculo.id));
      setLancamentos(getLancamentos(veiculo.id));
      const ent = getEntrada(veiculo.id);
      setEntrada(ent);
      if (ent) {
        setEntradaForm({ nomeFornecedor: ent.nomeForncedor, cpfCnpj: ent.cpfCnpjFornecedor, dataEntrada: ent.dataEntrada, observacoes: ent.observacoes || '' });
      } else {
        setEntradaForm({ nomeFornecedor: '', cpfCnpj: '', dataEntrada: veiculo.dataEntrada, observacoes: '' });
      }
    }
    onOpenChange(o);
  };

  if (!veiculo) return null;

  // ── Aba Arquivos ──
  const handleArquivoUpload = (e: React.ChangeEvent<HTMLInputElement>, tipo: ArquivoVeiculo['tipo']) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const arq: ArquivoVeiculo = { id: generateId(), veiculoId: veiculo.id, nome: file.name, tipo, dataUpload: new Date().toISOString().split('T')[0], conteudo: reader.result as string };
      saveArquivo(arq);
      setArquivos(getArquivos(veiculo.id));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDeleteArquivo = (id: string) => {
    deleteArquivo(id);
    setArquivos(getArquivos(veiculo.id));
  };

  // ── Aba Mídias ──
  const handleMidiaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const m: MidiaVeiculo = { id: generateId(), veiculoId: veiculo.id, nome: file.name, dataUpload: new Date().toISOString().split('T')[0], conteudo: reader.result as string };
        saveMidia(m);
        setMidias(getMidias(veiculo.id));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleDeleteMidia = (id: string) => {
    deleteMidia(id);
    setMidias(getMidias(veiculo.id));
  };

  // ── Aba Lançamentos ──
  const handleSaveLancamento = () => {
    if (!novoLancamento.descricao || !novoLancamento.valor) return;
    const l: LancamentoVeiculo = { id: generateId(), veiculoId: veiculo.id, descricao: novoLancamento.descricao, tipo: novoLancamento.tipo as 'despesa' | 'receita', valor: parseFloat(novoLancamento.valor), data: novoLancamento.data, observacoes: novoLancamento.observacoes || undefined };
    saveLancamento(l);
    setLancamentos(getLancamentos(veiculo.id));
    setNovoLancamento({ descricao: '', tipo: 'despesa', valor: '', data: new Date().toISOString().split('T')[0], observacoes: '' });
  };

  const handleDeleteLancamento = (id: string) => {
    deleteLancamento(id);
    setLancamentos(getLancamentos(veiculo.id));
  };

  const totalLancamentos = lancamentos.reduce((sum, l) => l.tipo === 'despesa' ? sum - l.valor : sum + l.valor, 0);

  // ── Aba Entrada ──
  const handleSaveEntrada = () => {
    const ent: EntradaVeiculo = { veiculoId: veiculo.id, nomeForncedor: entradaForm.nomeFornecedor, cpfCnpjFornecedor: entradaForm.cpfCnpj, dataEntrada: entradaForm.dataEntrada, observacoes: entradaForm.observacoes || undefined };
    saveEntrada(ent);
    setEntrada(ent);
  };

  const tipoArquivoLabel: Record<ArquivoVeiculo['tipo'], string> = { crlv: 'CRLV', nfe: 'NF-e', laudo: 'Laudo', contrato: 'Contrato', outros: 'Outros' };

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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[90vw] max-w-[90vw] max-h-[92vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">
                {veiculo.marca} {veiculo.modelo} {veiculo.ano}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Placa: {veiculo.placa} · {veiculo.cor} · {veiculo.km.toLocaleString('pt-BR')} km
              </p>
            </div>
            {getStatusBadge(veiculo.status)}
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
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors rounded-none ${tab === value ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </TabsList>

          <div className="flex-1 overflow-y-auto px-6 py-4">

            {/* ── ABA VEÍCULO ── */}
            <TabsContent value="veiculo" className="mt-0">
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Marca', veiculo.marca], ['Modelo', veiculo.modelo],
                  ['Ano', veiculo.ano], ['Cor', veiculo.cor],
                  ['Placa', veiculo.placa], ['Quilometragem', `${veiculo.km.toLocaleString('pt-BR')} km`],
                  ['Preço de Compra', veiculo.precoCompra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
                  ['Preço de Venda', veiculo.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
                  ['Data de Entrada', new Date(veiculo.dataEntrada).toLocaleDateString('pt-BR')],
                  ['Origem', veiculo.origem.charAt(0).toUpperCase() + veiculo.origem.slice(1)],
                ].map(([label, value]) => (
                  <div key={label as string} className="bg-muted/40 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    <p className="font-medium text-sm">{value}</p>
                  </div>
                ))}
              </div>
              {veiculo.origem === 'leilao' && veiculo.dadosLeilao && (
                <div className="mt-4 border rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-3">Dados do Leilão</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ['Evento', veiculo.dadosLeilao.nomeEventoLeilao],
                      ['Lote', veiculo.dadosLeilao.numeroLote],
                      ['Cidade de Origem', veiculo.dadosLeilao.cidadeOrigem],
                      ['Estado', veiculo.dadosLeilao.estadoOrigem],
                      ['Data Arrematação', new Date(veiculo.dadosLeilao.dataArrematacao).toLocaleDateString('pt-BR')],
                    ].map(([label, value]) => (
                      <div key={label as string} className="bg-blue-50 rounded p-2">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="font-medium text-sm">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-4 bg-green-50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Margem Potencial</p>
                <p className="text-lg font-bold text-green-700">
                  {(veiculo.preco - veiculo.precoCompra).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  <span className="text-sm font-normal ml-2">
                    ({(((veiculo.preco - veiculo.precoCompra) / veiculo.preco) * 100).toFixed(1)}%)
                  </span>
                </p>
              </div>
            </TabsContent>

            {/* ── ABA ARQUIVOS ── */}
            <TabsContent value="arquivos" className="mt-0 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{arquivos.length} arquivo(s) enviado(s)</p>
                <div className="flex gap-2">
                  {(['crlv', 'nfe', 'laudo', 'contrato', 'outros'] as ArquivoVeiculo['tipo'][]).map(tipo => (
                    <label key={tipo} className="cursor-pointer">
                      <input type="file" className="hidden" onChange={e => handleArquivoUpload(e, tipo)} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-accent transition-colors">
                        <Upload className="h-3 w-3" />
                        {tipoArquivoLabel[tipo]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {arquivos.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum arquivo enviado ainda</p>
                  <p className="text-xs text-muted-foreground">Use os botões acima para enviar documentos</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {arquivos.map(arq => (
                    <div key={arq.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{arq.nome}</p>
                          <p className="text-xs text-muted-foreground">{tipoArquivoLabel[arq.tipo]} · {new Date(arq.dataUpload).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {arq.conteudo && (
                          <><button onClick={() => {
                          const byteString = atob(arq.conteudo!.split(',')[1]);
                          const mimeType = arq.conteudo!.split(',')[0].split(':')[1].split(';')[0];
                          const ab = new ArrayBuffer(byteString.length);
                          const ia = new Uint8Array(ab);
                          for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
                          const blob = new Blob([ab], { type: mimeType });
                          const url = URL.createObjectURL(blob);
                          window.open(url, '_blank');
                          }}>
                            
      <Button variant="ghost" size="icon" className="h-7 w-7" title="Visualizar" type="button">
        <Eye className="h-3.5 w-3.5" />
      </Button>
    </button>
    <a href={arq.conteudo} download={arq.nome}>
      <Button variant="ghost" size="icon" className="h-7 w-7" title="Baixar">
        <Download className="h-3.5 w-3.5" />
      </Button>
    </a>
  </>
)}

                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteArquivo(arq.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── ABA MÍDIAS ── */}
            <TabsContent value="midias" className="mt-0 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{midias.length} foto(s)</p>
                <label className="cursor-pointer">
                  <input ref={midiaRef} type="file" className="hidden" multiple accept="image/*" onChange={handleMidiaUpload} />
                  <Button size="sm" onClick={() => midiaRef.current?.click()} type="button">
                    <Plus className="h-4 w-4 mr-1" /> Adicionar Fotos
                  </Button>
                </label>
              </div>

              {midias.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => midiaRef.current?.click()}>
                  <Image className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Clique para adicionar fotos do veículo</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {midias.map(m => (
                    <div key={m.id} className="relative group rounded-lg overflow-hidden border">
                      <img src={m.conteudo} alt={m.nome} className="w-full h-32 object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <a href={m.conteudo} target="_blank" rel="noopener noreferrer">
                          <Button variant="secondary" size="icon" className="h-7 w-7">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </a>
                        <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => handleDeleteMidia(m.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── ABA LANÇAMENTOS ── */}
            <TabsContent value="lancamentos" className="mt-0 space-y-4">
              {/* Formulário novo lançamento */}
              <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
                <h4 className="text-sm font-semibold">Novo Lançamento</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Descrição*</Label>
                    <Input placeholder="Ex: Revisão, limpeza..." value={novoLancamento.descricao} onChange={e => setNovoLancamento(p => ({ ...p, descricao: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo*</Label>
                    <Select value={novoLancamento.tipo} onValueChange={v => setNovoLancamento(p => ({ ...p, tipo: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="despesa">Despesa</SelectItem>
                        <SelectItem value="receita">Receita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Valor*</Label>
                    <Input type="number" placeholder="0.00" value={novoLancamento.valor} onChange={e => setNovoLancamento(p => ({ ...p, valor: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Data*</Label>
                    <Input type="date" value={novoLancamento.data} onChange={e => setNovoLancamento(p => ({ ...p, data: e.target.value }))} />
                  </div>
                </div>
                <Button size="sm" onClick={handleSaveLancamento}>
                  <Plus className="h-4 w-4 mr-1" /> Incluir
                </Button>
              </div>

              {/* Lista */}
              {lancamentos.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">Nenhum lançamento registrado</div>
              ) : (
                <div className="space-y-2">
                  {lancamentos.map(l => (
                    <div key={l.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{l.descricao}</p>
                        <p className="text-xs text-muted-foreground">{new Date(l.data).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-semibold text-sm ${l.tipo === 'despesa' ? 'text-red-600' : 'text-green-600'}`}>
                          {l.tipo === 'despesa' ? '-' : '+'}{l.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteLancamento(l.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className={`flex justify-between p-3 rounded-lg font-semibold text-sm ${totalLancamentos < 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    <span>Total lançamentos</span>
                    <span>{totalLancamentos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ── ABA ENTRADA ── */}
            <TabsContent value="entrada" className="mt-0 space-y-4">
              <p className="text-sm text-muted-foreground">Dados do fornecedor e entrada do veículo</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Nome do Fornecedor</Label>
                  <Input placeholder="Nome completo" value={entradaForm.nomeFornecedor} onChange={e => setEntradaForm(p => ({ ...p, nomeFornecedor: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">CPF / CNPJ</Label>
                  <Input placeholder="000.000.000-00" value={entradaForm.cpfCnpj} onChange={e => setEntradaForm(p => ({ ...p, cpfCnpj: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Data de Entrada</Label>
                  <Input type="date" value={entradaForm.dataEntrada} onChange={e => setEntradaForm(p => ({ ...p, dataEntrada: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Observações</Label>
                <Textarea placeholder="Informações adicionais sobre a entrada do veículo..." value={entradaForm.observacoes} onChange={e => setEntradaForm(p => ({ ...p, observacoes: e.target.value }))} rows={3} />
              </div>
              <Button onClick={handleSaveEntrada}>Salvar Dados de Entrada</Button>

              {entrada && (
                <div className="mt-4 border rounded-lg p-4 bg-muted/20 space-y-2">
                  <h4 className="text-sm font-semibold">Dados salvos</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Fornecedor: </span>{entrada.nomeForncedor || '—'}</div>
                    <div><span className="text-muted-foreground">CPF/CNPJ: </span>{entrada.cpfCnpjFornecedor || '—'}</div>
                    <div><span className="text-muted-foreground">Data entrada: </span>{entrada.dataEntrada ? new Date(entrada.dataEntrada).toLocaleDateString('pt-BR') : '—'}</div>
                  </div>
                </div>
              )}
            </TabsContent>

          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}