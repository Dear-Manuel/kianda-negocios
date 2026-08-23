import { useMemo, useState } from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import { store } from '../lib/store';
import { formatKz } from '../lib/currency';
import { useLiveVersion } from '../lib/useLiveVersion';
import ProductFormSheet from '../components/ProductFormSheet';
import PurchaseSessionSheet from '../components/PurchaseSessionSheet';

export default function Stock() {
  useLiveVersion();
  const [showProductForm, setShowProductForm] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [showCatInput, setShowCatInput] = useState(false);

  const categories = store.getCategories();
  const products = store.getProducts();

  const grouped = useMemo(() => {
    return categories.map((c) => ({
      ...c,
      items: products
        .filter((p) => p.categoryId === c.id)
        .map((p) => ({ ...p, stock: store.stockOf(p.id), stockValue: store.stockValueOf(p.id) })),
    })).filter((c) => c.items.length > 0);
  }, [categories, products]);

  const totalStockValue = store.totalStockValue();

  function addCategory() {
    if (!newCategory.trim()) return;
    store.addCategory({ name: newCategory });
    setNewCategory('');
    setShowCatInput(false);
  }

  return (
    <div className="px-5 pt-6 pb-28 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-1">
        <h1 className="font-display text-3xl">Stock</h1>
      </div>
      <p className="text-sm text-muted mb-5">Valor total em stock: <span className="font-mono tabular text-gold">{formatKz(totalStockValue)}</span></p>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setShowPurchase(true)} className="flex-1 bg-gold text-night text-xs font-semibold py-2.5 rounded-xl">
          + Dia de compra
        </button>
        <button onClick={() => setShowProductForm(true)} className="flex-1 bg-surface-light text-cream text-xs font-semibold py-2.5 rounded-xl border border-line">
          + Novo produto
        </button>
      </div>

      {showCatInput ? (
        <div className="flex gap-2 mb-5">
          <input
            autoFocus
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCategory()}
            placeholder="Nome da categoria"
            className="flex-1 bg-surface-light rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold"
          />
          <button onClick={addCategory} className="bg-gold text-night px-3 rounded-lg text-xs font-medium">Criar</button>
        </div>
      ) : (
        <button onClick={() => setShowCatInput(true)} className="text-xs text-gold mb-5">+ Nova categoria</button>
      )}

      {grouped.length === 0 && (
        <p className="text-sm text-muted py-12 text-center">Ainda não tens produtos. Toca em "Novo produto" para começar.</p>
      )}

      {grouped.map((cat) => (
        <div key={cat.id} className="mb-6">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
            <h2 className="text-sm font-medium">{cat.name}</h2>
          </div>
          <div className="space-y-2">
            {cat.items.map((p) => {
              const low = p.stock <= (p.lowStockThreshold ?? 3);
              return (
                <div key={p.id} className="flex items-center justify-between bg-surface rounded-xl px-4 py-3 border border-line">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-surface-light flex items-center justify-center shrink-0">
                      <Package size={16} color={cat.color} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted">{formatKz(p.salePrice)} / {p.unit}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-mono tabular font-medium ${low ? 'text-expense' : 'text-cream'}`}>
                      {p.stock} {p.unit}{p.stock !== 1 ? 's' : ''}
                    </p>
                    {low && (
                      <p className="text-[10px] text-expense flex items-center gap-0.5 justify-end">
                        <AlertTriangle size={10} /> stock baixo
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {showProductForm && (
        <ProductFormSheet onClose={() => setShowProductForm(false)} onSaved={() => setShowProductForm(false)} />
      )}
      {showPurchase && (
        <PurchaseSessionSheet onClose={() => setShowPurchase(false)} onSaved={() => setShowPurchase(false)} />
      )}
    </div>
  );
}
