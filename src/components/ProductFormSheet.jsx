import { useState } from 'react';
import { X } from 'lucide-react';
import { store } from '../lib/store';
import { parseAmountInput } from '../lib/currency';

// Ficha mestre do produto — só identidade e preço de venda sugerido.
// O stock (quantidade, custo) entra depois via StockMovementSheet, porque
// o custo muda a cada compra e não é uma propriedade fixa do produto.
export default function ProductFormSheet({ onClose, onSaved }) {
  const categories = store.getCategories();
  const [categoryId, setCategoryId] = useState(categories[0]?.id);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('unidade');
  const [salePrice, setSalePrice] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('3');

  const existingProduct = name.trim() ? store.findProduct(name, categoryId) : null;

  function handleSave() {
    if (!name || !categoryId) return;
    store.addProduct({
      categoryId,
      name,
      unit,
      salePrice: parseAmountInput(salePrice),
      lowStockThreshold: Number(lowStockThreshold) || 3,
    });
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md mx-auto bg-surface rounded-t-3xl p-5 pb-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-display text-xl">Novo produto</h2>
          <button onClick={onClose} className="text-muted p-1"><X size={22} /></button>
        </div>

        {categories.length === 0 ? (
          <p className="text-sm text-muted py-4">Cria uma categoria primeiro (botão "+ Nova categoria" no separador Stock).</p>
        ) : (
          <>
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
            </div>

            <label className="block text-xs text-muted mb-1.5">Nome do produto</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: MacBook Air, Carregador tipo-C..."
              autoFocus
              className="w-full bg-surface-light rounded-xl px-4 py-3 mb-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold"
            />
            {existingProduct && (
              <p className="text-xs text-gold mb-4">Já existe um produto com este nome nesta categoria — vais poder editar o existente.</p>
            )}
            {!existingProduct && <div className="mb-4" />}

            <div className="flex gap-3 mb-4">
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
              <div className="flex-1">
                <label className="block text-xs text-muted mb-1.5">Alerta stock baixo</label>
                <input
                  inputMode="numeric"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  placeholder="3"
                  className="w-full bg-surface-light rounded-xl px-4 py-3 text-sm font-mono outline-none focus-visible:ring-2 focus-visible:ring-gold"
                />
              </div>
            </div>

            <label className="block text-xs text-muted mb-1.5">Preço de venda (Kz)</label>
            <input
              inputMode="decimal"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              placeholder="0,00"
              className="w-full bg-surface-light rounded-xl px-4 py-3 mb-2 text-xl font-mono tabular outline-none focus-visible:ring-2 focus-visible:ring-gold"
            />
            <p className="text-xs text-muted mb-5">Podes ajustar isto (e ver a margem de lucro) quando adicionares stock a este produto.</p>

            <button
              onClick={handleSave}
              disabled={!name || !categoryId}
              className="w-full bg-gold text-night font-semibold py-3.5 rounded-xl text-sm disabled:opacity-40"
            >
              Criar produto
            </button>
          </>
        )}
      </div>
    </div>
  );
}
