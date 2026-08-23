import { useMemo, useState } from 'react';
import { X, Search } from 'lucide-react';
import { store, today } from '../lib/store';
import { formatKz, parseAmountInput } from '../lib/currency';

export default function SaleSheet({ onClose, onSaved }) {
  const products = store.getProducts();
  const customers = store.getCustomers();

  const [search, setSearch] = useState('');
  const [productId, setProductId] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [isOnCredit, setIsOnCredit] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [date, setDate] = useState(today());

  const filtered = useMemo(() => {
    if (!search) return products;
    return products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [search, products]);

  const selected = products.find((p) => p.id === productId);
  const stock = selected ? store.stockOf(selected.id) : 0;

  function selectProduct(p) {
    setProductId(p.id);
    setUnitPrice(String(p.salePrice));
    setSearch(p.name);
  }

  const qty = Number(quantity) || 0;
  const price = parseAmountInput(unitPrice);
  const total = qty * price;

  function handleSave() {
    if (!productId || qty <= 0 || price <= 0) return;
    if (qty > stock) return;

    let finalCustomerId = customerId;
    if (isOnCredit && !customerId && newCustomerName) {
      const c = store.addCustomer({ name: newCustomerName });
      finalCustomerId = c.id;
    }

    store.createSale({
      productId,
      quantity: qty,
      unitPrice: price,
      customerId: isOnCredit ? finalCustomerId : null,
      isOnCredit,
      date,
    });
    onSaved();
  }

  const canSave = productId && qty > 0 && qty <= stock && price > 0 && (!isOnCredit || customerId || newCustomerName);

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md mx-auto bg-surface rounded-t-3xl p-5 pb-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-display text-xl">Nova venda</h2>
          <button onClick={onClose} className="text-muted p-1"><X size={22} /></button>
        </div>

        <label className="block text-xs text-muted mb-1.5">Produto</label>
        <div className="relative mb-2">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setProductId(null); }}
            placeholder="Procurar produto..."
            autoFocus
            className="w-full bg-surface-light rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold"
          />
        </div>

        {!productId && search && (
          <div className="mb-4 space-y-1.5 max-h-48 overflow-y-auto">
            {filtered.length === 0 && <p className="text-xs text-muted py-2">Nenhum produto encontrado.</p>}
            {filtered.map((p) => (
              <button key={p.id} onClick={() => selectProduct(p)} className="w-full flex justify-between items-center bg-surface-light rounded-lg px-3.5 py-2.5 text-left">
                <span className="text-sm">{p.name}</span>
                <span className="text-xs text-muted font-mono">{store.stockOf(p.id)} em stock</span>
              </button>
            ))}
          </div>
        )}

        {selected && (
          <>
            <div className="flex gap-3 mb-4 mt-3">
              <div className="flex-1">
                <label className="block text-xs text-muted mb-1.5">Quantidade <span className="text-muted/70">({stock} disponíveis)</span></label>
                <input inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-surface-light rounded-xl px-4 py-3 text-lg font-mono tabular outline-none focus-visible:ring-2 focus-visible:ring-gold" />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-muted mb-1.5">Preço/unid (Kz)</label>
                <input inputMode="decimal" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)}
                  className="w-full bg-surface-light rounded-xl px-4 py-3 text-lg font-mono tabular outline-none focus-visible:ring-2 focus-visible:ring-gold" />
              </div>
            </div>

            {qty > stock && <p className="text-xs text-expense mb-3">Só há {stock} em stock.</p>}

            <div className="bg-surface-light rounded-xl px-4 py-3 mb-4 flex justify-between items-center">
              <span className="text-sm text-muted">Total da venda</span>
              <span className="text-xl font-mono tabular font-semibold text-gold">{formatKz(total)}</span>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setIsOnCredit(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: !isOnCredit ? '#3e9b7c' : '#223059', color: !isOnCredit ? '#101a33' : '#96a0c2' }}
              >
                Pagamento à vista
              </button>
              <button
                onClick={() => setIsOnCredit(true)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: isOnCredit ? '#d4a24c' : '#223059', color: isOnCredit ? '#101a33' : '#96a0c2' }}
              >
                Fiado (a receber)
              </button>
            </div>

            {isOnCredit && (
              <div className="mb-4">
                <label className="block text-xs text-muted mb-1.5">Cliente</label>
                {customers.length > 0 && (
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full bg-surface-light rounded-xl px-4 py-3 mb-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    <option value="">Novo cliente...</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
                {!customerId && (
                  <input
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="Nome do cliente"
                    className="w-full bg-surface-light rounded-xl px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  />
                )}
              </div>
            )}

            <label className="block text-xs text-muted mb-1.5">Data</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full bg-surface-light rounded-xl px-4 py-2.5 mb-5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold" />
          </>
        )}

        <button
          onClick={handleSave}
          disabled={!canSave}
          className="w-full bg-gold text-night font-semibold py-3.5 rounded-xl text-sm disabled:opacity-40"
        >
          Confirmar venda
        </button>
      </div>
    </div>
  );
}
