import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';

export function Carregando() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#888' }}>
      Carregando...
    </div>
  );
}

// Cada página vira um arquivo separado, baixado só quando é aberta.
const pagina = (carregar: () => Promise<Record<string, unknown>>, nome: string) => async () => {
  const mod = await carregar();
  return { Component: (mod[nome] ?? mod.default) as React.ComponentType };
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    HydrateFallback: Carregando,
    children: [
      { index: true, lazy: pagina(() => import('./pages/Dashboard'), 'Dashboard') },
      { path: 'vendas', lazy: pagina(() => import('./pages/Vendas'), 'Vendas') },
      { path: 'vendedores', lazy: pagina(() => import('./pages/Vendedores'), 'Vendedores') },
      { path: 'leads', lazy: pagina(() => import('./pages/Leads'), 'Leads') },
      { path: 'clientes', lazy: pagina(() => import('./pages/Clientes'), 'Clientes') },
      { path: 'estoque', lazy: pagina(() => import('./pages/Estoque'), 'Estoque') },
      { path: 'despesas', lazy: pagina(() => import('./pages/Despesas'), 'Despesas') },
      { path: 'relatorios', lazy: pagina(() => import('./pages/Relatorios'), 'Relatorios') },
      { path: 'integracoes', lazy: pagina(() => import('./pages/Integracoes'), 'Integracoes') },
      { path: 'transportes', lazy: pagina(() => import('./pages/Transportes'), 'Transportes') },
    ],
  },
]);
