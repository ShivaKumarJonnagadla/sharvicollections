import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, X } from 'lucide-react';
import type { CategoryDTO } from '@sharvi/shared';
import { api, ApiError } from '@/lib/api';
import { PageLoader } from '@/components/PageLoader';

export function AdminCategories() {
  const qc = useQueryClient();
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<CategoryDTO[]>('/categories'),
  });
  const [newCategory, setNewCategory] = useState('');
  const [newSub, setNewSub] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['categories'] });
  const onError = (e: unknown) => setError(e instanceof ApiError ? e.message : 'Something went wrong');

  const addCategory = useMutation({
    mutationFn: (name: string) => api.post('/categories', { name }),
    onSuccess: () => {
      setNewCategory('');
      setError(null);
      invalidate();
    },
    onError,
  });
  const delCategory = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      setError(null);
      invalidate();
    },
    onError,
  });
  const addSub = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.post(`/categories/${id}/subcategories`, { name }),
    onSuccess: (_d, v) => {
      setNewSub((s) => ({ ...s, [v.id]: '' }));
      setError(null);
      invalidate();
    },
    onError,
  });
  const delSub = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/subcategories/${id}`),
    onSuccess: () => {
      setError(null);
      invalidate();
    },
    onError,
  });

  if (isLoading || !categories) return <PageLoader />;

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-maroon-700">Categories</h1>

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {/* Add category */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (newCategory.trim()) addCategory.mutate(newCategory.trim());
        }}
        className="card flex gap-3 p-4"
      >
        <input
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New category name"
          className="flex-1 rounded-xl border border-maroon-200 px-4 py-2.5 text-sm outline-none focus:border-maroon-400"
        />
        <button type="submit" disabled={addCategory.isPending} className="btn-primary">
          <Plus className="h-4 w-4" /> Add
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((c) => (
          <div key={c.id} className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif text-lg text-maroon-700">{c.name}</h2>
              <button
                aria-label={`Delete ${c.name}`}
                onClick={() => {
                  if (confirm(`Delete category "${c.name}"? This cannot be undone.`))
                    delCategory.mutate(c.id);
                }}
                className="grid h-8 w-8 place-items-center rounded-lg text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {c.subcategories.length === 0 && (
                <span className="text-xs text-ink/40">No subcategories</span>
              )}
              {c.subcategories.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1 rounded-full border border-maroon-200 bg-white px-3 py-1 text-xs text-ink/70"
                >
                  {s.name}
                  <button
                    aria-label={`Remove ${s.name}`}
                    onClick={() => {
                      if (confirm(`Remove subcategory "${s.name}"?`)) delSub.mutate(s.id);
                    }}
                    className="text-maroon-400 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const name = (newSub[c.id] ?? '').trim();
                if (name) addSub.mutate({ id: c.id, name });
              }}
              className="mt-3 flex gap-2"
            >
              <input
                value={newSub[c.id] ?? ''}
                onChange={(e) => setNewSub((s) => ({ ...s, [c.id]: e.target.value }))}
                placeholder="Add subcategory"
                className="flex-1 rounded-lg border border-maroon-200 px-3 py-2 text-sm outline-none focus:border-maroon-400"
              />
              <button type="submit" className="btn-ghost px-3 py-2 text-xs">
                <Plus className="h-4 w-4" />
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
