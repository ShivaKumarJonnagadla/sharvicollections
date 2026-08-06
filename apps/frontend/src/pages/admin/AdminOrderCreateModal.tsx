import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Trash2, X } from 'lucide-react';
import {
  formatSEK,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  type Paginated,
  type ProductDTO,
} from '@sharvi/shared';
import { api, ApiError } from '@/lib/api';

interface Line {
  productId: string;
  quantity: number;
  color: string;
}

const inputCls =
  'w-full rounded-xl border border-maroon-200 bg-white px-3 py-2 text-sm outline-none focus:border-maroon-400';

/** Admin modal to create an order manually (e.g. received via WhatsApp). */
export function AdminOrderCreateModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data: productData } = useQuery({
    queryKey: ['admin', 'products', 'picker'],
    queryFn: () => api.get<Paginated<ProductDTO>>('/products/admin/all?pageSize=100'),
  });
  const products = productData?.items ?? [];
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [status, setStatus] = useState('CONFIRMED');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [error, setError] = useState<string | null>(null);

  const total = lines.reduce((sum, l) => {
    const p = byId.get(l.productId);
    return sum + (p ? p.priceMinor * l.quantity : 0);
  }, 0);

  const create = useMutation({
    mutationFn: () =>
      api.post('/orders/admin', {
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
        paymentMethod,
        status,
        source: 'WHATSAPP',
        note: note || undefined,
        items: lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          color: l.color || undefined,
        })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      onClose();
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Failed to create order'),
  });

  const canSubmit = customerName.trim() && customerPhone.trim() && lines.length > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-ink/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onClick={(e) => e.stopPropagation()}
          className="card my-8 w-full max-w-2xl p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl text-maroon-700">New WhatsApp / manual order</h2>
            <button onClick={onClose} aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name *" className={inputCls} />
            <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone *" className={inputCls} />
            <input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Email (optional)" className={inputCls} />
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputCls}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className={inputCls} />
          </div>

          {/* Items */}
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-ink/70">Items</p>
              <button
                onClick={() => products[0] && setLines((l) => [...l, { productId: products[0].id, quantity: 1, color: '' }])}
                className="btn-ghost py-1.5 text-xs"
              >
                <Plus className="h-4 w-4" /> Add item
              </button>
            </div>
            <div className="space-y-2">
              {lines.map((line, i) => {
                const p = byId.get(line.productId);
                return (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <select
                      value={line.productId}
                      onChange={(e) =>
                        setLines((ls) => ls.map((x, j) => (j === i ? { ...x, productId: e.target.value, color: '' } : x)))
                      }
                      className={`${inputCls} flex-1`}
                    >
                      {products.map((pr) => (
                        <option key={pr.id} value={pr.id}>
                          {pr.name} — {formatSEK(pr.priceMinor, 'sv')}
                        </option>
                      ))}
                    </select>
                    {p && p.colors.length > 0 && (
                      <select
                        value={line.color}
                        onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, color: e.target.value } : x)))}
                        className={`${inputCls} w-32`}
                      >
                        <option value="">Colour…</option>
                        {p.colors.map((c) => (
                          <option key={c.en} value={c.en}>
                            {c.en}
                          </option>
                        ))}
                      </select>
                    )}
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, quantity: Number(e.target.value) } : x)))}
                      className={`${inputCls} w-20`}
                    />
                    <button onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} className="text-red-500" aria-label="Remove">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
              {lines.length === 0 && <p className="text-xs text-ink/40">No items added yet.</p>}
            </div>
          </div>

          {error && <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}

          <div className="mt-5 flex items-center justify-between">
            <span className="text-sm text-ink/60">
              Total: <strong className="text-maroon-700">{formatSEK(total, 'sv')}</strong>
            </span>
            <div className="flex gap-3">
              <button onClick={onClose} className="btn-ghost">
                Cancel
              </button>
              <button onClick={() => create.mutate()} disabled={!canSubmit || create.isPending} className="btn-primary">
                {create.isPending ? 'Saving…' : 'Create order'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
