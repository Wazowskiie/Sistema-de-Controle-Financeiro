import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { store, Veiculo } from '../lib/store';

type Origem = 'leilao' | 'particular' | 'troca' | 'concessionaria' | 'netcarros' | 'site' | 'outros';

interface VeiculoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  veiculo?: Veiculo | null; // se passado, modo edição
}

export function VeiculoDialog({ open, onOpenChange, onSave, veiculo: veiculoEdicao }: VeiculoDialogProps) {
  const modoEdicao = !!veiculoEdicao;

  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [anoModelo, setAnoModelo] = useState('');
  const [cor, setCor] = useState('');
  const [placa, setPlaca] = useState('');
  const [km, setKm] = useState('');
  const [precoCompra, setPrecoCompra] = useState('');
  const [precoRepasse, setPrecoRepasse] = useState('');
  const [preco, setPreco] = useState('');
  const [origem, setOrigem] = useState<Origem>('particular');
  const [cidadeOrigem, setCidadeOrigem] = useState('');
  const [estadoOrigem, setEstadoOrigem] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Leilão
  const [nomeEventoLeilao, setNomeEventoLeilao] = useState('');
  const [numeroLote, setNumeroLote] = useState('');
  const [cidadeLeilao, setCidadeLeilao] = useState('');
  const [estadoLeilao, setEstadoLeilao] = useState('');
  const [dataArrematacao, setDataArrematacao] = useState('');

  // Preenche os campos ao abrir em modo edição
  useEffect(() => {
    if (open && veiculoEdicao) {
      setMarca(veiculoEdicao.marca);
      setModelo(veiculoEdicao.modelo);
      setAno(veiculoEdicao.ano.toString());
      setAnoModelo(veiculoEdicao.anoModelo || '');
      setCor(veiculoEdicao.cor);
      setPlaca(veiculoEdicao.placa);
      setKm(veiculoEdicao.km.toString());
      setPrecoCompra(veiculoEdicao.precoCompra.toString());
      setPreco(veiculoEdicao.preco.toString());
      setOrigem(veiculoEdicao.origem as Origem);
      setCidadeOrigem(veiculoEdicao.cidadeOrigem || '');
      setEstadoOrigem(veiculoEdicao.estadoOrigem || '');
      if (veiculoEdicao.dadosLeilao) {
        setNomeEventoLeilao(veiculoEdicao.dadosLeilao.nomeEventoLeilao);
        setNumeroLote(veiculoEdicao.dadosLeilao.numeroLote);
        setCidadeLeilao(veiculoEdicao.dadosLeilao.cidadeOrigem);
        setEstadoLeilao(veiculoEdicao.dadosLeilao.estadoOrigem);
        setDataArrematacao(veiculoEdicao.dadosLeilao.dataArrematacao);
      }
    } else if (open && !veiculoEdicao) {
      // reset ao abrir para cadastro
      setMarca(''); setModelo(''); setAno(''); setAnoModelo(''); setCor(''); setPlaca('');
      setKm(''); setPrecoCompra(''); setPrecoRepasse(''); setPreco(''); setOrigem('particular');
      setCidadeOrigem(''); setEstadoOrigem('');
      setNomeEventoLeilao(''); setNumeroLote(''); setCidadeLeilao(''); setEstadoLeilao(''); setDataArrematacao('');
    }
  }, [open, veiculoEdicao]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);

    const cidadeFinal = origem === 'leilao' ? cidadeLeilao : cidadeOrigem;
    const estadoFinal = origem === 'leilao' ? estadoLeilao : estadoOrigem;
    const dadosLeilao = origem === 'leilao' ? { nomeEventoLeilao, numeroLote, cidadeOrigem: cidadeLeilao, estadoOrigem: estadoLeilao, dataArrematacao } : undefined;

    const { supabase } = await import('../lib/supabase');

    if (modoEdicao && veiculoEdicao) {
      // MODO EDIÇÃO — atualiza diretamente no Supabase
      const origemStr = `origem:${origem}` + (dadosLeilao ? ` leilao_json:${JSON.stringify(dadosLeilao)}` : '');
      const { error } = await supabase.from('veiculos').update({
        marca,
        modelo,
        ano_fabricacao: parseInt(ano),
        ano_modelo: parseInt(ano),
        ano_modelo_texto: anoModelo || null,
        cor,
        placa: placa || null,
        km: parseFloat(km),
        preco_compra: parseFloat(precoCompra),
        preco_venda: preco ? parseFloat(preco) : 0,
        cidade_origem: cidadeFinal || null,
        estado_origem: estadoFinal || null,
        observacoes: origemStr,
      }).eq('id', veiculoEdicao.id);

      if (error) { console.error('updateVeiculo:', error); setSalvando(false); return; }

      // Atualizar preços nos extras se repasse foi preenchido
      if (precoRepasse) {
        await supabase.from('veiculo_extras').delete().eq('veiculo_id', veiculoEdicao.id).eq('tipo', 'precos');
        await supabase.from('veiculo_extras').insert({
          veiculo_id: veiculoEdicao.id,
          tipo: 'precos',
          dados: {
            veiculoId: veiculoEdicao.id,
            precoPagoBanco: parseFloat(precoCompra),
            precoRepasseParceiro: parseFloat(precoRepasse),
            precoVendaFinal: preco ? parseFloat(preco) : 0,
          }
        });
      }
    } else {
      // MODO CADASTRO — insere novo veículo
      const origemStr = `origem:${origem}` + (origem === 'leilao' && nomeEventoLeilao ? ` leilao_json:${JSON.stringify({ nomeEventoLeilao, numeroLote, cidadeOrigem: cidadeLeilao, estadoOrigem: estadoLeilao, dataArrematacao })}` : '');
      const { data: novoVeiculo, error: veicErr } = await supabase.from('veiculos').insert({
        tipo_veiculo: 'carro',
        marca, modelo,
        ano_fabricacao: parseInt(ano),
        ano_modelo: parseInt(ano),
        ano_modelo_texto: anoModelo || null,
        cor, placa: placa || null,
        km: parseFloat(km),
        preco_compra: parseFloat(precoCompra),
        preco_venda: preco ? parseFloat(preco) : 0,
        status: 'disponivel',
        data_entrada: new Date().toISOString().split('T')[0],
        cidade_origem: cidadeFinal || null,
        estado_origem: estadoFinal || null,
        observacoes: origemStr,
        status_pagamento: 'pendente',
      }).select('id').single();

      if (veicErr) { console.error('saveVeiculo:', veicErr); setSalvando(false); return; }

      if (precoRepasse && novoVeiculo) {
        await supabase.from('veiculo_extras').insert({
          veiculo_id: novoVeiculo.id,
          tipo: 'precos',
          dados: {
            veiculoId: novoVeiculo.id,
            precoPagoBanco: parseFloat(precoCompra),
            precoRepasseParceiro: parseFloat(precoRepasse),
            precoVendaFinal: preco ? parseFloat(preco) : 0,
          }
        });
      }
    }

    setSalvando(false);
    onSave();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{modoEdicao ? 'Editar Veículo' : 'Adicionar Veículo'}</DialogTitle>
          <DialogDescription>{modoEdicao ? 'Edite as informações do veículo.' : 'Cadastre um novo veículo no estoque.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Marca*</Label><Input value={marca} onChange={e => setMarca(e.target.value)} placeholder="Ex: Toyota" required /></div>
            <div className="space-y-2"><Label>Modelo*</Label><Input value={modelo} onChange={e => setModelo(e.target.value)} placeholder="Ex: Corolla" required /></div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Ano Fabricação*</Label>
              <Input type="number" value={ano} onChange={e => setAno(e.target.value)} placeholder="2023" min="1900" max="2030" required />
            </div>
            <div className="space-y-2">
              <Label>Ano Modelo</Label>
              <Input value={anoModelo} onChange={e => setAnoModelo(e.target.value)} placeholder="2023/24" />
              <p className="text-xs text-muted-foreground">Ex: 2023/24</p>
            </div>
            <div className="space-y-2"><Label>Cor*</Label><Input value={cor} onChange={e => setCor(e.target.value)} placeholder="Ex: Preto" required /></div>
            <div className="space-y-2"><Label>Placa*</Label><Input value={placa} onChange={e => setPlaca(e.target.value.toUpperCase())} placeholder="ABC-1234" required /></div>
          </div>

          <div className="space-y-2">
            <Label>Quilometragem*</Label>
            <Input type="number" value={km} onChange={e => setKm(e.target.value)} placeholder="50000" min="0" required />
          </div>

          <div className="space-y-2">
            <Label>Origem do Veículo*</Label>
            <Select value={origem} onValueChange={(v: any) => setOrigem(v)}>
              <SelectTrigger><SelectValue placeholder="Selecione a origem" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="leilao">Leilão</SelectItem>
                <SelectItem value="particular">Particular</SelectItem>
                <SelectItem value="troca">Troca</SelectItem>
                <SelectItem value="concessionaria">Concessionária</SelectItem>
                <SelectItem value="netcarros">Netcarros</SelectItem>
                <SelectItem value="site">Site</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {origem !== 'leilao' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cidade de Origem</Label>
                <Input value={cidadeOrigem} onChange={e => setCidadeOrigem(e.target.value)} placeholder="Ex: Salvador" />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input value={estadoOrigem} onChange={e => setEstadoOrigem(e.target.value.toUpperCase())} placeholder="BA" maxLength={2} />
              </div>
            </div>
          )}

          {origem === 'leilao' && (
            <div className="space-y-4 border rounded-lg p-4 bg-blue-50">
              <h4 className="font-medium text-sm">Informações do Leilão</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nome do Evento/Leilão*</Label><Input value={nomeEventoLeilao} onChange={e => setNomeEventoLeilao(e.target.value)} placeholder="Ex: Leilão SulBrasil" required /></div>
                <div className="space-y-2"><Label>Número do Lote*</Label><Input value={numeroLote} onChange={e => setNumeroLote(e.target.value)} placeholder="Ex: 12345" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Cidade de Origem*</Label><Input value={cidadeLeilao} onChange={e => setCidadeLeilao(e.target.value)} placeholder="Ex: São Paulo" required /></div>
                <div className="space-y-2"><Label>Estado*</Label><Input value={estadoLeilao} onChange={e => setEstadoLeilao(e.target.value.toUpperCase())} placeholder="SP" maxLength={2} required /></div>
              </div>
              <div className="space-y-2"><Label>Data de Arrematação*</Label><Input type="date" value={dataArrematacao} onChange={e => setDataArrematacao(e.target.value)} required /></div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Preço de Compra*</Label>
              <Input type="number" value={precoCompra} onChange={e => setPrecoCompra(e.target.value)} placeholder="80000.00" step="0.01" min="0" required />
            </div>
            <div className="space-y-2">
              <Label>Preço de Repasse</Label>
              <Input type="number" value={precoRepasse} onChange={e => setPrecoRepasse(e.target.value)} placeholder="85000.00" step="0.01" min="0" />
              <p className="text-xs text-muted-foreground">Valor repassado ao parceiro</p>
            </div>
            <div className="space-y-2">
              <Label>Preço de Venda</Label>
              <Input type="number" value={preco} onChange={e => setPreco(e.target.value)} placeholder="Definir depois" step="0.01" min="0" />
              <p className="text-xs text-muted-foreground">Pode ser definido depois</p>
            </div>
          </div>

          {precoCompra && preco && parseFloat(preco) > parseFloat(precoCompra) && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-900">
              Margem de lucro: {(parseFloat(preco) - parseFloat(precoCompra)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              {' '}({((parseFloat(preco) - parseFloat(precoCompra)) / parseFloat(preco) * 100).toFixed(1)}%)
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={salvando}>{salvando ? 'Salvando...' : modoEdicao ? 'Salvar Alterações' : 'Adicionar Veículo'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}