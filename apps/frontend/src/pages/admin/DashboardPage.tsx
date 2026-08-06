import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CircleDollarSign, Package, ShoppingCart, Trash2, Users } from 'lucide-react';
import { formatSEK, type ProductDTO } from '@sharvi/shared';
import { api } from '@/lib/api';
import { PageLoader } from '@/components/PageLoader';

interface DashboardData {
  cards: { revenueMinor: number; orders: number; products: number; customers: number };
  salesTrend: { label: string; orders: number; revenueMinor: number }[];
  popularCategories: { category: string; count: number }[];
  popularProducts: ProductDTO[];
  recentOrders: {
    id: string;
    orderNumber: string;
    customerName: string;
    totalMinor: number;
    status: string;
    source: string;
    paymentMethod: string;
    createdAt: string;
  }[];
  topCustomers: { name: string; email: string; orders: number; spentMinor: number }[];
}

const PIE_COLORS = ['#7c1f3f', '#a82c56', '#c94873', '#dcb857', '#c9a13a', '#856726'];

export function DashboardPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.get<DashboardData>('/analytics/dashboard'),
  });

  const deleteOrder = useMutation({
    mutationFn: (id: string) => api.delete(`/orders/admin/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });

  if (isLoading || !data) return <PageLoader />;

  const cards = [
    { label: 'Revenue', value: formatSEK(data.cards.revenueMinor, 'sv'), icon: CircleDollarSign },
    { label: 'Orders', value: String(data.cards.orders), icon: ShoppingCart },
    { label: 'Products', value: String(data.cards.products), icon: Package },
    { label: 'Customers', value: String(data.cards.customers), icon: Users },
  ];

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-3xl text-maroon-700">Dashboard</h1>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card flex items-center gap-4 p-5">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-maroon-50 text-maroon-600">
              <c.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-ink/50">{c.label}</p>
              <p className="text-2xl font-semibold text-ink">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales trend */}
        <div className="card p-5">
          <h2 className="mb-4 font-serif text-lg text-maroon-700">Orders by Month</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.salesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e0e6" />
              <XAxis dataKey="label" fontSize={12} stroke="#9c7a86" />
              <YAxis allowDecimals={false} fontSize={12} stroke="#9c7a86" />
              <Tooltip />
              <Line type="monotone" dataKey="orders" stroke="#7c1f3f" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue trend */}
        <div className="card p-5">
          <h2 className="mb-4 font-serif text-lg text-maroon-700">Revenue (kr)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.salesTrend.map((m) => ({ ...m, revenue: m.revenueMinor / 100 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e0e6" />
              <XAxis dataKey="label" fontSize={12} stroke="#9c7a86" />
              <YAxis fontSize={12} stroke="#9c7a86" />
              <Tooltip formatter={(v: number) => `${v} kr`} />
              <Bar dataKey="revenue" fill="#dcb857" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Popular categories */}
        <div className="card p-5">
          <h2 className="mb-4 font-serif text-lg text-maroon-700">Popular Categories</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.popularCategories}
                dataKey="count"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={(e) => e.category}
                fontSize={11}
              >
                {data.popularCategories.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top customers */}
        <div className="card p-5">
          <h2 className="mb-4 font-serif text-lg text-maroon-700">Top Customers</h2>
          {data.topCustomers.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink/50">No customers yet</p>
          ) : (
            <ul className="divide-y divide-maroon-50">
              {data.topCustomers.map((c) => (
                <li key={c.email} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium text-ink">{c.name}</p>
                    <p className="text-ink/50">{c.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-maroon-700">{formatSEK(c.spentMinor, 'sv')}</p>
                    <p className="text-ink/50">{c.orders} orders</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="card p-5">
        <h2 className="mb-4 font-serif text-lg text-maroon-700">Recent Orders</h2>
        {data.recentOrders.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink/50">No orders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-ink/50">
                <tr>
                  <th className="pb-3">Order</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Payment</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Total</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-maroon-50">
                {data.recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="py-3 font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        {o.orderNumber}
                        {o.source === 'WHATSAPP' && (
                          <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                            WA
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-3">{o.customerName}</td>
                    <td className="py-3">{o.paymentMethod}</td>
                    <td className="py-3">
                      <span className="rounded-full bg-maroon-50 px-2 py-0.5 text-xs text-maroon-700">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-medium">{formatSEK(o.totalMinor, 'sv')}</td>
                    <td className="py-3 text-right">
                      <button
                        aria-label={`Delete order ${o.orderNumber}`}
                        disabled={deleteOrder.isPending}
                        onClick={() => {
                          if (confirm(`Delete order ${o.orderNumber}? This cannot be undone.`))
                            deleteOrder.mutate(o.id);
                        }}
                        className="grid h-8 w-8 place-items-center rounded-lg text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
