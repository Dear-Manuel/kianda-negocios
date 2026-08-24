import { useState } from 'react';
import { X } from 'lucide-react';
import { store, today } from '../lib/store';
import { parseAmountInput } from '../lib/currency';

// mode: 'cliente' | 'fornecedor'
export default function DebtSheet({ mode, onClose, onSaved }) {
  const people = mode === 'cliente' ? store.getCustomers() : store.getSuppliers();
  const [personId, setPersonId] = useState('');
  const [newName, setNewName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  function handleSave() {
    const value = parseAmountInput(amount);
    if (!value) return;

    let finalId = personId;
    if (!finalId && newName) {
      const created = mode === 'cliente' ? store.addCustomer({ name: newName }) : store.addSupplier({ name: newName });
      finalId = created.id;
    }
    if (!finalId) return;

    if (mode === 'cliente') {
      store.addCustomerDebt({ customerId: finalId, amount: value, description, dueDate: dueDate || null, date: today() });
    } else {
      store.addSupplierDebt({ supplierId: finalId, amount: value, description, dueDate: dueDate || null, date: today() });
    }
    onSaved();
  }

  const label = mode === 'cliente' ? 'Cliente' : 'Fornecedor';

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md mx-auto bg-surface rounded-t-3xl p-5 pb-8 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-display text-xl">{mode === 'cliente' ? 'Nova dívida de cliente' : 'Nova dívida a fornecedor'}</h2>
          <button onClick={onClose} className="text-muted p-1"><X size={22} /></button>
        </div>

        <label className="block text-xs text-muted mb-1.5">{label}</label>
        {people.length > 0 && (
          <select value={personId} onChange={(e) => setPersonId(e.target.value)}
            className="w-full bg-surface-light rounded-xl px-4 py-3 mb-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold">
            <option value="">Novo {label.toLowerCase()}...</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        {!personId && (
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={`Nome do ${label.toLowerCase()}`} autoFocus
            className="w-full bg-surface-light rounded-xl px-4 py-3 mb-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold" />
        )}

        <label className="block text-xs text-muted mb-1.5">Valor (Kz)</label>
        <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00"
          className="w-full bg-surface-light rounded-xl px-4 py-3 mb-4 text-2xl font-mono tabular outline-none focus-visible:ring-2 focus-visible:ring-gold" />

        <label className="block text-xs text-muted mb-1.5">Descrição (opcional)</label>
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Compra de material"
          className="w-full bg-surface-light rounded-xl px-4 py-3 mb-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold" />

        <label className="block text-xs text-muted mb-1.5">Prazo (opcional)</label>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
          className="w-full bg-surface-light rounded-xl px-4 py-3 mb-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold" />
        {dueDate && <p className="text-xs text-gold mb-4">Um lembrete é criado automaticamente para essa data.</p>}
        {!dueDate && <div className="mb-6" />}

        <button onClick={handleSave} disabled={!amount || (!personId && !newName)}
          className="w-full bg-gold text-night font-semibold py-3.5 rounded-xl text-sm disabled:opacity-40">
          Guardar
        </button>
      </div>
    </div>
  );
}
