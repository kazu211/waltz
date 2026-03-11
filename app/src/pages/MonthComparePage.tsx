import { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { api } from '../lib/api';
import type { SummaryResponse, SummaryByCategoryResponse, KakeiboRecord, TransactionType } from '../types';

type CategoryView = 'parent' | 'child';

export default function MonthComparePage() {
  const now = new Date();
  const [yearA, setYearA] = useState(now.getFullYear());
  const [monthA, setMonthA] = useState(now.getMonth() + 1);
  const [yearB, setYearB] = useState(() => {
    const m = now.getMonth();
    return m === 0 ? now.getFullYear() - 1 : now.getFullYear();
  });
  const [monthB, setMonthB] = useState(() => {
    const m = now.getMonth();
    return m === 0 ? 12 : m;
  });

  const [sumA, setSumA] = useState<SummaryResponse | null>(null);
  const [sumB, setSumB] = useState<SummaryResponse | null>(null);
  const [catA, setCatA] = useState<SummaryByCategoryResponse | null>(null);
  const [catB, setCatB] = useState<SummaryByCategoryResponse | null>(null);
  const [recordsA, setRecordsA] = useState<KakeiboRecord[]>([]);
  const [recordsB, setRecordsB] = useState<KakeiboRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [type, setType] = useState<TransactionType>('expense');
  const [catView, setCatView] = useState<CategoryView>('parent');
  const [person, setPerson] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    const startA = `${yearA}-${String(monthA).padStart(2, '0')}-01`;
    const endA = `${yearA}-${String(monthA).padStart(2, '0')}-${new Date(yearA, monthA, 0).getDate()}`;
    const startB = `${yearB}-${String(monthB).padStart(2, '0')}-01`;
    const endB = `${yearB}-${String(monthB).padStart(2, '0')}-${new Date(yearB, monthB, 0).getDate()}`;
    Promise.all([
      api.summary(yearA, monthA),
      api.summary(yearB, monthB),
      api.summaryByCategory(yearA, monthA, type),
      api.summaryByCategory(yearB, monthB, type),
      api.list({ startDate: startA, endDate: endA }),
      api.list({ startDate: startB, endDate: endB }),
    ]).then(([sA, sB, cA, cB, rA, rB]) => {
      setSumA(sA); setSumB(sB);
      setCatA(cA); setCatB(cB);
      setRecordsA(rA); setRecordsB(rB);
    }).finally(() => setLoading(false));
  }, [yearA, monthA, yearB, monthB, type]);

  const persons = useMemo(() => {
    const set = new Set<string>();
    for (const r of [...recordsA, ...recordsB]) {
      for (const p of r.persons) set.add(p);
    }
    return Array.from(set).sort();
  }, [recordsA, recordsB]);

  const filtered = useMemo(() => {
    if (!person) return null;
    const compute = (recs: KakeiboRecord[], y: number, m: number) => {
      const f = recs.filter(r => r.persons.includes(person));
      const income = f.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
      const expense = f.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
      const sum: SummaryResponse = { year: y, month: m, income, expense, balance: income - expense };
      const catMap: Record<string, { parentCategory: string; childCategory: string; amount: number }> = {};
      for (const r of f.filter(r => r.type === type)) {
        const key = `${r.parentCategory}/${r.childCategory}`;
        if (!catMap[key]) catMap[key] = { parentCategory: r.parentCategory, childCategory: r.childCategory, amount: 0 };
        catMap[key].amount += r.amount;
      }
      const cat: SummaryByCategoryResponse = {
        year: y, month: m, type,
        categories: Object.values(catMap).sort((a, b) => b.amount - a.amount),
      };
      return { sum, cat };
    };
    const a = compute(recordsA, yearA, monthA);
    const b = compute(recordsB, yearB, monthB);
    return { sumA: a.sum, sumB: b.sum, catA: a.cat, catB: b.cat };
  }, [person, recordsA, recordsB, type, yearA, monthA, yearB, monthB]);

  const activeSumA = filtered ? filtered.sumA : sumA;
  const activeSumB = filtered ? filtered.sumB : sumB;
  const activeCatA = filtered ? filtered.catA : catA;
  const activeCatB = filtered ? filtered.catB : catB;

  const fmt = (n: number) => `¥${n.toLocaleString('ja-JP')}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tooltipFmt = (v: any) => fmt(Number(v));

  const labelA = `${yearA}年${monthA}月`;
  const labelB = `${yearB}年${monthB}月`;

  const summaryRows = activeSumA && activeSumB ? [
    { label: '収入', a: activeSumA.income, b: activeSumB.income, color: 'text-green-600' },
    { label: '支出', a: activeSumA.expense, b: activeSumB.expense, color: 'text-red-600' },
    { label: '収支', a: activeSumA.balance, b: activeSumB.balance, color: activeSumA.balance >= 0 ? 'text-blue-600' : 'text-red-600' },
  ] : [];

  const rateA = activeSumA && activeSumA.income > 0 ? Math.round((activeSumA.balance / activeSumA.income) * 100) : null;
  const rateB = activeSumB && activeSumB.income > 0 ? Math.round((activeSumB.balance / activeSumB.income) * 100) : null;

  const categoryCompare = (() => {
    if (!activeCatA || !activeCatB) return [];
    const aggregate = (data: SummaryByCategoryResponse) => {
      if (catView === 'child') {
        return data.categories.map(c => ({
          key: `${c.parentCategory} / ${c.childCategory}`,
          amount: c.amount,
        }));
      }
      const map: Record<string, number> = {};
      for (const c of data.categories) {
        map[c.parentCategory] = (map[c.parentCategory] ?? 0) + c.amount;
      }
      return Object.entries(map).map(([key, amount]) => ({ key, amount }));
    };
    const aItems = aggregate(activeCatA);
    const bItems = aggregate(activeCatB);
    const allKeys = [...new Set([...aItems.map(x => x.key), ...bItems.map(x => x.key)])];
    return allKeys.map(key => ({
      name: key,
      a: aItems.find(x => x.key === key)?.amount ?? 0,
      b: bItems.find(x => x.key === key)?.amount ?? 0,
    })).sort((x, y) => y.a - x.a);
  })();

  const barChartData = categoryCompare.map(d => ({
    name: d.name,
    [labelA]: d.a,
    [labelB]: d.b,
  }));

  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-bold text-gray-900">
          月比較
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

      {/* 月セレクター */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 mb-2">比較元</p>
          <div className="flex gap-2">
            <select value={yearA} onChange={e => setYearA(Number(e.target.value))} className="px-2 py-1.5 border border-gray-300 rounded text-sm">
              {yearOptions.map(y => <option key={y} value={y}>{y}年</option>)}
            </select>
            <select value={monthA} onChange={e => setMonthA(Number(e.target.value))} className="px-2 py-1.5 border border-gray-300 rounded text-sm">
              {monthOptions.map(m => <option key={m} value={m}>{m}月</option>)}
            </select>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 mb-2">比較先</p>
          <div className="flex gap-2">
            <select value={yearB} onChange={e => setYearB(Number(e.target.value))} className="px-2 py-1.5 border border-gray-300 rounded text-sm">
              {yearOptions.map(y => <option key={y} value={y}>{y}年</option>)}
            </select>
            <select value={monthB} onChange={e => setMonthB(Number(e.target.value))} className="px-2 py-1.5 border border-gray-300 rounded text-sm">
              {monthOptions.map(m => <option key={m} value={m}>{m}月</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">読み込み中...</div>
      ) : (
        <div className="space-y-6">
          {/* サマリー比較 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500"></th>
                  <th className="px-4 py-3 text-right font-medium text-blue-600">{labelA}</th>
                  <th className="px-4 py-3 text-right font-medium text-purple-600">{labelB}</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">差額</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {summaryRows.map(r => {
                  const d = r.a - r.b;
                  return (
                    <tr key={r.label} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{r.label}</td>
                      <td className={`px-4 py-3 text-right ${r.color}`}>{fmt(r.a)}</td>
                      <td className={`px-4 py-3 text-right ${r.color}`}>{fmt(r.b)}</td>
                      <td className="px-4 py-3 text-right">
                        {d === 0 ? (
                          <span className="text-gray-400">±0</span>
                        ) : d > 0 ? (
                          <span className="text-red-500">↑ {fmt(d)}</span>
                        ) : (
                          <span className="text-green-500">↓ {fmt(Math.abs(d))}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                <tr className="hover:bg-gray-50 border-t-2 border-gray-200">
                  <td className="px-4 py-3 font-medium">貯蓄率</td>
                  <td className={`px-4 py-3 text-right font-bold ${rateA !== null && rateA < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {rateA !== null ? `${rateA}%` : '-'}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${rateB !== null && rateB < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {rateB !== null ? `${rateB}%` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {rateA !== null && rateB !== null ? (
                      <span className={rateA - rateB > 0 ? 'text-green-500' : rateA - rateB < 0 ? 'text-red-500' : 'text-gray-400'}>
                        {rateA - rateB > 0 ? '↑' : rateA - rateB < 0 ? '↓' : '±'}{Math.abs(rateA - rateB)}pt
                      </span>
                    ) : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* フィルター */}
          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-1">
              <button onClick={() => setType('expense')} className={`px-3 py-1 text-xs rounded-full border transition-colors ${type === 'expense' ? 'bg-red-100 border-red-400 text-red-700' : 'bg-white border-gray-300 text-gray-600'}`}>支出</button>
              <button onClick={() => setType('income')} className={`px-3 py-1 text-xs rounded-full border transition-colors ${type === 'income' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-white border-gray-300 text-gray-600'}`}>収入</button>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setCatView('parent')} className={`px-3 py-1 text-xs rounded-full border transition-colors ${catView === 'parent' ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-white border-gray-300 text-gray-600'}`}>親カテゴリ</button>
              <button onClick={() => setCatView('child')} className={`px-3 py-1 text-xs rounded-full border transition-colors ${catView === 'child' ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-white border-gray-300 text-gray-600'}`}>子カテゴリ</button>
            </div>
          </div>

          {/* 比較棒グラフ */}
          {barChartData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-5">
              <h3 className="text-base font-bold text-gray-800 mb-4">カテゴリ別比較</h3>
              <ResponsiveContainer width="100%" height={Math.max(barChartData.length * 50, 200)}>
                <BarChart data={barChartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={v => `¥${Number(v).toLocaleString('ja-JP')}`} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={tooltipFmt} />
                  <Legend />
                  <Bar dataKey={labelA} fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={14} />
                  <Bar dataKey={labelB} fill="#a78bfa" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 比較テーブル */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">カテゴリ</th>
                  <th className="px-4 py-3 text-right font-medium text-blue-600">{labelA}</th>
                  <th className="px-4 py-3 text-right font-medium text-purple-600">{labelB}</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">差額</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categoryCompare.map(d => {
                  const diff = d.a - d.b;
                  return (
                    <tr key={d.name} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium">{d.name}</td>
                      <td className="px-4 py-2.5 text-right">{fmt(d.a)}</td>
                      <td className="px-4 py-2.5 text-right text-gray-500">{fmt(d.b)}</td>
                      <td className="px-4 py-2.5 text-right">
                        {diff === 0 ? (
                          <span className="text-gray-400">±0</span>
                        ) : diff > 0 ? (
                          <span className="text-red-500">↑ {fmt(diff)}</span>
                        ) : (
                          <span className="text-green-500">↓ {fmt(Math.abs(diff))}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}