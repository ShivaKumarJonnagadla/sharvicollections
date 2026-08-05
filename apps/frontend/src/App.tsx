import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { ScrollToTop } from '@/components/ScrollToTop';
import { PageLoader } from '@/components/PageLoader';
import { RequireAdmin } from '@/components/admin/RequireAdmin';

// Storefront pages (eager for the landing experience, lazy for the rest).
import { HomePage } from '@/pages/HomePage';
const ShopPage = lazy(() => import('@/pages/ShopPage').then((m) => ({ default: m.ShopPage })));
const ProductPage = lazy(() =>
  import('@/pages/ProductPage').then((m) => ({ default: m.ProductPage })),
);
const CheckoutPage = lazy(() =>
  import('@/pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })),
);
const OrderConfirmationPage = lazy(() =>
  import('@/pages/OrderConfirmationPage').then((m) => ({ default: m.OrderConfirmationPage })),
);
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

// Admin (fully code-split away from the storefront bundle).
const AdminLogin = lazy(() =>
  import('@/pages/admin/AdminLogin').then((m) => ({ default: m.AdminLogin })),
);
const AdminLayout = lazy(() =>
  import('@/pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })),
);
const DashboardPage = lazy(() =>
  import('@/pages/admin/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const AdminProducts = lazy(() =>
  import('@/pages/admin/AdminProducts').then((m) => ({ default: m.AdminProducts })),
);
const AdminProductEdit = lazy(() =>
  import('@/pages/admin/AdminProductEdit').then((m) => ({ default: m.AdminProductEdit })),
);
const AdminOrders = lazy(() =>
  import('@/pages/admin/AdminOrders').then((m) => ({ default: m.AdminOrders })),
);
const AdminSimple = lazy(() =>
  import('@/pages/admin/AdminSimple').then((m) => ({ default: m.AdminSimple })),
);

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          <Routes>
            {/* Storefront */}
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="shop" element={<ShopPage />} />
              <Route path="shop/:category" element={<ShopPage />} />
              <Route path="product/:slug" element={<ProductPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="order/:orderNumber" element={<OrderConfirmationPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Admin */}
            <Route path="admin/login" element={<AdminLogin />} />
            <Route
              path="admin"
              element={
                <RequireAdmin>
                  <AdminLayout />
                </RequireAdmin>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="products/new" element={<AdminProductEdit />} />
              <Route path="products/:id" element={<AdminProductEdit />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="analytics" element={<DashboardPage />} />
              <Route path="customers" element={<AdminSimple />} />
              <Route path="settings" element={<AdminSimple />} />
              <Route path="media" element={<AdminSimple />} />
            </Route>
          </Routes>
        </AnimatePresence>
      </Suspense>
    </>
  );
}
