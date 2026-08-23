import { useState } from 'react';
import { X } from 'lucide-react';
import { store, today } from '../lib/store';
import { parseAmountInput } from '../lib/currency';

const OUT_CATEGORIES = [
  { id: 'despesa_operacional', label: 'Despesa operacional' },
  { id: 'retirada', label: 'Retirada (uso pessoal)' },
  { id: 'pagamento_fornecedor', label: 'Pagamento a fornecedor' },
  { id: 'outra_saida', label: 'Outra saída' },
];
const IN_CATEGORIES = [
  { id: 'venda', label: 'Venda' },
  { id: 'recebimento_cliente', label: 'Recebimento de cliente' },
  { id: 'outra_entrada', label: 'Outra entrada' },
];

export default function CashEntrySheet({ onClose, onSaved }) {
  const [type, setType] = useState('saida');
  const [category, setCategory] = useState('despesa_operacional');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(today());

  const categories = type === 'saida' ? OUT_CATEGORIES : IN_CATEGORIES;

  function handleSave() {
    const value = parseAmountInput(amount);
    if (!value) return;
    store.addCashTransaction({ type, category, amount: value, description, date });
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md mx-auto bg-surface rounded-t-3xl p-5 pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-display text-xl">Movimento de caixa</h2>
          <button onClick={onClose} className="text-muted p-1"><X size={22} /></button>
        </div>

        <div className="flex gap-2 mb-5">
          {['saida', 'entrada'].map((t) => (
            <button
              key={t}
              onClick={() => { setType(t); setCategory(t === 'saida' ? 'despesa_operacional' : 'venda'); }}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: type === t ? (t === 'entrada' ? '#3e9b7c' : '#e8664f') : '#223059', color: type === t ? '#101a33' : '#96a0c2' }}
            >
              {t === 'entrada' ? 'Entrada' : 'Saída'}
            </button>
          ))}
        </div>

        <label className="block text-xs text-muted mb-1.5">Tipo</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className="px-3 py-1.5 rounded-full text-xs border"
              style={{ borderColor: category === c.id ? '#d4a24c' : '#2c3a63', background: category === c.id ? '#d4a24c22' : 'transparent', color: category === c.id ? '#d4a24c' : '#96a0c2' }}
            >
              {c.label}
            </button>
          ))}
        </div>

        <label className="block text-xs text-muted mb-1.5">Valor (Kz)</label>
        <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" autoFocus
          className="w-full bg-surface-light rounded-xl px-4 py-3 mb-4 text-2xl font-mono tabular outline-none focus-visible:ring-2 focus-visible:ring-gold" />

        <label className="block text-xs text-muted mb-1.5">Descrição (opcional)</label>
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Táxi para entrega"
          className="w-full bg-surface-light rounded-xl px-4 py-3 mb-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold" />

        <label className="block text-xs text-muted mb-1.5">Data</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="w-full bg-surface-light rounded-xl px-4 py-3 mb-6 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold" />

        <button onClick={handleSave} disabled={!amount} className="w-full bg-gold text-night font-semibold py-3.5 rounded-xl text-sm disabled:opacity-40">
          Guardar
        </button>
      </div>
    </div>
  );
}
