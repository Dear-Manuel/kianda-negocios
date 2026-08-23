import { Wallet, Boxes, ShoppingCart, HandCoins, Menu } from 'lucide-react';

const TABS = [
  { id: 'caixa', label: 'Caixa', icon: Wallet },
  { id: 'stock', label: 'Stock', icon: Boxes },
  { id: 'vendas', label: 'Vendas', icon: ShoppingCart },
  { id: 'dividas', label: 'Dívidas', icon: HandCoins },
  { id: 'mais', label: 'Mais', icon: Menu },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur border-t border-line px-1 pb-[env(safe-area-inset-bottom)] z-40">
      <div className="max-w-md mx-auto flex justify-between">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 focus-visible:outline-2 focus-visible:outline-gold rounded-lg"
            >
              <Icon size={21} strokeWidth={isActive ? 2.4 : 1.8} color={isActive ? '#d4a24c' : '#96a0c2'} />
              <span className="text-[10.5px]" style={{ color: isActive ? '#d4a24c' : '#96a0c2', fontWeight: isActive ? 600 : 400 }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
