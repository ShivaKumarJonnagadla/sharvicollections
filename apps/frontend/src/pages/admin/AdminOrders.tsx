import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { ORDER_STATUSES, PAYMENT_STATUSES, formatSEK, type OrderDTO, type Paginated } from '@sharvi/shared';
import { api } from '@/lib/api';
import { PageLoader } from '@/components/PageLoader';

export function AdminOrders() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: () => api.get<Paginated<OrderDTO>>('/orders/admin/list?pageSize=50'),
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, string> }) =>
      api.patch(`/orders/admin/${id}/status`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'orders'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/orders/admin/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });

  if (isLoading || !data) return <PageLoader />;

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-maroon-700">Orders</h1>

      {data.items.length === 0 ? (
        <div className="card p-12 text-center text-ink/50">No orders yet.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-maroon-100 text-ink/50">
              <tr>
                <th className="p-4">Order</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Items</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Status</th>
                <th className="p-4">Pay status</th>
                <th className="p-4 text-right">Total</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-maroon-50">
              {data.items.map((o) => (
                <tr key={o.id}>
                  <td className="p-4">
                    <p className="font-medium">{o.orderNumber}</p>
                    <p className="text-xs text-ink/50">{new Date(o.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="p-4">
                    <p>{o.customerName}</p>
                    <p className="text-xs text-ink/50">{o.customerEmail}</p>
                    <p className="text-xs text-ink/50">{o.customerPhone}</p>
                    {o.shippingRequired && (
                      <p className="mt-1 max-w-[200px] text-xs text-maroon-500">
                        📦{' '}
                        {[
                          o.shippingAddress,
                          o.shippingPostalCode,
                          o.shippingCity,
                          o.shippingCounty,
                          o.shippingCountry,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                  </td>
                  <td className="p-4 text-ink/70">
                    {o.items.map((it) => (
                      <div key={it.id} className="whitespace-nowrap text-xs">
                        {it.productName} × {it.quantity}
                      </div>
                    ))}
                  </td>
                  <td className="p-4">{o.paymentMethod}</td>
                  <td className="p-4">
                    <select
                      value={o.status}
                      onChange={(e) => update.mutate({ id: o.id, patch: { status: e.target.value } })}
                      className="rounded-lg border border-maroon-200 bg-white px-2 py-1 text-xs"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4">
                    <select
                      value={o.paymentStatus}
                      onChange={(e) =>
                        update.mutate({ id: o.id, patch: { paymentStatus: e.target.value } })
                      }
                      className="rounded-lg border border-maroon-200 bg-white px-2 py-1 text-xs"
                    >
                      {PAYMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4 text-right font-medium">{formatSEK(o.totalMinor, 'sv')}</td>
                  <td className="p-4 text-right">
                    <button
                      aria-label={`Delete order ${o.orderNumber}`}
                      disabled={remove.isPending}
                      onClick={() => {
                        if (confirm(`Delete order ${o.orderNumber}? This cannot be undone.`))
                          remove.mutate(o.id);
                      }}
                      className="grid h-9 w-9 place-items-center rounded-lg text-red-500 hover:bg-red-50"
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
  );
}
