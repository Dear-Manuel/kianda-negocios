# Kianda Negócios

App (PWA) de controlo financeiro para micro empreendedores em Kwanza: caixa, stock por categorias com lotes (FIFO), vendas com margem em tempo real, dívidas de clientes e a fornecedores, e lembretes.

Funciona offline (guarda tudo no telemóvel) e sincroniza entre dispositivos via Supabase quando ativares a conta.

## Correr localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

## Como a app está organizada

**Onboarding** — ao abrir pela primeira vez, pede os dados do negócio e o capital inicial:
- Capital em caixa (dinheiro disponível para começar)
- Stock inicial (produtos já existentes, por categoria, com preço de compra e venda)
- A soma dos dois fica gravada como "capital social inicial" — a referência para medir crescimento

**Caixa** — saldo disponível, património total do negócio (caixa + stock + a receber − a pagar), e crescimento desde o início. Todos os movimentos manuais (despesas operacionais, retiradas para uso pessoal, etc.) entram aqui.

**Stock** — categorias → produtos → lotes de compra. Cada vez que abasteces, cria-se um novo lote com o seu próprio preço (mesmo produto pode ter lotes a preços diferentes). As vendas consomem por ordem FIFO (primeiro que entra, primeiro que sai), para o lucro refletir o custo real de cada unidade.

**Compras ("dia de compra")** — dentro de Stock, regista uma sessão de abastecimento com vários produtos de uma vez, mais as despesas dessa saída (transporte, alimentação, outras). As despesas ficam só no fluxo de caixa — não entram no custo dos produtos, porque nem toda despesa de caixa está ligada a um produto específico (ex: entrega, uso pessoal por um funcionário).

**Vendas** — procura o produto já cadastrado, escolhe quantidade, o preço vem sugerido mas é editável, dá baixa automática no lote certo (FIFO) e mostra o lucro real da venda. Pode ser à vista (entra no caixa) ou fiado (vira dívida do cliente).

**Dívidas** — dois separadores: a receber (clientes/fiado) e a pagar (fornecedores). Cada dívida pode ter pagamentos parciais registados, que atualizam automaticamente o caixa.

**Relatórios** — lucro real por produto, gasto por categoria/dia de compra, histórico de sessões de abastecimento.

**Mais** — relatórios, lembretes e conta/sincronização.

## Subir para o teu GitHub

```bash
cd kwanza-finance
git init
git add .
git commit -m "Kianda Negócios — versão inicial"
git branch -M main
git remote add origin https://github.com/TEU_UTILIZADOR/kianda-negocios.git
git push -u origin main
```

(Cria o repositório vazio primeiro em github.com/new — sem README, sem .gitignore, para não haver conflito.)

## Publicar no Netlify

1. Em app.netlify.com → **Add new site → Import an existing project**
2. Escolhe o repositório
3. **Build command:** `npm run build` · **Publish directory:** `dist`
4. Deploy. A partir daqui, cada `git push` atualiza o site sozinho.

## Ativar sincronização entre dispositivos (Supabase, grátis)

1. Cria um projeto grátis em supabase.com
2. No editor SQL do projeto, corre o conteúdo de `supabase/schema.sql`
3. Em Authentication → Providers, ativa **Email**
4. Copia `.env.example` para `.env` e preenche `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (encontras em Project Settings → API)
5. No Netlify, adiciona as mesmas duas variáveis em **Site settings → Environment variables**
6. Reimplanta o site
7. Dentro da app, vai a **Mais → Conta e sincronização**, cria uma conta e usa a mesma conta em todos os dispositivos. Toca "Sincronizar agora" sempre que quiseres forçar uma atualização (também sincroniza sozinho ~4 segundos depois de qualquer alteração).

## Instalar como app no telemóvel

Depois de publicado no Netlify, abre o link no telemóvel:
- **Android (Chrome):** menu → "Instalar aplicação"
- **iPhone (Safari):** botão de partilha → "Adicionar ao ecrã principal" — necessário para os lembretes funcionarem corretamente

## Estrutura

```
src/
  screens/       Onboarding, Caixa, Stock, Vendas, Dividas, Relatorios, Lembretes, Conta, Mais
  components/    Sheets de formulário (produto, compra, venda, dívida, pagamento), navegação
  lib/
    store.js            Camada de dados local — toda a lógica de negócio (FIFO, caixa, dívidas)
    supabaseClient.js   Cliente Supabase
    auth.jsx            Contexto de autenticação (login/registo)
    sync.js             Push/pull entre localStorage e Supabase
    currency.js         Formatação em Kwanza (Kz)
supabase/
  schema.sql     Todas as tabelas + segurança por utilizador
```

## Nota sobre a lógica de lotes (FIFO)

Quando reabasteces um produto que já existe a um preço diferente, a app não substitui o preço antigo — cria um novo lote. Ao vender, consome primeiro o lote mais antigo. Isto significa que, num dado momento, vender a mesma unidade pode ter um custo real diferente consoante de que lote saiu — e é exatamente isso que torna o cálculo de lucro fiável, em vez de uma média que esconde a variação real dos preços de compra.
