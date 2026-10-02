import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';
import { DataContext } from './data-context';
import type { KakeiboRecord, CategoryRecord, MemberRecord, CreateRequest, UpdateRequest } from '../types';

const sortByDateDesc = (records: KakeiboRecord[]) => [...records].sort((a, b) => b.date.localeCompare(a.date));

/**
 * 明細・カテゴリ・メンバーをアプリ起動時に1回だけ取得して保持する。
 * 各画面はここから表示し、画面切り替えでは通信しない。
 * 保持したデータはブラウザを閉じると消える。
 */
export default function DataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [records, setRecords] = useState<KakeiboRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [recs, cats, mems] = await Promise.all([api.list(), api.categoryList(), api.memberList()]);
      setRecords(sortByDateDesc(recs));
      setCategories(cats);
      setMembers(mems);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの読み込みに失敗しました');
    } finally {
      setRefreshing(false);
    }
  }, []);

  // ログインしたら取得、ログアウトしたら破棄
  useEffect(() => {
    if (isAuthenticated) {
      refresh();
      return;
    }
    setRecords([]);
    setCategories([]);
    setMembers([]);
    setLastUpdated(null);
    setError(null);
  }, [isAuthenticated, refresh]);

  const createRecord = useCallback(async (data: CreateRequest) => {
    const created = await api.create(data);
    setRecords(prev => sortByDateDesc([created, ...prev]));
    return created;
  }, []);

  const updateRecord = useCallback(async (data: UpdateRequest) => {
    const updated = await api.update(data);
    setRecords(prev => sortByDateDesc(prev.map(r => (r.id === updated.id ? updated : r))));
    return updated;
  }, []);

  const deleteRecord = useCallback(async (id: string) => {
    await api.delete(id);
    setRecords(prev => prev.filter(r => r.id !== id));
  }, []);

  return (
    <DataContext.Provider
      value={{
        records,
        categories,
        members,
        // 初回取得の完了（成功 or 失敗）までは読み込み中として扱う
        initialLoading: isAuthenticated && lastUpdated === null && error === null,
        refreshing,
        lastUpdated,
        error,
        refresh,
        createRecord,
        updateRecord,
        deleteRecord,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
