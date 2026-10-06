import streamDeck from "@elgato/streamdeck";

/**
 * NoteDeck の内蔵 HTTP API (既定 127.0.0.1:19820) の薄いクライアント。
 * 接続先とトークンはプラグインのグローバル設定 (どのキーからも共通)。
 */

export type GlobalSettings = {
  baseUrl?: string;
  token?: string;
};

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

export async function globalSettings(): Promise<Required<GlobalSettings>> {
  const g = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
  return {
    baseUrl: (g.baseUrl?.trim() || "http://127.0.0.1:19820").replace(/\/+$/, ""),
    token: g.token?.trim() ?? "",
  };
}

async function request<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const { baseUrl, token } = await globalSettings();
  if (!token) throw new NoteDeckApiError(0, "no_token", "API token is not set (plugin settings)");
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
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const code = typeof data.code === "string" ? data.code : res.status === 401 ? "unauthorized" : "http_error";
    const message = typeof data.error === "string" ? data.error : `${res.status} ${res.statusText}`;
    throw new NoteDeckApiError(res.status, code, message);
  }
  return data as T;
}

/** `POST /api/capabilities/{id}/execute` → `result` */
export async function execute<T = unknown>(capabilityId: string, params?: Record<string, unknown>): Promise<T> {
  const data = await request<{ ok: true; result: T }>(
    "POST",
    `/api/capabilities/${encodeURIComponent(capabilityId)}/execute`,
    params ?? {},
  );
  return data.result;
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

export function describeError(e: unknown): string {
  if (!(e instanceof NoteDeckApiError)) return e instanceof Error ? e.message : String(e);
  switch (e.code) {
    case "no_token":
      return "Set the NoteDeck API token in the key's settings";
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
