import { useState } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './lib/auth';
import { store } from './lib/store';
import { useLiveVersion } from './lib/useLiveVersion';
import BottomNav from './components/BottomNav';
import Onboarding from './screens/Onboarding';
import Caixa from './screens/Caixa';
import Stock from './screens/Stock';
import Vendas from './screens/Vendas';
import Dividas from './screens/Dividas';
import Mais from './screens/Mais';
import Relatorios from './screens/Relatorios';
import Lembretes from './screens/Lembretes';
import Conta from './screens/Conta';

function AppShell() {
  useLiveVersion();
  const [tab, setTab] = useState('caixa');
  const [subScreen, setSubScreen] = useState(null); // 'relatorios' | 'lembretes' | 'conta'
  const [onboarded, setOnboarded] = useState(store.isOnboarded());

  if (!onboarded) {
    return <Onboarding onDone={() => setOnboarded(true)} />;
  }

  function changeTab(id) {
    setSubScreen(null);
    setTab(id);
  }

  let content;
  if (tab === 'mais' && subScreen) {
    content = subScreen === 'relatorios' ? <Relatorios />
      : subScreen === 'lembretes' ? <Lembretes />
      : <Conta />;
  } else if (tab === 'caixa') content = <Caixa onOpenAccount={() => { setTab('mais'); setSubScreen('conta'); }} />;
  else if (tab === 'stock') content = <Stock />;
  else if (tab === 'vendas') content = <Vendas />;
  else if (tab === 'dividas') content = <Dividas />;
  else content = <Mais onNavigate={setSubScreen} />;

  return (
    <div className="min-h-screen bg-night font-body">
      {tab === 'mais' && subScreen && (
        <button
          onClick={() => setSubScreen(null)}
          className="fixed top-4 left-4 z-30 bg-surface border border-line rounded-full px-3 py-1.5 text-xs text-muted"
        >
          ← Voltar
        </button>
      )}
      {content}
      <BottomNav active={tab} onChange={changeTab} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ErrorBoundary>
  );
}
