import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../lib/api';
import type { KakeiboRecord, CategoryRecord, MemberRecord, CreateRequest, UpdateRequest, ScanReceiptResponse } from '../types';
import RecordFormModal from '../components/RecordFormModal';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';

export default function MonthlyListPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [records, setRecords] = useState<KakeiboRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [formTarget, setFormTarget] = useState<KakeiboRecord | null | undefined>(undefined); // undefined=閉, null=新規, record=編集
  const [formInitialValues, setFormInitialValues] = useState<{ date?: string; storeName?: string; amount?: number; memo?: string } | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<KakeiboRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sortAsc, setSortAsc] = useState(false); // false=降順（新しい順）
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [recs, cats, mems] = await Promise.all([
        api.list({ startDate, endDate }),
        api.categoryList(),
        api.memberList(),
      ]);
      setRecords(recs);
      setCategories(cats);
      setMembers(mems);
    } catch {
      // エラーは api.ts 側で throw 済み
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 保存
  const handleSave = async (data: CreateRequest | UpdateRequest) => {
    if ('id' in data && data.id) {
      await api.update(data as UpdateRequest);
    } else {
      await api.create(data as CreateRequest);
    }
    setFormTarget(undefined);
    await fetchData();
  };

  // 削除
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(deleteTarget.id);
      setDeleteTarget(null);
      await fetchData();
    } finally {
      setDeleting(false);
    }
  };

  // レシートスキャン
  const handleReceiptScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // リセットして同じファイルも再選択可能に
    e.target.value = '';

    setScanning(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // data:image/jpeg;base64,XXXX → XXXX 部分を取得
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const result: ScanReceiptResponse = await api.scanReceipt(base64, file.type);

      // スキャン結果でフォームをプリフィルして開く
      setFormInitialValues({
        date: result.date || undefined,
        storeName: result.storeName || undefined,
        amount: result.amount || undefined,
        memo: result.items.length > 0 ? result.items.join('、') : undefined,
      });
      setFormTarget(null); // 新規作成モードで開く
    } catch (err) {
      alert(err instanceof Error ? err.message : 'レシートの読み取りに失敗しました');
    } finally {
      setScanning(false);
    }
  };

  // 通常の新規作成
  const openNewForm = () => {
    setFormInitialValues(undefined);
    setFormTarget(null);
  };

  const fmt = (n: number) => n.toLocaleString('ja-JP');

  // 収支サマリー
  const income = records.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
  const expense = records.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);

  // ソート
  const sortedRecords = [...records].sort((a, b) =>
    sortAsc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date),
  );

  return (
    <div>
      {/* ヘッダー: 月ナビ + 追加ボタン */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="px-2 py-1.5 border border-gray-300 rounded text-sm font-bold bg-white"
          >
            {Array.from({ length: 7 }, (_, i) => now.getFullYear() - 5 + i).map(y => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="px-2 py-1.5 border border-gray-300 rounded text-sm font-bold bg-white"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{m}月</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={scanning}
            className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-md hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {scanning ? '📷 読取中...' : '📷 レシート'}
          </button>
          <button
            onClick={openNewForm}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            ＋ 追加
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleReceiptScan}
            className="hidden"
          />
        </div>
      </div>

      {/* サマリー */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-lg shadow px-4 py-3 text-center">
          <p className="text-xs text-gray-500">収入</p>
          <p className="text-lg font-bold text-green-600">¥{fmt(income)}</p>
        </div>
        <div className="bg-white rounded-lg shadow px-4 py-3 text-center">
          <p className="text-xs text-gray-500">支出</p>
          <p className="text-lg font-bold text-red-600">¥{fmt(expense)}</p>
        </div>
        <div className="bg-white rounded-lg shadow px-4 py-3 text-center">
          <p className="text-xs text-gray-500">収支</p>
          <p className={`text-lg font-bold ${income - expense >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
            ¥{fmt(income - expense)}
          </p>
        </div>
      </div>

      {/* レコード一覧 */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">読み込み中...</div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
          データがありません
        </div>
      ) : (
        <>
          {/* デスクトップ: テーブル表示 */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th
                    className="px-4 py-3 text-left font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700"
                    onClick={() => setSortAsc(prev => !prev)}
                  >
                    日付 {sortAsc ? '▲' : '▼'}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">種別</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">カテゴリ</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">店名</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">使用者</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">金額</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">メモ</th>
                  <th className="px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedRecords.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">{r.date.slice(5)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        r.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {r.type === 'income' ? '収入' : '支出'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.parentCategory}{r.childCategory ? ` / ${r.childCategory}` : ''}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{r.storeName || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{r.persons.length > 0 ? r.persons.join(', ') : '-'}</td>
                    <td className={`px-4 py-3 text-right font-medium whitespace-nowrap ${
                      r.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ¥{fmt(r.amount)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 truncate max-w-[120px]">{r.memo || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setFormTarget(r)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="編集"
                        >✏️</button>
                        <button
                          onClick={() => setDeleteTarget(r)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="削除"
                        >🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* モバイル: カード表示 */}
          <div className="md:hidden space-y-2">
            {sortedRecords.map(r => (
              <div key={r.id} className="bg-white rounded-lg shadow px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{r.date.slice(5)}</span>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      r.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {r.type === 'income' ? '収入' : '支出'}
                    </span>
                  </div>
                  <p className={`text-base font-bold ${
                    r.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ¥{fmt(r.amount)}
                  </p>
                </div>
                <p className="text-sm text-gray-800 mt-1">
                  {r.parentCategory}{r.childCategory ? ` / ${r.childCategory}` : ''}
                  {r.storeName ? ` — ${r.storeName}` : ''}
                </p>
                {(r.memo || r.persons.length > 0) && (
                  <p className="text-xs text-gray-400 mt-1">
                    {r.persons.length > 0 && <span>{r.persons.join(', ')}</span>}
                    {r.persons.length > 0 && r.memo && ' / '}
                    {r.memo}
                  </p>
                )}
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => setFormTarget(r)}
                    className="text-xs text-blue-600 hover:underline"
                  >編集</button>
                  <button
                    onClick={() => setDeleteTarget(r)}
                    className="text-xs text-red-600 hover:underline"
                  >削除</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 作成/編集モーダル */}
      {formTarget !== undefined && (
        <RecordFormModal
          record={formTarget}
          categories={categories}
          members={members}
          initialValues={formInitialValues}
          onSave={handleSave}
          onClose={() => { setFormTarget(undefined); setFormInitialValues(undefined); }}
        />
      )}

      {/* レシートスキャン中オーバーレイ */}
      {scanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg px-8 py-6 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-gray-700 font-medium">レシートを読み取り中...</p>
            <p className="text-xs text-gray-400 mt-1">AI が画像を解析しています</p>
          </div>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      {deleteTarget && (
        <DeleteConfirmDialog
          message={`${deleteTarget.date} ${deleteTarget.parentCategory} ¥${fmt(deleteTarget.amount)} を削除しますか？`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
