import { useEffect, useState, useMemo } from 'react';
import { api } from '../lib/api';
import type { SummaryResponse, SummaryByCategoryResponse, KakeiboRecord } from '../types';

export default function DashboardPage() {
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth() + 1);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [prevSummary, setPrevSummary] = useState<SummaryResponse | null>(null);
  const [catData, setCatData] = useState<SummaryByCategoryResponse | null>(null);
  const [prevCatData, setPrevCatData] = useState<SummaryByCategoryResponse | null>(null);
  const [records, setRecords] = useState<KakeiboRecord[]>([]);
  const [prevRecords, setPrevRecords] = useState<KakeiboRecord[]>([]);
  const [person, setPerson] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const prevM = month === 1 ? 12 : month - 1;
  const prevY = month === 1 ? year - 1 : year;

  useEffect(() => {
    setLoading(true);
    const startCur = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDayCur = new Date(year, month, 0).getDate();
    const endCur = `${year}-${String(month).padStart(2, '0')}-${String(endDayCur).padStart(2, '0')}`;
    const startPrev = `${prevY}-${String(prevM).padStart(2, '0')}-01`;
    const endDayPrev = new Date(prevY, prevM, 0).getDate();
    const endPrev = `${prevY}-${String(prevM).padStart(2, '0')}-${String(endDayPrev).padStart(2, '0')}`;

    Promise.all([
      api.summary(year, month),
      api.summary(prevY, prevM),
      api.summaryByCategory(year, month, 'expense'),
      api.summaryByCategory(prevY, prevM, 'expense'),
      api.list({ startDate: startCur, endDate: endCur }),
      api.list({ startDate: startPrev, endDate: endPrev }),
    ]).then(([cur, prev, cat, pCat, recs, pRecs]) => {
      setSummary(cur);
      setPrevSummary(prev);
      setCatData(cat);
      setPrevCatData(pCat);
      setRecords(recs);
      setPrevRecords(pRecs);
    }).finally(() => setLoading(false));
  }, [year, month, prevY, prevM]);

  const persons = useMemo(() => {
    const set = new Set<string>();
    for (const r of [...records, ...prevRecords]) {
      for (const p of r.persons) set.add(p);
    }
    return Array.from(set).sort();
  }, [records, prevRecords]);

  const filtered = useMemo(() => {
    if (!person) return null;
    const compute = (recs: KakeiboRecord[], y: number, m: number) => {
      const f = recs.filter(r => r.persons.includes(person));
      const income = f.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
      const expense = f.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
      const sum: SummaryResponse = { year: y, month: m, income, expense, balance: income - expense };
      const catMap: Record<string, { parentCategory: string; childCategory: string; amount: number }> = {};
      for (const r of f.filter(r => r.type === 'expense')) {
        const key = `${r.parentCategory}/${r.childCategory}`;
        if (!catMap[key]) catMap[key] = { parentCategory: r.parentCategory, childCategory: r.childCategory, amount: 0 };
        catMap[key].amount += r.amount;
      }
      const cat: SummaryByCategoryResponse = {
        year: y, month: m, type: 'expense',
        categories: Object.values(catMap).sort((a, b) => b.amount - a.amount),
      };
      return { sum, cat };
    };
    const cur = compute(records, year, month);
    const prev = compute(prevRecords, prevY, prevM);
    return { summary: cur.sum, prevSummary: prev.sum, catData: cur.cat, prevCatData: prev.cat };
  }, [person, records, prevRecords, year, month, prevY, prevM]);

  const activeSummary = filtered ? filtered.summary : summary;
  const activePrevSummary = filtered ? filtered.prevSummary : prevSummary;
  const activeCatData = filtered ? filtered.catData : catData;
  const activePrevCatData = filtered ? filtered.prevCatData : prevCatData;

  if (loading) {
    return <div className="text-center py-12 text-gray-500">読み込み中...</div>;
  }

  const fmt = (n: number) => n.toLocaleString('ja-JP');
  const diffBadge = (cur: number, prev: number) => {
    const d = cur - prev;
    if (d === 0) return <span className="text-gray-400">±0</span>;
    return d > 0
      ? <span className="text-red-500">+{fmt(d)}</span>
      : <span className="text-green-500">{fmt(d)}</span>;
  };

  const categoryComparison = (() => {
    if (!activeCatData) return [];
    const curMap: Record<string, number> = {};
    for (const c of activeCatData.categories) {
      curMap[c.parentCategory] = (curMap[c.parentCategory] ?? 0) + c.amount;
    }
    const prevMap: Record<string, number> = {};
    if (activePrevCatData) {
      for (const c of activePrevCatData.categories) {
        prevMap[c.parentCategory] = (prevMap[c.parentCategory] ?? 0) + c.amount;
      }
    }
    const allKeys = [...new Set([...Object.keys(curMap), ...Object.keys(prevMap)])];
    return allKeys.map(name => ({
      name,
      current: curMap[name] ?? 0,
      previous: prevMap[name] ?? 0,
    })).sort((a, b) => b.current - a.current);
  })();

  const savingsRate = activeSummary && activeSummary.income > 0
    ? (activeSummary.balance / activeSummary.income) * 100
    : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-bold text-gray-900">
          {year}年{month}月 ダッシュボード
          {person && <span className="text-sm font-normal text-gray-500 ml-2">（{person}）</span>}
        </h2>
        {persons.length > 0 && (
          <select
            value={person}
            onChange={e => setPerson(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white"
          >
            <option value="">全員</option>
            {persons.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        )}
      </div>

      {activeSummary && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-5">
              <p className="text-sm text-gray-500">収入</p>
              <p className="text-2xl font-bold text-green-600 mt-1">¥{fmt(activeSummary.income)}</p>
              {activePrevSummary && (
                <p className="text-xs text-gray-400 mt-2">
                  前月比: {diffBadge(activeSummary.income, activePrevSummary.income)}
                </p>
              )}
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <p className="text-sm text-gray-500">支出</p>
              <p className="text-2xl font-bold text-red-600 mt-1">¥{fmt(activeSummary.expense)}</p>
              {activePrevSummary && (
                <p className="text-xs text-gray-400 mt-2">
                  前月比: {diffBadge(activeSummary.expense, activePrevSummary.expense)}
                </p>
              )}
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <p className="text-sm text-gray-500">収支</p>
              <p className={`text-2xl font-bold mt-1 ${activeSummary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ¥{fmt(activeSummary.balance)}
              </p>
              {activePrevSummary && (
                <p className="text-xs text-gray-400 mt-2">
                  前月比: {diffBadge(activeSummary.balance, activePrevSummary.balance)}
                </p>
              )}
            </div>
          </div>

          {savingsRate !== null && (
            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">貯蓄率</span>
                <span className={`font-bold ${savingsRate < 0 ? 'text-red-600' : savingsRate < 20 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {savingsRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${
                    savingsRate < 0 ? 'bg-red-500' : savingsRate < 20 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.max(Math.min(savingsRate, 100), 0)}%` }}
                />
              </div>
            </div>
          )}

          {categoryComparison.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-5 py-3 border-b">
                <h3 className="text-base font-bold text-gray-800">支出カテゴリ 前月比較</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">カテゴリ</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500">今月</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500">前月</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500">差額</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categoryComparison.map(c => {
                    const d = c.current - c.previous;
                    return (
                      <tr key={c.name} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium">{c.name}</td>
                        <td className="px-4 py-2.5 text-right">¥{fmt(c.current)}</td>
                        <td className="px-4 py-2.5 text-right text-gray-400">¥{fmt(c.previous)}</td>
                        <td className="px-4 py-2.5 text-right">
                          {d === 0 ? (
                            <span className="text-gray-400">±0</span>
                          ) : d > 0 ? (
                            <span className="text-red-500 inline-flex items-center gap-0.5">↑ ¥{fmt(d)}</span>
                          ) : (
                            <span className="text-green-500 inline-flex items-center gap-0.5">↓ ¥{fmt(Math.abs(d))}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}