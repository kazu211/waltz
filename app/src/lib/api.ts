import type {
  ApiResponse,
  KakeiboRecord,
  CategoryRecord,
  MemberRecord,
  SummaryResponse,
  SummaryByCategoryResponse,
  MonthlyTrendResponse,
  CreateRequest,
  UpdateRequest,
  ListRequest,
  TransactionType,
} from '../types';
import {
  mockRecords,
  mockCategories,
  mockMembers,
  getMockSummary,
  getMockSummaryByCategory,
  getMockMonthlyTrend,
} from '../mocks/data';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const API_URL = import.meta.env.VITE_API_URL ?? '';

const MOCK_AUTH_ID = 'demo';
const MOCK_AUTH_PASSWORD = 'demo';

function getCredentials(): { authId: string; authPassword: string } {
  const authId = localStorage.getItem('waltz_auth_id') ?? '';
  const authPassword = localStorage.getItem('waltz_auth_password') ?? '';
  return { authId, authPassword };
}

async function request<T>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  const { authId, authPassword } = getCredentials();
  const response = await fetch(`${API_URL}?action=${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authId, authPassword, ...body }),
    redirect: 'follow',
  });
  const json: ApiResponse<T> = await response.json();
  if (!json.success) {
    throw new Error(json.error ?? '不明なエラーが発生しました');
  }
  return json.data as T;
}

/** ログイン検証（モック時はモック認証、本番時はAPI疎通確認） */
export async function verifyLogin(authId: string, authPassword: string): Promise<void> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 500));
    if (authId !== MOCK_AUTH_ID || authPassword !== MOCK_AUTH_PASSWORD) {
      throw new Error('ID またはパスワードが正しくありません');
    }
    return;
  }
  // 本番: memberList で疎通確認（軽量なリクエスト）
  const response = await fetch(`${API_URL}?action=memberList`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authId, authPassword }),
    redirect: 'follow',
  });
  const json: ApiResponse = await response.json();
  if (!json.success) {
    throw new Error(json.error ?? '認証に失敗しました');
  }
}

// モック用のインメモリストア
let mockStore = [...mockRecords];

export const api = {
  // 家計簿CRUD
  async list(params?: ListRequest): Promise<KakeiboRecord[]> {
    if (USE_MOCK) {
      let records = [...mockStore];
      if (params?.startDate) records = records.filter(r => r.date >= params.startDate!);
      if (params?.endDate) records = records.filter(r => r.date <= params.endDate!);
      records.sort((a, b) => b.date.localeCompare(a.date));
      return records;
    }
    return request<KakeiboRecord[]>('list', params as Record<string, unknown>);
  },

  async create(data: CreateRequest): Promise<KakeiboRecord> {
    if (USE_MOCK) {
      const record: KakeiboRecord = {
        id: `r${Date.now()}`,
        ...data,
        childCategory: data.childCategory || '',
        storeName: data.storeName || '',
        persons: data.persons || [],
        memo: data.memo || '',
      };
      mockStore.unshift(record);
      return record;
    }
    return request<KakeiboRecord>('create', data as unknown as Record<string, unknown>);
  },

  async update(data: UpdateRequest): Promise<KakeiboRecord> {
    if (USE_MOCK) {
      const idx = mockStore.findIndex(r => r.id === data.id);
      if (idx === -1) throw new Error('レコードが見つかりません');
      mockStore[idx] = { ...mockStore[idx], ...data };
      return mockStore[idx];
    }
    return request<KakeiboRecord>('update', data as unknown as Record<string, unknown>);
  },

  async delete(id: string): Promise<{ id: string }> {
    if (USE_MOCK) {
      mockStore = mockStore.filter(r => r.id !== id);
      return { id };
    }
    return request<{ id: string }>('delete', { id });
  },

  // カテゴリ
  async categoryList(): Promise<CategoryRecord[]> {
    if (USE_MOCK) return mockCategories;
    return request<CategoryRecord[]>('categoryList');
  },

  // 集計
  async summary(year: number, month: number): Promise<SummaryResponse> {
    if (USE_MOCK) return getMockSummary(year, month);
    return request<SummaryResponse>('summary', { year, month });
  },

  async summaryByCategory(year: number, month: number, type?: TransactionType): Promise<SummaryByCategoryResponse> {
    if (USE_MOCK) return getMockSummaryByCategory(year, month, type ?? 'expense');
    return request<SummaryByCategoryResponse>('summaryByCategory', { year, month, type });
  },

  async monthlyTrend(year: number): Promise<MonthlyTrendResponse> {
    if (USE_MOCK) return getMockMonthlyTrend(year);
    return request<MonthlyTrendResponse>('monthlyTrend', { year });
  },

  // メンバー
  async memberList(): Promise<MemberRecord[]> {
    if (USE_MOCK) return mockMembers;
    return request<MemberRecord[]>('memberList');
  },
};
