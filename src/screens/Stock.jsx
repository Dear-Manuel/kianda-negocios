import { useMemo, useState } from 'react';
import { AlertTriangle, Package, PackagePlus, Search, ChevronDown, X } from 'lucide-react';
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
  const [newCategory, setNewCategory] = useState('');
  const [showCatInput, setShowCatInput] = useState(false);
  const [catError, setCatError] = useState('');

  const [search, setSearch] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState(null);
  const [showFilterPicker, setShowFilterPicker] = useState(false);

  const categories = store.getCategories();
  const products = store.getProducts();

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const relevantCategories = filterCategoryId ? categories.filter((c) => c.id === filterCategoryId) : categories;

    const known = relevantCategories.map((c) => ({
      ...c,
      items: products
        .filter((p) => p.categoryId === c.id && (!q || p.name.toLowerCase().includes(q)))
        .map((p) => ({ ...p, stock: store.stockOf(p.id), stockValue: store.stockValueOf(p.id) })),
    })).filter((c) => c.items.length > 0);

    if (!filterCategoryId) {
      const knownIds = new Set(categories.map((c) => c.id));
      const orphanItems = products
        .filter((p) => !knownIds.has(p.categoryId) && (!q || p.name.toLowerCase().includes(q)))
        .map((p) => ({ ...p, stock: store.stockOf(p.id), stockValue: store.stockValueOf(p.id) }));
      if (orphanItems.length > 0) {
        known.push({ id: '__sem_categoria__', name: 'Sem categoria', color: '#96a0c2', items: orphanItems });
      }
    }
    return known;
  }, [categories, products, version, search, filterCategoryId]);

  const totalStockValue = store.totalStockValue();
  const activeFilterCategory = categories.find((c) => c.id === filterCategoryId);
  const totalProducts = products.length;
  const visibleProducts = grouped.reduce((s, c) => s + c.items.length, 0);

  function addCategory() {
    if (!newCategory.trim()) return;
    const existing = store.findCategoryByName(newCategory);
    if (existing) {
      setCatError(`A categoria "${existing.name}" já existe.`);
      return;
    }
    store.addCategory({ name: newCategory });
    setNewCategory('');
    setCatError('');
    setShowCatInput(false);
  }

  return (
    <div className="px-5 pt-6 pb-28 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-1">
        <h1 className="font-display text-3xl">Stock</h1>
      </div>
      <p className="text-sm text-muted mb-5">Valor total em stock: <span className="font-mono tabular text-gold">{formatKz(totalStockValue)}</span></p>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setShowPurchase(true)} className="flex-1 bg-gold text-night text-xs font-semibold py-2.5 rounded-xl">
          + Dia de compra
        </button>
        <button onClick={() => setShowProductForm(true)} className="flex-1 bg-surface-light text-cream text-xs font-semibold py-2.5 rounded-xl border border-line">
          + Novo produto
        </button>
      </div>

      {/* Pesquisa geral + filtro por categoria */}
      <div className="flex gap-2 mb-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar produto..."
            className="w-full bg-surface-light rounded-xl pl-10 pr-8 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted">
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilterPicker(true)}
          className="flex items-center gap-1.5 px-3 rounded-xl text-xs shrink-0 border"
          style={{
            borderColor: activeFilterCategory ? activeFilterCategory.color : '#2c3a63',
            background: activeFilterCategory ? `${activeFilterCategory.color}22` : '#182545',
            color: activeFilterCategory ? activeFilterCategory.color : '#96a0c2',
          }}
        >
          {activeFilterCategory ? activeFilterCategory.name : 'Categoria'} <ChevronDown size={13} />
        </button>
      </div>

      {(search || filterCategoryId) && (
        <p className="text-xs text-muted mb-3">{visibleProducts} de {totalProducts} produto{totalProducts !== 1 ? 's' : ''}</p>
      )}
      {!search && !filterCategoryId && <div className="mb-5" />}

      {showCatInput ? (
        <div className="mb-5">
          <div className="flex gap-2">
            <input
              autoFocus
              value={newCategory}
              onChange={(e) => { setNewCategory(e.target.value); setCatError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              placeholder="Nome da categoria"
              className="flex-1 bg-surface-light rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold"
            />
            <button onClick={addCategory} className="bg-gold text-night px-3 rounded-lg text-xs font-medium">Criar</button>
          </div>
          {catError && <p className="text-xs text-expense mt-1.5">{catError}</p>}
        </div>
      ) : (
        <button onClick={() => setShowCatInput(true)} className="text-xs text-gold mb-5">+ Nova categoria</button>
      )}

      {grouped.length === 0 && totalProducts === 0 && (
        <p className="text-sm text-muted py-12 text-center">Ainda não tens produtos. Cria uma categoria e depois toca em "Novo produto" para começar.</p>
      )}
      {grouped.length === 0 && totalProducts > 0 && (
        <p className="text-sm text-muted py-12 text-center">Nenhum produto encontrado{search ? ` para "${search}"` : ''}{activeFilterCategory ? ` em ${activeFilterCategory.name}` : ''}.</p>
      )}

      {grouped.map((cat) => (
        <div key={cat.id} className="mb-6">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
            <h2 className="text-sm font-medium">{cat.name}</h2>
            <span className="text-xs text-muted">({cat.items.length})</span>
          </div>
          <div className="space-y-2">
            {cat.items.map((p) => {
              const low = p.stock <= (p.lowStockThreshold ?? 3);
              return (
                <div key={p.id} className="flex items-center justify-between bg-surface rounded-xl px-4 py-3 border border-line">
                  <button onClick={() => setHistoryProduct(p)} className="flex items-center gap-3 min-w-0 text-left flex-1">
                    <div className="w-9 h-9 rounded-lg bg-surface-light flex items-center justify-center shrink-0">
                      <Package size={16} color={cat.color} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted">{p.salePrice > 0 ? `${formatKz(p.salePrice)} / ${p.unit}` : 'Preço por definir'}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className={`text-sm font-mono tabular font-medium ${low ? 'text-expense' : 'text-cream'}`}>
                        {p.stock} {p.unit}{p.stock !== 1 ? 's' : ''}
                      </p>
                      {low && (
                        <p className="text-[10px] text-expense flex items-center gap-0.5 justify-end">
                          <AlertTriangle size={10} /> stock baixo
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setMovementProduct(p)}
                      aria-label={`Movimentar stock de ${p.name}`}
                      className="w-8 h-8 rounded-full bg-surface-light flex items-center justify-center shrink-0"
                    >
                      <PackagePlus size={15} color="#d4a24c" />
                    </button>
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
      {movementProduct && (
        <StockMovementSheet product={movementProduct} onClose={() => setMovementProduct(null)} onSaved={() => setMovementProduct(null)} />
      )}
      {historyProduct && (
        <StockHistorySheet product={historyProduct} onClose={() => setHistoryProduct(null)} />
      )}
      {showFilterPicker && (
        <CategoryPickerSheet
          selectedId={filterCategoryId}
          allowAll
          allLabel="Todas as categorias"
          onSelect={(id) => { setFilterCategoryId(id); setShowFilterPicker(false); }}
          onClose={() => setShowFilterPicker(false)}
        />
      )}
    </div>
  );
}
