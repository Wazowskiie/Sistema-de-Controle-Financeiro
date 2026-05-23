import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Vendas } from './pages/Vendas';
import { Estoque } from './pages/Estoque';
import { Despesas } from './pages/Despesas';
import { Relatorios } from './pages/Relatorios';
import { Vendedores } from './pages/Vendedores';
import { Leads } from './pages/Leads';
import { Integracoes } from './pages/Integracoes';
import Transportes from './pages/Transportes';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'vendas',
        element: <Vendas />,
      },
      {
        path: 'vendedores',
        element: <Vendedores />,
      },
      {
        path: 'leads',
        element: <Leads />,
      },
      {
        path: 'estoque',
        element: <Estoque />,
      },
      {
        path: 'despesas',
        element: <Despesas />,
      },
      {
        path: 'relatorios',
        element: <Relatorios />,
      },
      {
        path: 'integracoes',
        element: <Integracoes />,
      },
      {
        path: 'transportes',
        element: <Transportes />,
      },
    ],
  },
]);