import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { store } from '../lib/store';
import { formatKz } from '../lib/currency';
import { useLiveVersion } from '../lib/useLiveVersion';
import SaleSheet from '../components/SaleSheet';

export default function Vendas() {
  useLiveVersion();
  const [showSale, setShowSale] = useState(false);
  const products = store.getProducts();

  const sales = store.getSales();
  const monthKey = new Date().toISOString().slice(0, 7);
  const monthSales = sales.filter((s) => s.date.startsWith(monthKey));
  const monthProfit = monthSales.reduce((s, sale) => s + (sale.unitPrice - sale.unitCost) * sale.quantity, 0);
  const monthTotal = monthSales.reduce((s, sale) => s + sale.total, 0);

  function handleDelete(id) {
    store.deleteSale(id);
  }

  return (
    <div className="px-5 pt-6 pb-28 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-5">
        <h1 className="font-display text-3xl">Vendas</h1>
        <button onClick={() => setShowSale(true)} className="text-xs font-medium bg-gold text-night px-3.5 py-2 rounded-full flex items-center gap-1">
          <Plus size={14} /> Nova
        </button>
      </div>

      <div className="bg-surface rounded-2xl p-4 border border-line mb-6 flex gap-4">
        <div className="flex-1">
          <p className="text-[11px] text-muted mb-0.5">Vendido este mês</p>
          <p className="font-mono tabular text-lg">{formatKz(monthTotal)}</p>
        </div>
        <div className="w-px bg-line" />
        <div className="flex-1">
          <p className="text-[11px] text-income mb-0.5">Lucro real</p>
          <p className="font-mono tabular text-lg text-income">{formatKz(monthProfit)}</p>
        </div>
      </div>

      {products.length === 0 && (
        <p className="text-sm text-muted py-8 text-center">Adiciona produtos no separador Stock antes de vender.</p>
      )}

      {sales.length === 0 && products.length > 0 && (
        <p className="text-sm text-muted py-8 text-center">Ainda não registaste nenhuma venda.</p>
      )}

      <div className="space-y-2">
        {sales.map((s) => {
          const product = products.find((p) => p.id === s.productId);
          const profit = (s.unitPrice - s.unitCost) * s.quantity;
          return (
            <div key={s.id} className="flex items-center justify-between bg-surface rounded-xl px-4 py-3 border border-line">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{product?.name || 'Produto removido'}</p>
                <p className="text-xs text-muted">
                  {s.quantity}x · {new Date(s.date).toLocaleDateString('pt-AO')}
                  {s.isOnCredit && <span className="text-gold"> · fiado</span>}
                </p>
              </div>
              <div className="text-right shrink-0 flex items-center gap-2">
                <div>
                  <p className="text-sm font-mono tabular">{formatKz(s.total)}</p>
                  <p className="text-[11px] font-mono text-income">+{formatKz(profit)}</p>
                </div>
                <button onClick={() => handleDelete(s.id)} className="text-muted p-1">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showSale && <SaleSheet onClose={() => setShowSale(false)} onSaved={() => setShowSale(false)} />}
    </div>
  );
}
