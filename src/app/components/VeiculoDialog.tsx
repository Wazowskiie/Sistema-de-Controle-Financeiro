import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { store } from '../lib/store';

interface VeiculoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function VeiculoDialog({ open, onOpenChange, onSave }: VeiculoDialogProps) {
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [cor, setCor] = useState('');
  const [placa, setPlaca] = useState('');
  const [km, setKm] = useState('');
  const [precoCompra, setPrecoCompra] = useState('');
  const [preco, setPreco] = useState('');
  const [origem, setOrigem] = useState<'leilao' | 'particular' | 'troca' | 'concessionaria' | 'outros'>('particular');

  // Campos específicos de leilão
  const [nomeEventoLeilao, setNomeEventoLeilao] = useState('');
  const [numeroLote, setNumeroLote] = useState('');
  const [cidadeOrigem, setCidadeOrigem] = useState('');
  const [estadoOrigem, setEstadoOrigem] = useState('');
  const [dataArrematacao, setDataArrematacao] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    store.saveVeiculo({
      marca,
      modelo,
      ano: parseInt(ano),
      cor,
      placa,
      km: parseFloat(km),
      precoCompra: parseFloat(precoCompra),
      preco: parseFloat(preco),
      status: 'disponivel',
      dataEntrada: new Date().toISOString().split('T')[0],
      origem,
      dadosLeilao: origem === 'leilao' && nomeEventoLeilao ? {
        nomeEventoLeilao,
        numeroLote,
        cidadeOrigem,
        estadoOrigem,
        dataArrematacao,
      } : undefined,
    });

    // Limpar formulário
    setMarca('');
    setModelo('');
    setAno('');
    setCor('');
    setPlaca('');
    setKm('');
    setPrecoCompra('');
    setPreco('');
    setOrigem('particular');
    setNomeEventoLeilao('');
    setNumeroLote('');
    setCidadeOrigem('');
    setEstadoOrigem('');
    setDataArrematacao('');

    onSave();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Veículo</DialogTitle>
          <DialogDescription>
            Cadastre um novo veículo no estoque.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marca">Marca*</Label>
              <Input
                id="marca"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                placeholder="Ex: Toyota"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo*</Label>
              <Input
                id="modelo"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="Ex: Corolla"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ano">Ano*</Label>
              <Input
                id="ano"
                type="number"
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                placeholder="2023"
                min="1900"
                max="2030"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cor">Cor*</Label>
              <Input
                id="cor"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                placeholder="Ex: Preto"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="placa">Placa*</Label>
              <Input
                id="placa"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                placeholder="ABC-1234"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="km">Quilometragem*</Label>
            <Input
              id="km"
              type="number"
              value={km}
              onChange={(e) => setKm(e.target.value)}
              placeholder="50000"
              min="0"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="origem">Origem do Veículo*</Label>
            <Select value={origem} onValueChange={(value: any) => setOrigem(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="leilao">Leilão</SelectItem>
                <SelectItem value="particular">Particular</SelectItem>
                <SelectItem value="troca">Troca</SelectItem>
                <SelectItem value="concessionaria">Concessionária</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {origem === 'leilao' && (
            <div className="space-y-4 border rounded-lg p-4 bg-blue-50">
              <h4 className="font-medium text-sm">Informações do Leilão</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nomeEventoLeilao">Nome do Evento/Leilão*</Label>
                  <Input
                    id="nomeEventoLeilao"
                    value={nomeEventoLeilao}
                    onChange={(e) => setNomeEventoLeilao(e.target.value)}
                    placeholder="Ex: Leilão SulBrasil"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numeroLote">Número do Lote*</Label>
                  <Input
                    id="numeroLote"
                    value={numeroLote}
                    onChange={(e) => setNumeroLote(e.target.value)}
                    placeholder="Ex: 12345"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cidadeOrigem">Cidade de Origem*</Label>
                  <Input
                    id="cidadeOrigem"
                    value={cidadeOrigem}
                    onChange={(e) => setCidadeOrigem(e.target.value)}
                    placeholder="Ex: São Paulo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estadoOrigem">Estado de Origem*</Label>
                  <Input
                    id="estadoOrigem"
                    value={estadoOrigem}
                    onChange={(e) => setEstadoOrigem(e.target.value.toUpperCase())}
                    placeholder="Ex: SP"
                    maxLength={2}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataArrematacao">Data de Arrematação*</Label>
                <Input
                  id="dataArrematacao"
                  type="date"
                  value={dataArrematacao}
                  onChange={(e) => setDataArrematacao(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="precoCompra">Preço de Compra*</Label>
              <Input
                id="precoCompra"
                type="number"
                value={precoCompra}
                onChange={(e) => setPrecoCompra(e.target.value)}
                placeholder="80000.00"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preco">Preço de Venda*</Label>
              <Input
                id="preco"
                type="number"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="95000.00"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>

          {precoCompra && preco && parseFloat(preco) > parseFloat(precoCompra) && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-900">
              Margem de lucro: {(parseFloat(preco) - parseFloat(precoCompra)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              {' '}({((parseFloat(preco) - parseFloat(precoCompra)) / parseFloat(preco) * 100).toFixed(1)}%)
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Adicionar Veículo</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}