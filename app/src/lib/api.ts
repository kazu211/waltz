import type {
  ApiResponse,
  KakeiboRecord,
  CategoryRecord,
  MemberRecord,
  CreateRequest,
  UpdateRequest,
  ListRequest,
} from '../types';
import {
  mockRecords,
  mockCategories,
  mockMembers,
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

/** 読み込み失敗時の自動リトライ間隔（この回数だけやり直す） */
const RETRY_DELAYS_MS = [500, 1000, 2000];
const CONNECTION_ERROR_MESSAGE = 'サーバーとの通信に失敗しました。時間をおいてもう一度お試しください';

/**
 * サーバーの処理結果を受け取れなかったエラー（通信断や、GAS が JSON ではなくエラーページを返した場合）。
 * API が返す業務エラー（success: false）とは区別し、こちらだけリトライ対象にする。
 */
export class ConnectionError extends Error {}

async function send<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  let text: string;
  try {
    const response = await fetch(`${API_URL}?action=${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });
    text = await response.text();
  } catch {
    throw new ConnectionError(CONNECTION_ERROR_MESSAGE);
  }

  let json: ApiResponse<T>;
  try {
    json = JSON.parse(text);
  } catch {
    // GAS が混み合っていると JSON ではなく HTML のエラーページが返る
    throw new ConnectionError(CONNECTION_ERROR_MESSAGE);
  }
  if (!json.success) {
    throw new Error(json.error ?? '不明なエラーが発生しました');
  }
  return json.data as T;
}

/**
 * API 呼び出し。
 * retry: true は読み込み専用。書き込みは保存済みか判別できないままやり直すと二重登録になり得るため指定しない。
 */
async function request<T>(
  action: string,
  body: Record<string, unknown> = {},
  { retry = false }: { retry?: boolean } = {},
): Promise<T> {
  const payload = { ...getCredentials(), ...body };
  for (let attempt = 0; ; attempt++) {
    try {
      return await send<T>(action, payload);
    } catch (err) {
      if (!retry || !(err instanceof ConnectionError) || attempt >= RETRY_DELAYS_MS.length) throw err;
      await new Promise(r => setTimeout(r, RETRY_DELAYS_MS[attempt]));
    }
  }
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
  // 本番: memberList で疎通確認（軽量なリクエスト）。入力された認証情報で送る
  await request('memberList', { authId, authPassword }, { retry: true });
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
    return request<KakeiboRecord[]>('list', params as Record<string, unknown>, { retry: true });
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
    return request<CategoryRecord[]>('categoryList', {}, { retry: true });
  },

  // メンバー
  async memberList(): Promise<MemberRecord[]> {
    if (USE_MOCK) return mockMembers;
    return request<MemberRecord[]>('memberList', {}, { retry: true });
  },
};
