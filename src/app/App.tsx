import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';

function AppContent() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#888' }}>
        Carregando...
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}