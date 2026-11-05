import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';

export function Carregando() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#888' }}>
      Carregando...
    </div>
  );
}

function ErroPagina() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 12, fontFamily: 'sans-serif', color: '#444' }}>
      <p>O sistema foi atualizado.</p>
      <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', background: '#0f1923', color: '#fff', cursor: 'pointer' }}>
        Recarregar
      </button>
    </div>
  );
}

// Cada página vira um arquivo separado, baixado só quando é aberta.
const pagina = (carregar: () => Promise<Record<string, unknown>>, nome: string) => async () => {
  let mod: Record<string, unknown>;
  try {
    mod = await carregar();
  } catch (erro) {
    // Arquivo da página não existe mais (o site foi atualizado com esta aba aberta)
    let jaTentou = false;
    try { jaTentou = !!sessionStorage.getItem('recarregou-apos-atualizacao'); sessionStorage.setItem('recarregou-apos-atualizacao', '1'); } catch { /* ok */ }
    if (!jaTentou) { window.location.reload(); await new Promise(() => {}); }
    throw erro;
  }
  return { Component: (mod[nome] ?? mod.default) as React.ComponentType };
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    HydrateFallback: Carregando,
    errorElement: <ErroPagina />,
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
