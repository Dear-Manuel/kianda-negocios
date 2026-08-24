import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { store, today } from '../lib/store';
import { formatKz, parseAmountInput } from '../lib/currency';

export default function PurchaseSessionSheet({ onClose, onSaved }) {
  const products = store.getProducts();
  const suppliers = store.getSuppliers();
  const [date, setDate] = useState(today());
  const [items, setItems] = useState([]);
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [transportCost, setTransportCost] = useState('');
  const [foodCost, setFoodCost] = useState('');
  const [otherCost, setOtherCost] = useState('');
  const [notes, setNotes] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('vista');
  const [supplierId, setSupplierId] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [dueDate, setDueDate] = useState('');

  function selectProduct(id) {
    setProductId(id);
    setPurchasePrice(String(store.lastPurchasePrice(id) || ''));
  }

  function addItem() {
    if (!productId || !quantity || !purchasePrice) return;
    const product = products.find((p) => p.id === productId);
    setItems([...items, {
      productId,
      productName: product?.name,
      quantity: Number(quantity),
      purchasePrice: parseAmountInput(purchasePrice),
    }]);
    setQuantity('');
  }

  const itemsTotal = items.reduce((s, i) => s + i.quantity * i.purchasePrice, 0);
  const extraTotal = parseAmountInput(transportCost) + parseAmountInput(foodCost) + parseAmountInput(otherCost);

  function handleSave() {
    if (items.length === 0) return;

    let finalSupplierId = supplierId;
    if (paymentMethod === 'credito' && !finalSupplierId && newSupplierName) {
      const s = store.addSupplier({ name: newSupplierName });
      finalSupplierId = s.id;
    }

    store.createPurchaseSession({
      date,
      notes,
      transportCost: parseAmountInput(transportCost),
      foodCost: parseAmountInput(foodCost),
      otherCost: parseAmountInput(otherCost),
      items,
      paymentMethod,
      supplierId: paymentMethod === 'credito' ? finalSupplierId : (supplierId || null),
      dueDate: paymentMethod === 'credito' ? (dueDate || null) : null,
    });
    onSaved();
  }

  const canSave = items.length > 0 && (paymentMethod === 'vista' || supplierId || newSupplierName);

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md mx-auto bg-surface rounded-t-3xl p-5 pb-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-display text-xl">Dia de compra</h2>
          <button onClick={onClose} className="text-muted p-1"><X size={22} /></button>
        </div>

        <label className="block text-xs text-muted mb-1.5">Data</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="w-full bg-surface-light rounded-xl px-4 py-2.5 mb-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold" />

        <h3 className="text-xs font-medium text-muted mb-2">Produtos abastecidos</h3>
        {products.length === 0 ? (
          <p className="text-xs text-muted mb-4">Cria produtos primeiro no separador Stock.</p>
        ) : (
          <div className="bg-surface-light rounded-xl p-3.5 mb-4 space-y-2.5">
            <select
              value={productId}
              onChange={(e) => selectProduct(e.target.value)}
              className="w-full bg-surface rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="flex gap-2">
              <input inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Quantidade"
                className="w-1/2 bg-surface rounded-lg px-3 py-2 text-sm font-mono outline-none focus-visible:ring-2 focus-visible:ring-gold" />
              <input inputMode="decimal" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="Preço/unid. (Kz)"
                className="flex-1 bg-surface rounded-lg px-3 py-2 text-sm font-mono outline-none focus-visible:ring-2 focus-visible:ring-gold" />
            </div>
            {productId && store.lastPurchasePrice(productId) > 0 && (
              <p className="text-[11px] text-muted">Último preço pago: {formatKz(store.lastPurchasePrice(productId))}</p>
            )}
            <button onClick={addItem} className="w-full bg-surface text-gold text-sm py-2 rounded-lg flex items-center justify-center gap-1">
              <Plus size={15} /> Adicionar ao lote
            </button>
          </div>
        )}

        {items.length > 0 && (
          <div className="space-y-2 mb-5">
            {items.map((it, i) => (
              <div key={i} className="flex items-center justify-between bg-surface-light rounded-lg px-3.5 py-2.5">
                <div>
                  <p className="text-sm font-medium">{it.productName}</p>
                  <p className="text-xs text-muted">{it.quantity}x · {formatKz(it.purchasePrice)}/unid</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-mono tabular text-gold">{formatKz(it.quantity * it.purchasePrice)}</p>
                  <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="text-muted p-1">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <h3 className="text-xs font-medium text-muted mb-2">Pagamento dos produtos</h3>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setPaymentMethod('vista')}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: paymentMethod === 'vista' ? '#3e9b7c' : '#223059', color: paymentMethod === 'vista' ? '#101a33' : '#96a0c2' }}
          >
            À vista (sai do caixa)
          </button>
          <button
            onClick={() => setPaymentMethod('credito')}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: paymentMethod === 'credito' ? '#d4a24c' : '#223059', color: paymentMethod === 'credito' ? '#101a33' : '#96a0c2' }}
          >
            A crédito (fica a dever)
          </button>
        </div>

        {paymentMethod === 'credito' && (
          <div className="bg-surface-light rounded-xl p-3.5 mb-4 space-y-2.5">
            <label className="block text-xs text-muted">Fornecedor</label>
            {suppliers.length > 0 && (
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
                className="w-full bg-surface rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold">
                <option value="">Novo fornecedor...</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
            {!supplierId && (
              <input value={newSupplierName} onChange={(e) => setNewSupplierName(e.target.value)} placeholder="Nome do fornecedor"
                className="w-full bg-surface rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold" />
            )}
            <label className="block text-xs text-muted">Prazo de pagamento (opcional)</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-surface rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold" />
            {dueDate && <p className="text-[11px] text-gold">Um lembrete de pagamento é criado automaticamente.</p>}
          </div>
        )}

        <h3 className="text-xs font-medium text-muted mb-2">Despesas desta saída (sempre à vista, não entram no custo do produto)</h3>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <MiniInput label="Transporte" value={transportCost} onChange={setTransportCost} />
          <MiniInput label="Alimentação" value={foodCost} onChange={setFoodCost} />
          <MiniInput label="Outras" value={otherCost} onChange={setOtherCost} />
        </div>

        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Nota (opcional)"
          className="w-full bg-surface-light rounded-xl px-4 py-2.5 mb-5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold" />

        <div className="bg-surface-light rounded-xl p-4 mb-5 space-y-1.5">
          <Row label="Produtos" value={formatKz(itemsTotal)} />
          <Row label={paymentMethod === 'credito' ? 'Vira dívida ao fornecedor' : 'Despesas da saída'} value={formatKz(paymentMethod === 'credito' ? itemsTotal : extraTotal)} />
          {paymentMethod === 'credito' && <Row label="Despesas da saída (à vista)" value={formatKz(extraTotal)} />}
          <div className="h-px bg-line my-1" />
          <Row label="Sai do caixa agora" value={formatKz(paymentMethod === 'credito' ? extraTotal : itemsTotal + extraTotal)} bold />
        </div>

        <button onClick={handleSave} disabled={!canSave}
          className="w-full bg-gold text-night font-semibold py-3.5 rounded-xl text-sm disabled:opacity-40">
          Guardar compra
        </button>
      </div>
    </div>
  );
}

function MiniInput({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-[10px] text-muted mb-1">{label}</label>
      <input inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0"
        className="w-full bg-surface-light rounded-lg px-2 py-2 text-xs font-mono outline-none focus-visible:ring-2 focus-visible:ring-gold" />
    </div>
  );
}
function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between">
      <span className="text-xs text-muted">{label}</span>
      <span className={`text-sm font-mono tabular ${bold ? 'text-gold font-semibold' : ''}`}>{value}</span>
    </div>
  );
}
