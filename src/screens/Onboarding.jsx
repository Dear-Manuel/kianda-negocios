import { useEffect, useState } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { store } from '../lib/store';
import { formatKz, parseAmountInput } from '../lib/currency';

const STEPS = ['negocio', 'caixa', 'resumo'];
const DRAFT_KEY = 'kianda:onboarding_draft';

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function saveDraft(data) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota errors */
  }
}
function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

// Angola: números de telemóvel têm sempre 9 dígitos (ex: 923 456 789).
function digitsOnly(v) {
  return v.replace(/\D/g, '').slice(0, 9);
}
function formatPhoneDisplay(v) {
  const d = digitsOnly(v);
  return d.replace(/(\d{3})(\d{0,3})(\d{0,3})/, (_, a, b, c) => [a, b, c].filter(Boolean).join(' '));
}

const draft = loadDraft();

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(draft?.step ?? 0);

  const [ownerName, setOwnerName] = useState(draft?.ownerName ?? '');
  const [businessName, setBusinessName] = useState(draft?.businessName ?? '');
  const [sector, setSector] = useState(draft?.sector ?? '');
  const [phone, setPhone] = useState(draft?.phone ?? '');

  const [initialCash, setInitialCash] = useState(draft?.initialCash ?? '');

  useEffect(() => {
    saveDraft({ step, ownerName, businessName, sector, phone, initialCash });
  }, [step, ownerName, businessName, sector, phone, initialCash]);

  const cashValue = parseAmountInput(initialCash);
  const phoneDigits = digitsOnly(phone);
  const phoneValid = phoneDigits.length === 0 || phoneDigits.length === 9;

  function finish() {
    store.createBusiness({
      ownerName,
      businessName,
      sector,
      phone: phoneDigits ? formatPhoneDisplay(phoneDigits) : '',
      initialCash: cashValue,
    });
    clearDraft();
    onDone();
  }

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="min-h-screen bg-night px-5 pt-10 pb-10 flex flex-col max-w-md mx-auto">
      <div className="flex gap-1.5 mb-8">
        {STEPS.map((_, i) => (
          <div key={i} className="h-1 flex-1 rounded-full" style={{ background: i <= step ? '#d4a24c' : '#2c3a63' }} />
        ))}
      </div>

      {step === 0 && (
        <div className="flex-1">
          <h1 className="font-display text-3xl mb-1">O teu negócio</h1>
          <p className="text-sm text-muted mb-6">Vamos começar pelo básico.</p>

          <Field label="O teu nome" value={ownerName} onChange={setOwnerName} placeholder="Ex: Manuel dos Santos" />
          <Field label="Nome do negócio" value={businessName} onChange={setBusinessName} placeholder="Ex: Loja Kianda" />
          <Field label="Setor principal" value={sector} onChange={setSector} placeholder="Ex: Eletrónicos, Vestuário, Misto..." />

          <label className="block text-xs text-muted mb-1.5">Contacto (opcional)</label>
          <input
            value={formatPhoneDisplay(phone)}
            onChange={(e) => setPhone(digitsOnly(e.target.value))}
            placeholder="9XX XXX XXX"
            inputMode="numeric"
            className="w-full bg-surface-light rounded-xl px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold"
            style={{ boxShadow: !phoneValid ? '0 0 0 2px #e8664f' : undefined }}
          />
          {!phoneValid && (
            <p className="text-xs text-expense mt-1.5">O número de telefone em Angola tem 9 dígitos.</p>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="flex-1">
          <h1 className="font-display text-3xl mb-1">Capital próprio</h1>
          <p className="text-sm text-muted mb-6">Quanto dinheiro tens disponível para começar a operar?</p>
          <label className="block text-xs text-muted mb-1.5">Valor em Kz</label>
          <input
            inputMode="decimal"
            value={initialCash}
            onChange={(e) => setInitialCash(e.target.value)}
            placeholder="0,00"
            autoFocus
            className="w-full bg-surface-light rounded-xl px-4 py-3.5 text-3xl font-mono tabular outline-none focus-visible:ring-2 focus-visible:ring-gold"
          />
          <p className="text-xs text-muted mt-2">Se ainda não tens nada em caixa, deixa em branco. O teu stock inicial regista-se depois, no separador Stock.</p>
        </div>
      )}

      {step === 2 && (
        <div className="flex-1">
          <h1 className="font-display text-3xl mb-1">Está tudo certo?</h1>
          <p className="text-sm text-muted mb-6">Este é o ponto de partida do teu negócio.</p>

          <div className="bg-surface rounded-2xl p-5 border border-line space-y-3 mb-4">
            <Row label="Negócio" value={businessName || '—'} />
            <Row label="Responsável" value={ownerName || '—'} />
            <div className="h-px bg-line my-1" />
            <Row label="Capital próprio" value={formatKz(cashValue)} mono bold color="#d4a24c" />
          </div>
          <p className="text-xs text-muted">
            Assim que registares produtos e stock, o património total do negócio (caixa + stock + a receber − a pagar) passa a aparecer no separador Caixa, comparado com este valor de partida.
          </p>
        </div>
      )}

      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <button onClick={back} className="px-4 py-3.5 rounded-xl bg-surface-light text-muted flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            onClick={next}
            disabled={step === 0 && (!ownerName || !businessName || !phoneValid)}
            className="flex-1 bg-gold text-night font-semibold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-40"
          >
            Continuar <ArrowRight size={16} />
          </button>
        ) : (
          <button onClick={finish} className="flex-1 bg-gold text-night font-semibold py-3.5 rounded-xl text-sm">
            Começar a usar
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div className="mb-4">
      <label className="block text-xs text-muted mb-1.5">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface-light rounded-xl px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold"
      />
    </div>
  );
}

function Row({ label, value, mono, bold, color }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted">{label}</span>
      <span className={`text-sm ${mono ? 'font-mono tabular' : ''} ${bold ? 'font-semibold text-base' : ''}`} style={{ color: color || '#f3eee3' }}>
        {value}
      </span>
    </div>
  );
}
