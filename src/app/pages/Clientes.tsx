import { formatarData } from '../lib/datas';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { store } from '../lib/store';
import { Badge } from '../components/ui/badge';
import { Search, Users, Phone, Mail, Trash2, Pencil, Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

function ClienteDetalhesModal({ cliente, vendas, open, onOpenChange }: {
  cliente: any | null;
  vendas: any[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!cliente) return null;

  const vendasCliente = vendas.filter(v => v.clienteId === cliente.id);
  const totalGasto = vendasCliente.reduce((sum, v) => sum + v.valorVenda, 0);

  const linha = (label: string, valor: string | undefined | null) =>
    valor ? (
      <div className="flex justify-between py-2 border-b last:border-0 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-right max-w-[60%]">{valor}</span>
      </div>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Dados Pessoais</p>
            <div className="bg-muted rounded-lg px-4 py-1">
              {linha('Nome', cliente.nome)}
              {linha('CPF / CNPJ', cliente.cpf)}
              {linha('Cadastrado em', cliente.dataCadastro ? formatarData(cliente.dataCadastro) : null)}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Contato</p>
            <div className="bg-muted rounded-lg px-4 py-1">
              {linha('Telefone', cliente.telefone)}
              {linha('E-mail', cliente.email)}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Histórico de Compras</p>
            <div className="bg-muted rounded-lg px-4 py-1">
              {linha('Total de compras', vendasCliente.length > 0 ? `${vendasCliente.length} compra${vendasCliente.length > 1 ? 's' : ''}` : 'Nenhuma')}
              {totalGasto > 0 && linha('Total gasto', totalGasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))}
            </div>
            {vendasCliente.length > 0 && (
              <div className="mt-2 space-y-2">
                {vendasCliente.map(v => (
                  <div key={v.id} className="flex justify-between items-center p-3 border rounded-lg text-sm">
                    <div>
                      <p className="font-medium">{v.veiculo}</p>
                      <p className="text-xs text-muted-foreground">{new Date(v.dataVenda + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                    </div>
                    <span className="font-medium text-green-600">{v.valorVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Clientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isVisualizador } = useAuth();
  const [busca, setBusca] = useState('');

  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [clienteVisualizando, setClienteVisualizando] = useState<any | null>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<any | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editCpf, setEditCpf] = useState('');
  const [editTelefone, setEditTelefone] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const loadData = async () => {
    setLoading(true);
    const [c, v] = await Promise.all([store.getClientesAsync(), store.getVendasAsync()]);
    setClientes(c);
    setVendas(v);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (id: string) => {
    await supabase.from('clientes').delete().eq('id', id);
    loadData();
  };

  const abrirDetalhes = (cliente: any) => {
    setClienteVisualizando(cliente);
    setDetalhesOpen(true);
  };

  const abrirEdicao = (cliente: any) => {
    setSelectedCliente(cliente);
    setEditNome(cliente.nome || '');
    setEditCpf(cliente.cpf || '');
    setEditTelefone(cliente.telefone || '');
    setEditEmail(cliente.email || '');
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCliente) return;
    const { error } = await supabase.from('clientes').update({
      nome: editNome,
      cpf: editCpf || null,
      telefone: editTelefone || null,
      email: editEmail || null,
    }).eq('id', selectedCliente.id);
    if (error) { toast.error('Erro ao salvar alterações'); return; }
    toast.success('Cliente atualizado com sucesso!');
    setEditDialogOpen(false);
    setSelectedCliente(null);
    loadData();
  };

  const clientesFiltrados = clientes.filter(c => {
    const termo = busca.toLowerCase();
    return !busca ||
      c.nome.toLowerCase().includes(termo) ||
      c.cpf?.toLowerCase().includes(termo) ||
      c.telefone?.toLowerCase().includes(termo) ||
      c.email?.toLowerCase().includes(termo);
  });

  const getVendasCliente = (clienteId: string) => vendas.filter(v => v.clienteId === clienteId);
  const getTotalCompras = (clienteId: string) => getVendasCliente(clienteId).reduce((sum, v) => sum + v.valorVenda, 0);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Carregando clientes...</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Clientes</h1>
        <p className="text-muted-foreground">Todos os clientes cadastrados no sistema</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Users className="h-4 w-4" />Total de Clientes</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{clientes.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Clientes com Compras</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{clientes.filter(c => getVendasCliente(c.id).length > 0).length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total em Vendas</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{vendas.reduce((sum, v) => sum + v.valorVenda, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome, CPF/CNPJ, telefone ou e-mail..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9" />
            </div>
            {busca && <p className="text-sm text-muted-foreground whitespace-nowrap">{clientesFiltrados.length} encontrado(s)</p>}
          </div>
        </CardHeader>
        <CardContent>
          {clientesFiltrados.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF / CNPJ</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Compras</TableHead>
                    <TableHead>Total Gasto</TableHead>
                    <TableHead>Cadastrado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientesFiltrados.map(cliente => {
                    const vendasCliente = getVendasCliente(cliente.id);
                    const total = getTotalCompras(cliente.id);
                    return (
                      <TableRow key={cliente.id}>
                        <TableCell className="font-medium">{cliente.nome}</TableCell>
                        <TableCell className="text-muted-foreground">{cliente.cpf || '—'}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {cliente.telefone && <div className="flex items-center gap-1 text-sm"><Phone className="h-3 w-3 text-muted-foreground" />{cliente.telefone}</div>}
                            {cliente.email && <div className="flex items-center gap-1 text-sm text-muted-foreground"><Mail className="h-3 w-3" />{cliente.email}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {vendasCliente.length > 0 ? (
                            <Badge variant="secondary">{vendasCliente.length} compra{vendasCliente.length > 1 ? 's' : ''}</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Nenhuma</span>
                          )}
                        </TableCell>
                        <TableCell className={total > 0 ? 'font-medium text-green-600' : 'text-muted-foreground'}>
                          {total > 0 ? total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {cliente.dataCadastro ? formatarData(cliente.dataCadastro) : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => abrirDetalhes(cliente)} title="Visualizar cliente">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            {!isVisualizador && (
                              <Button variant="ghost" size="icon" onClick={() => abrirEdicao(cliente)} title="Editar cliente">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {!isVisualizador && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={vendasCliente.length > 0}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>Tem certeza que deseja excluir o cliente <strong>{cliente.nome}</strong>? Esta ação não pode ser desfeita.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(cliente.id)}>Excluir</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{busca ? 'Nenhum cliente encontrado com esse filtro' : 'Nenhum cliente cadastrado ainda'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <ClienteDetalhesModal
        cliente={clienteVisualizando}
        vendas={vendas}
        open={detalhesOpen}
        onOpenChange={(v) => { if (!v) setClienteVisualizando(null); setDetalhesOpen(v); }}
      />

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>Atualize os dados do cliente</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome completo*</Label>
              <Input value={editNome} onChange={e => setEditNome(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>CPF / CNPJ</Label>
              <Input value={editCpf} onChange={e => setEditCpf(e.target.value)} placeholder="000.000.000-00" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={editTelefone} onChange={e => setEditTelefone(e.target.value)} placeholder="(85) 99999-9999" />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="email@exemplo.com" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setEditDialogOpen(false); setSelectedCliente(null); }}>Cancelar</Button>
              <Button type="submit">Salvar alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}