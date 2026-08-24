import { useMemo, useState } from 'react';
import { X, TrendingUp, AlertTriangle } from 'lucide-react';
import { store, today } from '../lib/store';
import { formatKz, parseAmountInput } from '../lib/currency';

const ENTRY_TYPES = [
  { id: 'compra', label: 'Compra' },
  { id: 'devolucao', label: 'Devolução de cliente' },
  { id: 'ajuste', label: 'Ajuste (contagem)' },
];
const EXIT_TYPES = [
  { id: 'ajuste', label: 'Ajuste (contagem)' },
  { id: 'perda', label: 'Perda / dano' },
  { id: 'outro', label: 'Outro' },
];

export default function StockMovementSheet({ product, onClose, onSaved }) {
  const [direction, setDirection] = useState('entrada');
  const [type, setType] = useState('compra');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState(String(store.lastPurchasePrice(product.id) || ''));
  const [newSalePrice, setNewSalePrice] = useState(String(product.salePrice || ''));
  const [updateSalePrice, setUpdateSalePrice] = useState(false);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(today());

  const currentStock = store.stockOf(product.id);
  const showCost = direction === 'entrada' && type !== 'ajuste';

  const margin = useMemo(() => {
    if (!showCost) return null;
    const buy = parseAmountInput(purchasePrice);
    const sell = parseAmountInput(updateSalePrice ? newSalePrice : product.salePrice);
    if (!buy || !sell) return null;
    const profit = sell - buy;
    return { profit, overCost: (profit / buy) * 100, overSale: (profit / sell) * 100 };
  }, [purchasePrice, newSalePrice, updateSalePrice, showCost, product.salePrice]);

  function handleSave() {
    const qty = Number(quantity);
    if (!qty) return;

    if (updateSalePrice && parseAmountInput(newSalePrice) > 0) {
      store.updateProduct(product.id, { salePrice: parseAmountInput(newSalePrice) });
    }

    if (direction === 'entrada') {
      store.addBatch({
        productId: product.id,
        purchasePrice: showCost ? parseAmountInput(purchasePrice) : store.lastPurchasePrice(product.id),
        quantity: qty,
        purchaseDate: date,
        source: type === 'ajuste' ? 'ajuste' : 'compra',
        note: type === 'compra' ? undefined : `${ENTRY_TYPES.find((t) => t.id === type)?.label}${note ? ': ' + note : ''}`,
      });
      if (type === 'compra' && parseAmountInput(purchasePrice) > 0) {
        store.addCashTransaction({
          type: 'saida',
          category: 'compra_stock',
          amount: qty * parseAmountInput(purchasePrice),
          description: `Compra de stock — ${product.name}`,
          date,
        });
      }
    } else {
      store.adjustStock({
        productId: product.id,
        quantityDelta: -qty,
        reason: `${EXIT_TYPES.find((t) => t.id === type)?.label}${note ? ': ' + note : ''}`,
        date,
      });
    }
    onSaved();
  }

  const exceedsStock = direction === 'saida' && Number(quantity) > currentStock;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md mx-auto bg-surface rounded-t-3xl p-5 pb-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-1">
          <h2 className="font-display text-xl">Movimentar stock</h2>
          <button onClick={onClose} className="text-muted p-1"><X size={22} /></button>
        </div>
        <p className="text-sm text-muted mb-5">{product.name} · {currentStock} {product.unit}(s) em stock</p>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => { setDirection('entrada'); setType('compra'); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: direction === 'entrada' ? '#3e9b7c' : '#223059', color: direction === 'entrada' ? '#101a33' : '#96a0c2' }}
          >
            Entrada
          </button>
          <button
            onClick={() => { setDirection('saida'); setType('ajuste'); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: direction === 'saida' ? '#e8664f' : '#223059', color: direction === 'saida' ? '#101a33' : '#96a0c2' }}
          >
            Saída / ajuste
          </button>
        </div>

        <label className="block text-xs text-muted mb-1.5">Tipo</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {(direction === 'entrada' ? ENTRY_TYPES : EXIT_TYPES).map((t) => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className="px-3 py-1.5 rounded-full text-xs border"
              style={{ borderColor: type === t.id ? '#d4a24c' : '#2c3a63', background: type === t.id ? '#d4a24c22' : 'transparent', color: type === t.id ? '#d4a24c' : '#96a0c2' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <label className="block text-xs text-muted mb-1.5">Quantidade</label>
        <input
          inputMode="numeric"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="0"
          autoFocus
          className="w-full bg-surface-light rounded-xl px-4 py-3 mb-2 text-2xl font-mono tabular outline-none focus-visible:ring-2 focus-visible:ring-gold"
        />
        {exceedsStock && <p className="text-xs text-expense mb-3">Só há {currentStock} em stock — não é possível remover mais do que isso.</p>}

        {showCost && (
          <>
            <label className="block text-xs text-muted mb-1.5 mt-2">Preço de compra por unidade (Kz)</label>
            <input
              inputMode="decimal"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              placeholder="0,00"
              className="w-full bg-surface-light rounded-xl px-4 py-3 mb-3 text-lg font-mono tabular outline-none focus-visible:ring-2 focus-visible:ring-gold"
            />

            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input type="checkbox" checked={updateSalePrice} onChange={(e) => setUpdateSalePrice(e.target.checked)} className="accent-gold" />
              <span className="text-xs text-muted">Atualizar preço de venda para este e futuros lotes</span>
            </label>
            {updateSalePrice && (
              <input
                inputMode="decimal"
                value={newSalePrice}
                onChange={(e) => setNewSalePrice(e.target.value)}
                placeholder="Novo preço de venda"
                className="w-full bg-surface-light rounded-xl px-4 py-3 mb-3 text-lg font-mono tabular outline-none focus-visible:ring-2 focus-visible:ring-gold"
              />
            )}

            {margin && (
              <div
                className="rounded-xl p-4 mb-4 border"
                style={{ borderColor: margin.profit <= 0 ? '#e8664f' : '#3e9b7c', background: margin.profit <= 0 ? '#e8664f15' : '#3e9b7c15' }}
              >
                {margin.profit <= 0 ? (
                  <div className="flex gap-2 items-start">
                    <AlertTriangle size={16} color="#e8664f" className="shrink-0 mt-0.5" />
                    <p className="text-xs text-expense">
                      {margin.profit === 0 ? 'Sem lucro a este preço.' : `Vendes com prejuízo ao preço atual (${formatKz(product.salePrice)}).`}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2 items-center mb-2">
                      <TrendingUp size={16} color="#3e9b7c" />
                      <p className="text-sm font-medium text-income">Lucro por unidade: {formatKz(margin.profit)}</p>
                    </div>
                    <div className="flex gap-4 text-xs text-muted">
                      <span>Margem/custo: <span className="text-cream font-mono">{margin.overCost.toFixed(1)}%</span></span>
                      <span>Margem/venda: <span className="text-cream font-mono">{margin.overSale.toFixed(1)}%</span></span>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {(type === 'ajuste' || direction === 'saida') && (
          <>
            <label className="block text-xs text-muted mb-1.5">Motivo (opcional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex: contagem física encontrou menos 2 unidades"
              className="w-full bg-surface-light rounded-xl px-4 py-3 mb-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold" />
          </>
        )}

        <label className="block text-xs text-muted mb-1.5">Data</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="w-full bg-surface-light rounded-xl px-4 py-2.5 mb-6 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold" />

        <button
          onClick={handleSave}
          disabled={!quantity || exceedsStock}
          className="w-full bg-gold text-night font-semibold py-3.5 rounded-xl text-sm disabled:opacity-40"
        >
          Confirmar movimento
        </button>
      </div>
    </div>
  );
}
