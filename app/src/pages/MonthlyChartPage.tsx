import { useEffect, useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { api } from '../lib/api';
import type { SummaryByCategoryResponse, SummaryResponse, KakeiboRecord, TransactionType } from '../types';

const COLORS = [
  '#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6',
  '#e11d48', '#84cc16', '#a855f7', '#0ea5e9', '#d946ef',
];

type CategoryView = 'parent' | 'child';

export default function MonthlyChartPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [type, setType] = useState<TransactionType>('expense');
  const [catView, setCatView] = useState<CategoryView>('parent');
  const [catData, setCatData] = useState<SummaryByCategoryResponse | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [records, setRecords] = useState<KakeiboRecord[]>([]);
  const [person, setPerson] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
    Promise.all([
      api.summaryByCategory(year, month, type),
      api.summary(year, month),
      api.list({ startDate, endDate }),
    ]).then(([cat, sum, recs]) => {
      setCatData(cat);
      setSummary(sum);
      setRecords(recs);
    }).finally(() => setLoading(false));
  }, [year, month, type]);

  // 使用者一覧を抽出
  const persons = useMemo(() => {
    const set = new Set<string>();
    for (const r of records) {
      for (const p of r.persons) set.add(p);
    }
    return Array.from(set).sort();
  }, [records]);

  // 使用者フィルタ時はクライアント側で集計
  const filtered = useMemo(() => {
    if (!person) return null;
    const recs = records.filter(r => r.persons.includes(person));
    const income = recs.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
    const expense = recs.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
    const filteredSummary: SummaryResponse = { year, month, income, expense, balance: income - expense };

    const catMap: Record<string, { parentCategory: string; childCategory: string; amount: number }> = {};
    for (const r of recs) {
      if (r.type !== type) continue;
      const key = `${r.parentCategory}/${r.childCategory}`;
      if (!catMap[key]) catMap[key] = { parentCategory: r.parentCategory, childCategory: r.childCategory, amount: 0 };
      catMap[key].amount += r.amount;
    }
    const filteredCat: SummaryByCategoryResponse = {
      year, month, type,
      categories: Object.values(catMap).sort((a, b) => b.amount - a.amount),
    };
    return { summary: filteredSummary, catData: filteredCat };
  }, [person, records, type]);

  const activeSummary = filtered ? filtered.summary : summary;
  const activeCatData = filtered ? filtered.catData : catData;

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else { setMonth(m => m - 1); }
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else { setMonth(m => m + 1); }
  };

  const fmt = (n: number) => `¥${n.toLocaleString('ja-JP')}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tooltipFmt = (v: any) => fmt(Number(v));

  // 円グラフ用データ（親カテゴリ or 子カテゴリ）
  const pieData = (() => {
    if (!activeCatData) return [];
    if (catView === 'child') {
      return activeCatData.categories.map(c => ({
        name: `${c.parentCategory} / ${c.childCategory}`,
        value: c.amount,
      }));
    }
    const map: Record<string, number> = {};
    for (const c of activeCatData.categories) {
      map[c.parentCategory] = (map[c.parentCategory] ?? 0) + c.amount;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  })();

  // 詳細テーブル用データ
  const tableData = (() => {
    if (!activeCatData) return [];
    if (catView === 'child') {
      return activeCatData.categories;
    }
    const map: Record<string, { parentCategory: string; childCategory: string; amount: number }> = {};
    for (const c of activeCatData.categories) {
      if (!map[c.parentCategory]) map[c.parentCategory] = { parentCategory: c.parentCategory, childCategory: '', amount: 0 };
      map[c.parentCategory].amount += c.amount;
    }
    return Object.values(map).sort((a, b) => b.amount - a.amount);
  })();

  // 棒グラフ用データ
  const barData = activeSummary ? [
    { name: '収入', amount: activeSummary.income, fill: '#10b981' },
    { name: '支出', amount: activeSummary.expense, fill: '#ef4444' },
    { name: '収支', amount: activeSummary.balance, fill: activeSummary.balance >= 0 ? '#3b82f6' : '#ef4444' },
  ] : [];

  // 貯蓄率
  const savingsRate = activeSummary && activeSummary.income > 0
    ? (activeSummary.balance / activeSummary.income) * 100
    : null;

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-200 rounded-md text-gray-600 transition-colors">◀</button>
          <h2 className="text-xl font-bold text-gray-900">{year}年{month}月</h2>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-200 rounded-md text-gray-600 transition-colors">▶</button>
        </div>
        {/* 使用者フィルタ */}
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

      {loading ? (
        <div className="text-center py-12 text-gray-500">読み込み中...</div>
      ) : (
        <div className="space-y-6">
          {/* 収支バランス */}
          {activeSummary && (
            <div className="bg-white rounded-lg shadow p-5">
              <h3 className="text-base font-bold text-gray-800 mb-3">
                収支バランス{person && <span className="text-sm font-normal text-gray-500 ml-2">（{person}）</span>}
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-4 text-center text-sm">
                <div>
                  <p className="text-gray-500">収入</p>
                  <p className="text-lg font-bold text-green-600">{fmt(activeSummary.income)}</p>
                </div>
                <div>
                  <p className="text-gray-500">支出</p>
                  <p className="text-lg font-bold text-red-600">{fmt(activeSummary.expense)}</p>
                </div>
                <div>
                  <p className="text-gray-500">収支</p>
                  <p className={`text-lg font-bold ${activeSummary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {fmt(activeSummary.balance)}
                  </p>
                </div>
              </div>
              {savingsRate !== null && (
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">貯蓄率（(収入 − 支出) ÷ 収入）</span>
                    <span className={`font-bold ${savingsRate < 0 ? 'text-red-600' : savingsRate < 20 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {savingsRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        savingsRate < 0 ? 'bg-red-500' : savingsRate < 20 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.max(Math.min(savingsRate, 100), 0)}%` }}
                    />
                  </div>
                  {savingsRate >= 0 && (
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      貯蓄額 {fmt(activeSummary.balance)}
                    </p>
                  )}
                  {savingsRate < 0 && (
                    <p className="text-xs text-red-500 mt-1 text-right">
                      赤字 {fmt(Math.abs(activeSummary.balance))}
                    </p>
                  )}
                </div>
              )}
              {savingsRate === null && activeSummary.income === 0 && activeSummary.expense > 0 && (
                <p className="text-sm text-gray-500">収入がないため貯蓄率を計算できません</p>
              )}
            </div>
          )}

          {/* 収入/支出 棒グラフ */}
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="text-base font-bold text-gray-800 mb-4">月間サマリー</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={v => `¥${Number(v).toLocaleString('ja-JP')}`} />
                <YAxis type="category" dataKey="name" width={40} />
                <Tooltip formatter={tooltipFmt} />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* カテゴリ別円グラフ */}
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-base font-bold text-gray-800">カテゴリ別内訳</h3>
              <div className="flex gap-2 flex-wrap">
                <div className="flex gap-1">
                  <button
                    onClick={() => setType('expense')}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      type === 'expense' ? 'bg-red-100 border-red-400 text-red-700' : 'bg-white border-gray-300 text-gray-600'
                    }`}
                  >支出</button>
                  <button
                    onClick={() => setType('income')}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      type === 'income' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-white border-gray-300 text-gray-600'
                    }`}
                  >収入</button>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCatView('parent')}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      catView === 'parent' ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-white border-gray-300 text-gray-600'
                    }`}
                  >親カテゴリ</button>
                  <button
                    onClick={() => setCatView('child')}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      catView === 'child' ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-white border-gray-300 text-gray-600'
                    }`}
                  >子カテゴリ</button>
                </div>
              </div>
            </div>

            {pieData.length === 0 ? (
              <p className="text-center text-gray-400 py-8">データがありません</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={tooltipFmt} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>

                {/* カテゴリ詳細テーブル */}
                <div className="mt-4 border-t pt-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-left">
                        <th className="pb-2">カテゴリ</th>
                        <th className="pb-2 text-right">金額</th>
                        <th className="pb-2 text-right">割合</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((c, i) => {
                        const total = tableData.reduce((s, x) => s + x.amount, 0);
                        return (
                          <tr key={i} className="border-t border-gray-100">
                            <td className="py-2">
                              {catView === 'child'
                                ? `${c.parentCategory} / ${c.childCategory}`
                                : c.parentCategory}
                            </td>
                            <td className="py-2 text-right font-medium">{fmt(c.amount)}</td>
                            <td className="py-2 text-right text-gray-500">
                              {total > 0 ? `${((c.amount / total) * 100).toFixed(1)}%` : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}