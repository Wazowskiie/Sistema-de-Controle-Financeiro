import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { store, Venda, Despesa, Veiculo } from '../lib/store';
import { DollarSign, TrendingUp, Car, ShoppingCart, Users, UserPlus } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function Dashboard() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    // Inicializar dados de exemplo na primeira vez
    store.initializeSampleData();
    
    setVendas(store.getVendas());
    setDespesas(store.getDespesas());
    setVeiculos(store.getVeiculos());
    setVendedores(store.getVendedores());
    setLeads(store.getLeads());
  }, []);

  // Cálculos
  const receitaTotal = vendas.reduce((sum, v) => sum + v.valorVenda, 0);
  const despesasTotal = despesas.reduce((sum, d) => sum + d.valor, 0);
  const lucroTotal = vendas.reduce((sum, v) => sum + v.lucro, 0);
  const comissoesTotal = vendas.reduce((sum, v) => sum + (v.comissao || 0), 0);
  const veiculosDisponiveis = veiculos.filter(v => v.status === 'disponivel').length;
  const valorEstoque = veiculos
    .filter(v => v.status === 'disponivel')
    .reduce((sum, v) => sum + v.preco, 0);
  const saldoAtual = receitaTotal - despesasTotal;
  const leadsAtivos = leads.filter(l => l.status !== 'convertido' && l.status !== 'perdido').length;
  const taxaConversao = leads.length > 0 
    ? ((leads.filter(l => l.status === 'convertido').length / leads.length) * 100).toFixed(1)
    : '0';

  // Dados para gráficos
  const vendasPorMes = vendas.reduce((acc, venda) => {
    const mes = new Date(venda.dataVenda).toLocaleDateString('pt-BR', { month: 'short' });
    const existing = acc.find(item => item.mes === mes);
    if (existing) {
      existing.vendas += venda.valorVenda;
      existing.lucro += venda.lucro;
    } else {
      acc.push({ 
        id: `mes-${mes}-${acc.length}`,
        mes, 
        vendas: venda.valorVenda, 
        lucro: venda.lucro 
      });
    }
    return acc;
  }, [] as { id: string; mes: string; vendas: number; lucro: number }[]);

  const despesasPorCategoria = despesas.reduce((acc, despesa) => {
    const existing = acc.find(item => item.categoria === despesa.categoria);
    if (existing) {
      existing.valor += despesa.valor;
    } else {
      acc.push({ 
        id: `cat-${despesa.categoria}-${acc.length}`,
        categoria: despesa.categoria.charAt(0).toUpperCase() + despesa.categoria.slice(1), 
        valor: despesa.valor 
      });
    }
    return acc;
  }, [] as { id: string; categoria: string; valor: number }[]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do desempenho financeiro</p>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {receitaTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              {vendas.length} vendas realizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lucro Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {lucroTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              Margem: {vendas.length > 0 ? ((lucroTotal / receitaTotal) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {despesasTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              Saldo: {saldoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Estoque</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{veiculosDisponiveis}</div>
            <p className="text-xs text-muted-foreground">
              Valor: {valorEstoque.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Comissões</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {comissoesTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              Vendedores: {vendedores.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Leads Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadsAtivos}</div>
            <p className="text-xs text-muted-foreground">
              Taxa de Conversão: {taxaConversao}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vendas e Lucro por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vendasPorMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                />
                <Legend />
                <Bar dataKey="vendas" fill="#0088FE" name="Vendas" />
                <Bar dataKey="lucro" fill="#00C49F" name="Lucro" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={despesasPorCategoria}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.categoria}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="valor"
                >
                  {despesasPorCategoria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Últimas Vendas */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vendas.slice(-5).reverse().map((venda, index) => (
              <div key={`${venda.id}-${index}`} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div>
                  <p className="font-medium">{venda.veiculo}</p>
                  <p className="text-sm text-muted-foreground">{venda.cliente}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {venda.valorVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <p className="text-sm text-green-600">
                    +{venda.lucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </div>
            ))}
            {vendas.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Nenhuma venda registrada ainda
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}