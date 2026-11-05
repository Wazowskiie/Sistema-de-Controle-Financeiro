import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { store, Venda, Despesa, Veiculo } from '../lib/store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Download, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ============================================================
// EXPORTAÇÃO PDF
// ============================================================
// O gerador de PDF (~350 KB) só é baixado quando alguém clica em "Exportar PDF"
async function gerarPDF(titulo: string, secoes: { titulo: string; linhas: string[][] }[]) {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginL = 14;
  const marginR = pageWidth - 14;
  let y = 22;

  // Título principal
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(titulo, pageWidth / 2, y, { align: 'center' });
  y += 9;

  // Data de geração
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(140);
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, y, { align: 'center' });
  doc.setTextColor(0);
  y += 14;

  for (const secao of secoes) {
    if (y > 265) { doc.addPage(); y = 20; }

    // Título da seção — fundo cinza
    doc.setFillColor(235, 235, 235);
    doc.rect(marginL, y - 5, marginR - marginL, 9, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30);
    doc.text(secao.titulo, marginL + 2, y + 1);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    y += 13;

    doc.setFontSize(9);

    const isFirstlinha = (idx: number) => idx === 0;

    secao.linhas.forEach((linha, idx) => {
      if (y > 272) { doc.addPage(); y = 20; }

      const lineH = 9; // altura de cada linha

      if (linha.length === 1) {
        // Cabeçalho de tabela
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(90);
        doc.text(linha[0], marginL + 2, y - 1);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0);
      } else if (linha.length === 2) {
        // Par chave: valor
        doc.setFont('helvetica', 'bold');
        doc.text(linha[0], marginL + 2, y - 1);
        doc.setFont('helvetica', 'normal');
        doc.text(String(linha[1]), marginL + 80, y - 1);
      } else {
        // Tabela multi-coluna — zebra nas linhas pares
        if (idx % 2 === 0 && idx > 0) {
          doc.setFillColor(248, 248, 248);
          doc.rect(marginL, y - 5, marginR - marginL, lineH, 'F');
        }
        const colCount = linha.length;
        const colWidths = [55, ...Array(colCount - 1).fill((marginR - marginL - 55) / (colCount - 1))];
        let x = marginL + 2;
        linha.forEach((cell, i) => {
          const isLast = i === colCount - 1;
          const isNum = !isNaN(Number(String(cell).replace(/[R$\s.,]/g, ''))) && String(cell).trim() !== '';
          if (i === 0) {
            doc.setFont('helvetica', idx === 0 ? 'bold' : 'normal');
            doc.setTextColor(idx === 0 ? 70 : 0);
            doc.text(String(cell), x, y - 1);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0);
          } else {
            const colX = marginL + colWidths[0] + (i - 1) * colWidths[1];
            doc.setFont('helvetica', idx === 0 ? 'bold' : 'normal');
            doc.setTextColor(idx === 0 ? 70 : 0);
            doc.text(String(cell), colX + colWidths[1] - 2, y - 1, { align: 'right' });
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0);
          }
          x += colWidths[i] ?? 0;
        });
      }

      // Linha separadora abaixo do texto (3px abaixo)
      y += lineH;
      doc.setDrawColor(220);
      doc.line(marginL, y + 1, marginR, y + 1);
      doc.setDrawColor(0);
    });

    y += 8;
  }

  doc.save(`${titulo.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function Relatorios() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesFiltro, setMesFiltro] = useState<string>('todos');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [v, d, ve] = await Promise.all([
        store.getVendasAsync(),
        store.getDespesasAsync(),
        store.getVeiculosAsync(),
      ]);
      const { data: regPag } = await supabase
        .from('veiculo_extras')
        .select('dados, criado_em')
        .eq('tipo', 'registro_pagamento');
      setVendas(v);
      setDespesas(d);
      setVeiculos(ve);
      setPagamentos(regPag?.map(r => r.dados) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  // Meses disponíveis para filtro
  // Formato: "Abril 2026"
  const fmtMes = (dateStr: string) =>
    new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      .replace(' de ', ' ');

  const mesesDisponiveis = Array.from(new Set([
    ...vendas.map(v => fmtMes(v.dataVenda)),
    ...despesas.map(d => fmtMes(d.data)),
    ...pagamentos.filter((r: any) => r?.data).map((r: any) => fmtMes(r.data)),
  ])).sort((a, b) => {
    // Ordena cronologicamente
    const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
    const [ma, ya] = a.toLowerCase().split(' ');
    const [mb, yb] = b.toLowerCase().split(' ');
    return Number(ya) - Number(yb) || meses.indexOf(ma) - meses.indexOf(mb);
  });

  // Dados filtrados pelo mês selecionado
  const vendasFiltradas = mesFiltro === 'todos' ? vendas : vendas.filter(v => fmtMes(v.dataVenda) === mesFiltro);
  const despesasFiltradas = mesFiltro === 'todos' ? despesas : despesas.filter(d => fmtMes(d.data) === mesFiltro);
  const pagamentosFiltrados = mesFiltro === 'todos' ? pagamentos : pagamentos.filter((r: any) =>
    r?.data && fmtMes(r.data) === mesFiltro
  );

  const receitaTotal = vendasFiltradas.reduce((sum, v) => sum + v.valorVenda, 0);
  const custoTotal = vendasFiltradas.reduce((sum, v) => sum + v.valorCusto, 0);
  const despesasTotal = despesasFiltradas.reduce((sum, d) => sum + d.valor, 0);
  const lucroOperacional = receitaTotal - custoTotal - despesasTotal;
  const margemLucro = receitaTotal > 0 ? (lucroOperacional / receitaTotal) * 100 : 0;

  const desempenhoMensal = () => {
    const meses: Record<string, { mes: string; receitas: number; despesas: number; lucro: number }> = {};
    vendasFiltradas.forEach(venda => {
      const mes = new Date(venda.dataVenda + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      if (!meses[mes]) meses[mes] = { mes, receitas: 0, despesas: 0, lucro: 0 };
      meses[mes].receitas += venda.valorVenda;
      meses[mes].lucro += venda.lucro;
    });
    despesasFiltradas.forEach(despesa => {
      const mes = new Date(despesa.data + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      if (!meses[mes]) meses[mes] = { mes, receitas: 0, despesas: 0, lucro: 0 };
      meses[mes].despesas += despesa.valor;
      meses[mes].lucro -= despesa.valor;
    });
    return Object.values(meses);
  };

  const veiculosPagosPorMes = () => {
    const meses: Record<string, { mes: string; totalPago: number; quantidade: number }> = {};
    pagamentosFiltrados.forEach((reg: any) => {
      if (!reg?.data || !reg?.valor) return;
      const mes = new Date(reg.data + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      if (!meses[mes]) meses[mes] = { mes, totalPago: 0, quantidade: 0 };
      meses[mes].totalPago += Number(reg.valor);
      meses[mes].quantidade += 1;
    });
    return Object.values(meses).sort((a, b) => a.mes.localeCompare(b.mes));
  };

  const vendasPorPagamento = vendasFiltradas.reduce((acc, venda) => {
    const forma = venda.formaPagamento;
    const existing = acc.find(item => item.forma === forma);
    if (existing) { existing.quantidade += 1; existing.valor += venda.valorVenda; }
    else acc.push({ forma: forma.charAt(0).toUpperCase() + forma.slice(1), quantidade: 1, valor: venda.valorVenda });
    return acc;
  }, [] as { forma: string; quantidade: number; valor: number }[]);

  const vendasPorMarca = veiculos
    .filter(v => v.status === 'vendido')
    .reduce((acc, veiculo) => {
      const existing = acc.find(item => item.marca === veiculo.marca);
      if (existing) existing.quantidade += 1;
      else acc.push({ marca: veiculo.marca, quantidade: 1 });
      return acc;
    }, [] as { marca: string; quantidade: number }[])
    .sort((a, b) => b.quantidade - a.quantidade);

  const despesasPorCategoria = despesasFiltradas.reduce((acc, despesa) => {
    const cat = despesa.categoria.charAt(0).toUpperCase() + despesa.categoria.slice(1);
    const existing = acc.find(item => item.categoria === cat);
    if (existing) existing.valor += despesa.valor;
    else acc.push({ categoria: cat, valor: despesa.valor });
    return acc;
  }, [] as { categoria: string; valor: number }[]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // ============================================================
  // FUNÇÕES DE EXPORTAÇÃO PDF
  // ============================================================
  const exportarVendasPDF = () => {
    const sufixo = mesFiltro !== 'todos' ? ` - ${mesFiltro}` : '';
    gerarPDF(`Relatório de Vendas${sufixo}`, [
      {
        titulo: 'Resumo',
        linhas: [
          ['Total de vendas:', String(vendasFiltradas.length)],
          ['Receita total:', fmt(receitaTotal)],
          ['Ticket médio:', vendas.length > 0 ? fmt(receitaTotal / vendas.length) : 'R$ 0,00'],
          ['Lucro total:', fmt(vendas.reduce((s, v) => s + v.lucro, 0))],
        ],
      },
      {
        titulo: 'Lista de Vendas',
        linhas: [
          ['DATA', 'VEÍCULO', 'CLIENTE', 'VALOR', 'LUCRO'],
          ...vendasFiltradas.map(v => [
            new Date(v.dataVenda + 'T12:00:00').toLocaleDateString('pt-BR'),
            v.veiculo,
            v.cliente,
            fmt(v.valorVenda),
            fmt(v.lucro),
          ]),
        ],
      },
    ]);
  };

  const exportarDespesasPDF = () => {
    const sufixo = mesFiltro !== 'todos' ? ` - ${mesFiltro}` : '';
    gerarPDF(`Relatório de Despesas${sufixo}`, [
      {
        titulo: 'Resumo',
        linhas: [
          ['Total de registros:', String(despesasFiltradas.length)],
          ['Total gasto:', fmt(despesasTotal)],
        ],
      },
      {
        titulo: 'Lista de Despesas',
        linhas: [
          ['DATA', 'DESCRIÇÃO', 'CATEGORIA', 'VALOR'],
          ...despesasFiltradas.map(d => [
            new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR'),
            d.descricao,
            d.categoria,
            fmt(d.valor),
          ]),
        ],
      },
    ]);
  };

  const exportarPagamentosPDF = () => {
    const sufixo = mesFiltro !== 'todos' ? ` - ${mesFiltro}` : '';
    const dadosMes = veiculosPagosPorMes();
    const totalGeral = pagamentosFiltrados.reduce((s: number, r: any) => s + (Number(r?.valor) || 0), 0);

    gerarPDF(`Pagamentos de Veículos por Mês${sufixo}`, [
      {
        titulo: 'Resumo Geral',
        linhas: [
          ['Total de registros:', String(pagamentosFiltrados.length)],
          ['Total pago:', fmt(totalGeral)],
        ],
      },
      {
        titulo: 'Por Mês',
        linhas: [
          ['MÊS', 'QTD PAGAMENTOS', 'TOTAL PAGO'],
          ...dadosMes.map(m => [m.mes, String(m.quantidade), fmt(m.totalPago)]),
        ],
      },
      {
        titulo: 'Detalhamento',
        linhas: [
          ['DATA', 'DESCRIÇÃO', 'QUEM PAGOU', 'VALOR'],
          ...pagamentos
            .filter((r: any) => r?.data && r?.valor && pagamentosFiltrados.includes(r))
            .sort((a: any, b: any) => a.data.localeCompare(b.data))
            .map((r: any) => [
              new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR'),
              r.descricao || '—',
              r.quemPagou === 'empresa' ? 'Empresa' : r.quemPagou === 'banco' ? 'Banco' : 'Cliente',
              fmt(Number(r.valor)),
            ]),
        ],
      },
    ]);
  };

  const exportarResumoGeralPDF = () => {
    const sufixo = mesFiltro !== 'todos' ? ` - ${mesFiltro}` : '';
    const mensal = desempenhoMensal();
    gerarPDF(`Resumo Executivo${sufixo}`, [
      {
        titulo: 'Desempenho de Vendas',
        linhas: [
          ['Total de vendas:', String(vendasFiltradas.length)],
          ['Receita total:', fmt(receitaTotal)],
          ['Ticket médio:', vendas.length > 0 ? fmt(receitaTotal / vendas.length) : 'R$ 0,00'],
          ['Lucro bruto:', fmt(receitaTotal - custoTotal)],
        ],
      },
      {
        titulo: 'Gestão de Custos',
        linhas: [
          ['Custo dos veículos:', fmt(custoTotal)],
          ['Despesas operacionais:', fmt(despesasTotal)],
          ['Custo total:', fmt(custoTotal + despesasTotal)],
          ['Lucro operacional:', fmt(lucroOperacional)],
          ['Margem de lucro:', `${margemLucro.toFixed(1)}%`],
        ],
      },
      {
        titulo: 'Desempenho Mensal',
        linhas: [
          ['MÊS', 'RECEITAS', 'DESPESAS', 'LUCRO'],
          ...mensal.map(m => [m.mes, fmt(m.receitas), fmt(m.despesas), fmt(m.lucro)]),
        ],
      },
    ]);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Carregando relatórios...</p></div>;

  const dadosPagosMes = veiculosPagosPorMes();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Análise detalhada do desempenho financeiro</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end items-center">
          <Select value={mesFiltro} onValueChange={setMesFiltro}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Todos os meses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os meses</SelectItem>
              {mesesDisponiveis.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportarResumoGeralPDF}><FileText className="h-4 w-4 mr-1" />Resumo Geral</Button>
          <Button variant="outline" size="sm" onClick={exportarVendasPDF}><FileText className="h-4 w-4 mr-1" />Vendas</Button>
          <Button variant="outline" size="sm" onClick={exportarDespesasPDF}><FileText className="h-4 w-4 mr-1" />Despesas</Button>
          <Button variant="outline" size="sm" onClick={exportarPagamentosPDF}><FileText className="h-4 w-4 mr-1" />Pagamentos</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Receita Total</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(receitaTotal)}</div><p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3 text-green-500" />{vendasFiltradas.length} vendas</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Despesas Totais</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{fmt(despesasTotal)}</div><p className="text-xs text-muted-foreground">{despesasFiltradas.length} registros</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Lucro Operacional</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className={`text-2xl font-bold ${lucroOperacional >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(lucroOperacional)}</div><p className="text-xs text-muted-foreground">Margem: {margemLucro.toFixed(1)}%</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">ROI Médio</CardTitle><Calendar className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{vendasFiltradas.length > 0 && custoTotal > 0 ? ((receitaTotal - custoTotal) / custoTotal * 100).toFixed(1) : 0}%</div><p className="text-xs text-muted-foreground">Retorno sobre investimento</p></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="mensal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="mensal">Desempenho Mensal</TabsTrigger>
          <TabsTrigger value="vendas">Análise de Vendas</TabsTrigger>
          <TabsTrigger value="despesas">Análise de Despesas</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos de Veículos</TabsTrigger>
        </TabsList>

        <TabsContent value="mensal" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Receitas vs Despesas por Mês</CardTitle>
              <Button variant="outline" size="sm" onClick={exportarResumoGeralPDF}><FileText className="h-4 w-4 mr-1" />Exportar PDF</Button>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={desempenhoMensal()}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="mes" /><YAxis />
                  <Tooltip formatter={(value: number) => fmt(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="receitas" stroke="#0088FE" name="Receitas" strokeWidth={2} />
                  <Line type="monotone" dataKey="despesas" stroke="#FF8042" name="Despesas" strokeWidth={2} />
                  <Line type="monotone" dataKey="lucro" stroke="#00C49F" name="Lucro" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendas" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={exportarVendasPDF}><FileText className="h-4 w-4 mr-1" />Exportar PDF</Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Vendas por Forma de Pagamento</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={vendasPorPagamento} cx="50%" cy="50%" labelLine={false} label={(entry) => `${entry.forma} (${entry.quantidade})`} outerRadius={80} fill="#8884d8" dataKey="valor">
                      {vendasPorPagamento.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: number) => fmt(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Veículos Vendidos por Marca</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={vendasPorMarca}>
                    <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="marca" /><YAxis /><Tooltip />
                    <Bar dataKey="quantidade" fill="#0088FE" name="Quantidade" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Lista de Vendas</CardTitle>
              <Button variant="outline" size="sm" onClick={exportarVendasPDF}><FileText className="h-4 w-4 mr-1" />PDF</Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-muted-foreground text-xs">
                    <th className="text-left py-2">Data</th><th className="text-left py-2">Veículo</th><th className="text-left py-2">Cliente</th>
                    <th className="text-right py-2">Valor</th><th className="text-right py-2">Lucro</th>
                  </tr></thead>
                  <tbody>
                    {vendas.map(v => (
                      <tr key={v.id} className="border-b last:border-0">
                        <td className="py-2 text-muted-foreground">{new Date(v.dataVenda + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                        <td className="py-2 font-medium">{v.veiculo}</td>
                        <td className="py-2 text-muted-foreground">{v.cliente}</td>
                        <td className="py-2 text-right">{fmt(v.valorVenda)}</td>
                        <td className="py-2 text-right text-green-600">{fmt(v.lucro)}</td>
                      </tr>
                    ))}
                    {vendas.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Nenhuma venda registrada</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="despesas" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={exportarDespesasPDF}><FileText className="h-4 w-4 mr-1" />Exportar PDF</Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Distribuição de Despesas</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={despesasPorCategoria} cx="50%" cy="50%" labelLine={false} label={(entry) => entry.categoria} outerRadius={80} fill="#8884d8" dataKey="valor">
                      {despesasPorCategoria.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: number) => fmt(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Despesas por Categoria</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={despesasPorCategoria} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="categoria" type="category" width={100} />
                    <Tooltip formatter={(value: number) => fmt(value)} />
                    <Bar dataKey="valor" fill="#FF8042" name="Valor" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pagamentos" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={exportarPagamentosPDF}><FileText className="h-4 w-4 mr-1" />Exportar PDF</Button>
          </div>

          {dadosPagosMes.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Total Pago por Mês</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosPagosMes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" /><YAxis />
                    <Tooltip formatter={(value: number) => fmt(value)} />
                    <Legend />
                    <Bar dataKey="totalPago" fill="#0088FE" name="Total Pago" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Pagamentos de Veículos por Mês</CardTitle></CardHeader>
            <CardContent>
              {dadosPagosMes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum pagamento registrado</p>
              ) : (
                <div className="space-y-4">
                  {dadosPagosMes.map(mes => (
                    <div key={mes.mes} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold capitalize">{mes.mes}</h4>
                        <div className="flex gap-4 text-sm">
                          <span className="text-muted-foreground">{mes.quantidade} pagamento{mes.quantidade > 1 ? 's' : ''}</span>
                          <span className="font-bold text-green-600">{fmt(mes.totalPago)}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {pagamentosFiltrados
                          .filter((r: any) => {
                            if (!r?.data) return false;
                            const m = new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
                            return m === mes.mes;
                          })
                          .map((r: any, i: number) => (
                            <div key={i} className="flex justify-between text-sm py-1 border-b last:border-0">
                              <div>
                                <span className="font-medium">{r.descricao || '—'}</span>
                                <span className="text-muted-foreground ml-2">
                                  {r.quemPagou === 'empresa' ? '🏢 Empresa' : r.quemPagou === 'banco' ? '🏦 Banco' : '👤 Cliente'} · {new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              <span className="font-medium">{fmt(Number(r.valor))}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between p-3 bg-muted rounded-lg font-semibold">
                    <span>Total geral</span>
                    <span className="text-green-600">{fmt(pagamentosFiltrados.reduce((s: number, r: any) => s + (Number(r?.valor) || 0), 0))}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Resumo Executivo</CardTitle>
          <Button variant="outline" size="sm" onClick={exportarResumoGeralPDF}><FileText className="h-4 w-4 mr-1" />Exportar PDF</Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="font-semibold">Desempenho de Vendas</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Total de vendas: {vendasFiltradas.length}</li>
                <li>• Receita total: {fmt(receitaTotal)}</li>
                <li>• Ticket médio: {vendasFiltradas.length > 0 ? fmt(receitaTotal / vendasFiltradas.length) : 'R$ 0,00'}</li>
                <li>• Lucro bruto: {fmt(receitaTotal - custoTotal)}</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Gestão de Custos</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Custo dos veículos: {fmt(custoTotal)}</li>
                <li>• Despesas operacionais: {fmt(despesasTotal)}</li>
                <li>• Custo total: {fmt(custoTotal + despesasTotal)}</li>
                <li>• Lucro operacional: {fmt(lucroOperacional)}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}