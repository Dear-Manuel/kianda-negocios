import { useMemo, useState } from 'react';
import { Plus, Check, Trash2, BellRing, HandCoins } from 'lucide-react';
import { store } from '../lib/store';
import { useLiveVersion } from '../lib/useLiveVersion';

const LINK_LABELS = {
  divida_cliente: 'Dívida de cliente',
  divida_fornecedor: 'Dívida a fornecedor',
};

export default function Lembretes() {
  const version = useLiveVersion();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [datetime, setDatetime] = useState('');
  const [repeat, setRepeat] = useState('nenhuma');

  const reminders = useMemo(() => store.getReminders(), [version]);

  function handleSave() {
    if (!title || !datetime) return;
    store.addReminder({ title, datetime, repeat });
    setTitle('');
    setDatetime('');
    setRepeat('nenhuma');
    setShowForm(false);
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  return (
    <div className="px-5 pt-6 pb-28 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-3xl">Lembretes</h1>
        <button onClick={() => setShowForm((v) => !v)} className="text-xs font-medium bg-gold text-night px-3.5 py-2 rounded-full flex items-center gap-1">
          <Plus size={14} /> Novo
        </button>
      </div>

      <p className="text-xs text-muted mb-4">Vencimentos de dívidas, dias de abastecer stock, ou qualquer coisa importante. Lembretes ligados a dívidas são criados automaticamente.</p>

      {showForm && (
        <div className="bg-surface rounded-xl p-4 border border-line mb-5 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Cobrar dívida do João"
            className="w-full bg-surface-light rounded-lg px-3.5 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold" />
          <input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)}
            className="w-full bg-surface-light rounded-lg px-3.5 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold" />
          <div className="flex gap-2">
            {['nenhuma', 'semanal', 'mensal'].map((r) => (
              <button key={r} onClick={() => setRepeat(r)} className="flex-1 py-2 rounded-lg text-xs capitalize"
                style={{ background: repeat === r ? '#d4a24c' : '#223059', color: repeat === r ? '#101a33' : '#96a0c2' }}>
                {r}
              </button>
            ))}
          </div>
          <button onClick={handleSave} className="w-full bg-gold text-night font-semibold py-2.5 rounded-lg text-sm">Criar lembrete</button>
        </div>
      )}

      {reminders.length === 0 && !showForm && <p className="text-sm text-muted py-12 text-center">Nenhum lembrete criado ainda.</p>}

      <div className="space-y-2">
        {reminders.map((r) => (
          <div key={r.id} className="flex items-center gap-3 bg-surface rounded-xl px-4 py-3 border border-line">
            <button onClick={() => store.toggleReminder(r.id)} className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0"
              style={{ borderColor: r.done ? '#3e9b7c' : '#2c3a63', background: r.done ? '#3e9b7c' : 'transparent' }}>
              {r.done && <Check size={14} color="#101a33" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${r.done ? 'line-through text-muted' : ''}`}>{r.title}</p>
              <p className="text-xs text-muted flex items-center gap-1">
                <BellRing size={11} />
                {new Date(r.datetime).toLocaleString('pt-AO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                {r.repeat !== 'nenhuma' && ` · ${r.repeat}`}
              </p>
              {r.relatedType && (
                <p className="text-[10px] text-gold flex items-center gap-1 mt-0.5">
                  <HandCoins size={10} /> {LINK_LABELS[r.relatedType] || r.relatedType}
                </p>
              )}
            </div>
            <button onClick={() => store.deleteReminder(r.id)} className="text-muted p-1"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
