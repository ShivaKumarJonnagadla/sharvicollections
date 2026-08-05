import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { PageLoader } from '@/components/PageLoader';

interface StoreSettings {
  shippingCostKr: number;
  announcement: string;
}

export function AdminSettings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<StoreSettings>('/settings'),
  });

  const [shippingCostKr, setShippingCostKr] = useState('49');
  const [announcement, setAnnouncement] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setShippingCostKr(String(data.shippingCostKr));
      setAnnouncement(data.announcement);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      api.patch<StoreSettings>('/settings/admin', {
        shippingCostKr: Number(shippingCostKr),
        announcement,
      }),
    onSuccess: () => {
      setSaved(true);
      setError(null);
      qc.invalidateQueries({ queryKey: ['settings'] });
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Failed to save'),
  });

  if (isLoading || !data) return <PageLoader />;

  const inputCls =
    'w-full rounded-xl border border-maroon-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-maroon-400';

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="font-serif text-3xl text-maroon-700">Settings</h1>

      <div className="card space-y-5 p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/70">Shipping fee (kr)</label>
          <input
            type="number"
            min={0}
            value={shippingCostKr}
            onChange={(e) => setShippingCostKr(e.target.value)}
            className={inputCls}
          />
          <p className="mt-1 text-xs text-ink/50">
            Charged at checkout when a customer turns on shipping.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink/70">Store announcement</label>
          <input
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            placeholder="e.g. Free local pickup in Älmhult!"
            className={inputCls}
          />
          <p className="mt-1 text-xs text-ink/50">
            Shown as a banner at the top of the storefront (leave empty to hide).
          </p>
        </div>

        {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}

        <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary">
          {saved ? <Check className="h-4 w-4" /> : null}
          {saved ? 'Saved' : save.isPending ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </div>
  );
}
