// =============================================================================
// Waltz - 家計簿API
// Google Apps Script Web App
// =============================================================================

const SHEET_NAME = '家計簿';
const CATEGORY_SHEET_NAME = 'カテゴリ';
const MEMBER_SHEET_NAME = 'メンバー';
const HEADERS: (keyof KakeiboRecord)[] = [
  'id', 'date', 'type', 'parentCategory', 'childCategory',
  'storeName', 'persons', 'amount', 'memo'
];
const CATEGORY_HEADERS: (keyof CategoryRecord)[] = [
  'id', 'parentCategory', 'childCategory'
];
const MEMBER_HEADERS: (keyof MemberRecord)[] = [
  'id', 'name'
];

// =============================================================================
// エントリーポイント
// =============================================================================

function doPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
  try {
    const action = e.parameter.action as ActionType | undefined;
    const body = e.postData?.contents ? JSON.parse(e.postData.contents) : {};

    // 認証チェック
    const authError = authenticate(body.authId, body.authPassword);
    if (authError) {
      return jsonResponse({ success: false, error: authError });
    }

    let result: ApiResponse;

    switch (action) {
      case 'create':
        result = handleCreate(body);
        break;
      case 'update':
        result = handleUpdate(body);
        break;
      case 'delete':
        result = handleDelete(body);
        break;
      case 'list':
        result = handleList(body);
        break;
      case 'categoryList':
        result = handleCategoryList();
        break;
      case 'summary':
        result = handleSummary(body);
        break;
      case 'summaryByCategory':
        result = handleSummaryByCategory(body);
        break;
      case 'monthlyTrend':
        result = handleMonthlyTrend(body);
        break;
      case 'memberList':
        result = handleMemberList();
        break;
      default:
        result = { success: false, error: `不明なアクション: ${action}` };
    }

    return jsonResponse(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : '予期しないエラーが発生しました';
    return jsonResponse({ success: false, error: message });
  }
}

// =============================================================================
// 認証
// =============================================================================

function authenticate(authId: string | undefined, authPassword: string | undefined): string | null {
  const props = PropertiesService.getScriptProperties();
  const storedId = props.getProperty('AUTH_ID');
  const storedPassword = props.getProperty('AUTH_PASSWORD');

  if (!storedId || !storedPassword) {
    // 認証情報が未設定の場合は認証をスキップ（初期セットアップ用）
    return null;
  }

  if (!authId || !authPassword) {
    return '認証エラー: authId と authPassword は必須です';
  }

  if (authId !== storedId || authPassword !== storedPassword) {
    return '認証エラー: ID またはパスワードが正しくありません';
  }

  return null;
}

// =============================================================================
// アクションハンドラー
// =============================================================================

function handleCreate(body: CreateRequest): ApiResponse<KakeiboRecord> {
  const validation = validateCreateRequest(body);
  if (validation) {
    return { success: false, error: validation };
  }

  const id = generateUUID();
  const record: KakeiboRecord = {
    id,
    date: body.date,
    type: body.type,
    parentCategory: body.parentCategory,
    childCategory: body.childCategory || '',
    storeName: body.storeName || '',
    persons: body.persons || [],
    amount: body.amount,
    memo: body.memo || '',
  };

  const sheet = getSheet();
  sheet.appendRow(recordToRow(record));

  return { success: true, data: record };
}

function handleUpdate(body: UpdateRequest): ApiResponse<KakeiboRecord> {
  if (!body.id) {
    return { success: false, error: 'id は必須です' };
  }

  const sheet = getSheet();
  const rowIndex = findRowIndexById(sheet, body.id);
  if (rowIndex === -1) {
    return { success: false, error: `id: ${body.id} のレコードが見つかりません` };
  }

  const existing = rowToRecord(sheet.getRange(rowIndex, 1, 1, HEADERS.length).getValues()[0]);

  const updated: KakeiboRecord = {
    id: existing.id,
    date: body.date ?? existing.date,
    type: body.type ?? existing.type,
    parentCategory: body.parentCategory ?? existing.parentCategory,
    childCategory: body.childCategory ?? existing.childCategory,
    storeName: body.storeName ?? existing.storeName,
    persons: body.persons ?? existing.persons,
    amount: body.amount ?? existing.amount,
    memo: body.memo ?? existing.memo,
  };

  const validation = validateRecord(updated);
  if (validation) {
    return { success: false, error: validation };
  }

  sheet.getRange(rowIndex, 1, 1, HEADERS.length).setValues([recordToRow(updated)]);

  return { success: true, data: updated };
}

function handleDelete(body: DeleteRequest): ApiResponse<{ id: string }> {
  if (!body.id) {
    return { success: false, error: 'id は必須です' };
  }

  const sheet = getSheet();
  const rowIndex = findRowIndexById(sheet, body.id);
  if (rowIndex === -1) {
    return { success: false, error: `id: ${body.id} のレコードが見つかりません` };
  }

  sheet.deleteRow(rowIndex);

  return { success: true, data: { id: body.id } };
}

function handleList(body: ListRequest): ApiResponse<KakeiboRecord[]> {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return { success: true, data: [] };
  }

  const dataRange = sheet.getRange(2, 1, lastRow - 1, HEADERS.length);
  const rows = dataRange.getValues();

  let records = rows.map(rowToRecord);

  if (body.startDate) {
    records = records.filter(r => r.date >= body.startDate!);
  }
  if (body.endDate) {
    records = records.filter(r => r.date <= body.endDate!);
  }

  // 日付の降順でソート
  records.sort((a, b) => b.date.localeCompare(a.date));

  return { success: true, data: records };
}

// =============================================================================
// カテゴリ・集計ハンドラー
// =============================================================================

function handleCategoryList(): ApiResponse<CategoryRecord[]> {
  const sheet = getCategorySheet();
  if (!sheet) {
    return { success: true, data: [] };
  }

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return { success: true, data: [] };
  }

  const rows = sheet.getRange(2, 1, lastRow - 1, CATEGORY_HEADERS.length).getValues();
  const categories: CategoryRecord[] = rows.map(row => ({
    id: String(row[0]),
    parentCategory: String(row[1]),
    childCategory: String(row[2]),
  }));

  return { success: true, data: categories };
}

function handleSummary(body: SummaryRequest): ApiResponse<SummaryResponse> {
  if (!body.year || !body.month) {
    return { success: false, error: 'year と month は必須です' };
  }

  const records = getRecordsByMonth(body.year, body.month);

  const income = records
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0);
  const expense = records
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);

  return {
    success: true,
    data: {
      year: body.year,
      month: body.month,
      income,
      expense,
      balance: income - expense,
    },
  };
}

function handleSummaryByCategory(body: SummaryByCategoryRequest): ApiResponse<SummaryByCategoryResponse> {
  if (!body.year || !body.month) {
    return { success: false, error: 'year と month は必須です' };
  }

  const type: TransactionType = body.type || 'expense';
  const records = getRecordsByMonth(body.year, body.month)
    .filter(r => r.type === type);

  // parentCategory + childCategory をキーにして集計
  const map: { [key: string]: CategorySummaryItem } = {};
  for (const r of records) {
    const key = `${r.parentCategory}::${r.childCategory}`;
    if (!map[key]) {
      map[key] = {
        parentCategory: r.parentCategory,
        childCategory: r.childCategory,
        amount: 0,
      };
    }
    map[key].amount += r.amount;
  }

  const categories = Object.values(map);
  // 金額の降順でソート
  categories.sort((a, b) => b.amount - a.amount);

  return {
    success: true,
    data: {
      year: body.year,
      month: body.month,
      type,
      categories,
    },
  };
}

function handleMonthlyTrend(body: MonthlyTrendRequest): ApiResponse<MonthlyTrendResponse> {
  if (!body.year) {
    return { success: false, error: 'year は必須です' };
  }

  const startDate = `${body.year}-01-01`;
  const endDate = `${body.year}-12-31`;

  const sheet = getSheet();
  const lastRow = sheet.getLastRow();

  let records: KakeiboRecord[] = [];
  if (lastRow > 1) {
    const rows = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
    records = rows.map(rowToRecord)
      .filter(r => r.date >= startDate && r.date <= endDate);
  }

  const months: MonthlyTrendItem[] = [];
  for (let m = 1; m <= 12; m++) {
    const prefix = `${body.year}-${String(m).padStart(2, '0')}`;
    const monthRecords = records.filter(r => r.date.startsWith(prefix));

    const income = monthRecords
      .filter(r => r.type === 'income')
      .reduce((sum, r) => sum + r.amount, 0);
    const expense = monthRecords
      .filter(r => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount, 0);

    months.push({
      month: m,
      income,
      expense,
      balance: income - expense,
    });
  }

  return {
    success: true,
    data: {
      year: body.year,
      months,
    },
  };
}

// =============================================================================
// メンバーハンドラー
// =============================================================================

function handleMemberList(): ApiResponse<MemberRecord[]> {
  const sheet = getMemberSheet();
  if (!sheet) {
    return { success: true, data: [] };
  }

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return { success: true, data: [] };
  }

  const rows = sheet.getRange(2, 1, lastRow - 1, MEMBER_HEADERS.length).getValues();
  const members: MemberRecord[] = rows.map(row => ({
    id: String(row[0]),
    name: String(row[1]),
  }));

  return { success: true, data: members };
}

// =============================================================================
// バリデーション
// =============================================================================

function validateCreateRequest(body: CreateRequest): string | null {
  if (!body.date) return 'date は必須です';
  if (!body.type) return 'type は必須です';
  if (!body.parentCategory) return 'parentCategory は必須です';
  if (body.amount === undefined || body.amount === null) return 'amount は必須です';

  return validateRecord({ id: 'temp', ...body } as KakeiboRecord);
}

function validateRecord(record: KakeiboRecord): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(record.date)) {
    return 'date は yyyy-MM-dd 形式で指定してください';
  }

  if (record.type !== 'income' && record.type !== 'expense') {
    return 'type は income または expense を指定してください';
  }

  if (typeof record.amount !== 'number' || record.amount < 0) {
    return 'amount は0以上の数値を指定してください';
  }

  return null;
}

// =============================================================================
// ユーティリティ
// =============================================================================

function getSheet(): GoogleAppsScript.Spreadsheet.Sheet {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error(`「${SHEET_NAME}」シートが見つかりません。スプレッドシートに手動で作成してください。`);
  }

  return sheet;
}

function getCategorySheet(): GoogleAppsScript.Spreadsheet.Sheet | null {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(CATEGORY_SHEET_NAME);
}

function getMemberSheet(): GoogleAppsScript.Spreadsheet.Sheet | null {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(MEMBER_SHEET_NAME);
}

function getRecordsByMonth(year: number, month: number): KakeiboRecord[] {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return [];
  }

  const rows = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  return rows.map(rowToRecord).filter(r => r.date.startsWith(prefix));
}

function findRowIndexById(sheet: GoogleAppsScript.Spreadsheet.Sheet, id: string): number {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) {
      return i + 2; // ヘッダー行分+1、0-based→1-basedで+1
    }
  }
  return -1;
}

function recordToRow(record: KakeiboRecord): unknown[] {
  return [
    record.id,
    record.date,
    record.type,
    record.parentCategory,
    record.childCategory,
    record.storeName,
    Array.isArray(record.persons) ? record.persons.join(',') : record.persons,
    record.amount,
    record.memo,
  ];
}

function rowToRecord(row: unknown[]): KakeiboRecord {
  return {
    id: String(row[0]),
    date: formatDate(row[1]),
    type: String(row[2]) as TransactionType,
    parentCategory: String(row[3]),
    childCategory: String(row[4]),
    storeName: String(row[5]),
    persons: String(row[6]).split(',').filter(p => p.trim() !== ''),
    amount: Number(row[7]),
    memo: String(row[8]),
  };
}

function formatDate(value: unknown): string {
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(value);
}

function generateUUID(): string {
  return Utilities.getUuid();
}

function jsonResponse(data: ApiResponse): GoogleAppsScript.Content.TextOutput {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
