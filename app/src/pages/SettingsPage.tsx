import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { MemberRecord, CategoryRecord } from '../types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export default function SettingsPage() {
  const { logout } = useAuth();
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.memberList(), api.categoryList()])
      .then(([m, c]) => { setMembers(m); setCategories(c); })
      .finally(() => setLoading(false));
  }, []);

  // カテゴリを種別→親カテゴリでグループ化
  const grouped = categories.reduce<Record<string, Record<string, string[]>>>((acc, c) => {
    const t = c.type === 'income' ? '収入' : '支出';
    if (!acc[t]) acc[t] = {};
    if (!acc[t][c.parentCategory]) acc[t][c.parentCategory] = [];
    if (c.childCategory) acc[t][c.parentCategory].push(c.childCategory);
    return acc;
  }, {});

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">設定</h2>

      {loading ? (
        <div className="text-center py-12 text-gray-500">読み込み中...</div>
      ) : (
        <div className="space-y-6">
          {/* アプリ情報 */}
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="text-base font-bold text-gray-800 mb-3">アプリ情報</h3>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-500">モード</dt>
                <dd className={USE_MOCK ? 'text-amber-600' : 'text-green-600'}>
                  {USE_MOCK ? 'モック（デモ）' : '本番'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">バージョン</dt>
                <dd className="text-gray-800">1.0.0</dd>
              </div>
            </dl>
          </div>

          {/* メンバー一覧 */}
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="text-base font-bold text-gray-800 mb-3">メンバー</h3>
            {members.length === 0 ? (
              <p className="text-sm text-gray-400">メンバーが登録されていません</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {members.map(m => (
                  <span key={m.id} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                    {m.name}
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-3">
              メンバーの追加・削除はスプレッドシートの「メンバー」シートで行ってください。
            </p>
          </div>

          {/* カテゴリ一覧 */}
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="text-base font-bold text-gray-800 mb-3">カテゴリ</h3>
            {categories.length === 0 ? (
              <p className="text-sm text-gray-400">カテゴリが登録されていません</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(grouped).map(([typeName, parents]) => (
                  <div key={typeName}>
                    <h4 className={`text-sm font-medium mb-2 ${typeName === '収入' ? 'text-green-600' : 'text-red-600'}`}>
                      {typeName}
                    </h4>
                    <div className="space-y-1">
                      {Object.entries(parents).map(([parent, children]) => (
                        <div key={parent} className="text-sm">
                          <span className="font-medium text-gray-700">{parent}</span>
                          {children.length > 0 && (
                            <span className="text-gray-400 ml-2">
                              ({children.join(', ')})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-3">
              カテゴリの追加・編集・削除はスプレッドシートの「カテゴリ」シートで行ってください。
            </p>
          </div>

          {/* ログアウト */}
          <div className="bg-white rounded-lg shadow p-5">
            <button
              onClick={logout}
              className="w-full py-2 px-4 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
