import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Trash2, Eye } from 'lucide-react';
import { store, Veiculo } from '../lib/store';
import { VeiculoDialog } from '../components/VeiculoDialog';
import { VeiculoDetalhesModal } from '../components/Veiculodetalhesmodal';
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

export function Estoque() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<Veiculo | null>(null);

  const loadData = () => {
    setVeiculos(store.getVeiculos());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = (id: string) => {
    store.deleteVeiculo(id);
    loadData();
  };

  const handleVeiculoSaved = () => {
    loadData();
    setDialogOpen(false);
  };

  const handleVerDetalhes = (veiculo: Veiculo) => {
    setVeiculoSelecionado(veiculo);
    setDetalhesOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      disponivel: 'default',
      vendido: 'secondary',
      reservado: 'outline',
      em_transito: 'outline',
    };
    const labels: Record<string, string> = {
      disponivel: 'Disponível',
      vendido: 'Vendido',
      reservado: 'Reservado',
      em_transito: 'Em Transporte',
    };
    return (
      <Badge variant={variants[status]} className={status === 'em_transito' ? 'bg-blue-100 text-blue-800' : ''}>
        {labels[status]}
      </Badge>
    );
  };

  const getOrigemBadge = (origem: string) => {
    const labels: Record<string, string> = {
      leilao: 'Leilão',
      particular: 'Particular',
      troca: 'Troca',
      concessionaria: 'Concessionária',
      outros: 'Outros',
    };
    const colors: Record<string, string> = {
      leilao: 'bg-purple-100 text-purple-800',
      particular: 'bg-green-100 text-green-800',
      troca: 'bg-orange-100 text-orange-800',
      concessionaria: 'bg-blue-100 text-blue-800',
      outros: 'bg-gray-100 text-gray-800',
    };
    return (
      <Badge className={colors[origem] || colors.outros}>
        {labels[origem] || labels.outros}
      </Badge>
    );
  };

  const veiculosDisponiveis = veiculos.filter(v => v.status === 'disponivel');
  const valorEstoque = veiculosDisponiveis.reduce((sum, v) => sum + v.preco, 0);
  const valorCusto = veiculosDisponiveis.reduce((sum, v) => sum + v.precoCompra, 0);
  const margemPotencial = valorEstoque - valorCusto;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Estoque</h1>
          <p className="text-muted-foreground">Gerencie o estoque de veículos</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Veículo
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Veículos Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{veiculosDisponiveis.length}</div>
            <p className="text-xs text-muted-foreground">
              Total de {veiculos.length} veículos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor em Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {valorEstoque.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">Preço de venda</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Margem Potencial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {margemPotencial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              {veiculosDisponiveis.length > 0 ? ((margemPotencial / valorEstoque) * 100).toFixed(1) : 0}% de margem
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Veículos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Veículos</CardTitle>
        </CardHeader>
        <CardContent>
          {veiculos.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Placa</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead>Cor</TableHead>
                    <TableHead>KM</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Preço Compra</TableHead>
                    <TableHead>Preço Venda</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {veiculos.map((veiculo) => (
                    <TableRow
                      key={veiculo.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleVerDetalhes(veiculo)}
                    >
                      <TableCell className="font-medium">{veiculo.placa}</TableCell>
                      <TableCell>
                        {veiculo.marca} {veiculo.modelo}
                        {veiculo.origem === 'leilao' && veiculo.dadosLeilao && (
                          <div className="text-xs text-muted-foreground">
                            {veiculo.dadosLeilao.cidadeOrigem}/{veiculo.dadosLeilao.estadoOrigem}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{veiculo.ano}</TableCell>
                      <TableCell>{veiculo.cor}</TableCell>
                      <TableCell>{veiculo.km.toLocaleString('pt-BR')} km</TableCell>
                      <TableCell>{getOrigemBadge(veiculo.origem)}</TableCell>
                      <TableCell>
                        {veiculo.precoCompra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
                      <TableCell>
                        {veiculo.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
                      <TableCell>{getStatusBadge(veiculo.status)}</TableCell>
                      <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleVerDetalhes(veiculo)}
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={veiculo.status === 'vendido'}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir este veículo do estoque? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(veiculo.id)}>
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Nenhum veículo no estoque</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Primeiro Veículo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <VeiculoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleVeiculoSaved}
      />

      <VeiculoDetalhesModal
        veiculo={veiculoSelecionado}
        open={detalhesOpen}
        onOpenChange={setDetalhesOpen}
        onUpdate={loadData}
      />
    </div>
  );
}