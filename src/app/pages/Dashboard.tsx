import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { store, Venda, Despesa, Veiculo } from '../lib/store';
import { DollarSign, TrendingUp, Car, ShoppingCart, Users, UserPlus, CalendarDays, Receipt, Clock } from 'lucide-react';
import { lerData } from '../lib/datas';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function Dashboard() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [v, d, ve, vend, l] = await Promise.all([
        store.getVendasAsync(),
        store.getDespesasAsync(),
        store.getVeiculosAsync(),
        store.getVendedoresAsync(),
        store.getLeadsAsync(),
      ]);
      setVendas(v);
      setDespesas(d);
      setVeiculos(ve);
      setVendedores(vend);
      setLeads(l);
      setLoading(false);
    }
    load();
  }, []);

  const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  // Datas do banco vêm como "2026-10-01". Lidas direto viram meia-noite UTC,
  // que em Fortaleza ainda é dia 30/09 — por isso as vendas do dia 1º caíam no mês anterior.
  const dataLocal = lerData;
  const chaveMes = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  const receitaTotal = vendas.reduce((sum, v) => sum + v.valorVenda, 0);
  const despesasTotal = despesas.reduce((sum, d) => sum + d.valor, 0);
  const lucroTotal = vendas.reduce((sum, v) => sum + v.lucro, 0);
  const comissoesTotal = vendas.reduce((sum, v) => sum + (v.comissao || 0), 0);
  const disponiveis = veiculos.filter(v => v.status === 'disponivel');
  const veiculosDisponiveis = disponiveis.length;
  const valorEstoque = disponiveis.reduce((sum, v) => sum + v.preco, 0);
  const saldoAtual = receitaTotal - despesasTotal;
  const leadsAtivos = leads.filter(l => l.status !== 'convertido' && l.status !== 'perdido').length;
  const taxaConversao = leads.length > 0
    ? ((leads.filter(l => l.status === 'convertido').length / leads.length) * 100).toFixed(1)
    : '0';
  const ticketMedio = vendas.length > 0 ? receitaTotal / vendas.length : 0;

  // Vendas do mês atual x mês anterior
  const hoje = new Date();
  const mesAtual = chaveMes(hoje);
  const mesAnterior = chaveMes(new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1));
  const vendasMes = vendas.filter(v => chaveMes(dataLocal(v.dataVenda)) === mesAtual);
  const vendasMesAnterior = vendas.filter(v => chaveMes(dataLocal(v.dataVenda)) === mesAnterior);
  const receitaMes = vendasMes.reduce((s, v) => s + v.valorVenda, 0);

  // Veículos parados há mais de 60 dias
  const DIAS_PARADO = 60;
  const diasNoEstoque = (v: Veiculo) => v.dataEntrada ? Math.floor((hoje.getTime() - dataLocal(v.dataEntrada).getTime()) / 86_400_000) : 0;
  const parados = disponiveis.filter(v => diasNoEstoque(v) > DIAS_PARADO).sort((a, b) => diasNoEstoque(b) - diasNoEstoque(a));
  const valorParado = parados.reduce((s, v) => s + v.preco, 0);

  // Agrupa por ano-mês (não só pelo nome do mês) e mostra em ordem cronológica
  const vendasPorMes = Object.values(vendas.reduce((acc, venda) => {
    const d = dataLocal(venda.dataVenda);
    const chave = chaveMes(d);
    acc[chave] ??= { chave, mes: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('. de ', '/').replace(' de ', '/'), vendas: 0, lucro: 0 };
    acc[chave].vendas += venda.valorVenda;
    acc[chave].lucro += venda.lucro;
    return acc;
  }, {} as Record<string, { chave: string; mes: string; vendas: number; lucro: number }>))
    .sort((a, b) => a.chave.localeCompare(b.chave))
    .slice(-12);

  // Agrupa pela categoria original (antes comparava "Salarios" com "salarios" e nunca juntava)
  const nomeCategoria = (c: string) => {
    const t = (c || 'outros').trim().toLowerCase();
    const nomes: Record<string, string> = { salarios: 'Salários', impostos: 'Impostos', outros: 'Outros' };
    return nomes[t] ?? t.charAt(0).toUpperCase() + t.slice(1);
  };
  const despesasPorCategoria = Object.values(despesas.reduce((acc, d) => {
    const nome = nomeCategoria(d.categoria);
    acc[nome] ??= { categoria: nome, valor: 0 };
    acc[nome].valor += d.valor;
    return acc;
  }, {} as Record<string, { categoria: string; valor: number }>)).sort((a, b) => b.valor - a.valor);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do desempenho financeiro</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{receitaTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
            <p className="text-xs text-muted-foreground">{vendas.length} vendas realizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lucro Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{lucroTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
            <p className="text-xs text-muted-foreground">Margem: {vendas.length > 0 ? ((lucroTotal / receitaTotal) * 100).toFixed(1) : 0}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{despesasTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
            <p className="text-xs text-muted-foreground">Saldo: {saldoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Estoque</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{veiculosDisponiveis}</div>
            <p className="text-xs text-muted-foreground">Valor: {valorEstoque.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vendas este mês</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendasMes.length}</div>
            <p className="text-xs text-muted-foreground">
              {brl(receitaMes)} · mês passado: {vendasMesAnterior.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brl(ticketMedio)}</div>
            <p className="text-xs text-muted-foreground">Lucro médio por venda: {brl(vendas.length ? lucroTotal / vendas.length : 0)}</p>
          </CardContent>
        </Card>

        <Card className={parados.length > 0 ? 'border-amber-300' : undefined}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Parados há +{DIAS_PARADO} dias</CardTitle>
            <Clock className={`h-4 w-4 ${parados.length > 0 ? 'text-amber-600' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${parados.length > 0 ? 'text-amber-600' : ''}`}>{parados.length}</div>
            <p className="text-xs text-muted-foreground">
              {parados.length > 0
                ? `${brl(valorParado)} · mais antigo: ${diasNoEstoque(parados[0])} dias`
                : 'Nenhum veículo encalhado'}
            </p>
          </CardContent>
        </Card>

        {(comissoesTotal > 0 || vendedores.length > 0) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Comissões</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{brl(comissoesTotal)}</div>
              <p className="text-xs text-muted-foreground">Vendedores: {vendedores.length}</p>
            </CardContent>
          </Card>
        )}

        {leads.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Leads Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leadsAtivos}</div>
              <p className="text-xs text-muted-foreground">Taxa de Conversão: {taxaConversao}%</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Vendas e Lucro por Mês</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vendasPorMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis width={56} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toLocaleString('pt-BR')} mil` : String(v)} />
                <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                <Legend />
                <Bar dataKey="vendas" fill="#0088FE" name="Vendas" />
                <Bar dataKey="lucro" fill="#00C49F" name="Lucro" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Despesas por Categoria</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={despesasPorCategoria} cx="50%" cy="45%" innerRadius={55} outerRadius={95}
                  paddingAngle={2} nameKey="categoria" dataKey="valor">
                  {despesasPorCategoria.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => brl(value)} />
                <Legend formatter={(nome: string, item: any) => {
                  const pct = despesasTotal ? ((item.payload.valor / despesasTotal) * 100).toFixed(0) : 0;
                  return `${nome}: ${brl(item.payload.valor)} (${pct}%)`;
                }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Últimas Vendas</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vendas.slice(0, 5).map((venda) => (
              <div key={venda.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div>
                  <p className="font-medium">{venda.veiculo}</p>
                  <p className="text-sm text-muted-foreground">{venda.cliente}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{venda.valorVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  <p className="text-sm text-green-600">+{venda.lucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
              </div>
            ))}
            {vendas.length === 0 && <p className="text-center text-muted-foreground py-4">Nenhuma venda registrada ainda</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}