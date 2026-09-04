/**
 * 日付ユーティリティ。
 *
 * 家計簿の日付はすべて日本時間（JST）基準の yyyy-MM-dd 文字列として扱う。
 * `new Date().toISOString()` は UTC になり JST 09:00 より前は前日になってしまうため、
 * 「今日」を求めるときは必ずこのモジュールを経由すること。
 */

/** アプリの基準タイムゾーン */
export const APP_TIME_ZONE = 'Asia/Tokyo';

const jstFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const pad2 = (n: number) => String(n).padStart(2, '0');

/** 指定時刻（既定は現在時刻）の JST での年月日 */
export function jstDateParts(base: Date = new Date()): { year: number; month: number; day: number } {
  const parts = jstFormatter.formatToParts(base);
  const get = (type: 'year' | 'month' | 'day') => Number(parts.find(p => p.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

/** JST の今日を yyyy-MM-dd で返す */
export function todayJST(base: Date = new Date()): string {
  const { year, month, day } = jstDateParts(base);
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** yyyy-MM-dd 文字列の月（1-12）。タイムゾーンの影響を受けないよう文字列から取り出す */
export function monthOf(date: string): number {
  return Number(date.slice(5, 7));
}

/** 指定年月の末日 */
export function lastDayOfMonth(year: number, month: number): number {
  // UTC で計算するのでローカルタイムゾーンに左右されない
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** 指定年月の期間（yyyy-MM-dd） */
export function monthRange(year: number, month: number): { startDate: string; endDate: string } {
  const prefix = `${year}-${pad2(month)}`;
  return { startDate: `${prefix}-01`, endDate: `${prefix}-${pad2(lastDayOfMonth(year, month))}` };
}
