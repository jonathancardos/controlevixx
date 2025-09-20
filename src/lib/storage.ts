import { SavedOrder, SalesCategory } from '@/types/dashboard';

const STORAGE_KEY = 'vixxe_history_v1';
const CATEGORIES_KEY = 'vixxe_categories_v1';

export const defaultCategories: SalesCategory[] = [
  { key: 'hamburguer', label: 'Hambúrguers', max: 15000, value: 12500 },
  { key: 'pizzas', label: 'Pizzas', max: 12000, value: 9200 },
  { key: 'acai', label: 'Açaí', max: 10000, value: 7800 },
  { key: 'bebidas', label: 'Bebidas', max: 8000, value: 6500 },
];

export function loadHistory(): SavedOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error loading history:', e);
    return [];
  }
}

export function saveHistory(orders: SavedOrder[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Error saving history:', e);
  }
}

export function loadCategories(): SalesCategory[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    return raw ? JSON.parse(raw) : defaultCategories;
  } catch (e) {
    console.error('Error loading categories:', e);
    return defaultCategories;
  }
}

export function saveCategories(categories: SalesCategory[]): void {
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  } catch (e) {
    console.error('Error saving categories:', e);
  }
}

export function exportToCSV(orders: SavedOrder[]): void {
  if (!orders.length) {
    alert('Nenhum registro para exportar');
    return;
  }

  const header = ['ID', 'Cliente', 'Data', 'Total', 'Itens'];
  const rows = orders.map(order => [
    order.id,
    `"${(order.client || '').replace(/"/g, '""')}"`,
    order.date,
    order.total.toString(),
    `"${JSON.stringify(order.items).replace(/"/g, '""')}"`,
  ]);

  const csvContent = [header, ...rows]
    .map(row => row.join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'vixxe_history.csv';
  link.click();
  URL.revokeObjectURL(url);
}