export function formatKz(value) {
  const n = Number(value) || 0;
  const formatted = new Intl.NumberFormat('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(n));
  return `${n < 0 ? '-' : ''}${formatted} Kz`;
}

export function parseAmountInput(str) {
  const cleaned = String(str).replace(/[^0-9.,-]/g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}
