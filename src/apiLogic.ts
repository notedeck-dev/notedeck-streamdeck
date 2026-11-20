// 純ロジック: URL の検査、応答とエラーの読み取り、設定画面に渡す形への変換。Stream Deck に触れない (vitest で検査)。

export class NoteDeckApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "NoteDeckApiError";
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** 本体の host guard が通すのと同じ host (127.0.0.1 / localhost / [::1]) の http(s) だけを true にする */
export function isLoopbackUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  return ["127.0.0.1", "localhost", "[::1]"].includes(parsed.hostname);
}

/**
 * エラー応答の本文は route で形が違う。
 * - `POST /api/capabilities/{id}/execute`: `{ ok: false, code, error }` (error が文)
 * - それ以外: `{ error: CODE, message }` (error が大文字のコード)
 */
export function errorFromBody(status: number, body: unknown): { code: string; message: string } {
  const data = isRecord(body) ? body : {};
  if (typeof data.code === "string") {
    return { code: data.code, message: typeof data.error === "string" ? data.error : `HTTP ${status}` };
  }
  if (typeof data.error === "string" && typeof data.message === "string") {
    return { code: data.error.toLowerCase(), message: data.message };
  }
  return {
    code: status === 401 ? "unauthorized" : "http_error",
    message: typeof data.error === "string" ? data.error : `HTTP ${status}`,
  };
}

/** execute の 200 応答 `{ ok: true, result }` から result を取り出す。その形でなければ成功扱いにしない */
export function resultFromBody(body: unknown): unknown {
  if (!isRecord(body) || body.ok !== true) {
    throw new NoteDeckApiError(200, "bad_response", "Unexpected response (is the API URL really NoteDeck?)");
  }
  return body.result;
}

/** Run Capability の Params 欄。空なら引数なし、JSON の object 以外は実行しない */
export function parseParams(raw: string | undefined): Record<string, unknown> | undefined {
  if (!raw?.trim()) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = undefined;
  }
  if (!isRecord(parsed)) throw new NoteDeckApiError(0, "bad_params", "Params must be a JSON object");
  return parsed;
}

export function describeError(e: unknown): string {
  if (!(e instanceof NoteDeckApiError)) return e instanceof Error ? e.message : String(e);
  switch (e.code) {
    case "no_token":
      return "Set the NoteDeck API token in the key's settings";
    case "bad_url":
    case "bad_params":
    case "bad_response":
    case "missing_setting":
      return e.message;
    case "unreachable":
      return "NoteDeck is not running";
    case "unauthorized":
      return "Invalid API token";
    case "permission_denied":
      return `Not allowed for external tools: ${e.message}`;
    case "user_cancelled":
      return "Cancelled in NoteDeck";
    default:
      return `${e.code}: ${e.message}`;
  }
}

// ui/pi.js の locales に `err_<code>` がある code
const LOCALIZED_CODES = [
  "no_token",
  "bad_url",
  "bad_params",
  "bad_response",
  "missing_setting",
  "unreachable",
  "unauthorized",
  "permission_denied",
  "user_cancelled",
];

/** 設定画面に出すエラー。label が `__MSG_<key>__` なら設定画面の側で訳す (sdpi-components と同じ書き方) */
export function errorInfo(e: unknown): { label: string; detail?: string } {
  if (!(e instanceof NoteDeckApiError) || !LOCALIZED_CODES.includes(e.code)) return { label: describeError(e) };
  const label = `__MSG_err_${e.code}__`;
  return e.code === "permission_denied" ? { label, detail: e.message } : { label };
}

type Item = { value: string; label: string };

function itemsFrom(result: unknown, label: (row: Record<string, unknown>) => string): Item[] {
  if (!Array.isArray(result)) return [];
  const items: Item[] = [];
  for (const row of result) {
    if (isRecord(row) && typeof row.id === "string") items.push({ value: row.id, label: label(row) });
  }
  return items;
}

/** `account.list` の結果 → sdpi-select の選択肢 */
export function accountItems(result: unknown): Item[] {
  return itemsFrom(result, (a) => (typeof a.username === "string" ? `@${a.username}@${a.host}` : String(a.host)));
}

/** `column.list` の結果 → sdpi-select の選択肢 */
export function columnItems(result: unknown): Item[] {
  return itemsFrom(result, (c) => {
    const name = typeof c.name === "string" && c.name ? c.name : String(c.type);
    return typeof c.accountHost === "string" ? `${name} (${c.accountHost})` : name;
  });
}
