import { Link, useLocation, Outlet, useNavigation } from 'react-router';
import { LayoutDashboard, ShoppingCart, Car, Receipt, FileText, Menu, Users, UserPlus, Plug, Truck, LogOut, Contact, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Toaster } from './ui/sonner';
import { useAuth } from '../contexts/AuthContext.tsx';
import { Badge } from './ui/badge';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: ShoppingCart, label: 'Vendas', path: '/vendas' },
  { icon: UserPlus, label: 'Leads & CRM', path: '/leads' },
  { icon: Contact, label: 'Clientes', path: '/clientes' },
  { icon: Users, label: 'Vendedores', path: '/vendedores' },
  { icon: Car, label: 'Estoque', path: '/estoque' },
  { icon: Truck, label: 'Transportes', path: '/transportes' },
  { icon: Receipt, label: 'Despesas', path: '/despesas' },
  { icon: FileText, label: 'Relatórios', path: '/relatorios' },
  { icon: Plug, label: 'Integrações', path: '/integracoes' },
];

function Sidebar() {
  const location = useLocation();
  const { user, signOut, papel, isVisualizador } = useAuth();

  return (
    <div className="flex h-full flex-col gap-2 border-r bg-muted/40 p-4">
      <div className="mb-4 px-2">
        <h1 className="text-2xl font-bold">AutoGestão</h1>
        <p className="text-sm text-muted-foreground">Controle Financeiro</p>
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}>
              <Button variant={isActive ? 'secondary' : 'ghost'} className="w-full justify-start gap-2">
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>
      <div className="border-t pt-3 mt-2">
        <p className="text-xs text-muted-foreground px-2 mb-1 truncate">{user?.email}</p>
        {isVisualizador && (
          <div className="px-2 mb-2">
            <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
              <Eye className="h-3 w-3" />Modo visualização
            </Badge>
          </div>
        )}
        <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
}

export function Layout() {
  const navigation = useNavigation();
  return (
    <div className="flex h-screen">
      {navigation.state === 'loading' && (
        <div className="fixed inset-x-0 top-0 z-50 h-0.5 animate-pulse bg-primary" aria-hidden />
      )}
      <aside className="hidden w-64 md:block"><Sidebar /></aside>
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <button className="m-4 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9">
              <Menu className="h-6 w-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0"><Sidebar /></SheetContent>
        </Sheet>
      </div>
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6"><Outlet /></div>
      </main>
      <Toaster />
    </div>
  );
}