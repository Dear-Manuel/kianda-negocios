import { useMemo, useState } from 'react';
import { X, Search, Check } from 'lucide-react';
import { store } from '../lib/store';

export default function CategoryPickerSheet({ selectedId, onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const categories = store.getCategories();

  const filtered = useMemo(() => {
    if (!query.trim()) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()));
  }, [query, categories]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md mx-auto bg-surface rounded-t-3xl p-5 pb-8 max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display text-xl">Escolher categoria</h2>
          <button onClick={onClose} className="text-muted p-1"><X size={22} /></button>
        </div>

        <div className="relative mb-4">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar categoria..."
            autoFocus
            className="w-full bg-surface-light rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold"
          />
        </div>

        <div className="overflow-y-auto space-y-1.5">
          {filtered.length === 0 && (
            <p className="text-sm text-muted text-center py-6">Nenhuma categoria encontrada.</p>
          )}
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left"
              style={{ background: selectedId === c.id ? `${c.color}22` : 'transparent' }}
            >
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: c.color }} />
              <span className="text-sm flex-1">{c.name}</span>
              {selectedId === c.id && <Check size={16} color={c.color} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
