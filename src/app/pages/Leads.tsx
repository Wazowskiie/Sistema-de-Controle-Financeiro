import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Phone, Mail, Calendar, User, Plug } from 'lucide-react';
import { store, Lead } from '../lib/store';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { PLATFORM_DOCS } from '../lib/integrations';

export function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    veiculoInteresse: '',
    origem: '',
    vendedorId: '',
    observacoes: '',
  });

  const loadData = () => {
    setLeads(store.getLeads());
    setVendedores(store.getVendedores().filter(v => v.ativo));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vendedor = vendedores.find(v => v.id === formData.vendedorId);
    store.saveLead({
      ...formData,
      origem: formData.origem as any,
      status: 'novo',
      vendedor: vendedor?.nome,
    });
    setFormData({
      nome: '',
      telefone: '',
      email: '',
      veiculoInteresse: '',
      origem: '',
      vendedorId: '',
      observacoes: '',
    });
    setDialogOpen(false);
    loadData();
  };

  const handleUpdateStatus = (id: string, status: string) => {
    store.updateLead(id, { status: status as any });
    loadData();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      novo: 'default',
      contato_realizado: 'secondary',
      proposta_enviada: 'secondary',
      negociacao: 'default',
      perdido: 'destructive',
      convertido: 'default',
    };
    
    const labels: Record<string, string> = {
      novo: 'Novo',
      contato_realizado: 'Contato Realizado',
      proposta_enviada: 'Proposta Enviada',
      negociacao: 'Negociação',
      perdido: 'Perdido',
      convertido: 'Convertido',
    };

    return (
      <Badge variant={variants[status]} className={status === 'convertido' ? 'bg-green-600' : ''}>
        {labels[status]}
      </Badge>
    );
  };

  const getOrigemLabel = (origem: string) => {
    const labels: Record<string, string> = {
      telefone: 'Telefone',
      whatsapp: 'WhatsApp',
      site: 'Site',
      indicacao: 'Indicação',
      redes_sociais: 'Redes Sociais',
      presencial: 'Presencial',
    };
    return labels[origem] || origem;
  };

  const leadsFiltrados = filtroStatus === 'todos' 
    ? leads 
    : leads.filter(l => l.status === filtroStatus);

  const estatisticas = {
    total: leads.length,
    novos: leads.filter(l => l.status === 'novo').length,
    emNegociacao: leads.filter(l => l.status === 'negociacao').length,
    convertidos: leads.filter(l => l.status === 'convertido').length,
    taxaConversao: leads.length > 0 
      ? ((leads.filter(l => l.status === 'convertido').length / leads.length) * 100).toFixed(1)
      : '0',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads & CRM</h1>
          <p className="text-muted-foreground">Gerencie prospects e o funil de vendas</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Lead
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Novos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{estatisticas.novos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Em Negociação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{estatisticas.emNegociacao}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{estatisticas.taxaConversao}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filtroStatus === 'todos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroStatus('todos')}
            >
              Todos ({leads.length})
            </Button>
            <Button
              variant={filtroStatus === 'novo' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroStatus('novo')}
            >
              Novos ({estatisticas.novos})
            </Button>
            <Button
              variant={filtroStatus === 'contato_realizado' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroStatus('contato_realizado')}
            >
              Contato Realizado
            </Button>
            <Button
              variant={filtroStatus === 'proposta_enviada' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroStatus('proposta_enviada')}
            >
              Proposta Enviada
            </Button>
            <Button
              variant={filtroStatus === 'negociacao' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroStatus('negociacao')}
            >
              Em Negociação
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Leads */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {leadsFiltrados.length > 0 ? (
          leadsFiltrados.map((lead) => (
            <Card key={lead.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">{lead.nome}</CardTitle>
                  </div>
                  {getStatusBadge(lead.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{lead.telefone}</span>
                  </div>
                  {lead.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                  )}
                  {lead.veiculoInteresse && (
                    <div className="text-sm">
                      <span className="font-medium">Interesse:</span> {lead.veiculoInteresse}
                    </div>
                  )}
                  {lead.vendedor && (
                    <div className="text-sm">
                      <span className="font-medium">Vendedor:</span> {lead.vendedor}
                    </div>
                  )}
                  <div className="pt-1 flex gap-2 items-center">
                    <Badge variant="outline">{getOrigemLabel(lead.origem)}</Badge>
                    {lead.integrationSource && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Plug className="h-3 w-3" />
                        {PLATFORM_DOCS[lead.integrationSource.platform as keyof typeof PLATFORM_DOCS]?.name || lead.integrationSource.platform}
                      </Badge>
                    )}
                  </div>
                </div>

                {lead.proximoFollowUp && (
                  <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Follow-up: {new Date(lead.proximoFollowUp).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}

                {lead.observacoes && (
                  <p className="text-sm text-muted-foreground border-t pt-2">
                    {lead.observacoes}
                  </p>
                )}

                <div className="pt-2">
                  <Select
                    value={lead.status}
                    onValueChange={(value) => handleUpdateStatus(lead.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="contato_realizado">Contato Realizado</SelectItem>
                      <SelectItem value="proposta_enviada">Proposta Enviada</SelectItem>
                      <SelectItem value="negociacao">Negociação</SelectItem>
                      <SelectItem value="perdido">Perdido</SelectItem>
                      <SelectItem value="convertido">Convertido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Nenhum lead encontrado com este filtro
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Novo Lead
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Dialog de Cadastro */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Lead</DialogTitle>
            <DialogDescription>
              Cadastre um novo prospect no funil de vendas.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome*</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone*</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="veiculoInteresse">Veículo de Interesse</Label>
              <Input
                id="veiculoInteresse"
                value={formData.veiculoInteresse}
                onChange={(e) => setFormData({ ...formData, veiculoInteresse: e.target.value })}
                placeholder="Ex: Honda Civic 2023"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="origem">Origem*</Label>
                <Select
                  value={formData.origem}
                  onValueChange={(value) => setFormData({ ...formData, origem: value })}
                  required
                >
                  <SelectTrigger id="origem">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="telefone">Telefone</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="site">Site</SelectItem>
                    <SelectItem value="indicacao">Indicação</SelectItem>
                    <SelectItem value="redes_sociais">Redes Sociais</SelectItem>
                    <SelectItem value="presencial">Presencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendedor">Vendedor</Label>
                <Select
                  value={formData.vendedorId}
                  onValueChange={(value) => setFormData({ ...formData, vendedorId: value })}
                >
                  <SelectTrigger id="vendedor">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendedores.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Cadastrar Lead</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}