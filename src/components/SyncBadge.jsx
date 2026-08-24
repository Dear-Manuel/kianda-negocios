import { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { getLastSyncedAt, pushToCloud } from '../lib/sync';

function timeAgo(iso) {
  if (!iso) return null;
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 10) return 'agora mesmo';
  if (diff < 60) return `há ${diff}s`;
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`;
  return `há ${Math.floor(diff / 3600)}h`;
}

export default function SyncBadge({ onOpenAccount }) {
  const { session, syncEnabled } = useAuth();
  const [, setTick] = useState(0);
  const [syncing, setSyncing] = useState(false);

  // força re-render a cada 20s para o "há Xmin" ficar atualizado
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 20000);
    const onSynced = () => setTick((t) => t + 1);
    window.addEventListener('kianda:synced', onSynced);
    return () => { clearInterval(id); window.removeEventListener('kianda:synced', onSynced); };
  }, []);

  if (!syncEnabled) return null;

  if (!session) {
    return (
      <button
        onClick={onOpenAccount}
        className="flex items-center gap-1.5 text-[11px] text-muted bg-surface-light px-2.5 py-1.5 rounded-full border border-line"
      >
        <CloudOff size={12} />
        Dados só neste aparelho · Ligar conta
      </button>
    );
  }

  async function handleTap() {
    setSyncing(true);
    await pushToCloud();
    setSyncing(false);
  }

  const last = getLastSyncedAt();

  return (
    <button
      onClick={handleTap}
      className="flex items-center gap-1.5 text-[11px] text-income bg-income/10 px-2.5 py-1.5 rounded-full border border-income/30"
    >
      {syncing ? <RefreshCw size={12} className="animate-spin" /> : <Cloud size={12} />}
      {syncing ? 'A sincronizar...' : last ? `Sincronizado ${timeAgo(last)}` : `Ligado como ${session.user.email}`}
    </button>
  );
}
