import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Trash2, FileText, CheckCircle, Clock } from 'lucide-react';
import { store, Venda, Veiculo } from '../lib/store';
import { VendaDialogCompleto } from '../components/VendaDialogCompleto';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';

export function Vendas() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadData = () => {
    setVendas(store.getVendas());
    setVeiculos(store.getVeiculos());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = (id: string) => {
    store.deleteVenda(id);
    loadData();
  };

  const handleVendaSaved = () => {
    loadData();
    setDialogOpen(false);
  };

  const getFormaPagamentoLabel = (forma: string) => {
    const labels: Record<string, string> = {
      dinheiro: 'Dinheiro',
      financiamento: 'Financiamento',
      cartao: 'Cartão',
      transferencia: 'Transferência',
    };
    return labels[forma] || forma;
  };

  const veiculosDisponiveis = veiculos.filter(v => v.status === 'disponivel');
  const totalVendas = vendas.reduce((sum, v) => sum + v.valorVenda, 0);
  const totalLucro = vendas.reduce((sum, v) => sum + v.lucro, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vendas</h1>
          <p className="text-muted-foreground">Gerencie as vendas de veículos</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} disabled={veiculosDisponiveis.length === 0}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Venda
        </Button>
      </div>

      {veiculosDisponiveis.length === 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <p className="text-sm text-orange-900">
              Não há veículos disponíveis para venda. Adicione veículos no estoque primeiro.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">{vendas.length} vendas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lucro Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalLucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              Margem: {vendas.length > 0 ? ((totalLucro / totalVendas) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vendas.length > 0
                ? (totalVendas / vendas.length).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                : 'R$ 0,00'}
            </div>
            <p className="text-xs text-muted-foreground">Por venda</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Vendas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          {vendas.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Forma de Pagamento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Lucro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendas.map((venda) => (
                    <TableRow key={venda.id}>
                      <TableCell>
                        {new Date(venda.dataVenda).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-medium">{venda.veiculo}</TableCell>
                      <TableCell>{venda.cliente}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getFormaPagamentoLabel(venda.formaPagamento)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {venda.valorVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {venda.lucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(venda.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Nenhuma venda registrada ainda</p>
              <Button onClick={() => setDialogOpen(true)} disabled={veiculosDisponiveis.length === 0}>
                <Plus className="mr-2 h-4 w-4" />
                Registrar Primeira Venda
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <VendaDialogCompleto 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        onSave={handleVendaSaved}
        veiculos={veiculosDisponiveis}
      />
    </div>
  );
}