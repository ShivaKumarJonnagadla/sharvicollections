import { useQuery } from '@tanstack/react-query';
import { formatSEK } from '@sharvi/shared';
import { api } from '@/lib/api';
import { PageLoader } from '@/components/PageLoader';

interface Customer {
  name: string;
  email: string;
  orders: number;
  spentMinor: number;
  lastOrderAt: string | null;
}

export function AdminCustomers() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'customers'],
    queryFn: () => api.get<Customer[]>('/analytics/customers'),
  });

  if (isLoading || !data) return <PageLoader />;

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-maroon-700">Customers</h1>
      {data.length === 0 ? (
        <div className="card p-12 text-center text-ink/50">No customers yet.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-maroon-100 text-ink/50">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4 text-right">Orders</th>
                <th className="p-4 text-right">Spent</th>
                <th className="p-4 text-right">Last order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-maroon-50">
              {data.map((c) => (
                <tr key={c.email}>
                  <td className="p-4">
                    <p className="font-medium text-ink">{c.name}</p>
                    <p className="text-xs text-ink/50">{c.email}</p>
                  </td>
                  <td className="p-4 text-right">{c.orders}</td>
                  <td className="p-4 text-right font-medium text-maroon-700">
                    {formatSEK(c.spentMinor, 'sv')}
                  </td>
                  <td className="p-4 text-right text-ink/60">
                    {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
