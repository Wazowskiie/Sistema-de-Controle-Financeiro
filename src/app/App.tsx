import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';

// O sistema (menu + páginas) só é baixado depois do login
const AppRouter = lazy(() => import('./AppRouter'));
const carregando = (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#888' }}>
    Carregando...
  </div>
);

function AppContent() {
  const { session, loading } = useAuth();

  if (loading) return carregando;

  if (!session) {
    return <Login />;
  }

  return <Suspense fallback={carregando}><AppRouter /></Suspense>;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}