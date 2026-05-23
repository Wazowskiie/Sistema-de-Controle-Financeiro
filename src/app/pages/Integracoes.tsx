import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Plug,
  Settings,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  Copy,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  integrationsService,
  PLATFORM_DOCS,
  IntegrationConfig,
  IntegrationPlatform,
  getStatusColor,
  getStatusLabel,
} from '../lib/integrations';
import { store } from '../lib/store';

export function Integracoes() {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>(
    integrationsService.getIntegrations()
  );
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationConfig | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [syncingLeads, setSyncingLeads] = useState(false);

  const vendedores = store.getVendedores();
  const stats = integrationsService.getIntegrationStats();

  const refreshIntegrations = () => {
    setIntegrations(integrationsService.getIntegrations());
  };

  const handleToggleIntegration = (id: string, enabled: boolean) => {
    integrationsService.updateIntegration(id, { 
      enabled,
      status: enabled ? 'active' : 'inactive',
    });
    refreshIntegrations();
    toast.success(enabled ? 'Integração ativada' : 'Integração desativada');
  };

  const handleOpenConfig = (integration: IntegrationConfig) => {
    setSelectedIntegration(integration);
    setConfigDialogOpen(true);
  };

  const handleSaveConfig = () => {
    if (!selectedIntegration) return;

    integrationsService.updateIntegration(selectedIntegration.id, selectedIntegration);
    refreshIntegrations();
    setConfigDialogOpen(false);
    toast.success('Configurações salvas com sucesso');
  };

  const handleTestConnection = async () => {
    if (!selectedIntegration) return;

    setTestingConnection(true);
    try {
      const success = await integrationsService.testConnection(selectedIntegration.platform);
      
      if (success) {
        integrationsService.updateIntegration(selectedIntegration.id, { status: 'active' });
        refreshIntegrations();
        toast.success('Conexão testada com sucesso!');
      } else {
        integrationsService.updateIntegration(selectedIntegration.id, { status: 'error' });
        refreshIntegrations();
        toast.error('Erro ao testar conexão');
      }
    } catch (error) {
      toast.error('Erro ao testar conexão');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSyncLeads = async (platform: IntegrationPlatform) => {
    setSyncingLeads(true);
    try {
      const externalLeads = await integrationsService.syncLeads(platform);
      
      externalLeads.forEach((externalLead) => {
        const leadData = integrationsService.processExternalLead(externalLead);
        store.saveLead(leadData);
      });

      if (externalLeads.length > 0) {
        const integration = integrations.find(i => i.platform === platform);
        if (integration) {
          integrationsService.updateIntegration(integration.id, {
            leadsImported: integration.leadsImported + externalLeads.length,
            lastSync: new Date().toISOString(),
          });
        }
        refreshIntegrations();
        toast.success(`${externalLeads.length} leads sincronizados!`);
      } else {
        toast.info('Nenhum lead novo encontrado');
      }
    } catch (error) {
      toast.error('Erro ao sincronizar leads');
    } finally {
      setSyncingLeads(false);
    }
  };

  const copyWebhookUrl = async () => {
    const webhookUrl = await integrationsService.startWebhookListener();
    navigator.clipboard.writeText(webhookUrl);
    toast.success('URL do webhook copiada!');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <Plug className="h-8 w-8" />
            Integrações
          </h1>
          <p className="text-muted-foreground mt-1">
            Conecte com plataformas externas para capturar leads automaticamente
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Integrações Ativas</CardTitle>
            <Plug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}/{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Leads Importados</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Webhook URL</CardTitle>
            <Copy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={copyWebhookUrl}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar URL
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Aviso Supabase */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Info className="h-5 w-5" />
            Integrações com Supabase
          </CardTitle>
          <CardDescription className="text-blue-700">
            Para que as integrações funcionem em produção, você precisará:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-blue-800 space-y-2">
            <div>• Conectar ao Supabase para armazenar credenciais de forma segura</div>
            <div>• Criar Edge Functions para processar webhooks das plataformas</div>
            <div>• Configurar autenticação OAuth para Facebook/Instagram</div>
            <div>• As configurações abaixo preparam o sistema para essa integração</div>
          </div>
          <Button
            variant="outline"
            className="w-full mt-2 bg-white hover:bg-blue-50 border-blue-300 text-blue-900"
            onClick={() => window.open('/INTEGRACOES.md', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver Guia Completo de Configuração
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Integrações */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => {
          const docs = PLATFORM_DOCS[integration.platform];
          
          return (
            <Card key={integration.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${docs.color}20` }}
                    >
                      <div style={{ color: docs.color }}>
                        {getStatusIcon(integration.status)}
                      </div>
                    </div>
                    <div>
                      <CardTitle className="text-base">{docs.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={integration.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {getStatusLabel(integration.status)}
                        </Badge>
                        {integration.leadsImported > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {integration.leadsImported} leads
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={integration.enabled}
                    onCheckedChange={(enabled) =>
                      handleToggleIntegration(integration.id, enabled)
                    }
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{docs.description}</p>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenConfig(integration)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar
                  </Button>
                  
                  {integration.enabled && integration.status === 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSyncLeads(integration.platform)}
                      disabled={syncingLeads}
                    >
                      <RefreshCw className={`h-4 w-4 ${syncingLeads ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                </div>

                {integration.lastSync && (
                  <p className="text-xs text-muted-foreground">
                    Última sinc: {new Date(integration.lastSync).toLocaleString('pt-BR')}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog de Configuração */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedIntegration && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Configurar {PLATFORM_DOCS[selectedIntegration.platform].name}
                </DialogTitle>
                <DialogDescription>
                  Configure as credenciais e preferências da integração
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="credentials" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="credentials">Credenciais</TabsTrigger>
                  <TabsTrigger value="settings">Configurações</TabsTrigger>
                  <TabsTrigger value="docs">Como Configurar</TabsTrigger>
                </TabsList>

                <TabsContent value="credentials" className="space-y-4">
                  {PLATFORM_DOCS[selectedIntegration.platform].requiredFields.map((field) => (
                    <div key={field} className="space-y-2">
                      <Label htmlFor={field}>
                        {field === 'appId' && 'App ID'}
                        {field === 'accessToken' && 'Token de Acesso'}
                        {field === 'apiKey' && 'API Key'}
                        {field === 'webhookUrl' && 'Webhook URL'}
                        {field === 'phoneNumberId' && 'Phone Number ID'}
                      </Label>
                      <Input
                        id={field}
                        type="password"
                        placeholder={`Digite o ${field}...`}
                        value={selectedIntegration.credentials[field] || ''}
                        onChange={(e) =>
                          setSelectedIntegration({
                            ...selectedIntegration,
                            credentials: {
                              ...selectedIntegration.credentials,
                              [field]: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                  >
                    {testingConnection ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Testando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Testar Conexão
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Criar Leads Automaticamente</Label>
                      <p className="text-sm text-muted-foreground">
                        Novos leads serão criados automaticamente
                      </p>
                    </div>
                    <Switch
                      checked={selectedIntegration.settings.autoCreateLeads}
                      onCheckedChange={(checked) =>
                        setSelectedIntegration({
                          ...selectedIntegration,
                          settings: {
                            ...selectedIntegration.settings,
                            autoCreateLeads: checked,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Atribuir Vendedor Automaticamente</Label>
                      <p className="text-sm text-muted-foreground">
                        Leads serão atribuídos a um vendedor padrão
                      </p>
                    </div>
                    <Switch
                      checked={selectedIntegration.settings.autoAssignVendedor}
                      onCheckedChange={(checked) =>
                        setSelectedIntegration({
                          ...selectedIntegration,
                          settings: {
                            ...selectedIntegration.settings,
                            autoAssignVendedor: checked,
                          },
                        })
                      }
                    />
                  </div>

                  {selectedIntegration.settings.autoAssignVendedor && (
                    <div className="space-y-2">
                      <Label>Vendedor Padrão</Label>
                      <Select
                        value={selectedIntegration.settings.defaultVendedorId}
                        onValueChange={(value) =>
                          setSelectedIntegration({
                            ...selectedIntegration,
                            settings: {
                              ...selectedIntegration.settings,
                              defaultVendedorId: value,
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um vendedor" />
                        </SelectTrigger>
                        <SelectContent>
                          {vendedores
                            .filter((v) => v.ativo)
                            .map((vendedor) => (
                              <SelectItem key={vendedor.id} value={vendedor.id}>
                                {vendedor.nome}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificar Novos Leads</Label>
                      <p className="text-sm text-muted-foreground">
                        Receber notificações quando um novo lead chegar
                      </p>
                    </div>
                    <Switch
                      checked={selectedIntegration.settings.notifyOnNewLead}
                      onCheckedChange={(checked) =>
                        setSelectedIntegration({
                          ...selectedIntegration,
                          settings: {
                            ...selectedIntegration.settings,
                            notifyOnNewLead: checked,
                          },
                        })
                      }
                    />
                  </div>
                </TabsContent>

                <TabsContent value="docs" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Funcionalidades</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {PLATFORM_DOCS[selectedIntegration.platform].features.map(
                          (feature, index) => (
                            <li key={index}>• {feature}</li>
                          )
                        )}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Passos de Configuração</h4>
                      <ol className="space-y-2 text-sm text-muted-foreground">
                        {PLATFORM_DOCS[selectedIntegration.platform].setupSteps.map(
                          (step, index) => (
                            <li key={index}>
                              {index + 1}. {step}
                            </li>
                          )
                        )}
                      </ol>
                    </div>

                    {PLATFORM_DOCS[selectedIntegration.platform].docsUrl && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                          window.open(
                            PLATFORM_DOCS[selectedIntegration.platform].docsUrl!,
                            '_blank'
                          )
                        }
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver Documentação Oficial
                      </Button>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveConfig}>Salvar Configurações</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}