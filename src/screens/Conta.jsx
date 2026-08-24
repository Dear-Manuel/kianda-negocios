import { useState } from 'react';
import { CloudCheck, CloudOff, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { pushToCloud, pullFromCloud, getSyncComparison, getLastSyncedAt } from '../lib/sync';

const TABLE_LABELS = {
  categories: 'Categorias',
  products: 'Produtos',
  batches: 'Lotes de stock',
  purchaseSessions: 'Dias de compra',
  sales: 'Vendas',
  cashTransactions: 'Movimentos de caixa',
  customers: 'Clientes',
  customerDebts: 'Dívidas de clientes',
  suppliers: 'Fornecedores',
  supplierDebts: 'Dívidas a fornecedores',
  reminders: 'Lembretes',
};

export default function Conta() {
  const { session, signUp, signIn, signOut, syncEnabled } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [comparison, setComparison] = useState(null);
  const [checking, setChecking] = useState(false);

  if (!syncEnabled) {
    return (
      <div className="px-5 pt-6 pb-28 max-w-md mx-auto">
        <h1 className="font-display text-2xl mb-3">Conta e sincronização</h1>
        <div className="bg-surface rounded-xl p-4 border border-line flex gap-3">
          <CloudOff size={18} className="text-muted shrink-0 mt-0.5" />
          <p className="text-sm text-muted">
            A sincronização entre dispositivos ainda não está configurada. Segue as instruções no README (secção Supabase) para a ativar — é gratuita.
          </p>
        </div>
      </div>
    );
  }

  async function handleSubmit() {
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      await pushToCloud();
      await pullFromCloud();
    } catch (e) {
      setError(e.message || 'Algo correu mal.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSyncNow() {
    setBusy(true);
    setStatus('A sincronizar...');
    setComparison(null);
    await pushToCloud();
    await pullFromCloud();
    setStatus('Sincronizado agora mesmo.');
    setBusy(false);
  }

  async function handleCheck() {
    setChecking(true);
    const rows = await getSyncComparison();
    setComparison(rows);
    setChecking(false);
  }

  async function handleLogout() {
    if (!confirm('Terminar sessão? Os dados continuam guardados neste aparelho, mas deixam de sincronizar até voltares a entrar.')) return;
    await signOut();
  }

  if (session) {
    const last = getLastSyncedAt();
    return (
      <div className="px-5 pt-6 pb-28 max-w-md mx-auto">
        <h1 className="font-display text-2xl mb-5">Conta e sincronização</h1>
        <div className="bg-surface rounded-xl p-4 border border-line mb-4">
          <div className="flex items-center gap-2 mb-1">
            <CloudCheck size={16} className="text-income" />
            <p className="text-sm font-medium text-income">Sessão ativa</p>
          </div>
          <p className="text-xs text-muted">{session.user.email}</p>
          {last && <p className="text-[11px] text-muted mt-1">Última sincronização: {new Date(last).toLocaleTimeString('pt-AO')}</p>}
        </div>

        <button onClick={handleSyncNow} disabled={busy} className="w-full bg-gold text-night font-semibold py-3 rounded-xl text-sm mb-3 disabled:opacity-40">
          Sincronizar agora
        </button>
        {status && <p className="text-xs text-muted text-center mb-3">{status}</p>}

        <button onClick={handleCheck} disabled={checking} className="w-full bg-surface-light border border-line text-cream text-sm py-3 rounded-xl mb-3 flex items-center justify-center gap-2 disabled:opacity-40">
          <ShieldCheck size={15} /> {checking ? 'A verificar...' : 'Confirmar dados na base de dados'}
        </button>

        {comparison && (
          <div className="bg-surface rounded-xl p-4 border border-line mb-4">
            <p className="text-xs text-muted mb-3">Neste aparelho vs. guardado na nuvem:</p>
            <div className="space-y-1.5">
              {comparison.filter((r) => r.local > 0 || r.cloud > 0).map((r) => (
                <div key={r.table} className="flex justify-between items-center text-xs">
                  <span className="text-muted">{TABLE_LABELS[r.table] || r.table}</span>
                  <span className="font-mono tabular" style={{ color: r.local === r.cloud ? '#3e9b7c' : '#e8664f' }}>
                    {r.local} / {r.cloud === null ? '?' : r.cloud}
                  </span>
                </div>
              ))}
              {comparison.every((r) => r.local === 0 && r.cloud === 0) && (
                <p className="text-xs text-muted">Ainda não há dados registados.</p>
              )}
            </div>
            <p className="text-[10px] text-muted mt-3">Os dois números devem ser iguais (aparelho / nuvem). Se diferirem, toca "Sincronizar agora" e verifica de novo.</p>
          </div>
        )}

        <button onClick={handleLogout} className="w-full bg-surface-light border border-line text-cream text-sm py-3 rounded-xl flex items-center justify-center gap-2">
          <LogOut size={15} /> Terminar sessão
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-28 max-w-md mx-auto">
      <h1 className="font-display text-2xl mb-2">Conta e sincronização</h1>
      <p className="text-sm text-muted mb-6">
        Cria uma conta para usar o negócio em vários dispositivos, com os dados sempre atualizados.
      </p>

      <div className="flex gap-2 mb-5">
        {['login', 'registo'].map((m) => (
          <button key={m} onClick={() => setMode(m)} className="flex-1 py-2.5 rounded-xl text-sm font-medium capitalize"
            style={{ background: mode === m ? '#d4a24c' : '#223059', color: mode === m ? '#101a33' : '#96a0c2' }}>
            {m === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        ))}
      </div>

      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
        className="w-full bg-surface-light rounded-xl px-4 py-3 mb-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Palavra-passe"
        className="w-full bg-surface-light rounded-xl px-4 py-3 mb-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold" />

      {error && <p className="text-xs text-expense mb-3">{error}</p>}

      <button onClick={handleSubmit} disabled={busy || !email || !password} className="w-full bg-gold text-night font-semibold py-3.5 rounded-xl text-sm disabled:opacity-40">
        {mode === 'login' ? 'Entrar' : 'Criar conta'}
      </button>

      {mode === 'login' && (
        <p className="text-[11px] text-muted mt-4 text-center">
          Se já usaste esta conta noutro aparelho, os teus dados aparecem automaticamente depois de entrares.
        </p>
      )}
    </div>
  );
}
