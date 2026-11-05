import { RouterProvider } from 'react-router';
import { router } from './routes';

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
