import { useEffect, useState, useMemo } from 'react';
import {
  ComposedChart, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import { api } from '../lib/api';
import type { MonthlyTrendResponse, KakeiboRecord, TransactionType } from '../types';

const CAT_COLORS = [
  '#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6',
];

type CatTrendData = { months: { month: number; categories: { parentCategory: string; amount: number }[] }[] };

export default function AnnualTrendPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<MonthlyTrendResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [catType, setCatType] = useState<TransactionType>('expense');
  const [catTrend, setCatTrend] = useState<CatTrendData | null>(null);
  const [catLoading, setCatLoading] = useState(true);

  const [expenseTrend, setExpenseTrend] = useState<CatTrendData | null>(null);
  const [expenseLoading, setExpenseLoading] = useState(true);

  const [records, setRecords] = useState<KakeiboRecord[]>([]);
  const [person, setPerson] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    Promise.all([
      api.monthlyTrend(year),
      api.list({ startDate, endDate }),
    ]).then(([trend, recs]) => {
      setData(trend);
      setRecords(recs);
    }).finally(() => setLoading(false));
  }, [year]);

  useEffect(() => {
    setCatLoading(true);
    api.categoryMonthlyTrend(year, catType)
      .then(setCatTrend)
      .finally(() => setCatLoading(false));
  }, [year, catType]);

  useEffect(() => {
    setExpenseLoading(true);
    api.categoryMonthlyTrend(year, 'expense')
      .then(setExpenseTrend)
      .finally(() => setExpenseLoading(false));
  }, [year]);

  const persons = useMemo(() => {
    const set = new Set<string>();
    for (const r of records) for (const p of r.persons) set.add(p);
    return Array.from(set).sort();
  }, [records]);

  const personData = useMemo(() => {
    if (!person) return null;
    const filtered = records.filter(r => r.persons.includes(person));

    const months = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const mRecs = filtered.filter(r => new Date(r.date).getMonth() + 1 === m);
      const income = mRecs.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
      const expense = mRecs.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
      return { month: m, income, expense, balance: income - expense };
    });
    const trend: MonthlyTrendResponse = { year, months };

    const buildCatTrend = (tt: TransactionType): CatTrendData => ({
      months: months.map(m => {
        const mRecs = filtered.filter(r => new Date(r.date).getMonth() + 1 === m.month && r.type === tt);
        const catMap: Record<string, number> = {};
        for (const r of mRecs) catMap[r.parentCategory] = (catMap[r.parentCategory] ?? 0) + r.amount;
        return { month: m.month, categories: Object.entries(catMap).map(([parentCategory, amount]) => ({ parentCategory, amount })) };
      }),
    });

    return { trend, catTrend: buildCatTrend(catType), expenseTrend: buildCatTrend('expense') };
  }, [person, records, year, catType]);

  const activeData = personData ? personData.trend : data;
  const activeCatTrend = personData ? personData.catTrend : catTrend;
  const activeExpenseTrend = personData ? personData.expenseTrend : expenseTrend;
  const activeCatLoading = person ? false : catLoading;
  const activeExpenseLoading = person ? false : expenseLoading;

  const fmt = (n: number) => `¥${n.toLocaleString('ja-JP')}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tooltipFmt = (v: any) => fmt(Number(v));

  const composedData = activeData?.months.map(m => ({
    name: `${m.month}月`,
    収入: m.income,
    支出: m.expense,
    貯蓄率: m.income > 0 ? Math.round((m.balance / m.income) * 100) : 0,
  })) ?? [];

  const totals = activeData?.months.reduce(
    (acc, m) => ({ income: acc.income + m.income, expense: acc.expense + m.expense }),
    { income: 0, expense: 0 },
  );

  const allCatNames = (() => {
    if (!activeCatTrend) return [];
    const names = new Set<string>();
    for (const m of activeCatTrend.months) for (const c of m.categories) names.add(c.parentCategory);
    return [...names];
  })();

  const catChartData = activeCatTrend?.months.map(m => {
    const row: Record<string, string | number> = { name: `${m.month}月` };
    for (const name of allCatNames) {
      const found = m.categories.find(c => c.parentCategory === name);
      row[name] = found?.amount ?? 0;
    }
    return row;
  }) ?? [];

  const expenseCatNames = (() => {
    if (!activeExpenseTrend) return [];
    const names = new Set<string>();
    for (const m of activeExpenseTrend.months) for (const c of m.categories) names.add(c.parentCategory);
    return [...names];
  })();

  const stackedData = activeExpenseTrend?.months.map(m => {
    const row: Record<string, string | number> = { name: `${m.month}月` };
    for (const name of expenseCatNames) {
      const found = m.categories.find(c => c.parentCategory === name);
      row[name] = found?.amount ?? 0;
    }
    return row;
  }) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => setYear(y => y - 1)} className="p-2 hover:bg-gray-200 rounded-md text-gray-600 transition-colors">◀</button>
          <h2 className="text-xl font-bold text-gray-900">
            {year}年
            {person && <span className="text-sm font-normal text-gray-500 ml-2">（{person}）</span>}
          </h2>
          <button onClick={() => setYear(y => y + 1)} className="p-2 hover:bg-gray-200 rounded-md text-gray-600 transition-colors">▶</button>
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

      {loading ? (
        <div className="text-center py-12 text-gray-500">読み込み中...</div>
      ) : (
        <div className="space-y-6">
          {totals && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-lg shadow px-4 py-3 text-center">
                <p className="text-xs text-gray-500">年間収入</p>
                <p className="text-lg font-bold text-green-600">{fmt(totals.income)}</p>
              </div>
              <div className="bg-white rounded-lg shadow px-4 py-3 text-center">
                <p className="text-xs text-gray-500">年間支出</p>
                <p className="text-lg font-bold text-red-600">{fmt(totals.expense)}</p>
              </div>
              <div className="bg-white rounded-lg shadow px-4 py-3 text-center">
                <p className="text-xs text-gray-500">年間収支</p>
                <p className={`text-lg font-bold ${totals.income - totals.expense >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                  {fmt(totals.income - totals.expense)}
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="text-base font-bold text-gray-800 mb-4">月次収支・貯蓄率</h3>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={composedData} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="amount" tickFormatter={v => `¥${Number(v).toLocaleString('ja-JP')}`} tick={{ fontSize: 12 }} />
                <YAxis yAxisId="rate" orientation="right" tickFormatter={v => `${v}%`} tick={{ fontSize: 12 }} domain={[-20, 100]} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={(value: any, name: any) => name === '貯蓄率' ? `${value}%` : tooltipFmt(value)} />
                <Legend />
                <Bar yAxisId="amount" dataKey="収入" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar yAxisId="amount" dataKey="支出" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                <Line yAxisId="rate" type="monotone" dataKey="貯蓄率" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="text-base font-bold text-gray-800 mb-4">支出カテゴリ構成</h3>
            {activeExpenseLoading ? (
              <div className="text-center py-8 text-gray-500">読み込み中...</div>
            ) : expenseCatNames.length === 0 ? (
              <p className="text-center text-gray-400 py-8">データがありません</p>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={stackedData} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={v => `¥${Number(v).toLocaleString('ja-JP')}`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={tooltipFmt} />
                  <Legend />
                  {expenseCatNames.map((name, i) => (
                    <Bar key={name} dataKey={name} stackId="expense" fill={CAT_COLORS[i % CAT_COLORS.length]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-base font-bold text-gray-800">カテゴリ別月次推移</h3>
              <div className="flex gap-1">
                <button onClick={() => setCatType('expense')} className={`px-3 py-1 text-xs rounded-full border transition-colors ${catType === 'expense' ? 'bg-red-100 border-red-400 text-red-700' : 'bg-white border-gray-300 text-gray-600'}`}>支出</button>
                <button onClick={() => setCatType('income')} className={`px-3 py-1 text-xs rounded-full border transition-colors ${catType === 'income' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-white border-gray-300 text-gray-600'}`}>収入</button>
              </div>
            </div>
            {activeCatLoading ? (
              <div className="text-center py-8 text-gray-500">読み込み中...</div>
            ) : allCatNames.length === 0 ? (
              <p className="text-center text-gray-400 py-8">データがありません</p>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={catChartData} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={v => `¥${Number(v).toLocaleString('ja-JP')}`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={tooltipFmt} />
                  <Legend />
                  {allCatNames.map((name, i) => (
                    <Line key={name} type="monotone" dataKey={name} stroke={CAT_COLORS[i % CAT_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">月</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">収入</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">支出</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">収支</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">貯蓄率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeData?.months.map(m => {
                  const rate = m.income > 0 ? Math.round((m.balance / m.income) * 100) : null;
                  return (
                    <tr key={m.month} className={`hover:bg-gray-50 ${m.income === 0 && m.expense === 0 ? 'text-gray-300' : ''}`}>
                      <td className="px-4 py-3">{m.month}月</td>
                      <td className="px-4 py-3 text-right text-green-600">{fmt(m.income)}</td>
                      <td className="px-4 py-3 text-right text-red-600">{fmt(m.expense)}</td>
                      <td className={`px-4 py-3 text-right font-medium ${m.balance >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>{fmt(m.balance)}</td>
                      <td className={`px-4 py-3 text-right ${rate !== null && rate < 0 ? 'text-amber-600' : rate !== null && rate < 20 ? 'text-yellow-600' : 'text-green-600'}`}>{rate !== null ? `${rate}%` : '-'}</td>
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