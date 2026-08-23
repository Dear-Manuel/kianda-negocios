import { useMemo, useState } from 'react';
import { Plus, Phone, Check } from 'lucide-react';
import { store } from '../lib/store';
import { formatKz } from '../lib/currency';
import { useLiveVersion } from '../lib/useLiveVersion';
import DebtSheet from '../components/DebtSheet';
import PaymentSheet from '../components/PaymentSheet';

export default function Dividas() {
  useLiveVersion();
  const [mode, setMode] = useState('cliente');
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [payingDebt, setPayingDebt] = useState(null);

  const people = mode === 'cliente' ? store.getCustomers() : store.getSuppliers();
  const total = mode === 'cliente' ? store.totalReceivable() : store.totalPayable();

  const rows = useMemo(() => {
    return people
      .map((p) => {
        const debts = mode === 'cliente' ? store.getCustomerDebts(p.id) : store.getSupplierDebts(p.id);
        const openDebts = debts.filter((d) => d.amount - d.amountPaid > 0);
        const balance = openDebts.reduce((s, d) => s + (d.amount - d.amountPaid), 0);
        return { ...p, debts: openDebts, balance };
      })
      .filter((p) => p.balance > 0)
      .sort((a, b) => b.balance - a.balance);
  }, [people, mode]);

  return (
    <div className="px-5 pt-6 pb-28 max-w-md mx-auto">
      <h1 className="font-display text-3xl mb-5">Dívidas</h1>

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setMode('cliente')}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: mode === 'cliente' ? '#3e9b7c' : '#182545', color: mode === 'cliente' ? '#101a33' : '#96a0c2', border: '1px solid #2c3a63' }}
        >
          A receber (clientes)
        </button>
        <button
          onClick={() => setMode('fornecedor')}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: mode === 'fornecedor' ? '#e8664f' : '#182545', color: mode === 'fornecedor' ? '#101a33' : '#96a0c2', border: '1px solid #2c3a63' }}
        >
          A pagar (fornecedores)
        </button>
      </div>

      <div className="bg-surface rounded-2xl p-4 border border-line mb-5 flex justify-between items-center">
        <span className="text-sm text-muted">Total {mode === 'cliente' ? 'a receber' : 'a pagar'}</span>
        <span className="font-mono tabular text-xl font-semibold" style={{ color: mode === 'cliente' ? '#3e9b7c' : '#e8664f' }}>
          {formatKz(total)}
        </span>
      </div>

      <button onClick={() => setShowDebtForm(true)} className="w-full bg-surface-light border border-line text-cream text-sm font-medium py-2.5 rounded-xl mb-5 flex items-center justify-center gap-1.5">
        <Plus size={15} /> Nova dívida
      </button>

      {rows.length === 0 && (
        <p className="text-sm text-muted py-10 text-center">
          {mode === 'cliente' ? 'Nenhum cliente com dívida pendente.' : 'Nenhuma dívida pendente a fornecedores.'}
        </p>
      )}

      <div className="space-y-3">
        {rows.map((p) => (
          <div key={p.id} className="bg-surface rounded-xl p-4 border border-line">
            <div className="flex justify-between items-start mb-2.5">
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                {p.phone && <p className="text-xs text-muted flex items-center gap-1"><Phone size={10} />{p.phone}</p>}
              </div>
              <p className="font-mono tabular text-sm font-semibold" style={{ color: mode === 'cliente' ? '#3e9b7c' : '#e8664f' }}>
                {formatKz(p.balance)}
              </p>
            </div>
            <div className="space-y-1.5">
              {p.debts.map((d) => (
                <div key={d.id} className="flex justify-between items-center bg-surface-light rounded-lg px-3 py-2">
                  <div>
                    <p className="text-xs">{d.description || 'Dívida'}</p>
                    <p className="text-[10px] text-muted">
                      {new Date(d.date).toLocaleDateString('pt-AO')}
                      {d.dueDate && ` · prazo ${new Date(d.dueDate).toLocaleDateString('pt-AO')}`}
                    </p>
                  </div>
                  <button
                    onClick={() => setPayingDebt(d)}
                    className="text-[11px] bg-gold text-night px-2.5 py-1 rounded-full flex items-center gap-1 font-medium"
                  >
                    <Check size={11} /> {formatKz(d.amount - d.amountPaid)}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showDebtForm && (
        <DebtSheet mode={mode} onClose={() => setShowDebtForm(false)} onSaved={() => setShowDebtForm(false)} />
      )}
      {payingDebt && (
        <PaymentSheet
          mode={mode}
          debt={payingDebt}
          personName={people.find((p) => p.id === payingDebt.customerId || p.id === payingDebt.supplierId)?.name}
          onClose={() => setPayingDebt(null)}
          onSaved={() => setPayingDebt(null)}
        />
      )}
    </div>
  );
}
