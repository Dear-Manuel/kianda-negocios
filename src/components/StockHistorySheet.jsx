import { X, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { store } from '../lib/store';
import { formatKz } from '../lib/currency';

const TYPE_LABELS = {
  compra: 'Compra',
  stock_inicial: 'Stock inicial',
  ajuste_entrada: 'Ajuste (entrada)',
  ajuste_saida: 'Ajuste (saída)',
  venda: 'Venda',
  estorno_venda: 'Venda anulada',
};
const IS_ENTRY = { compra: true, stock_inicial: true, ajuste_entrada: true, venda: false, ajuste_saida: false, estorno_venda: true };

export default function StockHistorySheet({ product, onClose }) {
  const movements = store.getStockMovements(product.id);
  const batches = store.getBatches(product.id)
    .filter((b) => b.quantityRemaining > 0)
    .sort((a, b) => new Date(a.purchaseDate) - new Date(b.purchaseDate));

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md mx-auto bg-surface rounded-t-3xl p-5 pb-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-1">
          <h2 className="font-display text-xl">{product.name}</h2>
          <button onClick={onClose} className="text-muted p-1"><X size={22} /></button>
        </div>
        <p className="text-sm text-muted mb-5">{store.stockOf(product.id)} {product.unit}(s) em stock · {formatKz(product.salePrice)} / {product.unit}</p>

        {batches.length > 0 && (
          <>
            <h3 className="text-xs font-medium text-muted mb-2">Lotes ativos (FIFO — o mais antigo sai primeiro)</h3>
            <div className="space-y-1.5 mb-5">
              {batches.map((b) => (
                <div key={b.id} className="flex justify-between items-center bg-surface-light rounded-lg px-3.5 py-2.5">
                  <div>
                    <p className="text-xs">{new Date(b.purchaseDate).toLocaleDateString('pt-AO')}</p>
                    <p className="text-[10px] text-muted">{formatKz(b.purchasePrice)} / unid</p>
                  </div>
                  <p className="text-sm font-mono tabular text-gold">{b.quantityRemaining} {product.unit}(s)</p>
                </div>
              ))}
            </div>
          </>
        )}

        <h3 className="text-xs font-medium text-muted mb-2">Histórico de movimentos</h3>
        {movements.length === 0 && <p className="text-sm text-muted py-6 text-center">Nenhum movimento registado ainda.</p>}
        <div className="space-y-1.5">
          {movements.map((m) => {
            const isEntry = IS_ENTRY[m.type];
            return (
              <div key={m.id} className="flex items-center gap-3 bg-surface-light rounded-lg px-3.5 py-2.5">
                {isEntry
                  ? <ArrowDownCircle size={16} color="#3e9b7c" className="shrink-0" />
                  : <ArrowUpCircle size={16} color="#e8664f" className="shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{TYPE_LABELS[m.type] || m.type}</p>
                  {m.note && <p className="text-[10px] text-muted truncate">{m.note}</p>}
                  <p className="text-[10px] text-muted">{new Date(m.date).toLocaleDateString('pt-AO')}</p>
                </div>
                <p className="text-sm font-mono tabular shrink-0" style={{ color: isEntry ? '#3e9b7c' : '#e8664f' }}>
                  {isEntry ? '+' : '-'}{m.quantity}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
