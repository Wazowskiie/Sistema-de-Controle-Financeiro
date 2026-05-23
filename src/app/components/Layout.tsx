import { Link, useLocation, Outlet } from 'react-router';
import {
  LayoutDashboard,
  ShoppingCart,
  Car,
  Receipt,
  FileText,
  Menu,
  Users,
  UserPlus,
  Plug,
  Truck
} from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Toaster } from './ui/sonner';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: ShoppingCart, label: 'Vendas', path: '/vendas' },
  { icon: UserPlus, label: 'Leads & CRM', path: '/leads' },
  { icon: Users, label: 'Vendedores', path: '/vendedores' },
  { icon: Car, label: 'Estoque', path: '/estoque' },
  { icon: Truck, label: 'Transportes', path: '/transportes' },
  { icon: Receipt, label: 'Despesas', path: '/despesas' },
  { icon: FileText, label: 'Relatórios', path: '/relatorios' },
  { icon: Plug, label: 'Integrações', path: '/integracoes' },
];

function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex h-full flex-col gap-2 border-r bg-muted/40 p-4">
      <div className="mb-4 px-2">
        <h1 className="text-2xl font-bold">AutoGestão</h1>
        <p className="text-sm text-muted-foreground">Controle Financeiro</p>
      </div>
      <nav className="flex flex-col gap-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-2"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function Layout() {
  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 md:block">
        <Sidebar />
      </aside>

      {/* Mobile Menu */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <button className="m-4 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 w-9">
              <Menu className="h-6 w-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <Outlet />
        </div>
      </main>

      {/* Toaster for notifications */}
      <Toaster />
    </div>
  );
}