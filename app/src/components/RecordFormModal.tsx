import { useState, useEffect, type FormEvent } from 'react';
import type { KakeiboRecord, CategoryRecord, MemberRecord, TransactionType, CreateRequest, UpdateRequest } from '../types';

interface Props {
  record: KakeiboRecord | null; // null = 新規作成
  categories: CategoryRecord[];
  members: MemberRecord[];
  onSave: (data: CreateRequest | UpdateRequest) => Promise<void>;
  onClose: () => void;
}

export default function RecordFormModal({ record, categories, members, onSave, onClose }: Props) {
  const [date, setDate] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [parentCategory, setParentCategory] = useState('');
  const [childCategory, setChildCategory] = useState('');
  const [storeName, setStoreName] = useState('');
  const [persons, setPersons] = useState<string[]>([]);
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 編集時に初期値をセット
  useEffect(() => {
    if (record) {
      setDate(record.date);
      setType(record.type);
      setParentCategory(record.parentCategory);
      setChildCategory(record.childCategory);
      setStoreName(record.storeName);
      setPersons([...record.persons]);
      setAmount(String(record.amount));
      setMemo(record.memo);
    } else {
      const today = new Date();
      setDate(today.toISOString().slice(0, 10));
    }
  }, [record]);

  // 親カテゴリのユニーク一覧
  // 選択中の種別に対応するカテゴリのみ表示
  const filteredCategories = categories.filter(c => c.type === type);
  const parentCategories = [...new Set(filteredCategories.map(c => c.parentCategory))];

  // 選択中の親カテゴリに属する子カテゴリ一覧
  const childCategories = filteredCategories
    .filter(c => c.parentCategory === parentCategory && c.childCategory !== '')
    .map(c => c.childCategory);

  // 親カテゴリ変更時に子カテゴリをリセット
  const handleParentChange = (value: string) => {
    setParentCategory(value);
    setChildCategory('');
  };

  // 種別変更時にカテゴリもリセット
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setParentCategory('');
    setChildCategory('');
  };

  const togglePerson = (name: string) => {
    setPersons(prev =>
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name],
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!date) { setError('日付を入力してください'); return; }
    if (!parentCategory) { setError('親カテゴリを選択してください'); return; }
    const amountNum = Number(amount);
    if (!amount || isNaN(amountNum) || amountNum < 0) { setError('金額を正しく入力してください'); return; }

    setLoading(true);
    try {
      if (record) {
        // 更新
        const data: UpdateRequest = {
          id: record.id,
          date, type, parentCategory, childCategory, storeName, persons,
          amount: amountNum, memo,
        };
        await onSave(data);
      } else {
        // 新規作成
        const data: CreateRequest = {
          date, type, parentCategory, childCategory, storeName, persons,
          amount: amountNum, memo,
        };
        await onSave(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-5 py-3 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">
            {record ? 'レコード編集' : '新規作成'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* 日付 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">日付 *</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 種別 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">種別 *</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="radio" name="type" value="expense" checked={type === 'expense'} onChange={() => handleTypeChange('expense')} className="accent-red-500" />
                <span className="text-red-600">支出</span>
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="radio" name="type" value="income" checked={type === 'income'} onChange={() => handleTypeChange('income')} className="accent-green-500" />
                <span className="text-green-600">収入</span>
              </label>
            </div>
          </div>

          {/* 親カテゴリ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">親カテゴリ *</label>
            <select
              value={parentCategory}
              onChange={e => handleParentChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">選択してください</option>
              {parentCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* 子カテゴリ */}
          {childCategories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">子カテゴリ</label>
              <select
                value={childCategory}
                onChange={e => setChildCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">なし</option>
                {childCategories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {/* 店名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">店名</label>
            <input
              type="text"
              value={storeName}
              onChange={e => setStoreName(e.target.value)}
              placeholder="任意"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* メンバー */}
          {members.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">使用者</label>
              <div className="flex flex-wrap gap-2">
                {members.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => togglePerson(m.name)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      persons.includes(m.name)
                        ? 'bg-blue-100 border-blue-400 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 金額 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">金額 *</label>
            <input
              type="number"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* メモ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
            <input
              type="text"
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="任意"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          {/* ボタン */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
