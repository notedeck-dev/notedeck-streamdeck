import streamDeck from "@elgato/streamdeck";
import { describeError, errorFromBody, errorInfo, isLoopbackUrl, NoteDeckApiError, resultFromBody } from "./apiLogic";

/**
 * NoteDeck の内蔵 HTTP API (既定 127.0.0.1:19820) の薄いクライアント。
 * 接続先とトークンはプラグインのグローバル設定 (どのキーからも共通)。
 */

export type GlobalSettings = {
  baseUrl?: string;
  token?: string;
};

export async function globalSettings(): Promise<Required<GlobalSettings>> {
  const g = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
  return {
    baseUrl: (g.baseUrl?.trim() || "http://127.0.0.1:19820").replace(/\/+$/, ""),
    token: g.token?.trim() ?? "",
  };
}

async function request(method: "GET" | "POST", path: string, body?: unknown): Promise<unknown> {
  const { baseUrl, token } = await globalSettings();
  if (!token) throw new NoteDeckApiError(0, "no_token", "API token is not set (plugin settings)");
  // NoteDeck は 127.0.0.1 でしか待ち受けない。他のホストへトークンを送らない
  if (!isLoopbackUrl(baseUrl)) {
    throw new NoteDeckApiError(0, "bad_url", `API URL must point to this computer: ${baseUrl}`);
  }
  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new NoteDeckApiError(0, "unreachable", e instanceof Error ? e.message : String(e));
  }
  const data: unknown = await res.json().catch(() => undefined);
  if (!res.ok) {
    const { code, message } = errorFromBody(res.status, data);
    throw new NoteDeckApiError(res.status, code, message);
  }
  return data;
}

/** `POST /api/capabilities/{id}/execute` → `result` */
export async function execute(capabilityId: string, params?: Record<string, unknown>): Promise<unknown> {
  const data = await request("POST", `/api/capabilities/${encodeURIComponent(capabilityId)}/execute`, params ?? {});
  return resultFromBody(data);
}

/** 接続確認。`GET /api/capabilities` はトークンだけで通る (権限は要らない) */
export async function ping(): Promise<void> {
  const data = await request("GET", "/api/capabilities");
  if (!Array.isArray(data)) {
    throw new NoteDeckApiError(200, "bad_response", "Unexpected response (is the API URL really NoteDeck?)");
  }
}

/** `notedeck://` deep link。トークンも権限も要らない (本人がキーを押した扱い) */
export async function openDeepLink(path: string, params?: Record<string, string | undefined>): Promise<void> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v !== undefined && v !== "") qs.set(k, v);
  }
  const q = qs.toString();
  await streamDeck.system.openUrl(`notedeck://${path}${q ? `?${q}` : ""}`);
}

const inFlight = new Set<string>();
const lastErrors = new Map<string, unknown>();

/** そのキーの設定画面が開いていれば、最後の失敗理由 (成功後は無し) を送る。キーの表示は ⚠ しか出せない */
export async function sendStatus(actionId: string): Promise<void> {
  if (streamDeck.ui.action?.id !== actionId) return;
  const e = lastErrors.get(actionId);
  await streamDeck.ui.sendToPropertyInspector({ event: "status", ...(e !== undefined ? { error: errorInfo(e) } : {}) });
}

/**
 * キー 1 回分の処理。成功で ✓、失敗で ⚠ とログ。NoteDeck の確認ダイアログは最長 30 分
 * 待つので、返事が来るまで同じキーの押し直しは無視する (確認が積まれて二重投稿になる)。
 */
export async function runOnKey(
  ev: { action: { id: string; showOk(): Promise<void>; showAlert(): Promise<void> } },
  label: string,
  fn: () => Promise<unknown>,
): Promise<void> {
  const key = ev.action.id;
  if (inFlight.has(key)) return;
  inFlight.add(key);
  try {
    await fn();
    lastErrors.delete(key);
    await ev.action.showOk();
  } catch (e) {
    streamDeck.logger.error(`${label}: ${describeError(e)}`);
    lastErrors.set(key, e);
    await ev.action.showAlert();
  } finally {
    inFlight.delete(key);
  }
  await sendStatus(key);
}
