# 🚗 AutoGestão - Sistema de Controle Financeiro para Lojas de Veículos

Sistema completo para gestão de vendas, estoque, despesas e CRM para lojas de carros.

## ✨ Funcionalidades

### 📊 Dashboard
- Visão geral de vendas, lucros e despesas
- Gráficos interativos de desempenho
- Métricas em tempo real

### 🚙 Gestão de Veículos
- Controle completo do estoque
- Status: Disponível, Vendido, Reservado
- Informações detalhadas de cada veículo

### 💰 Vendas Avançadas
- Registro completo de vendas
- Cálculo automático de lucro e comissões
- Sistema de financiamento (entrada + parcelas)
- Trade-in (avaliação de veículo usado)
- Controle de documentação

### 👥 Gestão de Vendedores
- Cadastro de vendedores
- Percentuais de comissão personalizados
- Relatórios de desempenho individual

### 🎯 CRM & Funil de Vendas
- Gestão completa de leads
- Funil: Novo → Contato → Proposta → Negociação → Convertido
- Histórico de interações
- Agendamento de follow-ups
- **🔌 Integrações com plataformas externas** (novo!)

### 📝 Controle de Despesas
- Categorização de despesas
- Acompanhamento mensal
- Visão consolidada de custos

### 📈 Relatórios
- Análises detalhadas de vendas
- Performance de vendedores
- Relatórios por período
- Gráficos visuais

---

## 🔌 Integrações Automáticas de Leads

O sistema está preparado para capturar leads automaticamente de:

- **Facebook Lead Ads** - Formulários de anúncios
- **Instagram Lead Ads** - Anúncios do Instagram
- **OLX** - Mensagens de interessados
- **Webmotors** - Contatos de anúncios
- **Mercado Livre** - Perguntas de compradores
- **WhatsApp Business API** - Mensagens diretas
- **Site Próprio** - Formulário customizado

### Como funciona?

Atualmente o sistema funciona com **localStorage** (dados salvos no navegador).

Para ativar as integrações automáticas com as plataformas, você precisa:

1. **Conectar ao Supabase** (backend gratuito)
2. **Configurar Edge Functions** (recebem os webhooks)
3. **Conectar suas contas** nas plataformas (Facebook, OLX, etc.)

### 📚 Documentação Completa

Consulte o arquivo **[INTEGRACOES.md](./INTEGRACOES.md)** para:
- Passo a passo de configuração do Supabase
- Como conectar cada plataforma
- Código completo das Edge Functions
- Exemplos de uso e troubleshooting

---

## 🚀 Como Usar

1. **Acesse a aplicação** no navegador
2. **Configure vendedores** na aba Vendedores
3. **Cadastre veículos** na aba Estoque
4. **Registre leads** na aba Leads & CRM
5. **Realize vendas** na aba Vendas
6. **Acompanhe resultados** no Dashboard e Relatórios

### 🔗 Configurar Integrações

1. Acesse **Integrações** no menu
2. Escolha a plataforma (Facebook, OLX, etc.)
3. Clique em **Configurar**
4. Adicione as credenciais (API Key, Token, etc.)
5. Ative a integração
6. **Importante**: Para funcionamento completo, siga o guia em [INTEGRACOES.md](./INTEGRACOES.md)

---

## 💾 Armazenamento de Dados

### Modo Atual: LocalStorage
- Dados salvos no navegador
- Acesso offline
- Dados persistem entre sessões
- ⚠️ Limitado a um único dispositivo

### Modo Supabase (Futuro)
- Sincronização em nuvem
- Acesso multi-usuário
- Acesso de qualquer dispositivo
- Backup automático
- **Integrações automáticas de leads**

---

## 🛠️ Tecnologias

- **React** com TypeScript
- **React Router** para navegação
- **Tailwind CSS** para estilo
- **shadcn/ui** componentes UI
- **Recharts** para gráficos
- **Supabase** (opcional, para backend)

---

## 📁 Estrutura do Projeto

```
/src/app
├── pages/              # Páginas da aplicação
│   ├── Dashboard.tsx   # Visão geral
│   ├── Vendas.tsx      # Gestão de vendas
│   ├── Leads.tsx       # CRM e funil
│   ├── Vendedores.tsx  # Gestão de vendedores
│   ├── Estoque.tsx     # Controle de veículos
│   ├── Despesas.tsx    # Controle financeiro
│   ├── Relatorios.tsx  # Análises e gráficos
│   └── Integracoes.tsx # Configuração de APIs
├── lib/
│   ├── store.ts        # Gerenciamento de dados
│   └── integrations.ts # Sistema de integrações
└── components/         # Componentes reutilizáveis
```

---

## 🔐 Segurança

- Não compartilhe suas credenciais de API
- Use variáveis de ambiente no Supabase
- Ative Row Level Security (RLS) nas tabelas
- Valide assinaturas de webhooks
- Este sistema não deve ser usado para coletar PII sensível

---

## 📞 Suporte

Para dúvidas sobre integrações:
1. Consulte [INTEGRACOES.md](./INTEGRACOES.md)
2. Verifique a documentação oficial de cada plataforma
3. Confira os logs das Edge Functions no Supabase

---

## 🎯 Próximos Passos Recomendados

1. ✅ **Explorar o sistema** - Teste todas as funcionalidades
2. ✅ **Cadastrar dados** - Adicione vendedores, veículos e leads
3. 🔜 **Conectar Supabase** - Ative sincronização em nuvem
4. 🔜 **Configurar integrações** - Capture leads automaticamente
5. 🔜 **Personalizar** - Adapte conforme suas necessidades

---

**Desenvolvido para gestão profissional de lojas de veículos** 🚗✨
