// store.ts — AutoGestão integrado com Supabase
import { supabase } from './supabase';

export interface Veiculo {
  id: string;
  marca: string;
  modelo: string;
  ano: number;
  cor: string;
  preco: number;
  precoCompra: number;
  status: 'disponivel' | 'vendido' | 'reservado' | 'em_transito';
  dataEntrada: string;
  km: number;
  placa: string;
  origem: 'leilao' | 'particular' | 'troca' | 'concessionaria' | 'netcarros' | 'site' | 'outros';
  cidadeOrigem?: string;
  estadoOrigem?: string;
  anoModelo?: string;
  dadosLeilao?: {
    nomeEventoLeilao: string;
    numeroLote: string;
    cidadeOrigem: string;
    estadoOrigem: string;
    dataArrematacao: string;
  };
  transporteId?: string;
  statusPagamento?: 'pago' | 'pendente';
}

export interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email?: string;
  endereco?: {
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  profissao?: string;
  estadoCivil?: string;
  dataCadastro: string;
}

export interface Vendedor {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  percentualComissao: number;
  dataContratacao: string;
  ativo: boolean;
}

export interface TradeIn {
  marca: string;
  modelo: string;
  ano: number;
  placa: string;
  km: number;
  valorAvaliado: number;
  observacoes?: string;
}

export interface Venda {
  id: string;
  veiculoId: string;
  veiculo: string;
  clienteId: string;
  cliente: string;
  cpf: string;
  telefone: string;
  vendedorId?: string;
  vendedor?: string;
  valorVenda: number;
  valorCusto: number;
  desconto: number;
  motivoDesconto?: string;
  valorEntrada: number;
  financiado: boolean;
  valorFinanciado?: number;
  numeroParcelas?: number;
  valorParcela?: number;
  banco?: string;
  tradeIn?: TradeIn;
  valorTradeIn?: number;
  placaVeiculo?: string;
  formaPagamento: 'dinheiro' | 'financiamento' | 'cartao' | 'transferencia';
  dataVenda: string;
  statusDocumentacao: 'pendente' | 'em_andamento' | 'concluida';
  documentosEntregues: string[];
  observacoes?: string;
  lucro: number;
  comissao?: number;
}

export interface Lead {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  veiculoInteresse?: string;
  origem: 'telefone' | 'whatsapp' | 'site' | 'indicacao' | 'redes_sociais' | 'presencial';
  status: 'novo' | 'contato_realizado' | 'proposta_enviada' | 'negociacao' | 'perdido' | 'convertido';
  vendedorId?: string;
  vendedor?: string;
  dataCriacao: string;
  dataUltimoContato?: string;
  proximoFollowUp?: string;
  observacoes?: string;
  integrationSource?: {
    platform: string;
    externalId?: string;
    metadata?: Record<string, any>;
  };
}

export interface Interacao {
  id: string;
  tipo: 'ligacao' | 'whatsapp' | 'email' | 'visita' | 'proposta' | 'test_drive' | 'outros';
  leadId?: string;
  clienteId?: string;
  vendaId?: string;
  vendedorId?: string;
  vendedor?: string;
  descricao: string;
  data: string;
  proximaAcao?: string;
}

export interface Despesa {
  id: string;
  descricao: string;
  categoria: 'aluguel' | 'salarios' | 'impostos' | 'manutencao' | 'marketing' | 'outros';
  valor: number;
  data: string;
  observacoes?: string;
}

export interface Transporte {
  id: string;
  veiculoId: string;
  veiculo: string;
  placa: string;
  transportadora: string;
  nomeMotorista?: string;
  telefoneMotorista?: string;
  placaCegonha?: string;
  cidadeOrigem: string;
  estadoOrigem: string;
  cidadeDestino: string;
  estadoDestino: string;
  dataColeta: string;
  previsaoEntrega: string;
  dataEntregaReal?: string;
  status: 'aguardando_coleta' | 'em_transito' | 'em_transito_atrasado' | 'entregue' | 'cancelado';
  valorFrete: number;
  localizacaoAtual?: string;
  ultimaAtualizacao?: string;
  observacoes?: string;
}

// ============================================================
// HELPERS
// ============================================================

function safeDate(value: string | null | undefined): string {
  if (!value) return '';
  return value.substring(0, 10);
}

// ============================================================
// MAPEADORES
// ============================================================

function mapVeiculo(row: any): Veiculo {
  return {
    id: row.id,
    marca: row.marca,
    modelo: row.modelo,
    ano: row.ano_fabricacao,
    anoModelo: row.ano_modelo_texto ?? undefined,
    cor: row.cor ?? '',
    preco: Number(row.preco_venda),
    precoCompra: Number(row.preco_compra),
    status: row.status,
    dataEntrada: safeDate(row.data_entrada),
    km: row.km ?? 0,
    placa: row.placa ?? '',
    origem: row.observacoes?.startsWith('origem:')
      ? row.observacoes.split(':')[1].split(' ')[0].trim()
      : 'outros',
    cidadeOrigem: row.cidade_origem ?? undefined,
    estadoOrigem: row.estado_origem ?? undefined,
    dadosLeilao: row.observacoes?.includes('leilao_json:')
      ? JSON.parse(row.observacoes.split('leilao_json:')[1])
      : undefined,
    transporteId: undefined,
    statusPagamento: row.status_pagamento ?? 'pendente',
  };
}

function mapVendedor(row: any): Vendedor {
  return {
    id: row.id,
    nome: row.nome,
    cpf: row.email ?? '',
    telefone: row.telefone ?? '',
    email: row.email ?? '',
    percentualComissao: Number(row.comissao_pct),
    dataContratacao: safeDate(row.criado_em),
    ativo: row.ativo,
  };
}

function mapVenda(row: any): Venda {
  return {
    id: row.id,
    veiculoId: row.veiculo_id,
    veiculo: row.veiculos ? `${row.veiculos.marca} ${row.veiculos.modelo}` : '',
    placaVeiculo: row.veiculos?.placa ?? '',
    clienteId: row.cliente_id ?? '',
    cliente: row.clientes?.nome ?? '',
    cpf: row.clientes?.cpf ?? '',
    telefone: row.clientes?.telefone ?? '',
    vendedorId: row.vendedor_id ?? undefined,
    vendedor: row.vendedores?.nome ?? undefined,
    valorVenda: Number(row.preco_venda),
    valorCusto: Number(row.preco_custo),
    desconto: 0,
    valorEntrada: Number(row.entrada ?? 0),
    financiado: row.tipo_pagamento === 'financiado',
    valorFinanciado: row.tipo_pagamento === 'financiado' ? Number(row.preco_venda) - Number(row.entrada ?? 0) : undefined,
    numeroParcelas: row.num_parcelas ?? undefined,
    valorParcela: row.valor_parcela ? Number(row.valor_parcela) : undefined,
    banco: row.banco_financeira ?? undefined,
    formaPagamento: row.tipo_pagamento === 'avista' ? 'dinheiro' : 'financiamento',
    dataVenda: safeDate(row.data_venda),
    statusDocumentacao: row.status_doc === 'concluido' ? 'concluida' : row.status_doc === 'em_andamento' ? 'em_andamento' : 'pendente',
    documentosEntregues: [],
    observacoes: row.observacoes ?? undefined,
    lucro: Number(row.lucro_bruto ?? 0),
    comissao: row.comissao_valor ? Number(row.comissao_valor) : undefined,
  };
}

function mapLead(row: any): Lead {
  return {
    id: row.id,
    nome: row.nome,
    telefone: row.telefone ?? '',
    email: row.email ?? undefined,
    veiculoInteresse: row.veiculo_interesse ?? undefined,
    origem: row.origem === 'facebook' || row.origem === 'instagram' ? 'redes_sociais'
      : row.origem === 'whatsapp' ? 'whatsapp'
      : row.origem === 'olx' || row.origem === 'webmotors' || row.origem === 'mercadolivre' ? 'site'
      : (row.origem as any) ?? 'telefone',
    status: row.status === 'novo' ? 'novo'
      : row.status === 'contato' ? 'contato_realizado'
      : row.status === 'proposta' ? 'proposta_enviada'
      : row.status === 'negociacao' ? 'negociacao'
      : row.status === 'convertido' ? 'convertido'
      : row.status === 'perdido' ? 'perdido'
      : 'novo',
    vendedorId: row.vendedor_id ?? undefined,
    dataCriacao: safeDate(row.criado_em),
    dataUltimoContato: undefined,
    proximoFollowUp: safeDate(row.proximo_contato) || undefined,
    observacoes: row.observacoes ?? undefined,
  };
}

function mapDespesa(row: any): Despesa {
  return {
    id: row.id,
    descricao: row.descricao,
    categoria: row.categoria as Despesa['categoria'],
    valor: Number(row.valor),
    data: safeDate(row.data_despesa),
    observacoes: row.observacoes ?? undefined,
  };
}

function mapCliente(row: any): Cliente {
  return {
    id: row.id,
    nome: row.nome,
    cpf: row.cpf ?? '',
    telefone: row.telefone ?? '',
    email: row.email ?? undefined,
    dataCadastro: safeDate(row.criado_em),
  };
}

// ============================================================
// STORE
// ============================================================

class Store {

  // ========== VEÍCULOS ==========

  async getVeiculosAsync(): Promise<Veiculo[]> {
    const { data, error } = await supabase.from('veiculos').select('*').order('criado_em', { ascending: false });
    if (error) { console.error('getVeiculos:', error); return []; }
    return (data ?? []).map(mapVeiculo);
  }

  getVeiculos(): Veiculo[] { return []; }

  async saveVeiculo(veiculo: Omit<Veiculo, 'id'>): Promise<{ error: any }> {
    const origemStr = `origem:${veiculo.origem}` + (veiculo.dadosLeilao ? ` leilao_json:${JSON.stringify(veiculo.dadosLeilao)}` : '');
    const { error } = await supabase.from('veiculos').insert({
      tipo_veiculo: 'carro',
      marca: veiculo.marca,
      modelo: veiculo.modelo,
      ano_fabricacao: veiculo.ano,
      ano_modelo: veiculo.ano,
      ano_modelo_texto: veiculo.anoModelo ?? null,
      cor: veiculo.cor,
      placa: veiculo.placa || null,
      km: veiculo.km,
      preco_compra: veiculo.precoCompra,
      preco_venda: veiculo.preco,
      status: veiculo.status,
      data_entrada: veiculo.dataEntrada,
      cidade_origem: veiculo.cidadeOrigem ?? null,
      estado_origem: veiculo.estadoOrigem ?? null,
      observacoes: origemStr,
      status_pagamento: 'pendente',
    });
    if (error) console.error('saveVeiculo:', error);
    return { error };
  }

  async updateVeiculo(id: string, veiculo: Partial<Veiculo>): Promise<void> {
    const update: any = {};
    if (veiculo.preco !== undefined) update.preco_venda = veiculo.preco;
    if (veiculo.precoCompra !== undefined) update.preco_compra = veiculo.precoCompra;
    if (veiculo.status !== undefined) update.status = veiculo.status;
    if (veiculo.km !== undefined) update.km = veiculo.km;
    if (veiculo.cor !== undefined) update.cor = veiculo.cor;
    if (veiculo.dataEntrada !== undefined) update.data_entrada = veiculo.dataEntrada;
    if (veiculo.statusPagamento !== undefined) update.status_pagamento = veiculo.statusPagamento;
    const { error } = await supabase.from('veiculos').update(update).eq('id', id);
    if (error) console.error('updateVeiculo:', error);
  }

  async deleteVeiculo(id: string): Promise<void> {
    const { error } = await supabase.from('veiculos').delete().eq('id', id);
    if (error) console.error('deleteVeiculo:', error);
  }

  // ========== CLIENTES ==========

  async getClientesAsync(): Promise<Cliente[]> {
    const { data, error } = await supabase.from('clientes').select('*').order('criado_em', { ascending: false });
    if (error) { console.error('getClientes:', error); return []; }
    return (data ?? []).map(mapCliente);
  }

  async saveCliente(cliente: Omit<Cliente, 'id' | 'dataCadastro'>): Promise<Cliente> {
    // Se tem CPF, verifica se já existe antes de tentar inserir (evita erro 409)
    if (cliente.cpf) {
      const { data: existente } = await supabase
        .from('clientes')
        .select('*')
        .eq('cpf', cliente.cpf)
        .maybeSingle();
      if (existente) return mapCliente(existente);
    }
    const { data, error } = await supabase.from('clientes').insert({
      nome: cliente.nome,
      cpf: cliente.cpf || null,
      telefone: cliente.telefone,
      email: cliente.email ?? null,
    }).select().single();
    if (error) { console.error('saveCliente:', error); throw error; }
    return mapCliente(data);
  }

  async getClienteByCpf(cpf: string): Promise<Cliente | undefined> {
    const { data } = await supabase.from('clientes').select('*').eq('cpf', cpf).maybeSingle();
    return data ? mapCliente(data) : undefined;
  }

  // ========== VENDEDORES ==========

  async getVendedoresAsync(): Promise<Vendedor[]> {
    const { data, error } = await supabase.from('vendedores').select('*').order('nome');
    if (error) { console.error('getVendedores:', error); return []; }
    return (data ?? []).map(mapVendedor);
  }

  getVendedores(): Vendedor[] { return []; }

  async saveVendedor(vendedor: Omit<Vendedor, 'id'>): Promise<void> {
    const { error } = await supabase.from('vendedores').insert({
      nome: vendedor.nome,
      email: vendedor.email,
      telefone: vendedor.telefone,
      comissao_pct: vendedor.percentualComissao,
      ativo: vendedor.ativo,
    });
    if (error) console.error('saveVendedor:', error);
  }

  async updateVendedor(id: string, vendedor: Partial<Vendedor>): Promise<void> {
    const update: any = {};
    if (vendedor.ativo !== undefined) update.ativo = vendedor.ativo;
    if (vendedor.percentualComissao !== undefined) update.comissao_pct = vendedor.percentualComissao;
    const { error } = await supabase.from('vendedores').update(update).eq('id', id);
    if (error) console.error('updateVendedor:', error);
  }

  async deleteVendedor(id: string): Promise<void> {
    const { error } = await supabase.from('vendedores').delete().eq('id', id);
    if (error) console.error('deleteVendedor:', error);
  }

  // ========== VENDAS ==========

  async getVendasAsync(): Promise<Venda[]> {
    const { data, error } = await supabase
      .from('vendas')
      // Sem a coluna "documentos" (arquivos anexados, ~56 MB no total): ela faz a busca
      // estourar o tempo limite do banco. Os documentos são carregados só ao abrir a venda.
      .select('id, veiculo_id, cliente_id, vendedor_id, preco_venda, preco_custo, lucro_bruto, comissao_valor, tipo_pagamento, entrada, num_parcelas, valor_parcela, banco_financeira, tradein_veiculo, tradein_valor, status_doc, data_venda, observacoes, criado_em, atualizado_em, veiculos(marca, modelo, placa), clientes(nome, cpf, telefone), vendedores(nome)')
      .order('data_venda', { ascending: false });
    if (error) { console.error('getVendas:', error); return []; }
    return (data ?? []).map(mapVenda);
  }

  getVendas(): Venda[] { return []; }

  async saveVenda(venda: Omit<Venda, 'id'>): Promise<void> {
    let clienteId = venda.clienteId;
    if (!clienteId || clienteId === '') {
      const cliente = await this.saveCliente({
        nome: venda.cliente,
        cpf: venda.cpf,
        telefone: venda.telefone,
      });
      clienteId = cliente.id;
    }
    const { error } = await supabase.from('vendas').insert({
      veiculo_id: venda.veiculoId,
      cliente_id: clienteId,
      vendedor_id: venda.vendedorId ?? null,
      preco_venda: venda.valorVenda,
      preco_custo: venda.valorCusto,
      comissao_valor: venda.comissao ?? null,
      tipo_pagamento: venda.financiado ? 'financiado' : 'avista',
      entrada: venda.valorEntrada,
      num_parcelas: venda.numeroParcelas ?? 0,
      valor_parcela: venda.valorParcela ?? 0,
      banco_financeira: venda.banco ?? null,
      status_doc: venda.statusDocumentacao === 'concluida' ? 'concluido'
        : venda.statusDocumentacao === 'em_andamento' ? 'em_andamento' : 'pendente',
      data_venda: venda.dataVenda,
      observacoes: venda.observacoes ?? null,
    });
    if (error) console.error('saveVenda:', error);
  }

  async deleteVenda(id: string): Promise<void> {
    // Busca veiculoId antes de deletar para reverter status
    const { data } = await supabase.from('vendas').select('veiculo_id').eq('id', id).single();
    const { error } = await supabase.from('vendas').delete().eq('id', id);
    if (error) { console.error('deleteVenda:', error); return; }
    // Reverte veículo para disponível
    if (data?.veiculo_id) {
      await supabase.from('veiculos').update({ status: 'disponivel' }).eq('id', data.veiculo_id);
    }
  }

  // ========== LEADS ==========

  async getLeadsAsync(): Promise<Lead[]> {
    const { data, error } = await supabase.from('leads').select('*').order('criado_em', { ascending: false });
    if (error) { console.error('getLeads:', error); return []; }
    return (data ?? []).map(mapLead);
  }

  getLeads(): Lead[] { return []; }

  async saveLead(lead: Omit<Lead, 'id' | 'dataCriacao'>): Promise<void> {
    const statusMap: Record<string, string> = {
      novo: 'novo', contato_realizado: 'contato', proposta_enviada: 'proposta',
      negociacao: 'negociacao', convertido: 'convertido', perdido: 'perdido',
    };
    const origemMap: Record<string, string> = {
      redes_sociais: 'facebook', whatsapp: 'whatsapp', site: 'site',
      telefone: 'manual', indicacao: 'manual', presencial: 'manual',
    };
    const { error } = await supabase.from('leads').insert({
      nome: lead.nome,
      telefone: lead.telefone,
      email: lead.email ?? null,
      veiculo_interesse: lead.veiculoInteresse ?? null,
      origem: origemMap[lead.origem] ?? 'manual',
      status: statusMap[lead.status] ?? 'novo',
      vendedor_id: lead.vendedorId ?? null,
      observacoes: lead.observacoes ?? null,
      proximo_contato: lead.proximoFollowUp ? new Date(lead.proximoFollowUp).toISOString() : null,
    });
    if (error) console.error('saveLead:', error);
  }

  async updateLead(id: string, lead: Partial<Lead>): Promise<void> {
    const update: any = {};
    if (lead.status) {
      const statusMap: Record<string, string> = {
        novo: 'novo', contato_realizado: 'contato', proposta_enviada: 'proposta',
        negociacao: 'negociacao', convertido: 'convertido', perdido: 'perdido',
      };
      update.status = statusMap[lead.status] ?? lead.status;
    }
    if (lead.vendedorId !== undefined) update.vendedor_id = lead.vendedorId;
    if (lead.observacoes !== undefined) update.observacoes = lead.observacoes;
    if (lead.proximoFollowUp !== undefined) update.proximo_contato = new Date(lead.proximoFollowUp).toISOString();
    const { error } = await supabase.from('leads').update(update).eq('id', id);
    if (error) console.error('updateLead:', error);
  }

  async deleteLead(id: string): Promise<void> {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) console.error('deleteLead:', error);
  }

  async convertLeadToCliente(leadId: string): Promise<Cliente | null> {
    const leads = await this.getLeadsAsync();
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return null;
    const cliente = await this.saveCliente({ nome: lead.nome, cpf: '', telefone: lead.telefone, email: lead.email });
    await this.updateLead(leadId, { status: 'convertido' });
    return cliente;
  }

  // ========== INTERAÇÕES ==========

  async getInteracoesAsync(): Promise<Interacao[]> {
    const { data, error } = await supabase.from('interacoes_leads').select('*').order('criado_em', { ascending: false });
    if (error) { console.error('getInteracoes:', error); return []; }
    return (data ?? []).map((row: any) => ({
      id: row.id,
      tipo: row.tipo as Interacao['tipo'],
      leadId: row.lead_id ?? undefined,
      vendedorId: row.vendedor_id ?? undefined,
      descricao: row.descricao,
      data: safeDate(row.criado_em),
    }));
  }

  getInteracoes(): Interacao[] { return []; }

  async saveInteracao(interacao: Omit<Interacao, 'id'>): Promise<void> {
    const { error } = await supabase.from('interacoes_leads').insert({
      lead_id: interacao.leadId ?? null,
      vendedor_id: interacao.vendedorId ?? null,
      tipo: interacao.tipo,
      descricao: interacao.descricao,
    });
    if (error) console.error('saveInteracao:', error);
  }

  async getInteracoesByLead(leadId: string): Promise<Interacao[]> {
    const { data, error } = await supabase.from('interacoes_leads').select('*').eq('lead_id', leadId).order('criado_em', { ascending: false });
    if (error) return [];
    return (data ?? []).map((row: any) => ({
      id: row.id, tipo: row.tipo, leadId: row.lead_id, vendedorId: row.vendedor_id,
      descricao: row.descricao, data: safeDate(row.criado_em),
    }));
  }

  // ========== DESPESAS ==========

  async getDespesasAsync(): Promise<Despesa[]> {
    const { data, error } = await supabase.from('despesas').select('*').order('data_despesa', { ascending: false });
    if (error) { console.error('getDespesas:', error); return []; }
    return (data ?? []).map(mapDespesa);
  }

  getDespesas(): Despesa[] { return []; }

  async saveDespesa(despesa: Omit<Despesa, 'id'>): Promise<void> {
    const { error } = await supabase.from('despesas').insert({
      descricao: despesa.descricao,
      categoria: despesa.categoria,
      valor: despesa.valor,
      data_despesa: despesa.data,
      observacoes: despesa.observacoes ?? null,
    });
    if (error) console.error('saveDespesa:', error);
  }

  async deleteDespesa(id: string): Promise<void> {
    const { error } = await supabase.from('despesas').delete().eq('id', id);
    if (error) console.error('deleteDespesa:', error);
  }

  // ========== TRANSPORTES ==========

  async getTransportesAsync(): Promise<Transporte[]> {
    const { data, error } = await supabase.from('transportes').select('*').order('criado_em', { ascending: false });
    if (error) { console.error('getTransportes:', error); return []; }
    return (data ?? []).map((row: any): Transporte => ({
      id: row.id,
      veiculoId: row.veiculo_id,
      veiculo: row.veiculo,
      placa: row.placa,
      transportadora: row.transportadora,
      nomeMotorista: row.nome_motorista ?? undefined,
      telefoneMotorista: row.telefone_motorista ?? undefined,
      placaCegonha: row.placa_cegonha ?? undefined,
      cidadeOrigem: row.cidade_origem,
      estadoOrigem: row.estado_origem,
      cidadeDestino: row.cidade_destino,
      estadoDestino: row.estado_destino,
      dataColeta: safeDate(row.data_coleta),
      previsaoEntrega: safeDate(row.previsao_entrega),
      dataEntregaReal: safeDate(row.data_entrega_real) || undefined,
      status: row.status,
      valorFrete: Number(row.valor_frete),
      localizacaoAtual: row.localizacao_atual ?? undefined,
      ultimaAtualizacao: row.ultima_atualizacao ?? undefined,
      observacoes: row.observacoes ?? undefined,
    }));
  }

  getTransportes(): Transporte[] { return []; }

  async saveTransporte(transporte: Omit<Transporte, 'id'>): Promise<void> {
    const { error } = await supabase.from('transportes').insert({
      veiculo_id: transporte.veiculoId,
      veiculo: transporte.veiculo,
      placa: transporte.placa,
      transportadora: transporte.transportadora,
      nome_motorista: transporte.nomeMotorista ?? null,
      telefone_motorista: transporte.telefoneMotorista ?? null,
      placa_cegonha: transporte.placaCegonha ?? null,
      cidade_origem: transporte.cidadeOrigem,
      estado_origem: transporte.estadoOrigem,
      cidade_destino: transporte.cidadeDestino,
      estado_destino: transporte.estadoDestino,
      data_coleta: transporte.dataColeta,
      previsao_entrega: transporte.previsaoEntrega,
      data_entrega_real: transporte.dataEntregaReal ?? null,
      status: transporte.status,
      valor_frete: transporte.valorFrete,
      localizacao_atual: transporte.localizacaoAtual ?? null,
      ultima_atualizacao: transporte.ultimaAtualizacao ?? null,
      observacoes: transporte.observacoes ?? null,
    });
    if (error) { console.error('saveTransporte:', error); return; }
    await this.updateVeiculo(transporte.veiculoId, { status: 'em_transito' });
  }

  async updateTransporte(id: string, transporte: Partial<Transporte>): Promise<void> {
    const update: any = {};
    if (transporte.status !== undefined) update.status = transporte.status;
    if (transporte.transportadora !== undefined) update.transportadora = transporte.transportadora;
    if (transporte.nomeMotorista !== undefined) update.nome_motorista = transporte.nomeMotorista ?? null;
    if (transporte.telefoneMotorista !== undefined) update.telefone_motorista = transporte.telefoneMotorista ?? null;
    if (transporte.placaCegonha !== undefined) update.placa_cegonha = transporte.placaCegonha ?? null;
    if (transporte.cidadeDestino !== undefined) update.cidade_destino = transporte.cidadeDestino;
    if (transporte.estadoDestino !== undefined) update.estado_destino = transporte.estadoDestino;
    if (transporte.dataColeta !== undefined) update.data_coleta = transporte.dataColeta;
    if (transporte.previsaoEntrega !== undefined) update.previsao_entrega = transporte.previsaoEntrega;
    if (transporte.valorFrete !== undefined) update.valor_frete = transporte.valorFrete;
    if (transporte.localizacaoAtual !== undefined) update.localizacao_atual = transporte.localizacaoAtual;
    if (transporte.ultimaAtualizacao !== undefined) update.ultima_atualizacao = transporte.ultimaAtualizacao;
    if (transporte.dataEntregaReal !== undefined) update.data_entrega_real = transporte.dataEntregaReal;
    if (transporte.observacoes !== undefined) update.observacoes = transporte.observacoes ?? null;
    const { error } = await supabase.from('transportes').update(update).eq('id', id);
    if (error) { console.error('updateTransporte:', error); return; }
    if (transporte.status === 'entregue') {
      const transportes = await this.getTransportesAsync();
      const t = transportes.find(t => t.id === id);
      if (t) await this.updateVeiculo(t.veiculoId, {
        status: 'disponivel',
        dataEntrada: transporte.dataEntregaReal ?? new Date().toISOString().split('T')[0],
      });
    }
  }

  async deleteTransporte(id: string): Promise<void> {
    const { error } = await supabase.from('transportes').delete().eq('id', id);
    if (error) console.error('deleteTransporte:', error);
  }

  async getTransportesByVeiculo(veiculoId: string): Promise<Transporte[]> {
    const { data, error } = await supabase.from('transportes').select('*').eq('veiculo_id', veiculoId);
    if (error) return [];
    return (data ?? []).map((row: any): Transporte => ({
      id: row.id, veiculoId: row.veiculo_id, veiculo: row.veiculo, placa: row.placa,
      transportadora: row.transportadora, nomeMotorista: row.nome_motorista ?? undefined,
      telefoneMotorista: row.telefone_motorista ?? undefined, placaCegonha: row.placa_cegonha ?? undefined,
      cidadeOrigem: row.cidade_origem, estadoOrigem: row.estado_origem,
      cidadeDestino: row.cidade_destino, estadoDestino: row.estado_destino,
      dataColeta: safeDate(row.data_coleta), previsaoEntrega: safeDate(row.previsao_entrega),
      dataEntregaReal: safeDate(row.data_entrega_real) || undefined, status: row.status,
      valorFrete: Number(row.valor_frete), localizacaoAtual: row.localizacao_atual ?? undefined,
      ultimaAtualizacao: row.ultima_atualizacao ?? undefined, observacoes: row.observacoes ?? undefined,
    }));
  }

  initializeSampleData(): void {}
}

export const store = new Store();