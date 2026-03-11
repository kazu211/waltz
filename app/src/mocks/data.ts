import type {
  KakeiboRecord,
  CategoryRecord,
  MemberRecord,
  SummaryResponse,
  SummaryByCategoryResponse,
  MonthlyTrendResponse,
} from '../types';

export const mockCategories: CategoryRecord[] = [
  { id: '1', type: 'expense', parentCategory: '食費', childCategory: '外食' },
  { id: '2', type: 'expense', parentCategory: '食費', childCategory: '自炊' },
  { id: '3', type: 'expense', parentCategory: '食費', childCategory: 'カフェ' },
  { id: '4', type: 'expense', parentCategory: '交通費', childCategory: '電車' },
  { id: '5', type: 'expense', parentCategory: '交通費', childCategory: 'バス' },
  { id: '6', type: 'expense', parentCategory: '住居費', childCategory: '家賃' },
  { id: '7', type: 'expense', parentCategory: '住居費', childCategory: '光熱費' },
  { id: '8', type: 'expense', parentCategory: '日用品', childCategory: '消耗品' },
  { id: '9', type: 'expense', parentCategory: '日用品', childCategory: '衛生用品' },
  { id: '10', type: 'expense', parentCategory: '娯楽', childCategory: '映画' },
  { id: '11', type: 'expense', parentCategory: '娯楽', childCategory: 'ゲーム' },
  { id: '12', type: 'expense', parentCategory: '通信費', childCategory: 'スマホ' },
  { id: '13', type: 'expense', parentCategory: '通信費', childCategory: 'インターネット' },
  { id: '14', type: 'income', parentCategory: '給与', childCategory: '本業' },
  { id: '15', type: 'income', parentCategory: '給与', childCategory: '残業' },
  { id: '16', type: 'income', parentCategory: '副収入', childCategory: 'フリーランス' },
  { id: '17', type: 'income', parentCategory: '副収入', childCategory: 'その他' },
];

export const mockMembers: MemberRecord[] = [
  { id: '1', name: '太郎' },
  { id: '2', name: '花子' },
];

export const mockRecords: KakeiboRecord[] = [
  { id: 'r1', date: '2026-03-10', type: 'expense', parentCategory: '食費', childCategory: '外食', storeName: 'レストランA', persons: ['太郎', '花子'], amount: 3200, memo: 'ランチ' },
  { id: 'r2', date: '2026-03-09', type: 'expense', parentCategory: '交通費', childCategory: '電車', storeName: '', persons: ['太郎'], amount: 480, memo: '通勤' },
  { id: 'r3', date: '2026-03-08', type: 'expense', parentCategory: '食費', childCategory: '自炊', storeName: 'スーパーB', persons: ['花子'], amount: 2150, memo: '食材' },
  { id: 'r4', date: '2026-03-07', type: 'expense', parentCategory: '日用品', childCategory: '衛生用品', storeName: 'ドラッグストアC', persons: ['花子'], amount: 980, memo: 'シャンプー' },
  { id: 'r5', date: '2026-03-06', type: 'expense', parentCategory: '娯楽', childCategory: '映画', storeName: '映画館D', persons: ['太郎', '花子'], amount: 3600, memo: '映画' },
  { id: 'r6', date: '2026-03-05', type: 'expense', parentCategory: '食費', childCategory: 'カフェ', storeName: 'カフェE', persons: ['太郎'], amount: 550, memo: '' },
  { id: 'r7', date: '2026-03-04', type: 'expense', parentCategory: '通信費', childCategory: 'スマホ', storeName: '', persons: [], amount: 5500, memo: 'スマホ代' },
  { id: 'r8', date: '2026-03-03', type: 'expense', parentCategory: '住居費', childCategory: '光熱費', storeName: '', persons: [], amount: 8200, memo: '電気代' },
  { id: 'r9', date: '2026-03-01', type: 'expense', parentCategory: '住居費', childCategory: '家賃', storeName: '', persons: [], amount: 85000, memo: '' },
  { id: 'r10', date: '2026-03-01', type: 'income', parentCategory: '給与', childCategory: '本業', storeName: '', persons: ['太郎'], amount: 300000, memo: '3月給与' },
  { id: 'r11', date: '2026-02-28', type: 'expense', parentCategory: '食費', childCategory: '外食', storeName: 'レストランF', persons: ['太郎'], amount: 1800, memo: '' },
  { id: 'r12', date: '2026-02-25', type: 'expense', parentCategory: '交通費', childCategory: '電車', storeName: '', persons: ['太郎'], amount: 960, memo: '' },
  { id: 'r13', date: '2026-02-20', type: 'expense', parentCategory: '食費', childCategory: '自炊', storeName: 'スーパーB', persons: ['花子'], amount: 3400, memo: '' },
  { id: 'r14', date: '2026-02-15', type: 'expense', parentCategory: '住居費', childCategory: '家賃', storeName: '', persons: [], amount: 85000, memo: '' },
  { id: 'r15', date: '2026-02-01', type: 'income', parentCategory: '給与', childCategory: '本業', storeName: '', persons: ['太郎'], amount: 300000, memo: '2月給与' },
];

export function getMockSummary(year: number, month: number): SummaryResponse {
  const records = mockRecords.filter(r => {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return r.date.startsWith(prefix);
  });
  const income = records.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
  const expense = records.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
  return { year, month, income, expense, balance: income - expense };
}

export function getMockSummaryByCategory(year: number, month: number, type: 'income' | 'expense' = 'expense'): SummaryByCategoryResponse {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const records = mockRecords.filter(r => r.date.startsWith(prefix) && r.type === type);
  const map: Record<string, { parentCategory: string; childCategory: string; amount: number }> = {};
  for (const r of records) {
    const key = `${r.parentCategory}::${r.childCategory}`;
    if (!map[key]) map[key] = { parentCategory: r.parentCategory, childCategory: r.childCategory, amount: 0 };
    map[key].amount += r.amount;
  }
  const categories = Object.values(map).sort((a, b) => b.amount - a.amount);
  return { year, month, type, categories };
}

export function getMockMonthlyTrend(year: number): MonthlyTrendResponse {
  const months = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const prefix = `${year}-${String(m).padStart(2, '0')}`;
    const records = mockRecords.filter(r => r.date.startsWith(prefix));
    const income = records.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
    const expense = records.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
    return { month: m, income, expense, balance: income - expense };
  });
  return { year, months };
}
