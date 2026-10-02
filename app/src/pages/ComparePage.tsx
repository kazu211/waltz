import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useData } from '../contexts/data-context';
import { recordsInMonth, recordsInYear, filterByPerson, personsOf, summarize, summarizeByCategory } from '../lib/aggregate';
import { jstDateParts, monthOf } from '../lib/date';
import type { CategorySummaryItem, TransactionType } from '../types';

type CategoryView = 'parent' | 'child';
type CompareMode = 'month' | 'year';

const COLOR_A = '#2563eb'; // text-blue-600
const COLOR_B = '#9333ea'; // text-purple-600

export default function ComparePage() {
  const today = jstDateParts();
  const [mode, setMode] = useState<CompareMode>('month');

  // 月比較: 初期値は今月と前月
  const [yearA, setYearA] = useState(today.year);
  const [monthA, setMonthA] = useState(today.month);
  const [yearB, setYearB] = useState(() => (today.month === 1 ? today.year - 1 : today.year));
  const [monthB, setMonthB] = useState(() => (today.month === 1 ? 12 : today.month - 1));

  // 年比較: 初期値は今年と前年
  const [compareYearA, setCompareYearA] = useState(today.year);
  const [compareYearB, setCompareYearB] = useState(today.year - 1);
  const [samePeriod, setSamePeriod] = useState(true);

  const [type, setType] = useState<TransactionType>('expense');
  const [catView, setCatView] = useState<CategoryView>('parent');
  const [person, setPerson] = useState<string>('');
  const { records: allRecords, initialLoading: loading } = useData();

  // 今年は途中なので、今年を含む年比較では「同じ期間（1月〜今月）」で比べられるようにする
  const includesCurrentYear = compareYearA === today.year || compareYearB === today.year;
  const lastMonth = mode === 'year' && includesCurrentYear && samePeriod ? today.month : 12;

  const recordsA = useMemo(() => (mode === 'month'
    ? recordsInMonth(allRecords, yearA, monthA)
    : recordsInYear(allRecords, compareYearA).filter(r => monthOf(r.date) <= lastMonth)
  ), [allRecords, mode, yearA, monthA, compareYearA, lastMonth]);
  const recordsB = useMemo(() => (mode === 'month'
    ? recordsInMonth(allRecords, yearB, monthB)
    : recordsInYear(allRecords, compareYearB).filter(r => monthOf(r.date) <= lastMonth)
  ), [allRecords, mode, yearB, monthB, compareYearB, lastMonth]);
  const persons = useMemo(() => personsOf([...recordsA, ...recordsB]), [recordsA, recordsB]);

  // 集計は保持している明細からブラウザ側で計算する（使用者フィルタも同じ経路）
  const targetA = filterByPerson(recordsA, person);
  const targetB = filterByPerson(recordsB, person);
  const activeSumA = summarize(targetA);
  const activeSumB = summarize(targetB);
  const categoriesA = summarizeByCategory(targetA, type);
  const categoriesB = summarizeByCategory(targetB, type);

  const fmt = (n: number) => `¥${n.toLocaleString('ja-JP')}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tooltipFmt = (v: any) => fmt(Number(v));

  const yearLabel = (y: number) => (lastMonth < 12 ? `${y}年1〜${lastMonth}月` : `${y}年`);
  const labelA = mode === 'month' ? `${yearA}年${monthA}月` : yearLabel(compareYearA);
  const labelB = mode === 'month' ? `${yearB}年${monthB}月` : yearLabel(compareYearB);

  const summaryRows = [
    { label: '収入', a: activeSumA.income, b: activeSumB.income, color: 'text-green-600' },
    { label: '支出', a: activeSumA.expense, b: activeSumB.expense, color: 'text-red-600' },
    { label: '収支', a: activeSumA.balance, b: activeSumB.balance, color: activeSumA.balance >= 0 ? 'text-blue-600' : 'text-amber-600' },
  ];

  const rateA = activeSumA.income > 0 ? Math.round((activeSumA.balance / activeSumA.income) * 100) : null;
  const rateB = activeSumB.income > 0 ? Math.round((activeSumB.balance / activeSumB.income) * 100) : null;

  // 年比較: 月ごとの金額（収入/支出の切り替えに連動）
  const monthlyCompare = Array.from({ length: lastMonth }, (_, i) => {
    const m = i + 1;
    const sumOf = (recs: typeof targetA) => recs
      .filter(r => r.type === type && monthOf(r.date) === m)
      .reduce((s, r) => s + r.amount, 0);
    return { name: `${m}月`, a: sumOf(targetA), b: sumOf(targetB) };
  });

  const categoryCompare = (() => {
    const aggregate = (categories: CategorySummaryItem[]) => {
      const map: Record<string, { parent: string; amount: number }> = {};
      for (const c of categories) {
        const key = catView === 'child' ? `${c.parentCategory} / ${c.childCategory}` : c.parentCategory;
        if (!map[key]) map[key] = { parent: c.parentCategory, amount: 0 };
        map[key].amount += c.amount;
      }
      return map;
    };
    const aMap = aggregate(categoriesA);
    const bMap = aggregate(categoriesB);
    const allKeys = [...new Set([...Object.keys(aMap), ...Object.keys(bMap)])];
    const items = allKeys.map(key => ({
      name: key,
      parent: (aMap[key] ?? bMap[key]).parent,
      a: aMap[key]?.amount ?? 0,
      b: bMap[key]?.amount ?? 0,
    }));

    if (catView === 'parent') {
      return items.sort((x, y) => (y.a - x.a) || (y.b - x.b));
    }
    // 子カテゴリは親カテゴリごとにまとめて並べる（親は金額の大きい順）
    const parentTotal: Record<string, number> = {};
    for (const it of items) parentTotal[it.parent] = (parentTotal[it.parent] ?? 0) + it.a + it.b;
    return items.sort((x, y) =>
      (parentTotal[y.parent] - parentTotal[x.parent]) ||
      x.parent.localeCompare(y.parent, 'ja') ||
      (y.a - x.a) || (y.b - x.b),
    );
  })();

  const yearOptions = Array.from({ length: 7 }, (_, i) => today.year - 5 + i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900">
            比較
            {person && <span className="text-sm font-normal text-gray-500 ml-2">（{person}）</span>}
          </h2>
          <div className="flex rounded-md border border-gray-300 overflow-hidden text-sm">
            {(['month', 'year'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1 transition-colors ${mode === m ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                {m === 'month' ? '月' : '年'}
              </button>
            ))}
          </div>
        </div>
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

      {/* 期間セレクター */}
      <div className="grid grid-cols-2 gap-4 mb-2">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 mb-2">比較元</p>
          <div className="flex gap-2">
            {mode === 'month' ? (
              <>
                <select value={yearA} onChange={e => setYearA(Number(e.target.value))} className="px-2 py-1.5 border border-gray-300 rounded text-sm">
                  {yearOptions.map(y => <option key={y} value={y}>{y}年</option>)}
                </select>
                <select value={monthA} onChange={e => setMonthA(Number(e.target.value))} className="px-2 py-1.5 border border-gray-300 rounded text-sm">
                  {monthOptions.map(m => <option key={m} value={m}>{m}月</option>)}
                </select>
              </>
            ) : (
              <select value={compareYearA} onChange={e => setCompareYearA(Number(e.target.value))} className="px-2 py-1.5 border border-gray-300 rounded text-sm">
                {yearOptions.map(y => <option key={y} value={y}>{y}年</option>)}
              </select>
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 mb-2">比較先</p>
          <div className="flex gap-2">
            {mode === 'month' ? (
              <>
                <select value={yearB} onChange={e => setYearB(Number(e.target.value))} className="px-2 py-1.5 border border-gray-300 rounded text-sm">
                  {yearOptions.map(y => <option key={y} value={y}>{y}年</option>)}
                </select>
                <select value={monthB} onChange={e => setMonthB(Number(e.target.value))} className="px-2 py-1.5 border border-gray-300 rounded text-sm">
                  {monthOptions.map(m => <option key={m} value={m}>{m}月</option>)}
                </select>
              </>
            ) : (
              <select value={compareYearB} onChange={e => setCompareYearB(Number(e.target.value))} className="px-2 py-1.5 border border-gray-300 rounded text-sm">
                {yearOptions.map(y => <option key={y} value={y}>{y}年</option>)}
              </select>
            )}
          </div>
        </div>
      </div>
      {mode === 'year' && includesCurrentYear ? (
        <label className="inline-flex items-center gap-2 mb-6 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={samePeriod}
            onChange={e => setSamePeriod(e.target.checked)}
            className="w-4 h-4 accent-blue-600"
          />
          同じ期間で比較（1〜{today.month}月）
        </label>
      ) : (
        <div className="mb-6" />
      )}

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
                  <td className={`px-4 py-3 text-right font-bold ${rateA !== null && rateA < 0 ? 'text-amber-600' : 'text-green-600'}`}>
                    {rateA !== null ? `${rateA}%` : '-'}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${rateB !== null && rateB < 0 ? 'text-amber-600' : 'text-green-600'}`}>
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

          {/* 年比較: 月ごとの推移（2年を重ねて表示） */}
          {mode === 'year' && (
            <div className="bg-white rounded-lg shadow p-5">
              <h3 className="text-base font-bold text-gray-800 mb-4">月ごとの{type === 'expense' ? '支出' : '収入'}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyCompare} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={v => `¥${Number(v).toLocaleString('ja-JP')}`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={tooltipFmt} />
                  {/* 凡例は名前順ではなく dataKey 順（a=比較元 → b=比較先）で表示する */}
                  <Legend itemSorter="dataKey" />
                  <Line type="monotone" dataKey="a" name={`${compareYearA}年`} stroke={COLOR_A} strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="b" name={`${compareYearB}年`} stroke={COLOR_B} strokeWidth={2.5} dot={{ r: 3 }} strokeDasharray="5 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 構成比較（金額バー・2期間とも同じ縮尺） */}
          {categoryCompare.length > 0 && (() => {
            const totalA = categoryCompare.reduce((s, d) => s + d.a, 0);
            const totalB = categoryCompare.reduce((s, d) => s + d.b, 0);
            const maxTotal = Math.max(totalA, totalB);
            const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6'];
            const renderBar = (key: 'a' | 'b', total: number) => (
              <div className="flex h-8 rounded-md overflow-hidden bg-gray-100" style={{ width: maxTotal > 0 ? `${(total / maxTotal) * 100}%` : '100%' }}>
                {categoryCompare.map((d, i) => {
                  const amount = d[key];
                  if (amount === 0) return null;
                  const width = total > 0 ? (amount / total) * 100 : 0;
                  return (
                    <div
                      key={d.name}
                      className="relative group cursor-default"
                      style={{ width: `${width}%`, backgroundColor: COLORS[i % COLORS.length] }}
                    >
                      {width >= 18 && (
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-medium truncate px-1">
                          {fmt(amount)}
                        </span>
                      )}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 whitespace-nowrap bg-gray-800 text-white text-xs rounded-md px-3 py-1.5 shadow-lg pointer-events-none">
                        <p className="font-medium">{d.name}</p>
                        <p>{fmt(amount)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
            return (
              <div className="bg-white rounded-lg shadow p-5">
                <h3 className="text-base font-bold text-gray-800 mb-4">構成比較（金額）</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{labelA}（{fmt(totalA)}）</p>
                    {renderBar('a', totalA)}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{labelB}（{fmt(totalB)}）</p>
                    {renderBar('b', totalB)}
                  </div>
                  {/* 凡例 */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    {categoryCompare.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-1 text-xs text-gray-600">
                        <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        {d.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 比較テーブル */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-3 text-left font-medium text-gray-500">カテゴリ</th>
                  <th className="px-3 py-3 text-right font-medium text-blue-600">{labelA}</th>
                  <th className="px-3 py-3 text-right font-medium text-purple-600">{labelB}</th>
                  <th className="px-3 py-3 text-right font-medium text-gray-500">差額</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categoryCompare.map(d => {
                  const diff = d.a - d.b;
                  return (
                    <tr key={d.name} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-medium">{d.name}</td>
                      <td className="px-3 py-2.5 text-right">{fmt(d.a)}</td>
                      <td className="px-3 py-2.5 text-right text-gray-500">{fmt(d.b)}</td>
                      <td className="px-3 py-2.5 text-right">
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