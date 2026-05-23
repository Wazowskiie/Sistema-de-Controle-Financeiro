// Sistema de Integrações com Plataformas Externas
// Preparado para conexão com Supabase + Edge Functions

export type IntegrationPlatform = 
  | 'facebook' 
  | 'instagram' 
  | 'olx' 
  | 'webmotors' 
  | 'mercadolivre'
  | 'whatsapp_business'
  | 'site_proprio';

export type IntegrationStatus = 'inactive' | 'active' | 'error' | 'pending';

export interface IntegrationConfig {
  id: string;
  platform: IntegrationPlatform;
  name: string;
  status: IntegrationStatus;
  enabled: boolean;
  credentials: {
    // Credenciais serão armazenadas no Supabase de forma segura
    accessToken?: string;
    appId?: string;
    apiKey?: string;
    webhookUrl?: string;
    [key: string]: string | undefined;
  };
  settings: {
    autoCreateLeads: boolean; // Criar leads automaticamente
    autoAssignVendedor: boolean; // Atribuir vendedor automaticamente
    defaultVendedorId?: string;
    notifyOnNewLead: boolean; // Notificar quando houver novo lead
  };
  lastSync?: string;
  leadsImported: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeadSource {
  platform: IntegrationPlatform;
  externalId?: string; // ID na plataforma externa
  formId?: string; // ID do formulário (Facebook/Instagram)
  adId?: string; // ID do anúncio
  metadata?: {
    [key: string]: any; // Metadados específicos da plataforma
  };
}

// Estrutura de dados que virá das plataformas
export interface ExternalLead {
  platform: IntegrationPlatform;
  externalId: string;
  name: string;
  phone?: string;
  email?: string;
  message?: string;
  vehicleInterest?: string;
  metadata: {
    formName?: string;
    adName?: string;
    campaignName?: string;
    [key: string]: any;
  };
  receivedAt: string;
}

// Documentação de cada plataforma
export const PLATFORM_DOCS = {
  facebook: {
    name: 'Facebook Lead Ads',
    icon: 'Facebook',
    color: '#1877F2',
    description: 'Captura leads de anúncios do Facebook automaticamente',
    features: [
      'Leads de formulários de anúncios',
      'Sincronização em tempo real via webhook',
      'Informações de campanha e anúncio',
    ],
    setupSteps: [
      'Criar aplicativo no Facebook Developers',
      'Configurar permissões: pages_manage_metadata, leads_retrieval',
      'Gerar token de acesso',
      'Configurar webhook para receber leads',
      'Conectar página do Facebook',
    ],
    requiredFields: ['appId', 'accessToken'],
    docsUrl: 'https://developers.facebook.com/docs/marketing-api/guides/lead-ads',
  },
  instagram: {
    name: 'Instagram Lead Ads',
    icon: 'Instagram',
    color: '#E4405F',
    description: 'Captura leads de anúncios do Instagram automaticamente',
    features: [
      'Leads de formulários de anúncios',
      'Integração via Facebook Business',
      'Sincronização em tempo real',
    ],
    setupSteps: [
      'Vincular Instagram ao Facebook Business',
      'Configurar mesmas permissões do Facebook',
      'Usar o mesmo token de acesso',
      'Leads aparecerão automaticamente',
    ],
    requiredFields: ['appId', 'accessToken'],
    docsUrl: 'https://developers.facebook.com/docs/instagram-api',
  },
  olx: {
    name: 'OLX',
    icon: 'MessageSquare',
    color: '#6E0AD6',
    description: 'Recebe contatos de interessados em seus anúncios',
    features: [
      'Mensagens de interessados',
      'Notificações em tempo real',
      'Histórico de conversas',
    ],
    setupSteps: [
      'Criar conta profissional na OLX',
      'Solicitar acesso à API OLX Professional',
      'Obter credenciais (API Key)',
      'Configurar webhook para mensagens',
    ],
    requiredFields: ['apiKey'],
    docsUrl: 'https://www.olx.com.br/profissional',
  },
  webmotors: {
    name: 'Webmotors',
    icon: 'Car',
    color: '#FF6000',
    description: 'Captura leads de interessados em seus veículos',
    features: [
      'Contatos de anúncios',
      'Informações do veículo de interesse',
      'Integração via API',
    ],
    setupSteps: [
      'Ter conta profissional Webmotors',
      'Solicitar acesso à API para lojistas',
      'Obter token de integração',
      'Configurar sincronização',
    ],
    requiredFields: ['apiKey'],
    docsUrl: 'https://www.webmotors.com.br/profissional',
  },
  mercadolivre: {
    name: 'Mercado Livre',
    icon: 'ShoppingCart',
    color: '#FFE600',
    description: 'Recebe perguntas sobre seus veículos',
    features: [
      'Perguntas de compradores',
      'Mensagens diretas',
      'Notificações automáticas',
    ],
    setupSteps: [
      'Criar aplicativo no Mercado Livre Developers',
      'Obter App ID e Secret Key',
      'Autenticar com OAuth 2.0',
      'Configurar notificações de perguntas',
    ],
    requiredFields: ['appId', 'accessToken'],
    docsUrl: 'https://developers.mercadolivre.com.br',
  },
  whatsapp_business: {
    name: 'WhatsApp Business API',
    icon: 'MessageCircle',
    color: '#25D366',
    description: 'Captura conversas iniciadas via WhatsApp Business',
    features: [
      'Mensagens de clientes',
      'Webhooks em tempo real',
      'Histórico de conversas',
    ],
    setupSteps: [
      'Criar conta WhatsApp Business API',
      'Verificar número de telefone',
      'Obter token de acesso permanente',
      'Configurar webhook para mensagens',
    ],
    requiredFields: ['accessToken', 'phoneNumberId'],
    docsUrl: 'https://developers.facebook.com/docs/whatsapp',
  },
  site_proprio: {
    name: 'Site Próprio',
    icon: 'Globe',
    color: '#0EA5E9',
    description: 'Formulário de contato do seu site',
    features: [
      'API pública para receber leads',
      'Formulário incorporável',
      'Validação automática',
    ],
    setupSteps: [
      'Copiar código do formulário',
      'Incorporar no seu site',
      'Ou usar API REST para enviar leads',
      'Leads aparecem automaticamente',
    ],
    requiredFields: ['webhookUrl'],
    docsUrl: null,
  },
};

class IntegrationsService {
  private STORAGE_KEY = 'integrations';

  // ========== CRUD de Integrações ==========
  
  getIntegrations(): IntegrationConfig[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : this.getDefaultIntegrations();
  }

  private getDefaultIntegrations(): IntegrationConfig[] {
    const defaults: IntegrationConfig[] = Object.keys(PLATFORM_DOCS).map((platform) => ({
      id: `int-${platform}`,
      platform: platform as IntegrationPlatform,
      name: PLATFORM_DOCS[platform as IntegrationPlatform].name,
      status: 'inactive' as IntegrationStatus,
      enabled: false,
      credentials: {},
      settings: {
        autoCreateLeads: true,
        autoAssignVendedor: false,
        notifyOnNewLead: true,
      },
      leadsImported: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    
    this.saveIntegrations(defaults);
    return defaults;
  }

  private saveIntegrations(integrations: IntegrationConfig[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(integrations));
  }

  updateIntegration(id: string, updates: Partial<IntegrationConfig>): void {
    const integrations = this.getIntegrations();
    const index = integrations.findIndex(i => i.id === id);
    
    if (index !== -1) {
      integrations[index] = {
        ...integrations[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.saveIntegrations(integrations);
    }
  }

  testConnection(platform: IntegrationPlatform): Promise<boolean> {
    // TODO: Implementar com Supabase Edge Function
    // Esta função fará uma chamada para o backend que testará a conexão
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Testing connection for ${platform}...`);
        resolve(true);
      }, 1500);
    });
  }

  // ========== Sincronização de Leads ==========
  
  async syncLeads(platform: IntegrationPlatform): Promise<ExternalLead[]> {
    // TODO: Implementar com Supabase Edge Function
    // Esta função buscará leads da plataforma externa
    console.log(`Syncing leads from ${platform}...`);
    return [];
  }

  async startWebhookListener(): Promise<string> {
    // TODO: Implementar com Supabase
    // Retorna URL do webhook que deve ser configurado nas plataformas
    const webhookUrl = `${window.location.origin}/api/webhooks/leads`;
    console.log('Webhook URL:', webhookUrl);
    return webhookUrl;
  }

  // ========== Processamento de Leads ==========
  
  processExternalLead(externalLead: ExternalLead): {
    nome: string;
    telefone: string;
    email?: string;
    veiculoInteresse?: string;
    origem: string;
    observacoes?: string;
  } {
    // Converte lead externo para formato do sistema
    const origem = this.mapPlatformToOrigem(externalLead.platform);
    
    let observacoes = `Lead capturado via ${PLATFORM_DOCS[externalLead.platform].name}`;
    if (externalLead.message) {
      observacoes += `\nMensagem: ${externalLead.message}`;
    }
    if (externalLead.metadata.formName) {
      observacoes += `\nFormulário: ${externalLead.metadata.formName}`;
    }
    if (externalLead.metadata.adName) {
      observacoes += `\nAnúncio: ${externalLead.metadata.adName}`;
    }

    return {
      nome: externalLead.name,
      telefone: externalLead.phone || '',
      email: externalLead.email,
      veiculoInteresse: externalLead.vehicleInterest,
      origem,
      observacoes,
    };
  }

  private mapPlatformToOrigem(platform: IntegrationPlatform): 'redes_sociais' | 'site' | 'whatsapp' {
    const mapping: Record<IntegrationPlatform, 'redes_sociais' | 'site' | 'whatsapp'> = {
      facebook: 'redes_sociais',
      instagram: 'redes_sociais',
      olx: 'site',
      webmotors: 'site',
      mercadolivre: 'site',
      whatsapp_business: 'whatsapp',
      site_proprio: 'site',
    };
    return mapping[platform];
  }

  // ========== Estatísticas ==========
  
  getIntegrationStats() {
    const integrations = this.getIntegrations();
    return {
      total: integrations.length,
      active: integrations.filter(i => i.enabled && i.status === 'active').length,
      totalLeads: integrations.reduce((sum, i) => sum + i.leadsImported, 0),
    };
  }
}

export const integrationsService = new IntegrationsService();

// ========== Funções Auxiliares ==========

export function getPlatformIcon(platform: IntegrationPlatform): string {
  return PLATFORM_DOCS[platform]?.icon || 'HelpCircle';
}

export function getPlatformColor(platform: IntegrationPlatform): string {
  return PLATFORM_DOCS[platform]?.color || '#6B7280';
}

export function getStatusColor(status: IntegrationStatus): string {
  const colors = {
    inactive: 'gray',
    active: 'green',
    error: 'red',
    pending: 'yellow',
  };
  return colors[status];
}

export function getStatusLabel(status: IntegrationStatus): string {
  const labels = {
    inactive: 'Inativo',
    active: 'Ativo',
    error: 'Erro',
    pending: 'Pendente',
  };
  return labels[status];
}
