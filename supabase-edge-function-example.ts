/**
 * EXEMPLO DE EDGE FUNCTION PARA SUPABASE
 * 
 * Este arquivo serve como template para criar a Edge Function
 * que processará webhooks de plataformas externas.
 * 
 * Para usar:
 * 1. Instale Supabase CLI: npm install -g supabase
 * 2. Crie função: supabase functions new webhook-leads
 * 3. Cole este código em: supabase/functions/webhook-leads/index.ts
 * 4. Deploy: supabase functions deploy webhook-leads
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hub-signature-256',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface WebhookPayload {
  platform: string;
  data: any;
  signature?: string;
}

interface LeadData {
  nome: string;
  telefone?: string;
  email?: string;
  veiculo_interesse?: string;
  origem: string;
  observacoes?: string;
  integration_source: {
    platform: string;
    externalId?: string;
    metadata?: any;
  };
  vendedor_id?: string;
}

/**
 * Verifica assinatura do Facebook/Instagram
 */
function verifyFacebookSignature(payload: string, signature: string, appSecret: string): boolean {
  const expectedSignature = 'sha256=' + createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex');
  return signature === expectedSignature;
}

/**
 * Processa lead do Facebook Lead Ads
 */
function processFacebookLead(data: any): Partial<LeadData> {
  const fieldData: Record<string, string> = {};
  
  // Facebook envia campos em array de objetos
  if (data.field_data) {
    data.field_data.forEach((field: any) => {
      fieldData[field.name] = field.values[0];
    });
  }

  return {
    nome: fieldData.full_name || fieldData.name || 'Lead Facebook',
    telefone: fieldData.phone_number || fieldData.phone,
    email: fieldData.email,
    veiculo_interesse: fieldData.vehicle_interest || fieldData.vehicle_model,
    origem: 'redes_sociais',
    observacoes: fieldData.message || `Lead capturado via Facebook Lead Ads\nFormulário: ${data.form_id}`,
    integration_source: {
      platform: 'facebook',
      externalId: data.leadgen_id,
      metadata: {
        formId: data.form_id,
        adId: data.ad_id,
        pageId: data.page_id,
        createdTime: data.created_time,
      },
    },
  };
}

/**
 * Processa lead do Instagram
 */
function processInstagramLead(data: any): Partial<LeadData> {
  const facebookData = processFacebookLead(data);
  return {
    ...facebookData,
    integration_source: {
      ...facebookData.integration_source!,
      platform: 'instagram',
    },
  };
}

/**
 * Processa mensagem da OLX
 */
function processOlxLead(data: any): Partial<LeadData> {
  return {
    nome: data.sender_name || 'Interessado OLX',
    telefone: data.sender_phone,
    email: data.sender_email,
    veiculo_interesse: data.ad_title,
    origem: 'site',
    observacoes: `Mensagem da OLX:\n${data.message}\n\nAnúncio: ${data.ad_title}`,
    integration_source: {
      platform: 'olx',
      externalId: data.message_id,
      metadata: {
        adId: data.ad_id,
        adUrl: data.ad_url,
        conversationId: data.conversation_id,
      },
    },
  };
}

/**
 * Processa mensagem do WhatsApp Business
 */
function processWhatsAppLead(data: any): Partial<LeadData> {
  const contact = data.contacts?.[0] || {};
  const message = data.messages?.[0] || {};

  return {
    nome: contact.profile?.name || `WhatsApp ${contact.wa_id}`,
    telefone: contact.wa_id,
    origem: 'whatsapp',
    observacoes: `Mensagem WhatsApp:\n${message.text?.body || '[mensagem de mídia]'}`,
    integration_source: {
      platform: 'whatsapp_business',
      externalId: message.id,
      metadata: {
        messageType: message.type,
        timestamp: message.timestamp,
        from: message.from,
      },
    },
  };
}

/**
 * Processa lead do Webmotors
 */
function processWebmotorsLead(data: any): Partial<LeadData> {
  return {
    nome: data.customer_name,
    telefone: data.customer_phone,
    email: data.customer_email,
    veiculo_interesse: `${data.vehicle_brand} ${data.vehicle_model} ${data.vehicle_year}`,
    origem: 'site',
    observacoes: `Lead Webmotors\nInteresse: ${data.interest_type}\nMensagem: ${data.message}`,
    integration_source: {
      platform: 'webmotors',
      externalId: data.lead_id,
      metadata: {
        vehicleId: data.vehicle_id,
        adUrl: data.ad_url,
      },
    },
  };
}

/**
 * Processa pergunta do Mercado Livre
 */
function processMercadoLivreLead(data: any): Partial<LeadData> {
  return {
    nome: data.from?.nickname || 'Comprador ML',
    origem: 'site',
    observacoes: `Pergunta Mercado Livre:\n"${data.text}"\n\nProduto: ${data.item_id}`,
    integration_source: {
      platform: 'mercadolivre',
      externalId: data.id,
      metadata: {
        itemId: data.item_id,
        questionId: data.id,
        answered: data.answer !== null,
      },
    },
  };
}

/**
 * Handler principal da Edge Function
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url);

    // Verificação do webhook do Facebook/WhatsApp (GET request)
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      const VERIFY_TOKEN = Deno.env.get('WEBHOOK_VERIFY_TOKEN') || 'autogestao_verify_token';

      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Webhook verified');
        return new Response(challenge, { status: 200 });
      } else {
        return new Response('Forbidden', { status: 403 });
      }
    }

    // Processar webhook (POST request)
    const rawBody = await req.text();
    let payload: WebhookPayload;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { platform, data } = payload;

    // Verificar assinatura para Facebook/Instagram
    if (platform === 'facebook' || platform === 'instagram') {
      const signature = req.headers.get('x-hub-signature-256');
      const appSecret = Deno.env.get('FACEBOOK_APP_SECRET');

      if (appSecret && signature && !verifyFacebookSignature(rawBody, signature, appSecret)) {
        console.error('Invalid signature');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Buscar configuração da integração
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('platform', platform)
      .single();

    if (integrationError || !integration?.enabled) {
      console.log(`Integration ${platform} not enabled or not found`);
      return new Response(
        JSON.stringify({ error: 'Integration not enabled' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Processar lead baseado na plataforma
    let leadData: Partial<LeadData>;

    switch (platform) {
      case 'facebook':
        leadData = processFacebookLead(data);
        break;
      case 'instagram':
        leadData = processInstagramLead(data);
        break;
      case 'olx':
        leadData = processOlxLead(data);
        break;
      case 'whatsapp_business':
        leadData = processWhatsAppLead(data);
        break;
      case 'webmotors':
        leadData = processWebmotorsLead(data);
        break;
      case 'mercadolivre':
        leadData = processMercadoLivreLead(data);
        break;
      default:
        throw new Error(`Platform ${platform} not supported`);
    }

    // Auto-atribuir vendedor se configurado
    if (integration.settings?.autoAssignVendedor && integration.settings?.defaultVendedorId) {
      leadData.vendedor_id = integration.settings.defaultVendedorId;
    }

    // Adicionar status padrão
    const fullLeadData = {
      ...leadData,
      status: 'novo',
      data_criacao: new Date().toISOString().split('T')[0],
    };

    // Salvar lead no banco
    const { data: newLead, error: leadError } = await supabase
      .from('leads')
      .insert([fullLeadData])
      .select()
      .single();

    if (leadError) {
      console.error('Error inserting lead:', leadError);
      throw leadError;
    }

    // Atualizar contador de leads importados
    await supabase
      .from('integrations')
      .update({
        leads_imported: (integration.leads_imported || 0) + 1,
        last_sync: new Date().toISOString(),
      })
      .eq('id', integration.id);

    console.log(`Lead created successfully from ${platform}:`, newLead.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        lead: newLead,
        message: 'Lead processed successfully' 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString() 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})

/**
 * VARIÁVEIS DE AMBIENTE NECESSÁRIAS:
 * 
 * Configurar em: Supabase Dashboard > Project Settings > Edge Functions > Secrets
 * 
 * - SUPABASE_URL (automático)
 * - SUPABASE_SERVICE_ROLE_KEY (automático)
 * - WEBHOOK_VERIFY_TOKEN (criar um token aleatório)
 * - FACEBOOK_APP_SECRET (do app Facebook/Instagram)
 */
