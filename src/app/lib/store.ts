// Sistema de gerenciamento de dados com localStorage - Versão Completa

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
  // Origem do veículo
  origem: 'leilao' | 'particular' | 'troca' | 'concessionaria' | 'outros';
  // Dados específicos de leilão
  dadosLeilao?: {
    nomeEventoLeilao: string;
    numeroLote: string;
    cidadeOrigem: string;
    estadoOrigem: string;
    dataArrematacao: string;
  };
  // Transporte
  transporteId?: string;
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
  
  // Valores
  valorVenda: number;
  valorCusto: number;
  desconto: number;
  motivoDesconto?: string;
  valorEntrada: number;
  
  // Financiamento
  financiado: boolean;
  valorFinanciado?: number;
  numeroParcelas?: number;
  valorParcela?: number;
  banco?: string;
  
  // Trade-in
  tradeIn?: TradeIn;
  valorTradeIn?: number;
  
  // Pagamento
  formaPagamento: 'dinheiro' | 'financiamento' | 'cartao' | 'transferencia';
  dataVenda: string;
  
  // Documentação
  statusDocumentacao: 'pendente' | 'em_andamento' | 'concluida';
  documentosEntregues: string[];
  observacoes?: string;
  
  // Calculados
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
  // Dados da integração
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
  veiculo: string; // Marca/Modelo para exibição
  placa: string;

  // Informações de transporte
  transportadora: string;
  nomeMotorista?: string;
  telefoneMotorista?: string;
  placaCegonha?: string;

  // Origem e destino
  cidadeOrigem: string;
  estadoOrigem: string;
  cidadeDestino: string;
  estadoDestino: string;

  // Datas e status
  dataColeta: string;
  previsaoEntrega: string;
  dataEntregaReal?: string;
  status: 'aguardando_coleta' | 'em_transito' | 'em_transito_atrasado' | 'entregue' | 'cancelado';

  // Custos
  valorFrete: number;

  // Rastreamento
  localizacaoAtual?: string;
  ultimaAtualizacao?: string;
  observacoes?: string;
}

// Contador para garantir IDs únicos
let idCounter = Date.now();

function generateId(): string {
  return `${Date.now()}-${idCounter++}-${Math.random().toString(36).substr(2, 9)}`;
}

class Store {
  private STORE_VERSION = '3.0';
  
  constructor() {
    this.checkAndMigrateStore();
  }

  private checkAndMigrateStore() {
    const version = localStorage.getItem('storeVersion');
    if (version !== this.STORE_VERSION) {
      localStorage.clear();
      localStorage.setItem('storeVersion', this.STORE_VERSION);
    }
  }

  // ========== VEÍCULOS ==========
  getVeiculos(): Veiculo[] {
    const data = localStorage.getItem('veiculos');
    return data ? JSON.parse(data) : [];
  }

  saveVeiculo(veiculo: Omit<Veiculo, 'id'>): void {
    const veiculos = this.getVeiculos();
    const novoVeiculo: Veiculo = { ...veiculo, id: generateId() };
    veiculos.push(novoVeiculo);
    localStorage.setItem('veiculos', JSON.stringify(veiculos));
  }

  updateVeiculo(id: string, veiculo: Partial<Veiculo>): void {
    const veiculos = this.getVeiculos();
    const index = veiculos.findIndex(v => v.id === id);
    if (index !== -1) {
      veiculos[index] = { ...veiculos[index], ...veiculo };
      localStorage.setItem('veiculos', JSON.stringify(veiculos));
    }
  }

  deleteVeiculo(id: string): void {
    const veiculos = this.getVeiculos().filter(v => v.id !== id);
    localStorage.setItem('veiculos', JSON.stringify(veiculos));
  }

  // ========== CLIENTES ==========
  getClientes(): Cliente[] {
    const data = localStorage.getItem('clientes');
    return data ? JSON.parse(data) : [];
  }

  saveCliente(cliente: Omit<Cliente, 'id' | 'dataCadastro'>): Cliente {
    const clientes = this.getClientes();
    const novoCliente: Cliente = {
      ...cliente,
      id: generateId(),
      dataCadastro: new Date().toISOString().split('T')[0],
    };
    clientes.push(novoCliente);
    localStorage.setItem('clientes', JSON.stringify(clientes));
    return novoCliente;
  }

  updateCliente(id: string, cliente: Partial<Cliente>): void {
    const clientes = this.getClientes();
    const index = clientes.findIndex(c => c.id === id);
    if (index !== -1) {
      clientes[index] = { ...clientes[index], ...cliente };
      localStorage.setItem('clientes', JSON.stringify(clientes));
    }
  }

  getClienteByCpf(cpf: string): Cliente | undefined {
    return this.getClientes().find(c => c.cpf === cpf);
  }

  // ========== VENDEDORES ==========
  getVendedores(): Vendedor[] {
    const data = localStorage.getItem('vendedores');
    return data ? JSON.parse(data) : [];
  }

  saveVendedor(vendedor: Omit<Vendedor, 'id'>): void {
    const vendedores = this.getVendedores();
    const novoVendedor: Vendedor = { ...vendedor, id: generateId() };
    vendedores.push(novoVendedor);
    localStorage.setItem('vendedores', JSON.stringify(vendedores));
  }

  updateVendedor(id: string, vendedor: Partial<Vendedor>): void {
    const vendedores = this.getVendedores();
    const index = vendedores.findIndex(v => v.id === id);
    if (index !== -1) {
      vendedores[index] = { ...vendedores[index], ...vendedor };
      localStorage.setItem('vendedores', JSON.stringify(vendedores));
    }
  }

  deleteVendedor(id: string): void {
    const vendedores = this.getVendedores().filter(v => v.id !== id);
    localStorage.setItem('vendedores', JSON.stringify(vendedores));
  }

  // ========== VENDAS ==========
  getVendas(): Venda[] {
    const data = localStorage.getItem('vendas');
    return data ? JSON.parse(data) : [];
  }

  saveVenda(venda: Omit<Venda, 'id' | 'lucro' | 'comissao'>): void {
    const vendas = this.getVendas();
    
    // Calcular lucro
    let lucro = venda.valorVenda - venda.valorCusto - venda.desconto;
    if (venda.valorTradeIn) {
      lucro -= venda.valorTradeIn;
    }
    
    // Calcular comissão
    let comissao = 0;
    if (venda.vendedorId) {
      const vendedor = this.getVendedores().find(v => v.id === venda.vendedorId);
      if (vendedor) {
        comissao = lucro * (vendedor.percentualComissao / 100);
      }
    }
    
    const novaVenda: Venda = {
      ...venda,
      id: generateId(),
      lucro,
      comissao,
    };
    
    vendas.push(novaVenda);
    localStorage.setItem('vendas', JSON.stringify(vendas));
    
    // Atualizar status do veículo
    this.updateVeiculo(venda.veiculoId, { status: 'vendido' });
  }

  updateVenda(id: string, venda: Partial<Venda>): void {
    const vendas = this.getVendas();
    const index = vendas.findIndex(v => v.id === id);
    if (index !== -1) {
      vendas[index] = { ...vendas[index], ...venda };
      localStorage.setItem('vendas', JSON.stringify(vendas));
    }
  }

  deleteVenda(id: string): void {
    const vendas = this.getVendas().filter(v => v.id !== id);
    localStorage.setItem('vendas', JSON.stringify(vendas));
  }

  // ========== LEADS ==========
  getLeads(): Lead[] {
    const data = localStorage.getItem('leads');
    return data ? JSON.parse(data) : [];
  }

  saveLead(lead: Omit<Lead, 'id' | 'dataCriacao'>): void {
    const leads = this.getLeads();
    const novoLead: Lead = {
      ...lead,
      id: generateId(),
      dataCriacao: new Date().toISOString().split('T')[0],
    };
    leads.push(novoLead);
    localStorage.setItem('leads', JSON.stringify(leads));
  }

  updateLead(id: string, lead: Partial<Lead>): void {
    const leads = this.getLeads();
    const index = leads.findIndex(l => l.id === id);
    if (index !== -1) {
      leads[index] = { ...leads[index], ...lead };
      localStorage.setItem('leads', JSON.stringify(leads));
    }
  }

  deleteLead(id: string): void {
    const leads = this.getLeads().filter(l => l.id !== id);
    localStorage.setItem('leads', JSON.stringify(leads));
  }

  convertLeadToCliente(leadId: string): Cliente | null {
    const lead = this.getLeads().find(l => l.id === leadId);
    if (!lead) return null;

    const cliente = this.saveCliente({
      nome: lead.nome,
      cpf: '',
      telefone: lead.telefone,
      email: lead.email,
    });

    this.updateLead(leadId, { status: 'convertido' });
    return cliente;
  }

  // ========== INTERAÇÕES ==========
  getInteracoes(): Interacao[] {
    const data = localStorage.getItem('interacoes');
    return data ? JSON.parse(data) : [];
  }

  saveInteracao(interacao: Omit<Interacao, 'id'>): void {
    const interacoes = this.getInteracoes();
    const novaInteracao: Interacao = { ...interacao, id: generateId() };
    interacoes.push(novaInteracao);
    localStorage.setItem('interacoes', JSON.stringify(interacoes));

    // Atualizar data de último contato do lead
    if (interacao.leadId) {
      this.updateLead(interacao.leadId, { dataUltimoContato: interacao.data });
    }
  }

  getInteracoesByLead(leadId: string): Interacao[] {
    return this.getInteracoes().filter(i => i.leadId === leadId);
  }

  getInteracoesByCliente(clienteId: string): Interacao[] {
    return this.getInteracoes().filter(i => i.clienteId === clienteId);
  }

  getInteracoesByVenda(vendaId: string): Interacao[] {
    return this.getInteracoes().filter(i => i.vendaId === vendaId);
  }

  // ========== DESPESAS ==========
  getDespesas(): Despesa[] {
    const data = localStorage.getItem('despesas');
    return data ? JSON.parse(data) : [];
  }

  saveDespesa(despesa: Omit<Despesa, 'id'>): void {
    const despesas = this.getDespesas();
    const novaDespesa: Despesa = { ...despesa, id: generateId() };
    despesas.push(novaDespesa);
    localStorage.setItem('despesas', JSON.stringify(despesas));
  }

  deleteDespesa(id: string): void {
    const despesas = this.getDespesas().filter(d => d.id !== id);
    localStorage.setItem('despesas', JSON.stringify(despesas));
  }

  // ========== TRANSPORTES ==========
  getTransportes(): Transporte[] {
    const data = localStorage.getItem('transportes');
    return data ? JSON.parse(data) : [];
  }

  saveTransporte(transporte: Omit<Transporte, 'id'>): void {
    const transportes = this.getTransportes();
    const novoTransporte: Transporte = { ...transporte, id: generateId() };
    transportes.push(novoTransporte);
    localStorage.setItem('transportes', JSON.stringify(transportes));

    // Atualizar veículo com ID do transporte e status em_transito
    this.updateVeiculo(transporte.veiculoId, {
      transporteId: novoTransporte.id,
      status: 'em_transito'
    });
  }

  updateTransporte(id: string, transporte: Partial<Transporte>): void {
    const transportes = this.getTransportes();
    const index = transportes.findIndex(t => t.id === id);
    if (index !== -1) {
      transportes[index] = { ...transportes[index], ...transporte };
      localStorage.setItem('transportes', JSON.stringify(transportes));

      // Se transporte foi entregue, atualizar status do veículo
      if (transporte.status === 'entregue') {
        const transp = transportes[index];
        this.updateVeiculo(transp.veiculoId, {
          status: 'disponivel',
          dataEntrada: transporte.dataEntregaReal || new Date().toISOString().split('T')[0]
        });
      }
    }
  }

  deleteTransporte(id: string): void {
    const transportes = this.getTransportes().filter(t => t.id !== id);
    localStorage.setItem('transportes', JSON.stringify(transportes));
  }

  getTransportesByVeiculo(veiculoId: string): Transporte[] {
    return this.getTransportes().filter(t => t.veiculoId === veiculoId);
  }

  // ========== DADOS DE EXEMPLO ==========
  initializeSampleData(): void {
    // Vendedores
    if (this.getVendedores().length === 0) {
      this.saveVendedor({
        nome: 'Carlos Vendas',
        cpf: '111.222.333-44',
        telefone: '(11) 99999-1111',
        email: 'carlos@loja.com',
        percentualComissao: 3,
        dataContratacao: '2025-01-10',
        ativo: true,
      });
      this.saveVendedor({
        nome: 'Ana Paula',
        cpf: '222.333.444-55',
        telefone: '(11) 99999-2222',
        email: 'ana@loja.com',
        percentualComissao: 2.5,
        dataContratacao: '2025-06-15',
        ativo: true,
      });
    }

    // Veículos
    if (this.getVeiculos().length === 0) {
      const veiculosExemplo: Omit<Veiculo, 'id'>[] = [
        {
          marca: 'Toyota',
          modelo: 'Corolla',
          ano: 2022,
          cor: 'Prata',
          preco: 125000,
          precoCompra: 110000,
          status: 'disponivel',
          dataEntrada: '2026-04-15',
          km: 25000,
          placa: 'ABC-1234',
          origem: 'leilao',
          dadosLeilao: {
            nomeEventoLeilao: 'Leilão SulBrasil Auto',
            numeroLote: '12345',
            cidadeOrigem: 'Porto Alegre',
            estadoOrigem: 'RS',
            dataArrematacao: '2026-04-01',
          },
        },
        {
          marca: 'Honda',
          modelo: 'Civic',
          ano: 2023,
          cor: 'Preto',
          preco: 145000,
          precoCompra: 130000,
          status: 'disponivel',
          dataEntrada: '2026-04-20',
          km: 15000,
          placa: 'DEF-5678',
          origem: 'particular',
        },
        {
          marca: 'Volkswagen',
          modelo: 'Jetta',
          ano: 2021,
          cor: 'Branco',
          preco: 98000,
          precoCompra: 85000,
          status: 'disponivel',
          dataEntrada: '2026-03-10',
          km: 35000,
          placa: 'GHI-9012',
          origem: 'troca',
        },
        {
          marca: 'Chevrolet',
          modelo: 'Onix',
          ano: 2023,
          cor: 'Vermelho',
          preco: 75000,
          precoCompra: 68000,
          status: 'disponivel',
          dataEntrada: '2026-05-01',
          km: 8000,
          placa: 'JKL-3456',
          origem: 'concessionaria',
        },
      ];
      veiculosExemplo.forEach(v => this.saveVeiculo(v));
    }

    // Leads
    if (this.getLeads().length === 0) {
      const vendedores = this.getVendedores();
      this.saveLead({
        nome: 'Pedro Oliveira',
        telefone: '(11) 98888-7777',
        email: 'pedro@email.com',
        veiculoInteresse: 'Honda Civic',
        origem: 'whatsapp',
        status: 'contato_realizado',
        vendedorId: vendedores[0]?.id,
        vendedor: vendedores[0]?.nome,
        dataUltimoContato: '2026-05-05',
        proximoFollowUp: '2026-05-08',
        observacoes: 'Interessado em test drive',
      });
      this.saveLead({
        nome: 'Juliana Costa',
        telefone: '(11) 97777-6666',
        origem: 'site',
        status: 'novo',
        vendedorId: vendedores[1]?.id,
        vendedor: vendedores[1]?.nome,
      });
    }

    // Transportes
    if (this.getTransportes().length === 0) {
      const veiculos = this.getVeiculos();
      const veiculoLeilao = veiculos.find(v => v.origem === 'leilao');

      if (veiculoLeilao && veiculoLeilao.dadosLeilao) {
        this.saveTransporte({
          veiculoId: veiculoLeilao.id,
          veiculo: `${veiculoLeilao.marca} ${veiculoLeilao.modelo}`,
          placa: veiculoLeilao.placa,
          transportadora: 'TransCar Logística',
          nomeMotorista: 'Roberto Silva',
          telefoneMotorista: '(51) 99888-7777',
          placaCegonha: 'XYZ-9876',
          cidadeOrigem: veiculoLeilao.dadosLeilao.cidadeOrigem,
          estadoOrigem: veiculoLeilao.dadosLeilao.estadoOrigem,
          cidadeDestino: 'Curitiba',
          estadoDestino: 'PR',
          dataColeta: '2026-04-10',
          previsaoEntrega: '2026-04-14',
          status: 'entregue',
          dataEntregaReal: '2026-04-15',
          valorFrete: 2500,
          localizacaoAtual: 'Entregue em Curitiba/PR',
          ultimaAtualizacao: new Date().toISOString(),
          observacoes: 'Transporte realizado com sucesso',
        });
      }
    }

    // Despesas
    if (this.getDespesas().length === 0) {
      const despesasExemplo: Omit<Despesa, 'id'>[] = [
        {
          descricao: 'Aluguel do Pátio',
          categoria: 'aluguel',
          valor: 5000,
          data: '2026-05-01',
        },
        {
          descricao: 'Salários Funcionários',
          categoria: 'salarios',
          valor: 15000,
          data: '2026-05-05',
        },
        {
          descricao: 'IPVA e Licenciamento',
          categoria: 'impostos',
          valor: 3200,
          data: '2026-04-20',
        },
        {
          descricao: 'Manutenção Veículos',
          categoria: 'manutencao',
          valor: 2500,
          data: '2026-04-28',
        },
      ];
      despesasExemplo.forEach(d => this.saveDespesa(d));
    }
  }
}

export const store = new Store();