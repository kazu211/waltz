import { createContext, useContext } from 'react';
import type { KakeiboRecord, CategoryRecord, MemberRecord, CreateRequest, UpdateRequest } from '../types';

export interface DataContextType {
  /** 全明細（日付の降順） */
  records: KakeiboRecord[];
  categories: CategoryRecord[];
  members: MemberRecord[];
  /** 初回の読み込み中（まだ一度もデータを取得できていない） */
  initialLoading: boolean;
  /** 読み込み中（「↻ 更新」による再取得も含む） */
  refreshing: boolean;
  /** 最後にデータを取得できた時刻 */
  lastUpdated: Date | null;
  /** 直近の読み込みエラー */
  error: string | null;
  /** スプレッドシートから全データを取り直す */
  refresh: () => Promise<void>;
  /** 保存に成功したら、そのレコードだけアプリ内のデータに反映する */
  createRecord: (data: CreateRequest) => Promise<KakeiboRecord>;
  updateRecord: (data: UpdateRequest) => Promise<KakeiboRecord>;
  deleteRecord: (id: string) => Promise<void>;
}

export const DataContext = createContext<DataContextType | null>(null);

export function useData(): DataContextType {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
