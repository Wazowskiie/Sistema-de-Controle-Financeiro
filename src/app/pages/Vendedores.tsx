import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Trash2, TrendingUp, DollarSign } from 'lucide-react';
import { store, Vendedor } from '../lib/store';
import { supabase } from '../lib/supabase';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

export function Vendedores() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [vendas, setVendas] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [formData, setFormData] = useState({
    nome: '', cpf: '', telefone: '', email: '',
    percentualComissao: '', senha: '', confirmarSenha: '',
  });

  const loadData = async () => {
    setLoading(true);
    const [v, vend] = await Promise.all([store.getVendasAsync(), store.getVendedoresAsync()]);
    setVendas(v);
    setVendedores(vend);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.senha !== formData.confirmarSenha) {
      toast.error('As senhas não coincidem.');
      return;
    }
    if (formData.senha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setSalvando(true);

    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin
        ? // tenta via admin se disponível
          { data: null, error: { message: 'use_signup' } }
        : { data: null, error: { message: 'use_signup' } };

      // Usa signUp para criar a conta do vendedor
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
        options: { data: { nome: formData.nome } },
      });

      if (signUpError) {
        toast.error('Erro ao criar acesso: ' + signUpError.message);
        setSalvando(false);
        return;
      }

      // 2. Definir perfil como vendedor (o trigger cria como admin, então atualizamos)
      if (signUpData.user) {
        await supabase
          .from('perfis_usuario')
          .upsert({ auth_user_id: signUpData.user.id, papel: 'vendedor' }, { onConflict: 'auth_user_id' });
      }

      // 3. Salvar vendedor no banco
      await store.saveVendedor({
        nome: formData.nome,
        cpf: formData.cpf,
        telefone: formData.telefone,
        email: formData.email,
        percentualComissao: parseFloat(formData.percentualComissao),
        dataContratacao: new Date().toISOString().split('T')[0],
        ativo: true,
      });

      toast.success(`Vendedor ${formData.nome} cadastrado com sucesso!`);
      setFormData({ nome: '', cpf: '', telefone: '', email: '', percentualComissao: '', senha: '', confirmarSenha: '' });
      setDialogOpen(false);
      loadData();
    } catch (err) {
      toast.error('Erro inesperado ao cadastrar vendedor.');
    }

    setSalvando(false);
  };

  const handleToggleAtivo = async (id: string, ativo: boolean) => {
    await store.updateVendedor(id, { ativo: !ativo });
    loadData();
  };

  const handleDelete = async (id: string) => {
    await store.deleteVendedor(id);
    loadData();
  };

  const getVendedorStats = (vendedorId: string) => {
    const vendasVendedor = vendas.filter(v => v.vendedorId === vendedorId);
    return {
      totalVendas: vendasVendedor.length,
      totalComissoes: vendasVendedor.reduce((sum, v) => sum + (v.comissao || 0), 0),
    };
  };

  const totalComissoes = vendas.reduce((sum, v) => sum + (v.comissao || 0), 0);
  const totalVendasComVendedor = vendas.filter(v => v.vendedorId).length;

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Carregando vendedores...</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Vendedores</h1><p className="text-muted-foreground">Gerencie a equipe de vendas e comissões</p></div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Novo Vendedor</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4" />Vendedores Ativos</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{vendedores.filter(v => v.ativo).length}</div><p className="text-xs text-muted-foreground">de {vendedores.length} cadastrados</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><DollarSign className="h-4 w-4" />Total em Comissões</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalComissoes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div><p className="text-xs text-muted-foreground">em {totalVendasComVendedor} vendas</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Média de Comissão</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{vendedores.length > 0 ? (vendedores.reduce((sum, v) => sum + v.percentualComissao, 0) / vendedores.length).toFixed(1) : 0}%</div><p className="text-xs text-muted-foreground">por venda</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Lista de Vendedores</CardTitle></CardHeader>
        <CardContent>
          {vendedores.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Nome</TableHead><TableHead>Contato</TableHead><TableHead>Comissão</TableHead><TableHead>Vendas</TableHead><TableHead>Total Comissões</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {vendedores.map((vendedor) => {
                    const stats = getVendedorStats(vendedor.id);
                    return (
                      <TableRow key={vendedor.id}>
                        <TableCell><div><p className="font-medium">{vendedor.nome}</p><p className="text-sm text-muted-foreground">{vendedor.cpf}</p></div></TableCell>
                        <TableCell><div><p className="text-sm">{vendedor.telefone}</p><p className="text-sm text-muted-foreground">{vendedor.email}</p></div></TableCell>
                        <TableCell><Badge variant="secondary">{vendedor.percentualComissao}%</Badge></TableCell>
                        <TableCell>{stats.totalVendas}</TableCell>
                        <TableCell className="font-medium text-green-600">{stats.totalComissoes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                        <TableCell><Badge variant={vendedor.ativo ? 'default' : 'secondary'}>{vendedor.ativo ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleToggleAtivo(vendedor.id, vendedor.ativo)}>{vendedor.ativo ? 'Desativar' : 'Ativar'}</Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Tem certeza? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(vendedor.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
              <p className="text-muted-foreground mb-4">Nenhum vendedor cadastrado ainda</p>
              <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Cadastrar Primeiro Vendedor</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Vendedor</DialogTitle>
            <DialogDescription>Cadastre um novo vendedor. Ele usará o e-mail e senha para entrar no sistema.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Nome Completo*</Label><Input value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>CPF</Label><Input value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: e.target.value })} placeholder="000.000.000-00" /></div>
              <div className="space-y-2"><Label>Telefone*</Label><Input value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: e.target.value })} placeholder="(00) 00000-0000" required /></div>
            </div>
            <div className="space-y-2"><Label>E-mail*</Label><Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required /></div>
            <div className="space-y-2">
              <Label>Percentual de Comissão (%)*</Label>
              <Input type="number" step="0.1" min="0" max="100" value={formData.percentualComissao} onChange={e => setFormData({ ...formData, percentualComissao: e.target.value })} placeholder="3.0" required />
              <p className="text-xs text-muted-foreground">Percentual sobre o lucro de cada venda</p>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Acesso ao sistema</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Senha*</Label><Input type="password" placeholder="Mínimo 6 caracteres" value={formData.senha} onChange={e => setFormData({ ...formData, senha: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Confirmar senha*</Label><Input type="password" placeholder="Repita a senha" value={formData.confirmarSenha} onChange={e => setFormData({ ...formData, confirmarSenha: e.target.value })} required /></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">O vendedor entrará com o e-mail e essa senha com acesso limitado.</p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={salvando}>{salvando ? 'Cadastrando...' : 'Cadastrar Vendedor'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}