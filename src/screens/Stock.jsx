import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, PackagePlus, Search, ChevronDown, X } from 'lucide-react';
import { store } from '../lib/store';
import { formatKz } from '../lib/currency';
import { useLiveVersion } from '../lib/useLiveVersion';
import ProductFormSheet from '../components/ProductFormSheet';
import PurchaseSessionSheet from '../components/PurchaseSessionSheet';
import StockMovementSheet from '../components/StockMovementSheet';
import StockHistorySheet from '../components/StockHistorySheet';
import CategoryPickerSheet from '../components/CategoryPickerSheet';

export default function Stock() {
  const version = useLiveVersion();
  const [showProductForm, setShowProductForm] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [movementProduct, setMovementProduct] = useState(null);
  const [historyProduct, setHistoryProduct] = useState(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [search, setSearch] = useState('');

  const categories = store.getCategories();
  const products = store.getProducts();

  // Ao entrar (ou quando a categoria ativa deixa de existir), assume a primeira categoria disponível.
  useEffect(() => {
    if (!activeCategoryId && categories.length > 0) {
      setActiveCategoryId(categories[0].id);
    } else if (activeCategoryId && !categories.find((c) => c.id === activeCategoryId)) {
      setActiveCategoryId(categories[0]?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.length]);

  const activeCategory = categories.find((c) => c.id === activeCategoryId);
  const q = search.trim().toLowerCase();
  const isSearching = q.length > 0;

  const list = useMemo(() => {
    const enrich = (p) => ({ ...p, stock: store.stockOf(p.id) });
    if (isSearching) {
      // Pesquisa geral: ignora a categoria ativa, procura em todos os produtos.
      return products.filter((p) => p.name.toLowerCase().includes(q)).map(enrich);
    }
    if (!activeCategory) return [];
    return products.filter((p) => p.categoryId === activeCategory.id).map(enrich);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, activeCategory, q, isSearching, version]);

  const totalStockValue = store.totalStockValue();
  const categoryOf = (p) => categories.find((c) => c.id === p.categoryId);

  return (
    <div className="px-5 pt-6 pb-28 max-w-md mx-auto">
      <h1 className="font-display text-3xl mb-1">Stock</h1>
      <p className="text-sm text-muted mb-5">Valor total em stock: <span className="font-mono tabular text-gold">{formatKz(totalStockValue)}</span></p>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setShowPurchase(true)} className="flex-1 bg-gold text-night text-xs font-semibold py-2.5 rounded-xl">
          + Dia de compra
        </button>
        <button onClick={() => setShowProductForm(true)} className="flex-1 bg-surface-light text-cream text-xs font-semibold py-2.5 rounded-xl border border-line">
          + Novo produto
        </button>
      </div>

      {/* Seletor de categoria — mostra sempre uma categoria de cada vez */}
      {categories.length > 0 && (
        <button
          onClick={() => setShowCategoryPicker(true)}
          className="w-full flex items-center justify-between bg-surface rounded-xl px-4 py-3 mb-3 border border-line"
        >
          <span className="flex items-center gap-2.5 min-w-0">
            {activeCategory && <span className="w-3 h-3 rounded-full shrink-0" style={{ background: activeCategory.color }} />}
            <span className="text-sm font-medium truncate">{activeCategory?.name ?? 'Escolher categoria'}</span>
            {!isSearching && <span className="text-xs text-muted shrink-0">({list.length})</span>}
          </span>
          <ChevronDown size={16} className="text-muted shrink-0" />
        </button>
      )}

      {/* Pesquisa geral — quando ativa, mostra resultados de todas as categorias */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar produto em todas as categorias..."
          className="w-full bg-surface-light rounded-xl pl-10 pr-8 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted">
            <X size={14} />
          </button>
        )}
      </div>

      {categories.length === 0 && (
        <p className="text-sm text-muted py-12 text-center">Ainda não tens categorias. Toca em "Novo produto" para criar a primeira.</p>
      )}

      {isSearching && (
        <p className="text-xs text-muted mb-2">{list.length} resultado{list.length !== 1 ? 's' : ''} para "{search}"</p>
      )}

      {categories.length > 0 && list.length === 0 && (
        <p className="text-sm text-muted py-10 text-center">
          {isSearching ? `Nenhum produto encontrado para "${search}".` : `Nenhum produto em ${activeCategory?.name} ainda.`}
        </p>
      )}

      {list.length > 0 && (
        <div className="bg-surface rounded-xl border border-line divide-y divide-line overflow-hidden">
          {list.map((p) => {
            const low = p.stock <= (p.lowStockThreshold ?? 3);
            const cat = isSearching ? categoryOf(p) : null;
            return (
              <div key={p.id} className="flex items-center justify-between px-3.5 py-2.5">
                <button onClick={() => setHistoryProduct(p)} className="flex items-center gap-2.5 min-w-0 text-left flex-1">
                  {cat && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.color }} />}
                  <div className="min-w-0">
                    <p className="text-sm truncate leading-tight">{p.name}</p>
                    <p className="text-[11px] text-muted leading-tight">
                      {cat ? `${cat.name} · ` : ''}{p.salePrice > 0 ? formatKz(p.salePrice) : 'preço por definir'}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-sm font-mono tabular ${low ? 'text-expense' : 'text-cream'}`}>
                    {p.stock}
                  </span>
                  {low && <AlertTriangle size={12} className="text-expense" />}
                  <button
                    onClick={() => setMovementProduct(p)}
                    aria-label={`Movimentar stock de ${p.name}`}
                    className="w-7 h-7 rounded-full bg-surface-light flex items-center justify-center shrink-0"
                  >
                    <PackagePlus size={13} color="#d4a24c" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showProductForm && (
        <ProductFormSheet onClose={() => setShowProductForm(false)} onSaved={() => setShowProductForm(false)} />
      )}
      {showPurchase && (
        <PurchaseSessionSheet onClose={() => setShowPurchase(false)} onSaved={() => setShowPurchase(false)} />
      )}
      {movementProduct && (
        <StockMovementSheet product={movementProduct} onClose={() => setMovementProduct(null)} onSaved={() => setMovementProduct(null)} />
      )}
      {historyProduct && (
        <StockHistorySheet product={historyProduct} onClose={() => setHistoryProduct(null)} />
      )}
      {showCategoryPicker && (
        <CategoryPickerSheet
          selectedId={activeCategoryId}
          allowCreate
          onSelect={(id) => { setActiveCategoryId(id); setShowCategoryPicker(false); }}
          onClose={() => setShowCategoryPicker(false)}
        />
      )}
    </div>
  );
}
