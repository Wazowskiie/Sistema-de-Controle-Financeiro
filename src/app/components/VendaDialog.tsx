import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { store, Veiculo } from '../lib/store';

interface VendaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  veiculos: Veiculo[];
}

export function VendaDialog({ open, onOpenChange, onSave, veiculos }: VendaDialogProps) {
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<string>('');
  const [cliente, setCliente] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [valorVenda, setValorVenda] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const veiculo = veiculos.find(v => v.id === veiculoSelecionado);
    if (!veiculo) return;

    store.saveVenda({
      veiculoId: veiculo.id,
      veiculo: `${veiculo.marca} ${veiculo.modelo} ${veiculo.ano}`,
      cliente,
      cpf,
      telefone,
      valorVenda: parseFloat(valorVenda),
      valorCusto: veiculo.precoCompra,
      formaPagamento: formaPagamento as any,
      dataVenda: new Date().toISOString().split('T')[0],
    });

    // Limpar formulário
    setVeiculoSelecionado('');
    setCliente('');
    setCpf('');
    setTelefone('');
    setValorVenda('');
    setFormaPagamento('');
    
    onSave();
  };

  const veiculoAtual = veiculos.find(v => v.id === veiculoSelecionado);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Venda</DialogTitle>
          <DialogDescription>
            Preencha os dados para registrar uma nova venda de veículo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="veiculo">Veículo*</Label>
            <Select value={veiculoSelecionado} onValueChange={setVeiculoSelecionado} required>
              <SelectTrigger id="veiculo">
                <SelectValue placeholder="Selecione o veículo" />
              </SelectTrigger>
              <SelectContent>
                {veiculos.map((veiculo) => (
                  <SelectItem key={veiculo.id} value={veiculo.id}>
                    {veiculo.marca} {veiculo.modelo} {veiculo.ano} - {veiculo.placa}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {veiculoAtual && (
              <p className="text-sm text-muted-foreground">
                Preço sugerido: {veiculoAtual.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente*</Label>
            <Input
              id="cliente"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Nome completo"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF*</Label>
              <Input
                id="cpf"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone*</Label>
              <Input
                id="telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valorVenda">Valor da Venda*</Label>
            <Input
              id="valorVenda"
              type="number"
              value={valorVenda}
              onChange={(e) => setValorVenda(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="formaPagamento">Forma de Pagamento*</Label>
            <Select value={formaPagamento} onValueChange={setFormaPagamento} required>
              <SelectTrigger id="formaPagamento">
                <SelectValue placeholder="Selecione a forma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="financiamento">Financiamento</SelectItem>
                <SelectItem value="cartao">Cartão</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Registrar Venda</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}