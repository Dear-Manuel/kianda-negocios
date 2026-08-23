import { useState } from 'react';
import { X } from 'lucide-react';
import { store } from '../lib/store';
import { formatKz, parseAmountInput } from '../lib/currency';

// mode: 'cliente' | 'fornecedor'
export default function PaymentSheet({ mode, debt, personName, onClose, onSaved }) {
  const remaining = debt.amount - debt.amountPaid;
  const [amount, setAmount] = useState(String(remaining));

  function handleSave() {
    const value = Math.min(parseAmountInput(amount), remaining);
    if (!value) return;
    if (mode === 'cliente') store.registerCustomerPayment(debt.id, value);
    else store.registerSupplierPayment(debt.id, value);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md mx-auto bg-surface rounded-t-3xl p-5 pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-display text-xl">Registar {mode === 'cliente' ? 'recebimento' : 'pagamento'}</h2>
          <button onClick={onClose} className="text-muted p-1"><X size={22} /></button>
        </div>

        <p className="text-sm text-muted mb-1">{personName}</p>
        <p className="text-xs text-muted mb-5">Em dívida: <span className="font-mono text-cream">{formatKz(remaining)}</span></p>

        <label className="block text-xs text-muted mb-1.5">Valor a {mode === 'cliente' ? 'receber' : 'pagar'} agora (Kz)</label>
        <input
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
          className="w-full bg-surface-light rounded-xl px-4 py-3 mb-6 text-2xl font-mono tabular outline-none focus-visible:ring-2 focus-visible:ring-gold"
        />

        <button
          onClick={handleSave}
          disabled={!amount || parseAmountInput(amount) <= 0}
          className="w-full bg-gold text-night font-semibold py-3.5 rounded-xl text-sm disabled:opacity-40"
        >
          Confirmar
        </button>
      </div>
    </div>
  );
}
