import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { store, Despesa } from '../lib/store';
import { DespesaDialog } from '../components/DespesaDialog';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { useAuth } from '../contexts/AuthContext';

export function Despesas() {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isVisualizador } = useAuth();

  const loadData = async () => {
    setLoading(true);
    setDespesas(await store.getDespesasAsync());
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (id: string) => { await store.deleteDespesa(id); loadData(); };
  const handleDespesaSaved = () => { loadData(); setDialogOpen(false); };

  const getCategoriaInfo = (categoria: string) => {
    const info: Record<string, { label: string; color: string }> = {
      aluguel: { label: 'Aluguel', color: 'bg-blue-100 text-blue-800' },
      salarios: { label: 'Salários', color: 'bg-purple-100 text-purple-800' },
      impostos: { label: 'Impostos', color: 'bg-red-100 text-red-800' },
      manutencao: { label: 'Manutenção', color: 'bg-yellow-100 text-yellow-800' },
      marketing: { label: 'Marketing', color: 'bg-green-100 text-green-800' },
      outros: { label: 'Outros', color: 'bg-gray-100 text-gray-800' },
    };
    return info[categoria] || info.outros;
  };

  const totalDespesas = despesas.reduce((sum, d) => sum + d.valor, 0);
  const despesasPorCategoria = despesas.reduce((acc, despesa) => {
    acc[despesa.categoria] = (acc[despesa.categoria] || 0) + despesa.valor;
    return acc;
  }, {} as Record<string, number>);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Carregando despesas...</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Despesas</h1><p className="text-muted-foreground">Gerencie as despesas operacionais</p></div>
        {!isVisualizador && (
          <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Nova Despesa</Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total de Despesas</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div><p className="text-xs text-muted-foreground">{despesas.length} registros</p></CardContent>
        </Card>
        {Object.entries(despesasPorCategoria).slice(0, 3).map(([categoria, valor]) => {
          const info = getCategoriaInfo(categoria);
          return (
            <Card key={categoria}>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{info.label}</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div><p className="text-xs text-muted-foreground">{((valor / totalDespesas) * 100).toFixed(1)}% do total</p></CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle>Lista de Despesas</CardTitle></CardHeader>
        <CardContent>
          {despesas.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Observações</TableHead>
                    {!isVisualizador && <TableHead className="text-right">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {despesas.map((despesa) => {
                    const info = getCategoriaInfo(despesa.categoria);
                    return (
                      <TableRow key={despesa.id}>
                        <TableCell>{new Date(despesa.data + 'T12:00:00').toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="font-medium">{despesa.descricao}</TableCell>
                        <TableCell><Badge className={info.color} variant="secondary">{info.label}</Badge></TableCell>
                        <TableCell className="text-red-600 font-medium">{despesa.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">{despesa.observacoes || '-'}</TableCell>
                        {!isVisualizador && (
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Tem certeza? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(despesa.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Nenhuma despesa registrada</p>
              {!isVisualizador && (
                <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Registrar Primeira Despesa</Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {!isVisualizador && (
        <DespesaDialog open={dialogOpen} onOpenChange={setDialogOpen} onSave={handleDespesaSaved} />
      )}
    </div>
  );
}