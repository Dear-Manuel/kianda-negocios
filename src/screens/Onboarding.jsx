import { useEffect, useState } from 'react';
import { Plus, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { store } from '../lib/store';
import { formatKz, parseAmountInput } from '../lib/currency';

const STEPS = ['negocio', 'caixa', 'stock', 'resumo'];
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

  const [categories, setCategories] = useState(draft?.categories ?? [{ id: 'geral', name: 'Geral', color: '#d4a24c' }]);
  const [stockItems, setStockItems] = useState(draft?.stockItems ?? []);
  const [itemForm, setItemForm] = useState({ categoryId: categories[0]?.id ?? 'geral', name: '', quantity: '', purchasePrice: '', salePrice: '' });
  const [newCategory, setNewCategory] = useState('');
  const [catError, setCatError] = useState('');

  // Guarda o progresso a cada alteração, para não se perder se a página for
  // recarregada a meio do cadastro.
  useEffect(() => {
    saveDraft({ step, ownerName, businessName, sector, phone, initialCash, categories, stockItems });
  }, [step, ownerName, businessName, sector, phone, initialCash, categories, stockItems]);

  const stockTotal = stockItems.reduce((s, i) => s + i.purchasePrice * i.quantity, 0);
  const cashValue = parseAmountInput(initialCash);
  const phoneDigits = digitsOnly(phone);
  const phoneValid = phoneDigits.length === 0 || phoneDigits.length === 9;

  function addCategory() {
    if (!newCategory.trim()) return;
    const dup = categories.find((c) => c.name.trim().toLowerCase() === newCategory.trim().toLowerCase());
    if (dup) {
      setCatError(`A categoria "${dup.name}" já existe.`);
      setItemForm((f) => ({ ...f, categoryId: dup.id }));
      return;
    }
    const palette = ['#e8664f', '#d4a24c', '#3e9b7c', '#8b7bd8', '#4a90c2', '#c26fa8'];
    const cat = { id: newCategory.toLowerCase().replace(/\s+/g, '_') + Date.now(), name: newCategory, color: palette[categories.length % palette.length] };
    setCategories([...categories, cat]);
    setItemForm((f) => ({ ...f, categoryId: cat.id }));
    setNewCategory('');
    setCatError('');
  }

  function addStockItem() {
    if (!itemForm.name || !itemForm.quantity || !itemForm.purchasePrice) return;
    const quantity = Number(itemForm.quantity);
    const purchasePrice = parseAmountInput(itemForm.purchasePrice);
    const salePrice = parseAmountInput(itemForm.salePrice) || purchasePrice;

    // Se já existe uma linha para o mesmo produto na mesma categoria, soma a
    // quantidade em vez de criar uma entrada duplicada.
    const existingIdx = stockItems.findIndex(
      (it) => it.categoryId === itemForm.categoryId && it.name.trim().toLowerCase() === itemForm.name.trim().toLowerCase()
    );
    if (existingIdx >= 0) {
      const updated = [...stockItems];
      updated[existingIdx] = {
        ...updated[existingIdx],
        quantity: updated[existingIdx].quantity + quantity,
        purchasePrice, // usa o preço mais recente
        salePrice,
      };
      setStockItems(updated);
    } else {
      setStockItems([...stockItems, { ...itemForm, quantity, purchasePrice, salePrice }]);
    }
    setItemForm({ categoryId: itemForm.categoryId, name: '', quantity: '', purchasePrice: '', salePrice: '' });
  }

  function finish() {
    // Mapeia o id local de cada categoria para o id realmente gravado —
    // se a categoria já existir (ex: veio de outro dispositivo via
    // sincronização), addCategory devolve a existente com outro id, e os
    // produtos têm de apontar para esse id real, não para o local.
    const categoryIdMap = {};
    for (const c of categories) {
      const saved = store.addCategory(c);
      categoryIdMap[c.id] = saved.id;
    }
    const remappedStockItems = stockItems.map((item) => ({
      ...item,
      categoryId: categoryIdMap[item.categoryId] ?? item.categoryId,
    }));

    store.createBusiness({
      ownerName,
      businessName,
      sector,
      phone: phoneDigits ? formatPhoneDisplay(phoneDigits) : '',
      initialCash: cashValue,
      initialStockItems: remappedStockItems,
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
          <h1 className="font-display text-3xl mb-1">Capital em caixa</h1>
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
          <p className="text-xs text-muted mt-2">Se ainda não tens nada em caixa, deixa em branco.</p>
        </div>
      )}

      {step === 2 && (
        <div className="flex-1 overflow-y-auto">
          <h1 className="font-display text-3xl mb-1">Stock inicial</h1>
          <p className="text-sm text-muted mb-5">Já tens produtos para começar? Regista-os aqui (podes saltar e adicionar depois).</p>

          <div className="mb-4">
            <div className="flex gap-2">
              <input
                value={newCategory}
                onChange={(e) => { setNewCategory(e.target.value); setCatError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                placeholder="Nova categoria (ex: Eletrónicos)"
                className="flex-1 bg-surface-light rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold"
              />
              <button onClick={addCategory} className="bg-surface-light px-3 rounded-lg text-gold text-sm">+</button>
            </div>
            {catError && <p className="text-xs text-expense mt-1.5">{catError}</p>}
          </div>

          <div className="flex gap-2 overflow-x-auto mb-4 -mx-1 px-1">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setItemForm((f) => ({ ...f, categoryId: c.id }))}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs border"
                style={{
                  borderColor: itemForm.categoryId === c.id ? c.color : '#2c3a63',
                  background: itemForm.categoryId === c.id ? `${c.color}22` : 'transparent',
                  color: itemForm.categoryId === c.id ? c.color : '#96a0c2',
                }}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="bg-surface rounded-xl p-4 border border-line mb-4 space-y-2.5">
            <input
              value={itemForm.name}
              onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nome do produto (ex: MacBook Air)"
              className="w-full bg-surface-light rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold"
            />
            <div className="flex gap-2">
              <input
                inputMode="numeric"
                value={itemForm.quantity}
                onChange={(e) => setItemForm((f) => ({ ...f, quantity: e.target.value }))}
                placeholder="Quantidade"
                className="w-1/3 bg-surface-light rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold"
              />
              <input
                inputMode="decimal"
                value={itemForm.purchasePrice}
                onChange={(e) => setItemForm((f) => ({ ...f, purchasePrice: e.target.value }))}
                placeholder="Preço compra"
                className="flex-1 bg-surface-light rounded-lg px-3 py-2 text-sm font-mono outline-none focus-visible:ring-2 focus-visible:ring-gold"
              />
              <input
                inputMode="decimal"
                value={itemForm.salePrice}
                onChange={(e) => setItemForm((f) => ({ ...f, salePrice: e.target.value }))}
                placeholder="Preço venda"
                className="flex-1 bg-surface-light rounded-lg px-3 py-2 text-sm font-mono outline-none focus-visible:ring-2 focus-visible:ring-gold"
              />
            </div>
            <button onClick={addStockItem} className="w-full bg-surface-light text-gold text-sm py-2 rounded-lg flex items-center justify-center gap-1">
              <Plus size={15} /> Adicionar item
            </button>
          </div>

          {stockItems.length > 0 && (
            <div className="space-y-2 mb-4">
              {stockItems.map((it, i) => (
                <div key={i} className="flex items-center justify-between bg-surface rounded-lg px-3.5 py-2.5 border border-line">
                  <div>
                    <p className="text-sm font-medium">{it.name}</p>
                    <p className="text-xs text-muted">{it.quantity}x · {formatKz(it.purchasePrice)}/unid</p>
                  </div>
                  <button onClick={() => setStockItems(stockItems.filter((_, idx) => idx !== i))} className="text-muted p-1">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <p className="text-xs text-muted text-right">Total em stock: <span className="text-gold font-mono">{formatKz(stockTotal)}</span></p>
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="flex-1">
          <h1 className="font-display text-3xl mb-1">Está tudo certo?</h1>
          <p className="text-sm text-muted mb-6">Este é o ponto de partida do teu negócio.</p>

          <div className="bg-surface rounded-2xl p-5 border border-line space-y-3 mb-4">
            <Row label="Negócio" value={businessName || '—'} />
            <Row label="Responsável" value={ownerName || '—'} />
            <Row label="Caixa inicial" value={formatKz(cashValue)} mono />
            <Row label="Stock inicial" value={formatKz(stockTotal)} mono />
            <div className="h-px bg-line my-1" />
            <Row label="Capital social" value={formatKz(cashValue + stockTotal)} mono bold color="#d4a24c" />
          </div>
          <p className="text-xs text-muted">Este valor fica gravado como referência — a app vai mostrar, com o tempo, se o teu negócio está a crescer a partir daqui.</p>
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
            disabled={(step === 0 && (!ownerName || !businessName || !phoneValid))}
            className="flex-1 bg-gold text-night font-semibold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {step === 2 && stockItems.length === 0 ? 'Saltar' : 'Continuar'} <ArrowRight size={16} />
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
