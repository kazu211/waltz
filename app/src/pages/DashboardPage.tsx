import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { SummaryResponse } from '../types';

export default function DashboardPage() {
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth() + 1);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [prevSummary, setPrevSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    Promise.all([
      api.summary(year, month),
      api.summary(prevYear, prevMonth),
    ]).then(([cur, prev]) => {
      setSummary(cur);
      setPrevSummary(prev);
    }).finally(() => setLoading(false));
  }, [year, month]);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">読み込み中...</div>;
  }

  const fmt = (n: number) => n.toLocaleString('ja-JP');
  const diff = (cur: number, prev: number) => {
    const d = cur - prev;
    if (d === 0) return <span className="text-gray-400">±0</span>;
    return d > 0
      ? <span className="text-red-500">+{fmt(d)}</span>
      : <span className="text-green-500">{fmt(d)}</span>;
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        {year}年{month}月 ダッシュボード
      </h2>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 収入 */}
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-sm text-gray-500">収入</p>
            <p className="text-2xl font-bold text-green-600 mt-1">¥{fmt(summary.income)}</p>
            {prevSummary && (
              <p className="text-xs text-gray-400 mt-2">
                前月比: {diff(summary.income, prevSummary.income)}
              </p>
            )}
          </div>

          {/* 支出 */}
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-sm text-gray-500">支出</p>
            <p className="text-2xl font-bold text-red-600 mt-1">¥{fmt(summary.expense)}</p>
            {prevSummary && (
              <p className="text-xs text-gray-400 mt-2">
                前月比: {diff(summary.expense, prevSummary.expense)}
              </p>
            )}
          </div>

          {/* 収支 */}
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-sm text-gray-500">収支</p>
            <p className={`text-2xl font-bold mt-1 ${summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              ¥{fmt(summary.balance)}
            </p>
            {prevSummary && (
              <p className="text-xs text-gray-400 mt-2">
                前月比: {diff(summary.balance, prevSummary.balance)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
