import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { store } from '../lib/store';
import { formatKz } from '../lib/currency';
import { useLiveVersion } from '../lib/useLiveVersion';
import CashEntrySheet from '../components/CashEntrySheet';
import SyncBadge from '../components/SyncBadge';

const LABELS = {
  venda: 'Venda',
  recebimento_cliente: 'Recebimento de cliente',
  compra_stock: 'Compra de stock',
  despesa_operacional: 'Despesa operacional',
  retirada: 'Retirada',
  pagamento_fornecedor: 'Pagamento a fornecedor',
  capital_inicial: 'Capital inicial',
  outra_entrada: 'Outra entrada',
  outra_saida: 'Outra saída',
};

export default function Caixa({ onOpenAccount }) {
  const version = useLiveVersion();
  const [showEntry, setShowEntry] = useState(false);

  const business = store.getBusiness();
  const balance = store.cashBalance();
  const netWorth = store.netWorth();
  const growth = store.growthSinceStart();
  const initialCapital = store.initialCapital();

  const txs = useMemo(() => store.getCashTransactions(), [version]);

  return (
    <div className="px-5 pt-6 pb-28 max-w-md mx-auto">
      <p className="text-muted text-sm mb-1">{business?.businessName}</p>
      <div className="flex items-center justify-between mb-3 gap-2">
        <h1 className="font-display text-3xl">Caixa</h1>
      </div>
      <div className="mb-6">
        <SyncBadge onOpenAccount={onOpenAccount} />
      </div>

      <div className="bg-surface rounded-2xl p-5 mb-4 border border-line">
        <p className="text-xs text-muted mb-1">Saldo disponível em caixa</p>
        <p className="font-mono tabular text-3xl font-medium mb-4">{formatKz(balance)}</p>
      </div>

      <div className="bg-surface rounded-2xl p-5 mb-6 border border-line">
        <p className="text-xs text-muted mb-1">Património do negócio</p>
        <p className="font-mono tabular text-2xl font-medium mb-3">{formatKz(netWorth)}</p>
        <p className="text-[11px] text-muted mb-2">= caixa + stock + a receber − a pagar</p>
        <div className="h-px bg-line my-2" />
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted">Desde o início ({business?.startDate && new Date(business.startDate).toLocaleDateString('pt-AO')})</span>
          <span className="font-mono tabular text-sm font-semibold" style={{ color: growth >= 0 ? '#3e9b7c' : '#e8664f' }}>
            {growth >= 0 ? '+' : ''}{formatKz(growth)}
          </span>
        </div>
        <p className="text-[11px] text-muted mt-1">Capital social inicial: {formatKz(initialCapital)}</p>
      </div>

      <button onClick={() => setShowEntry(true)} className="w-full bg-surface-light border border-line text-cream text-sm font-medium py-2.5 rounded-xl mb-5 flex items-center justify-center gap-1.5">
        <Plus size={15} /> Registar movimento
      </button>

      <h2 className="text-sm font-medium text-muted mb-3">Histórico</h2>
      <div className="space-y-2">
        {txs.length === 0 && <p className="text-sm text-muted py-8 text-center">Sem movimentos ainda.</p>}
        {txs.map((t) => (
          <div key={t.id} className="flex items-center justify-between bg-surface rounded-xl px-4 py-3 border border-line">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{t.description || LABELS[t.category] || t.category}</p>
              <p className="text-xs text-muted">{LABELS[t.category] || t.category} · {new Date(t.date).toLocaleDateString('pt-AO')}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <p className="font-mono tabular text-sm font-medium" style={{ color: t.type === 'entrada' ? '#3e9b7c' : '#e8664f' }}>
                {t.type === 'entrada' ? '+' : '-'}{formatKz(t.amount)}
              </p>
              {!t.relatedId && (
                <button onClick={() => store.deleteCashTransaction(t.id)} className="text-muted p-1">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showEntry && <CashEntrySheet onClose={() => setShowEntry(false)} onSaved={() => setShowEntry(false)} />}
    </div>
  );
}
