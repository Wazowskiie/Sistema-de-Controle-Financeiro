import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { store, Venda, Despesa, Veiculo } from '../lib/store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';

export function Relatorios() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);

  useEffect(() => {
    setVendas(store.getVendas());
    setDespesas(store.getDespesas());
    setVeiculos(store.getVeiculos());
  }, []);

  // Cálculos gerais
  const receitaTotal = vendas.reduce((sum, v) => sum + v.valorVenda, 0);
  const custoTotal = vendas.reduce((sum, v) => sum + v.valorCusto, 0);
  const despesasTotal = despesas.reduce((sum, d) => sum + d.valor, 0);
  const lucroOperacional = receitaTotal - custoTotal - despesasTotal;
  const margemLucro = receitaTotal > 0 ? (lucroOperacional / receitaTotal) * 100 : 0;

  // Desempenho mensal
  const desempenhoMensal = () => {
    const meses: Record<string, { mes: string; receitas: number; despesas: number; lucro: number }> = {};
    
    vendas.forEach(venda => {
      const mes = new Date(venda.dataVenda).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      if (!meses[mes]) {
        meses[mes] = { mes, receitas: 0, despesas: 0, lucro: 0 };
      }
      meses[mes].receitas += venda.valorVenda;
      meses[mes].lucro += venda.lucro;
    });

    despesas.forEach(despesa => {
      const mes = new Date(despesa.data).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      if (!meses[mes]) {
        meses[mes] = { mes, receitas: 0, despesas: 0, lucro: 0 };
      }
      meses[mes].despesas += despesa.valor;
      meses[mes].lucro -= despesa.valor;
    });

    return Object.values(meses);
  };

  // Vendas por forma de pagamento
  const vendasPorPagamento = vendas.reduce((acc, venda) => {
    const forma = venda.formaPagamento;
    const existing = acc.find(item => item.forma === forma);
    if (existing) {
      existing.quantidade += 1;
      existing.valor += venda.valorVenda;
    } else {
      acc.push({ 
        forma: forma.charAt(0).toUpperCase() + forma.slice(1), 
        quantidade: 1,
        valor: venda.valorVenda 
      });
    }
    return acc;
  }, [] as { forma: string; quantidade: number; valor: number }[]);

  // Top veículos vendidos por marca
  const vendasPorMarca = veiculos
    .filter(v => v.status === 'vendido')
    .reduce((acc, veiculo) => {
      const existing = acc.find(item => item.marca === veiculo.marca);
      if (existing) {
        existing.quantidade += 1;
      } else {
        acc.push({ marca: veiculo.marca, quantidade: 1 });
      }
      return acc;
    }, [] as { marca: string; quantidade: number }[])
    .sort((a, b) => b.quantidade - a.quantidade);

  // Despesas por categoria
  const despesasPorCategoria = despesas.reduce((acc, despesa) => {
    const cat = despesa.categoria.charAt(0).toUpperCase() + despesa.categoria.slice(1);
    const existing = acc.find(item => item.categoria === cat);
    if (existing) {
      existing.valor += despesa.valor;
    } else {
      acc.push({ categoria: cat, valor: despesa.valor });
    }
    return acc;
  }, [] as { categoria: string; valor: number }[]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground">Análise detalhada do desempenho financeiro</p>
      </div>

      {/* Cards de KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {receitaTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              {vendas.length} vendas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {despesasTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              {despesas.length} registros
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lucro Operacional</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${lucroOperacional >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {lucroOperacional.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              Margem: {margemLucro.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ROI Médio</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vendas.length > 0 ? ((receitaTotal - custoTotal) / custoTotal * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Retorno sobre investimento</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos em Abas */}
      <Tabs defaultValue="mensal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="mensal">Desempenho Mensal</TabsTrigger>
          <TabsTrigger value="vendas">Análise de Vendas</TabsTrigger>
          <TabsTrigger value="despesas">Análise de Despesas</TabsTrigger>
        </TabsList>

        <TabsContent value="mensal" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1">
            <Card>
              <CardHeader>
                <CardTitle>Receitas vs Despesas por Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={desempenhoMensal()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="receitas" stroke="#0088FE" name="Receitas" strokeWidth={2} />
                    <Line type="monotone" dataKey="despesas" stroke="#FF8042" name="Despesas" strokeWidth={2} />
                    <Line type="monotone" dataKey="lucro" stroke="#00C49F" name="Lucro" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vendas" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Vendas por Forma de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={vendasPorPagamento}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.forma} (${entry.quantidade})`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="valor"
                    >
                      {vendasPorPagamento.map((entry, index) => (
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

            <Card>
              <CardHeader>
                <CardTitle>Veículos Vendidos por Marca</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={vendasPorMarca}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="marca" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="quantidade" fill="#0088FE" name="Quantidade" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="despesas" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Despesas</CardTitle>
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

            <Card>
              <CardHeader>
                <CardTitle>Despesas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={despesasPorCategoria} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="categoria" type="category" width={100} />
                    <Tooltip 
                      formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    />
                    <Bar dataKey="valor" fill="#FF8042" name="Valor" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Resumo Executivo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Executivo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="font-semibold">Desempenho de Vendas</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Total de vendas: {vendas.length}</li>
                <li>• Receita total: {receitaTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</li>
                <li>• Ticket médio: {vendas.length > 0 ? (receitaTotal / vendas.length).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}</li>
                <li>• Lucro bruto: {(receitaTotal - custoTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Gestão de Custos</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Custo dos veículos: {custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</li>
                <li>• Despesas operacionais: {despesasTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</li>
                <li>• Custo total: {(custoTotal + despesasTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</li>
                <li>• Lucro operacional: {lucroOperacional.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
