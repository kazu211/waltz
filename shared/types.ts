/** 収支タイプ */
type TransactionType = 'income' | 'expense';

/** 家計簿レコード */
interface KakeiboRecord {
  id: string;
  date: string; // yyyy-MM-dd
  type: TransactionType;
  parentCategory: string;
  childCategory: string;
  storeName: string;
  persons: string[];
  amount: number;
  memo: string;
}

/** 新規作成リクエスト（idは自動生成） */
type CreateRequest = Omit<KakeiboRecord, 'id'>;

/** 更新リクエスト（idは必須、他はオプション） */
type UpdateRequest = Pick<KakeiboRecord, 'id'> & Partial<Omit<KakeiboRecord, 'id'>>;

/** 削除リクエスト */
interface DeleteRequest {
  id: string;
}

/** 一覧取得リクエスト */
interface ListRequest {
  startDate?: string; // yyyy-MM-dd
  endDate?: string;   // yyyy-MM-dd
}

/** APIレスポンス */
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/** カテゴリレコード */
interface CategoryRecord {
  id: string;
  type: TransactionType;
  parentCategory: string;
  childCategory: string;
}

/** 月次サマリーリクエスト */
interface SummaryRequest {
  year: number;
  month: number;
}

/** 月次サマリーレスポンス */
interface SummaryResponse {
  year: number;
  month: number;
  income: number;
  expense: number;
  balance: number;
}

/** カテゴリ別集計リクエスト */
interface SummaryByCategoryRequest {
  year: number;
  month: number;
  type?: TransactionType;
}

/** カテゴリ別集計の各カテゴリ */
interface CategorySummaryItem {
  parentCategory: string;
  childCategory: string;
  amount: number;
}

/** カテゴリ別集計レスポンス */
interface SummaryByCategoryResponse {
  year: number;
  month: number;
  type: TransactionType;
  categories: CategorySummaryItem[];
}

/** 月次推移リクエスト */
interface MonthlyTrendRequest {
  year: number;
}

/** 月次推移の各月データ */
interface MonthlyTrendItem {
  month: number;
  income: number;
  expense: number;
  balance: number;
}

/** 月次推移レスポンス */
interface MonthlyTrendResponse {
  year: number;
  months: MonthlyTrendItem[];
}

/** メンバーレコード */
interface MemberRecord {
  id: string;
  name: string;
}

/** アクション種別 */
type ActionType =
  | 'create' | 'update' | 'delete' | 'list'
  | 'categoryList'
  | 'summary' | 'summaryByCategory' | 'monthlyTrend'
  | 'memberList';
