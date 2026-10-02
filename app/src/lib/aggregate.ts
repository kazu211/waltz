/**
 * 明細の集計。
 * アプリ起動時に取得した全明細から、各画面の集計をブラウザ側で計算する。
 */
import type { KakeiboRecord, TransactionType, CategorySummaryItem, MonthlyTrendItem } from '../types';
import { monthOf } from './date';

/** 月ごとの親カテゴリ別金額（年次推移のカテゴリ別グラフ用） */
export type CategoryTrend = { month: number; categories: { parentCategory: string; amount: number }[] }[];

const monthPrefix = (year: number, month: number) => `${year}-${String(month).padStart(2, '0')}-`;

export function recordsInMonth(records: KakeiboRecord[], year: number, month: number): KakeiboRecord[] {
  const prefix = monthPrefix(year, month);
  return records.filter(r => r.date.startsWith(prefix));
}

export function recordsInYear(records: KakeiboRecord[], year: number): KakeiboRecord[] {
  const prefix = `${year}-`;
  return records.filter(r => r.date.startsWith(prefix));
}

/** 使用者で絞り込む（空文字なら全員） */
export function filterByPerson(records: KakeiboRecord[], person: string): KakeiboRecord[] {
  return person ? records.filter(r => r.persons.includes(person)) : records;
}

/** 明細に登場する使用者の一覧 */
export function personsOf(records: KakeiboRecord[]): string[] {
  const set = new Set<string>();
  for (const r of records) for (const p of r.persons) set.add(p);
  return Array.from(set).sort();
}

export function summarize(records: KakeiboRecord[]): { income: number; expense: number; balance: number } {
  let income = 0;
  let expense = 0;
  for (const r of records) {
    if (r.type === 'income') income += r.amount;
    else expense += r.amount;
  }
  return { income, expense, balance: income - expense };
}

/** 親/子カテゴリ別の合計（金額の降順） */
export function summarizeByCategory(records: KakeiboRecord[], type: TransactionType): CategorySummaryItem[] {
  const map: Record<string, CategorySummaryItem> = {};
  for (const r of records) {
    if (r.type !== type) continue;
    const key = `${r.parentCategory}::${r.childCategory}`;
    if (!map[key]) map[key] = { parentCategory: r.parentCategory, childCategory: r.childCategory, amount: 0 };
    map[key].amount += r.amount;
  }
  return Object.values(map).sort((a, b) => b.amount - a.amount);
}

/** 1年分の明細から12ヶ月の収支推移を作る */
export function monthlyTrend(yearRecords: KakeiboRecord[]): MonthlyTrendItem[] {
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return { month, ...summarize(yearRecords.filter(r => monthOf(r.date) === month)) };
  });
}

/** 1年分の明細から12ヶ月の親カテゴリ別金額を作る */
export function categoryMonthlyTrend(yearRecords: KakeiboRecord[], type: TransactionType): CategoryTrend {
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const map: Record<string, number> = {};
    for (const r of yearRecords) {
      if (r.type !== type || monthOf(r.date) !== month) continue;
      map[r.parentCategory] = (map[r.parentCategory] ?? 0) + r.amount;
    }
    return { month, categories: Object.entries(map).map(([parentCategory, amount]) => ({ parentCategory, amount })) };
  });
}
