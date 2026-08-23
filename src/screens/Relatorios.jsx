import { useMemo } from 'react';
import { store } from '../lib/store';
import { formatKz } from '../lib/currency';
import { useLiveVersion } from '../lib/useLiveVersion';

export default function Relatorios() {
  const version = useLiveVersion();

  const data = useMemo(() => {
    const sales = store.getSales();
    const products = store.getProducts();
    const categories = store.getCategories();
    const sessions = store.getPurchaseSessions();

    const byProduct = products.map((p) => {
      const pSales = sales.filter((s) => s.productId === p.id);
      const qty = pSales.reduce((s, x) => s + x.quantity, 0);
      const revenue = pSales.reduce((s, x) => s + x.total, 0);
      const profit = pSales.reduce((s, x) => s + (x.unitPrice - x.unitCost) * x.quantity, 0);
      return { ...p, qty, revenue, profit };
    }).filter((p) => p.qty > 0).sort((a, b) => b.profit - a.profit);

    const totalProfit = byProduct.reduce((s, p) => s + p.profit, 0);
    const totalRevenue = byProduct.reduce((s, p) => s + p.revenue, 0);

    const purchasesByCategory = {};
    for (const session of sessions) {
      const batches = store.getBatches().filter((b) => b.purchaseSessionId === session.id);
      for (const b of batches) {
        const product = products.find((p) => p.id === b.productId);
        const cat = categories.find((c) => c.id === product?.categoryId);
        const key = cat?.name || 'Outros';
        purchasesByCategory[key] = (purchasesByCategory[key] || 0) + b.purchasePrice * b.quantity;
      }
    }

    return { byProduct, totalProfit, totalRevenue, sessions, purchasesByCategory };
  }, [version]);

  return (
    <div className="px-5 pt-6 pb-28 max-w-md mx-auto">
      <h1 className="font-display text-3xl mb-6">Relatórios</h1>

      <div className="bg-surface rounded-2xl p-4 border border-line mb-6 flex gap-4">
        <div className="flex-1">
          <p className="text-[11px] text-muted mb-0.5">Receita total</p>
          <p className="font-mono tabular text-lg">{formatKz(data.totalRevenue)}</p>
        </div>
        <div className="w-px bg-line" />
        <div className="flex-1">
          <p className="text-[11px] text-income mb-0.5">Lucro real total</p>
          <p className="font-mono tabular text-lg text-income">{formatKz(data.totalProfit)}</p>
        </div>
      </div>

      <h2 className="text-sm font-medium text-muted mb-3">Lucro por produto</h2>
      {data.byProduct.length === 0 && <p className="text-xs text-muted mb-6">Ainda sem vendas registadas.</p>}
      <div className="space-y-2 mb-6">
        {data.byProduct.map((p) => (
          <div key={p.id} className="flex justify-between items-center bg-surface rounded-xl px-4 py-3 border border-line">
            <div>
              <p className="text-sm font-medium">{p.name}</p>
              <p className="text-xs text-muted">{p.qty} vendidos · {formatKz(p.revenue)}</p>
            </div>
            <p className="font-mono tabular text-sm text-income">+{formatKz(p.profit)}</p>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-medium text-muted mb-3">Compras por categoria</h2>
      {Object.keys(data.purchasesByCategory).length === 0 && <p className="text-xs text-muted mb-6">Ainda sem compras registadas.</p>}
      <div className="space-y-2 mb-6">
        {Object.entries(data.purchasesByCategory).map(([cat, total]) => (
          <div key={cat} className="flex justify-between items-center bg-surface rounded-xl px-4 py-3 border border-line">
            <p className="text-sm">{cat}</p>
            <p className="font-mono tabular text-sm text-gold">{formatKz(total)}</p>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-medium text-muted mb-3">Dias de compra</h2>
      {data.sessions.length === 0 && <p className="text-xs text-muted">Nenhum dia de compra registado.</p>}
      <div className="space-y-2">
        {data.sessions.map((s) => {
          const extra = s.transportCost + s.foodCost + s.otherCost;
          return (
            <div key={s.id} className="bg-surface rounded-xl px-4 py-3 border border-line">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium">{new Date(s.date).toLocaleDateString('pt-AO', { day: '2-digit', month: 'long' })}</p>
              </div>
              {s.notes && <p className="text-xs text-muted">{s.notes}</p>}
              {extra > 0 && <p className="text-[11px] text-muted">Despesas da saída: {formatKz(extra)}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
