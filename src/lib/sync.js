// Sincronização entre dispositivos. Ativa-se automaticamente quando o
// utilizador tem sessão iniciada (ver lib/auth.jsx) e as variáveis
// VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY estão definidas.
//
// Estratégia simples e previsível: "Sincronizar agora" envia tudo o que
// está localmente para a nuvem (upsert) e depois traz tudo o que está na
// nuvem para o dispositivo (substitui local). Corre também automaticamente
// pouco depois de qualquer alteração local, e ao iniciar sessão.

import { supabase, isSyncEnabled } from './supabaseClient';

let lastSyncedAt = null;
export function getLastSyncedAt() {
  return lastSyncedAt;
}

const LOCAL_KEYS = {
  business: 'kianda:business',
  categories: 'kianda:categories',
  products: 'kianda:products',
  batches: 'kianda:batches',
  purchaseSessions: 'kianda:purchaseSessions',
  sales: 'kianda:sales',
  saleConsumptions: 'kianda:saleConsumptions',
  cashTransactions: 'kianda:cashTransactions',
  customers: 'kianda:customers',
  customerDebts: 'kianda:customerDebts',
  suppliers: 'kianda:suppliers',
  supplierDebts: 'kianda:supplierDebts',
  reminders: 'kianda:reminders',
};

function readLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const camelToSnake = (obj) => {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase())] = v;
  }
  return out;
};
const snakeToCamel = (obj) => {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = v;
  }
  return out;
};

// tabelas simples: mapeamento direto camelCase <-> snake_case
const SIMPLE_TABLES = [
  { local: 'categories', table: 'categories' },
  { local: 'products', table: 'products' },
  { local: 'batches', table: 'batches' },
  { local: 'purchaseSessions', table: 'purchase_sessions' },
  { local: 'sales', table: 'sales' },
  { local: 'saleConsumptions', table: 'sale_batch_consumptions' },
  { local: 'cashTransactions', table: 'cash_transactions' },
  { local: 'customers', table: 'customers' },
  { local: 'customerDebts', table: 'customer_debts' },
  { local: 'suppliers', table: 'suppliers' },
  { local: 'supplierDebts', table: 'supplier_debts' },
  { local: 'reminders', table: 'reminders' },
];

export async function pushToCloud() {
  if (!isSyncEnabled()) return { ok: false, reason: 'disabled' };
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) return { ok: false, reason: 'no_session' };

  const business = readLocal(LOCAL_KEYS.business, null);
  if (business) {
    await supabase.from('businesses').upsert({
      user_id: userId,
      owner_name: business.ownerName,
      business_name: business.businessName,
      sector: business.sector,
      phone: business.phone,
      start_date: business.startDate,
      initial_cash: business.initialCash,
    }, { onConflict: 'user_id' });
  }

  for (const { local, table } of SIMPLE_TABLES) {
    const rows = readLocal(LOCAL_KEYS[local], []);
    if (rows.length === 0) continue;
    const payload = rows.map((r) => ({ ...camelToSnake(r), user_id: userId }));
    const { error } = await supabase.from(table).upsert(payload, { onConflict: 'id' });
    if (error) console.error(`Erro ao sincronizar ${table}:`, error.message);
  }

  lastSyncedAt = new Date().toISOString();
  window.dispatchEvent(new CustomEvent('kianda:synced'));
  return { ok: true };
}

export async function pullFromCloud() {
  if (!isSyncEnabled()) return { ok: false, reason: 'disabled' };
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) return { ok: false, reason: 'no_session' };

  const { data: business } = await supabase.from('businesses').select('*').eq('user_id', userId).maybeSingle();
  if (business) {
    writeLocal(LOCAL_KEYS.business, {
      id: business.id,
      ownerName: business.owner_name,
      businessName: business.business_name,
      sector: business.sector,
      phone: business.phone,
      startDate: business.start_date,
      initialCash: business.initial_cash,
      createdAt: business.created_at,
    });
  }

  for (const { local, table } of SIMPLE_TABLES) {
    const { data, error } = await supabase.from(table).select('*').eq('user_id', userId);
    if (error) {
      console.error(`Erro ao trazer ${table}:`, error.message);
      continue;
    }
    if (data) {
      const rows = data.map((r) => {
        const { userId: _userId, ...rest } = snakeToCamel(r);
        return rest;
      });
      writeLocal(LOCAL_KEYS[local], rows);
    }
  }

  window.dispatchEvent(new CustomEvent('kianda:changed'));
  lastSyncedAt = new Date().toISOString();
  window.dispatchEvent(new CustomEvent('kianda:synced'));
  return { ok: true };
}

let debounceTimer = null;
export function scheduleSync() {
  if (!isSyncEnabled()) return;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    pushToCloud().catch((e) => console.error('Sync automático falhou:', e));
  }, 4000);
}

// Confirmação visual: compara quantos registos existem localmente vs. na
// nuvem, para o utilizador poder verificar com os próprios olhos que os
// dados estão mesmo a ser guardados na base de dados.
export async function getSyncComparison() {
  if (!isSyncEnabled()) return null;
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) return null;

  const rows = [];
  for (const { local, table } of SIMPLE_TABLES) {
    const localCount = readLocal(LOCAL_KEYS[local], []).length;
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true }).eq('user_id', userId);
    rows.push({ table, local: localCount, cloud: error ? null : count ?? 0 });
  }
  return rows;
}
