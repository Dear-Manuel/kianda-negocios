// Cliente Supabase — pronto a usar quando ligares a sincronização entre
// dispositivos. Enquanto as variáveis abaixo não estiverem definidas no
// .env, a app funciona 100% offline com o localStorage (ver lib/store.js).
//
// Para ativar:
// 1. Cria um projeto grátis em https://supabase.com
// 2. Corre o SQL em supabase/schema.sql no editor SQL do teu projeto
// 3. Copia .env.example para .env e preenche as duas variáveis
// 4. Reinicia `npm run dev`

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export const isSyncEnabled = () => Boolean(supabase);
