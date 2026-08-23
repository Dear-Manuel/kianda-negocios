import { useMemo, useState } from 'react';
import { X, TrendingUp, AlertTriangle, PackagePlus } from 'lucide-react';
import { store } from '../lib/store';
import { formatKz, parseAmountInput } from '../lib/currency';

export default function ProductFormSheet({ onClose, onSaved, presetProduct }) {
  const categories = store.getCategories();
  const [categoryId, setCategoryId] = useState(presetProduct?.categoryId ?? categories[0]?.id);
  const [name, setName] = useState(presetProduct?.name ?? '');
  const [unit, setUnit] = useState(presetProduct?.unit ?? 'unidade');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');

  const existingProduct = useMemo(
    () => (name.trim() ? store.findProduct(name, categoryId) : null),
    [name, categoryId]
  );

  const margin = useMemo(() => {
    const buy = parseAmountInput(purchasePrice);
    const sell = parseAmountInput(salePrice);
    if (!buy || !sell) return null;
    const profit = sell - buy;
    const overCost = (profit / buy) * 100;
    const overSale = (profit / sell) * 100;
    return { profit, overCost, overSale };
  }, [purchasePrice, salePrice]);

  function handleSave() {
    if (!name || !purchasePrice) return;
    const product = store.addProduct({
      categoryId,
      name,
      unit,
      salePrice: parseAmountInput(salePrice) || parseAmountInput(purchasePrice),
    });
    store.addBatch({
      productId: product.id,
      purchasePrice: parseAmountInput(purchasePrice),
      quantity: Number(quantity) || 0,
      source: 'compra',
    });
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md mx-auto bg-surface rounded-t-3xl p-5 pb-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-display text-xl">{existingProduct ? 'Adicionar stock' : 'Novo produto'}</h2>
          <button onClick={onClose} className="text-muted p-1"><X size={22} /></button>
        </div>

        <label className="block text-xs text-muted mb-1.5">Categoria</label>
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-1 px-1">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryId(c.id)}
              className="shrink-0 px-3.5 py-2 rounded-full text-xs font-medium border"
              style={{
                borderColor: categoryId === c.id ? c.color : '#2c3a63',
                background: categoryId === c.id ? `${c.color}22` : 'transparent',
                color: categoryId === c.id ? c.color : '#96a0c2',
              }}
            >
              {c.name}
            </button>
          ))}
          {categories.length === 0 && <p className="text-xs text-muted">Cria uma categoria primeiro em Stock.</p>}
        </div>

        <label className="block text-xs text-muted mb-1.5">Nome do produto</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: MacBook Air, Carregador tipo-C..."
          autoFocus
          className="w-full bg-surface-light rounded-xl px-4 py-3 mb-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold"
        />

        {existingProduct && (
          <div className="rounded-xl p-3 mb-4 border border-gold/40 bg-gold/10 flex gap-2 items-start">
            <PackagePlus size={16} color="#d4a24c" className="shrink-0 mt-0.5" />
            <p className="text-xs text-gold">
              Já existe "{existingProduct.name}" nesta categoria — isto vai adicionar um novo lote de stock a ele (não cria um produto duplicado). Tinha {store.stockOf(existingProduct.id)} {existingProduct.unit}(s) antes desta entrada.
            </p>
          </div>
        )}

        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-xs text-muted mb-1.5">Quantidade</label>
            <input
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="w-full bg-surface-light rounded-xl px-4 py-3 text-sm font-mono outline-none focus-visible:ring-2 focus-visible:ring-gold"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-muted mb-1.5">Unidade</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full bg-surface-light rounded-xl px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <option value="unidade">unidade</option>
              <option value="kg">kg</option>
              <option value="litro">litro</option>
              <option value="pacote">pacote</option>
              <option value="caixa">caixa</option>
            </select>
          </div>
        </div>

        <label className="block text-xs text-muted mb-1.5">Preço de compra (Kz)</label>
        <input
          inputMode="decimal"
          value={purchasePrice}
          onChange={(e) => setPurchasePrice(e.target.value)}
          placeholder="0,00"
          className="w-full bg-surface-light rounded-xl px-4 py-3 mb-4 text-xl font-mono tabular outline-none focus-visible:ring-2 focus-visible:ring-gold"
        />

        <label className="block text-xs text-muted mb-1.5">Preço de venda (Kz)</label>
        <input
          inputMode="decimal"
          value={salePrice}
          onChange={(e) => setSalePrice(e.target.value)}
          placeholder="0,00"
          className="w-full bg-surface-light rounded-xl px-4 py-3 mb-2 text-xl font-mono tabular outline-none focus-visible:ring-2 focus-visible:ring-gold"
        />

        {margin && (
          <div
            className="rounded-xl p-4 mb-4 border"
            style={{
              borderColor: margin.profit <= 0 ? '#e8664f' : '#3e9b7c',
              background: margin.profit <= 0 ? '#e8664f15' : '#3e9b7c15',
            }}
          >
            {margin.profit <= 0 ? (
              <div className="flex gap-2 items-start">
                <AlertTriangle size={16} color="#e8664f" className="shrink-0 mt-0.5" />
                <p className="text-xs text-expense">
                  {margin.profit === 0 ? 'Estás a vender pelo preço de custo — sem lucro.' : 'Estás a vender abaixo do custo — vais ter prejuízo nesta venda.'}
                </p>
              </div>
            ) : (
              <>
                <div className="flex gap-2 items-center mb-2">
                  <TrendingUp size={16} color="#3e9b7c" />
                  <p className="text-sm font-medium text-income">Lucro por unidade: {formatKz(margin.profit)}</p>
                </div>
                <div className="flex gap-4 text-xs text-muted">
                  <span>Margem sobre custo: <span className="text-cream font-mono">{margin.overCost.toFixed(1)}%</span></span>
                  <span>Margem sobre venda: <span className="text-cream font-mono">{margin.overSale.toFixed(1)}%</span></span>
                </div>
                {margin.overSale < 15 && (
                  <p className="text-[11px] text-gold mt-2">Margem apertada — considera se cobre bem as tuas despesas.</p>
                )}
              </>
            )}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!name || !purchasePrice}
          className="w-full bg-gold text-night font-semibold py-3.5 rounded-xl text-sm disabled:opacity-40"
        >
          {existingProduct ? 'Adicionar stock' : 'Guardar produto'}
        </button>
      </div>
    </div>
  );
}
