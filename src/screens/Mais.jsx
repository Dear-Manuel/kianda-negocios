import { ChartBar, BellRing, UserCircle, Store, ChevronRight } from 'lucide-react';
import { store } from '../lib/store';

export default function Mais({ onNavigate }) {
  const business = store.getBusiness();

  const items = [
    { id: 'relatorios', label: 'Relatórios', desc: 'Lucro por produto, compras, dias de abastecimento', icon: ChartBar },
    { id: 'lembretes', label: 'Lembretes', desc: 'Vencimentos e alertas importantes', icon: BellRing },
    { id: 'conta', label: 'Conta e sincronização', desc: 'Login e sincronização entre dispositivos', icon: UserCircle },
  ];

  return (
    <div className="px-5 pt-6 pb-28 max-w-md mx-auto">
      <h1 className="font-display text-3xl mb-6">Mais</h1>

      <div className="bg-surface rounded-2xl p-4 border border-line mb-6 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-surface-light flex items-center justify-center">
          <Store size={20} color="#d4a24c" />
        </div>
        <div>
          <p className="text-sm font-medium">{business?.businessName}</p>
          <p className="text-xs text-muted">{business?.ownerName} · {business?.sector}</p>
        </div>
      </div>

      <div className="space-y-2">
        {items.map(({ id, label, desc, icon: Icon }) => (
          <button key={id} onClick={() => onNavigate(id)} className="w-full flex items-center gap-3 bg-surface rounded-xl px-4 py-3.5 border border-line text-left">
            <Icon size={19} color="#96a0c2" className="shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted truncate">{desc}</p>
            </div>
            <ChevronRight size={16} className="text-muted shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
