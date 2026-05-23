# 🔌 Guia de Integrações - Sistema AutoGestão

Este documento explica como conectar as integrações de captura automática de leads usando **Supabase** como backend.

---

## 📋 Visão Geral

O sistema está preparado para integrar com:
- **Facebook Lead Ads** - Captura leads de anúncios do Facebook
- **Instagram Lead Ads** - Captura leads de anúncios do Instagram  
- **OLX** - Recebe contatos de anúncios
- **Webmotors** - Captura leads de veículos
- **Mercado Livre** - Recebe perguntas sobre produtos
- **WhatsApp Business API** - Mensagens de clientes
- **Site Próprio** - Formulário customizado

---

## 🏗️ Arquitetura

```
Plataforma Externa (Facebook, OLX, etc.)
           ↓
    Webhook/API Call
           ↓
Supabase Edge Function (Processa e valida)
           ↓
    Supabase Database (Armazena lead)
           ↓
  Frontend (Exibe notificação em tempo real)
```

---

## 🚀 Configuração do Supabase

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote a **Project URL** e **anon key**

### 2. Criar Tabelas no Banco de Dados

Execute os seguintes scripts SQL no Supabase SQL Editor:

```sql
-- Tabela de configurações de integrações
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'inactive',
  enabled BOOLEAN DEFAULT false,
  credentials JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  leads_imported INTEGER DEFAULT 0,
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de leads com integração
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  veiculo_interesse TEXT,
  origem TEXT,
  status TEXT DEFAULT 'novo',
  vendedor_id UUID,
  data_criacao DATE DEFAULT CURRENT_DATE,
  data_ultimo_contato DATE,
  proximo_follow_up DATE,
  observacoes TEXT,
  integration_source JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_vendedor ON leads(vendedor_id);
CREATE INDEX idx_leads_origem ON leads(origem);

-- RLS (Row Level Security) - Ajustar conforme autenticação
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Política básica (permitir tudo - ajustar em produção)
CREATE POLICY "Allow all operations" ON integrations FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON leads FOR ALL USING (true);
```

### 3. Criar Edge Function para Webhooks

Crie uma Edge Function no Supabase para processar webhooks:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Linkar ao projeto
supabase link --project-ref YOUR_PROJECT_REF

# Criar função
supabase functions new webhook-leads
```

**Arquivo: `supabase/functions/webhook-leads/index.ts`**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { platform, data } = await req.json()

    // Processar lead baseado na plataforma
    let leadData: any = {}

    switch (platform) {
      case 'facebook':
      case 'instagram':
        leadData = {
          nome: data.full_name || data.name,
          telefone: data.phone_number,
          email: data.email,
          veiculo_interesse: data.custom_questions?.vehicle_interest,
          origem: 'redes_sociais',
          integration_source: {
            platform,
            externalId: data.leadgen_id,
            formId: data.form_id,
            adId: data.ad_id,
            metadata: data,
          },
        }
        break

      case 'olx':
        leadData = {
          nome: data.sender_name,
          telefone: data.sender_phone,
          email: data.sender_email,
          origem: 'site',
          observacoes: data.message,
          integration_source: {
            platform,
            externalId: data.message_id,
            metadata: data,
          },
        }
        break

      case 'whatsapp_business':
        leadData = {
          nome: data.contacts?.[0]?.profile?.name || 'Contato WhatsApp',
          telefone: data.contacts?.[0]?.wa_id,
          origem: 'whatsapp',
          observacoes: data.messages?.[0]?.text?.body,
          integration_source: {
            platform,
            externalId: data.messages?.[0]?.id,
            metadata: data,
          },
        }
        break

      default:
        throw new Error(`Platform ${platform} not supported`)
    }

    // Buscar configuração da integração
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('platform', platform)
      .single()

    if (!integration?.enabled) {
      throw new Error('Integration not enabled')
    }

    // Auto-atribuir vendedor se configurado
    if (integration.settings?.autoAssignVendedor && integration.settings?.defaultVendedorId) {
      leadData.vendedor_id = integration.settings.defaultVendedorId
    }

    // Salvar lead no banco
    const { data: newLead, error } = await supabase
      .from('leads')
      .insert([leadData])
      .select()
      .single()

    if (error) throw error

    // Atualizar contador de leads importados
    await supabase
      .from('integrations')
      .update({
        leads_imported: integration.leads_imported + 1,
        last_sync: new Date().toISOString(),
      })
      .eq('id', integration.id)

    return new Response(
      JSON.stringify({ success: true, lead: newLead }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

**Deploy da função:**

```bash
supabase functions deploy webhook-leads
```

A URL da função será: `https://YOUR_PROJECT.supabase.co/functions/v1/webhook-leads`

---

## 🔗 Configuração das Plataformas

### Facebook Lead Ads

1. **Criar App no Facebook Developers**
   - Acesse: https://developers.facebook.com/apps
   - Crie novo app tipo "Business"
   - Adicione produto "Webhooks"

2. **Configurar Permissões**
   - `pages_manage_metadata`
   - `leads_retrieval`
   - `pages_read_engagement`

3. **Gerar Token de Acesso**
   - Acesse Graph API Explorer
   - Selecione permissões acima
   - Gere token de usuário
   - Use Access Token Tool para converter em token permanente

4. **Configurar Webhook**
   - URL: `https://YOUR_PROJECT.supabase.co/functions/v1/webhook-leads`
   - Campos: `leadgen`
   - Verify Token: crie um token secreto

5. **No Sistema AutoGestão**
   - Vá em Integrações > Facebook
   - Adicione App ID e Access Token
   - Ative a integração

### Instagram Lead Ads

Usa a mesma configuração do Facebook. Apenas vincule a conta do Instagram ao Facebook Business.

### OLX

1. **Conta Profissional**
   - Acesse: https://www.olx.com.br/profissional
   - Crie conta de lojista

2. **API (Requer aprovação)**
   - Solicite acesso à API OLX Professional
   - Receberá API Key por email

3. **Configurar Webhook**
   - Configure URL de webhook no painel OLX
   - URL: sua Edge Function

### WhatsApp Business API

1. **Criar Conta Business**
   - Acesse: https://business.facebook.com/
   - Configure WhatsApp Business API

2. **Obter Credenciais**
   - Phone Number ID
   - WhatsApp Business Account ID
   - Token de acesso permanente

3. **Configurar Webhook**
   - URL: sua Edge Function
   - Campos: `messages`
   - Verify Token: token secreto

---

## 🎯 Testando Integrações

### Testar Webhook Localmente

Use ferramentas como Postman ou curl:

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/webhook-leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "platform": "facebook",
    "data": {
      "full_name": "João Silva",
      "phone_number": "+5511999999999",
      "email": "joao@email.com",
      "leadgen_id": "123456789",
      "form_id": "form123",
      "ad_id": "ad456"
    }
  }'
```

### Verificar Logs

```bash
supabase functions logs webhook-leads --project-ref YOUR_PROJECT_REF
```

---

## 📊 Monitoramento

### Realtime (Tempo Real)

Ative subscriptions do Supabase para receber leads em tempo real:

```typescript
// No frontend
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

supabase
  .channel('leads')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'leads'
  }, (payload) => {
    // Notificar novo lead
    toast.success(`Novo lead: ${payload.new.nome}`)
    // Atualizar lista de leads
    refreshLeads()
  })
  .subscribe()
```

---

## 🔒 Segurança

### Validação de Webhooks

Sempre valide webhooks usando assinaturas:

**Facebook/Instagram:**
```typescript
import crypto from 'crypto'

function verifyFacebookSignature(payload: string, signature: string, secret: string) {
  const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return `sha256=${hash}` === signature
}

// Na Edge Function
const signature = req.headers.get('x-hub-signature-256')
const isValid = verifyFacebookSignature(bodyRaw, signature, APP_SECRET)
```

**WhatsApp:**
```typescript
// Verificar token no primeiro request
if (req.method === 'GET') {
  const mode = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')
  
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }
}
```

---

## 🐛 Troubleshooting

### Webhook não recebe dados

1. Verifique se Edge Function está deployada
2. Confirme URL do webhook na plataforma
3. Verifique logs: `supabase functions logs webhook-leads`
4. Teste com curl manualmente

### Leads não aparecem no sistema

1. Verifique RLS policies
2. Confirme que integração está ativada
3. Veja logs do Supabase

### Erros de autenticação

1. Confirme tokens não expiraram
2. Verifique permissões do app
3. Regenere tokens se necessário

---

## 📚 Recursos Adicionais

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Facebook Lead Ads API](https://developers.facebook.com/docs/marketing-api/guides/lead-ads)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

---

## ✅ Checklist de Implementação

- [ ] Criar projeto no Supabase
- [ ] Executar scripts SQL (criar tabelas)
- [ ] Criar Edge Function `webhook-leads`
- [ ] Deploy da Edge Function
- [ ] Configurar apps nas plataformas (Facebook, etc.)
- [ ] Adicionar credenciais no sistema
- [ ] Testar webhook com curl
- [ ] Configurar Realtime para notificações
- [ ] Implementar validação de assinaturas
- [ ] Monitorar logs e ajustar

---

**Pronto!** Com esta configuração, você terá um sistema completo de captura automática de leads de múltiplas plataformas. 🚀
