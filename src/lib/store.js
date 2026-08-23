// Camada de dados local (offline-first). Espelha as tabelas do Supabase
// (ver supabase/schema.sql) para que a sincronização (lib/sync.js) seja
// uma simples cópia de/para a nuvem, sem remodelar nada.

import { scheduleSync } from './sync';

const KEYS = {
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

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent('kianda:changed'));
  scheduleSync();
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

export const store = {
  // ================= NEGÓCIO =================
  getBusiness() {
    return read(KEYS.business, null);
  },
  isOnboarded() {
    return Boolean(read(KEYS.business, null));
  },

  // onboarding: cria o negócio + capital inicial (caixa + stock opcional)
  createBusiness({ ownerName, businessName, sector, phone, initialCash, initialStockItems }) {
    const business = {
      id: uid(),
      ownerName,
      businessName,
      sector,
      phone,
      startDate: today(),
      initialCash: Number(initialCash) || 0,
      createdAt: new Date().toISOString(),
    };
    write(KEYS.business, business);

    if (business.initialCash > 0) {
      this.addCashTransaction({
        type: 'entrada',
        category: 'capital_inicial',
        amount: business.initialCash,
        description: 'Capital inicial em caixa',
        date: today(),
      });
    }

    // Regista itens de stock inicial (cada um vira um produto + lote "stock_inicial")
    for (const item of initialStockItems || []) {
      const product = this.addProduct({
        categoryId: item.categoryId,
        name: item.name,
        unit: item.unit || 'unidade',
        salePrice: item.salePrice,
      });
      this.addBatch({
        productId: product.id,
        purchasePrice: item.purchasePrice,
        quantity: item.quantity,
        purchaseDate: today(),
        source: 'stock_inicial',
      });
    }

    return business;
  },

  initialStockValue() {
    const batches = read(KEYS.batches, []).filter((b) => b.source === 'stock_inicial');
    return batches.reduce((s, b) => s + b.purchasePrice * b.quantity, 0);
  },

  // ================= CATEGORIAS =================
  getCategories() {
    return read(KEYS.categories, []);
  },
  addCategory({ name, color }) {
    const list = read(KEYS.categories, []);
    const record = { id: uid(), name, color: color || randomColor() };
    list.push(record);
    write(KEYS.categories, list);
    return record;
  },
  deleteCategory(id) {
    write(KEYS.categories, read(KEYS.categories, []).filter((c) => c.id !== id));
  },

  // ================= PRODUTOS =================
  getProducts() {
    return read(KEYS.products, []);
  },
  addProduct({ categoryId, name, unit, salePrice, lowStockThreshold }) {
    const list = read(KEYS.products, []);
    const record = {
      id: uid(),
      categoryId,
      name,
      unit: unit || 'unidade',
      salePrice: Number(salePrice) || 0,
      lowStockThreshold: lowStockThreshold ?? 3,
      createdAt: new Date().toISOString(),
    };
    list.push(record);
    write(KEYS.products, list);
    return record;
  },
  updateProduct(id, patch) {
    const list = read(KEYS.products, []);
    const idx = list.findIndex((p) => p.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...patch };
      write(KEYS.products, list);
    }
  },
  deleteProduct(id) {
    write(KEYS.products, read(KEYS.products, []).filter((p) => p.id !== id));
    write(KEYS.batches, read(KEYS.batches, []).filter((b) => b.productId !== id));
  },

  // ================= LOTES (stock, FIFO) =================
  getBatches(productId) {
    const all = read(KEYS.batches, []);
    return productId ? all.filter((b) => b.productId === productId) : all;
  },
  addBatch({ productId, purchasePrice, quantity, purchaseDate, source, purchaseSessionId, supplierId }) {
    const list = read(KEYS.batches, []);
    const record = {
      id: uid(),
      productId,
      purchasePrice: Number(purchasePrice) || 0,
      quantity: Number(quantity) || 0,
      quantityRemaining: Number(quantity) || 0,
      purchaseDate: purchaseDate || today(),
      source: source || 'compra',
      purchaseSessionId: purchaseSessionId || null,
      supplierId: supplierId || null,
    };
    list.push(record);
    write(KEYS.batches, list);
    return record;
  },
  stockOf(productId) {
    return this.getBatches(productId).reduce((s, b) => s + b.quantityRemaining, 0);
  },
  stockValueOf(productId) {
    return this.getBatches(productId).reduce((s, b) => s + b.quantityRemaining * b.purchasePrice, 0);
  },
  totalStockValue() {
    return read(KEYS.batches, []).reduce((s, b) => s + b.quantityRemaining * b.purchasePrice, 0);
  },
  // preço de compra "atual" = do lote mais recente (para sugerir ao reabastecer)
  lastPurchasePrice(productId) {
    const batches = this.getBatches(productId).sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
    return batches[0]?.purchasePrice ?? 0;
  },

  // ================= COMPRAS (sessão "dia de compra") =================
  getPurchaseSessions() {
    return read(KEYS.purchaseSessions, []).sort((a, b) => new Date(b.date) - new Date(a.date));
  },
  // items: [{ productId (ou newProduct: {categoryId,name,unit,salePrice}), purchasePrice, quantity }]
  createPurchaseSession({ date, notes, transportCost, foodCost, otherCost, items }) {
    const session = {
      id: uid(),
      date: date || today(),
      notes: notes || '',
      transportCost: Number(transportCost) || 0,
      foodCost: Number(foodCost) || 0,
      otherCost: Number(otherCost) || 0,
      createdAt: new Date().toISOString(),
    };
    const list = read(KEYS.purchaseSessions, []);
    list.push(session);
    write(KEYS.purchaseSessions, list);

    let productsTotal = 0;
    for (const item of items) {
      let productId = item.productId;
      if (!productId && item.newProduct) {
        const p = this.addProduct(item.newProduct);
        productId = p.id;
      }
      this.addBatch({
        productId,
        purchasePrice: item.purchasePrice,
        quantity: item.quantity,
        purchaseDate: session.date,
        source: 'compra',
        purchaseSessionId: session.id,
      });
      productsTotal += item.purchasePrice * item.quantity;
    }

    if (productsTotal > 0) {
      this.addCashTransaction({
        type: 'saida',
        category: 'compra_stock',
        amount: productsTotal,
        description: `Compra de stock (${items.length} item${items.length > 1 ? 's' : ''})`,
        date: session.date,
        relatedId: session.id,
      });
    }
    const extra = session.transportCost + session.foodCost + session.otherCost;
    if (extra > 0) {
      this.addCashTransaction({
        type: 'saida',
        category: 'despesa_operacional',
        amount: extra,
        description: 'Despesas da saída de compras (transporte/alimentação/outras)',
        date: session.date,
        relatedId: session.id,
      });
    }

    return session;
  },

  // ================= VENDAS (baixa FIFO) =================
  getSales() {
    return read(KEYS.sales, []).sort((a, b) => new Date(b.date) - new Date(a.date));
  },
  // Consome lotes por ordem FIFO e devolve o custo médio ponderado real
  consumeFifo(productId, quantity) {
    const batches = read(KEYS.batches, [])
      .filter((b) => b.productId === productId && b.quantityRemaining > 0)
      .sort((a, b) => new Date(a.purchaseDate) - new Date(b.purchaseDate));

    let remaining = quantity;
    let totalCost = 0;
    const consumptions = [];
    const allBatches = read(KEYS.batches, []);

    for (const batch of batches) {
      if (remaining <= 0) break;
      const take = Math.min(batch.quantityRemaining, remaining);
      totalCost += take * batch.purchasePrice;
      consumptions.push({ batchId: batch.id, quantity: take, unitCost: batch.purchasePrice });
      const idx = allBatches.findIndex((b) => b.id === batch.id);
      allBatches[idx].quantityRemaining -= take;
      remaining -= take;
    }
    write(KEYS.batches, allBatches);
    const consumed = quantity - remaining;
    return { unitCost: consumed > 0 ? totalCost / consumed : 0, consumptions, shortfall: remaining };
  },
  createSale({ productId, quantity, unitPrice, customerId, isOnCredit, date }) {
    const qty = Number(quantity);
    const { unitCost, consumptions } = this.consumeFifo(productId, qty);
    const total = qty * Number(unitPrice);

    const sale = {
      id: uid(),
      productId,
      quantity: qty,
      unitPrice: Number(unitPrice),
      unitCost,
      total,
      customerId: customerId || null,
      isOnCredit: Boolean(isOnCredit),
      date: date || today(),
      createdAt: new Date().toISOString(),
    };
    const list = read(KEYS.sales, []);
    list.push(sale);
    write(KEYS.sales, list);

    const consList = read(KEYS.saleConsumptions, []);
    for (const c of consumptions) {
      consList.push({ id: uid(), saleId: sale.id, ...c });
    }
    write(KEYS.saleConsumptions, consList);

    if (isOnCredit && customerId) {
      this.addCustomerDebt({
        customerId,
        amount: total,
        description: `Venda fiado (${qty}x)`,
        date: sale.date,
        saleId: sale.id,
      });
    } else {
      this.addCashTransaction({
        type: 'entrada',
        category: 'venda',
        amount: total,
        description: `Venda (${qty}x)`,
        date: sale.date,
        relatedId: sale.id,
      });
    }

    return sale;
  },
  deleteSale(id) {
    // devolve as quantidades aos lotes
    const consumptions = read(KEYS.saleConsumptions, []).filter((c) => c.saleId === id);
    const batches = read(KEYS.batches, []);
    for (const c of consumptions) {
      const idx = batches.findIndex((b) => b.id === c.batchId);
      if (idx >= 0) batches[idx].quantityRemaining += c.quantity;
    }
    write(KEYS.batches, batches);
    write(KEYS.saleConsumptions, read(KEYS.saleConsumptions, []).filter((c) => c.saleId !== id));
    write(KEYS.sales, read(KEYS.sales, []).filter((s) => s.id !== id));
    write(KEYS.cashTransactions, read(KEYS.cashTransactions, []).filter((t) => t.relatedId !== id));
  },

  // ================= CAIXA =================
  getCashTransactions() {
    return read(KEYS.cashTransactions, []).sort((a, b) => new Date(b.date) - new Date(a.date));
  },
  addCashTransaction({ type, category, amount, description, date, relatedId }) {
    const list = read(KEYS.cashTransactions, []);
    const record = {
      id: uid(),
      type,
      category,
      amount: Number(amount) || 0,
      description: description || '',
      date: date || today(),
      relatedId: relatedId || null,
      createdAt: new Date().toISOString(),
    };
    list.push(record);
    write(KEYS.cashTransactions, list);
    return record;
  },
  deleteCashTransaction(id) {
    write(KEYS.cashTransactions, read(KEYS.cashTransactions, []).filter((t) => t.id !== id));
  },
  cashBalance() {
    const txs = read(KEYS.cashTransactions, []);
    return txs.reduce((s, t) => s + (t.type === 'entrada' ? t.amount : -t.amount), 0);
  },

  // ================= CLIENTES (a receber) =================
  getCustomers() {
    return read(KEYS.customers, []);
  },
  addCustomer({ name, phone }) {
    const list = read(KEYS.customers, []);
    const record = { id: uid(), name, phone: phone || '' };
    list.push(record);
    write(KEYS.customers, list);
    return record;
  },
  getCustomerDebts(customerId) {
    const all = read(KEYS.customerDebts, []);
    return customerId ? all.filter((d) => d.customerId === customerId) : all;
  },
  addCustomerDebt({ customerId, amount, description, dueDate, date, saleId }) {
    const list = read(KEYS.customerDebts, []);
    const record = {
      id: uid(),
      customerId,
      amount: Number(amount) || 0,
      amountPaid: 0,
      description: description || '',
      dueDate: dueDate || null,
      date: date || today(),
      saleId: saleId || null,
    };
    list.push(record);
    write(KEYS.customerDebts, list);
    return record;
  },
  registerCustomerPayment(debtId, amount) {
    const list = read(KEYS.customerDebts, []);
    const idx = list.findIndex((d) => d.id === debtId);
    if (idx < 0) return;
    list[idx].amountPaid += Number(amount);
    write(KEYS.customerDebts, list);
    this.addCashTransaction({
      type: 'entrada',
      category: 'recebimento_cliente',
      amount: Number(amount),
      description: `Recebimento de dívida`,
      date: today(),
      relatedId: debtId,
    });
  },
  customerBalance(customerId) {
    return this.getCustomerDebts(customerId).reduce((s, d) => s + (d.amount - d.amountPaid), 0);
  },
  totalReceivable() {
    return read(KEYS.customerDebts, []).reduce((s, d) => s + (d.amount - d.amountPaid), 0);
  },

  // ================= FORNECEDORES (a pagar) =================
  getSuppliers() {
    return read(KEYS.suppliers, []);
  },
  addSupplier({ name, phone }) {
    const list = read(KEYS.suppliers, []);
    const record = { id: uid(), name, phone: phone || '' };
    list.push(record);
    write(KEYS.suppliers, list);
    return record;
  },
  getSupplierDebts(supplierId) {
    const all = read(KEYS.supplierDebts, []);
    return supplierId ? all.filter((d) => d.supplierId === supplierId) : all;
  },
  addSupplierDebt({ supplierId, amount, description, dueDate, date }) {
    const list = read(KEYS.supplierDebts, []);
    const record = {
      id: uid(),
      supplierId,
      amount: Number(amount) || 0,
      amountPaid: 0,
      description: description || '',
      dueDate: dueDate || null,
      date: date || today(),
    };
    list.push(record);
    write(KEYS.supplierDebts, list);
    return record;
  },
  registerSupplierPayment(debtId, amount) {
    const list = read(KEYS.supplierDebts, []);
    const idx = list.findIndex((d) => d.id === debtId);
    if (idx < 0) return;
    list[idx].amountPaid += Number(amount);
    write(KEYS.supplierDebts, list);
    this.addCashTransaction({
      type: 'saida',
      category: 'pagamento_fornecedor',
      amount: Number(amount),
      description: `Pagamento a fornecedor`,
      date: today(),
      relatedId: debtId,
    });
  },
  supplierBalance(supplierId) {
    return this.getSupplierDebts(supplierId).reduce((s, d) => s + (d.amount - d.amountPaid), 0);
  },
  totalPayable() {
    return read(KEYS.supplierDebts, []).reduce((s, d) => s + (d.amount - d.amountPaid), 0);
  },

  // ================= LEMBRETES =================
  getReminders() {
    return read(KEYS.reminders, []).sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  },
  addReminder(reminder) {
    const list = read(KEYS.reminders, []);
    const record = { id: uid(), done: false, ...reminder };
    list.push(record);
    write(KEYS.reminders, list);
    return record;
  },
  toggleReminder(id) {
    const list = read(KEYS.reminders, []);
    const idx = list.findIndex((r) => r.id === id);
    if (idx >= 0) list[idx].done = !list[idx].done;
    write(KEYS.reminders, list);
  },
  deleteReminder(id) {
    write(KEYS.reminders, read(KEYS.reminders, []).filter((r) => r.id !== id));
  },

  // ================= PATRIMÓNIO / RELATÓRIOS =================
  netWorth() {
    return this.cashBalance() + this.totalStockValue() + this.totalReceivable() - this.totalPayable();
  },
  initialCapital() {
    const business = this.getBusiness();
    if (!business) return 0;
    return business.initialCash + this.initialStockValue();
  },
  growthSinceStart() {
    return this.netWorth() - this.initialCapital();
  },
};

function randomColor() {
  const palette = ['#e8664f', '#d4a24c', '#3e9b7c', '#8b7bd8', '#4a90c2', '#c26fa8', '#96a0c2'];
  return palette[Math.floor(Math.random() * palette.length)];
}

export { today };
