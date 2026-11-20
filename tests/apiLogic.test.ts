import { describe, expect, it } from "vitest";
import {
  accountItems,
  columnItems,
  describeError,
  errorFromBody,
  errorInfo,
  isLoopbackUrl,
  NoteDeckApiError,
  parseParams,
  resultFromBody,
} from "../src/apiLogic";

describe("isLoopbackUrl", () => {
  it("127.0.0.1 / localhost / [::1] の http(s) を通す", () => {
    expect(isLoopbackUrl("http://127.0.0.1:19820")).toBe(true);
    expect(isLoopbackUrl("http://localhost:19821")).toBe(true);
    expect(isLoopbackUrl("http://[::1]:19820")).toBe(true);
    expect(isLoopbackUrl("https://127.0.0.1")).toBe(true);
  });
  it("よその host、userinfo で偽装した URL、壊れた URL は通さない", () => {
    expect(isLoopbackUrl("http://example.com:19820")).toBe(false);
    expect(isLoopbackUrl("http://127.0.0.1@example.com")).toBe(false);
    expect(isLoopbackUrl("http://127.0.0.1.example.com")).toBe(false);
    expect(isLoopbackUrl("http://192.168.0.2:19820")).toBe(false);
    expect(isLoopbackUrl("ftp://127.0.0.1")).toBe(false);
    expect(isLoopbackUrl("not a url")).toBe(false);
  });
});

describe("errorFromBody", () => {
  it("execute の { ok: false, code, error } はそのまま読む", () => {
    expect(errorFromBody(403, { ok: false, code: "permission_denied", error: "notes.write" })).toEqual({
      code: "permission_denied",
      message: "notes.write",
    });
  });
  it("それ以外の route の { error: CODE, message } は CODE を小文字の code に、message を文にする", () => {
    expect(errorFromBody(401, { error: "UNAUTHORIZED", message: "no valid credential" })).toEqual({
      code: "unauthorized",
      message: "no valid credential",
    });
  });
  it("どちらの形でもなければ (JSON でない本文も) status から決める", () => {
    expect(errorFromBody(401, {})).toEqual({ code: "unauthorized", message: "HTTP 401" });
    expect(errorFromBody(502, undefined)).toEqual({ code: "http_error", message: "HTTP 502" });
    expect(errorFromBody(502, "Bad Gateway")).toEqual({ code: "http_error", message: "HTTP 502" });
  });
});

describe("resultFromBody", () => {
  it("{ ok: true, result } の result を返す (result が無い capability は undefined)", () => {
    expect(resultFromBody({ ok: true, result: [1] })).toEqual([1]);
    expect(resultFromBody({ ok: true })).toBeUndefined();
  });
  it("200 でも JSON でない / ok が true でない応答は bad_response", () => {
    for (const body of [undefined, null, "ok", [], {}, { ok: false }, { ok: "true", result: 1 }]) {
      expect(() => resultFromBody(body)).toThrowError(expect.objectContaining({ code: "bad_response" }));
    }
  });
});

describe("parseParams", () => {
  it("空なら undefined、object はそのまま", () => {
    expect(parseParams(undefined)).toBeUndefined();
    expect(parseParams("  ")).toBeUndefined();
    expect(parseParams(' { "columnId": "a" } ')).toEqual({ columnId: "a" });
  });
  it("JSON でない / 配列 / primitive / null は bad_params", () => {
    for (const raw of ["{", "[1]", "1", '"a"', "true", "null"]) {
      expect(() => parseParams(raw)).toThrowError(expect.objectContaining({ code: "bad_params" }));
    }
  });
});

describe("describeError", () => {
  it("code ごとの文にする", () => {
    expect(describeError(new NoteDeckApiError(0, "no_token", "x"))).toBe(
      "Set the NoteDeck API token in the key's settings",
    );
    expect(describeError(new NoteDeckApiError(0, "unreachable", "ECONNREFUSED"))).toBe("NoteDeck is not running");
    expect(describeError(new NoteDeckApiError(401, "unauthorized", "x"))).toBe("Invalid API token");
    expect(describeError(new NoteDeckApiError(403, "permission_denied", "notes.write"))).toBe(
      "Not allowed for external tools: notes.write",
    );
    expect(describeError(new NoteDeckApiError(409, "user_cancelled", "x"))).toBe("Cancelled in NoteDeck");
    expect(describeError(new NoteDeckApiError(0, "bad_url", "API URL must point to this computer: x"))).toBe(
      "API URL must point to this computer: x",
    );
  });
  it("知らない code は code と文、API 以外のエラーは message", () => {
    expect(describeError(new NoteDeckApiError(500, "execute_failed", "boom"))).toBe("execute_failed: boom");
    expect(describeError(new Error("plain"))).toBe("plain");
    expect(describeError("str")).toBe("str");
  });
});

describe("errorInfo", () => {
  it("設定画面が訳せる code は __MSG_err_<code>__ にする", () => {
    expect(errorInfo(new NoteDeckApiError(0, "no_token", "x"))).toEqual({ label: "__MSG_err_no_token__" });
    expect(errorInfo(new NoteDeckApiError(0, "unreachable", "x"))).toEqual({ label: "__MSG_err_unreachable__" });
  });
  it("permission_denied は足りない権限を detail に付ける", () => {
    expect(errorInfo(new NoteDeckApiError(403, "permission_denied", "deck.read"))).toEqual({
      label: "__MSG_err_permission_denied__",
      detail: "deck.read",
    });
  });
  it("知らない code は describeError の文をそのまま出す", () => {
    expect(errorInfo(new NoteDeckApiError(500, "execute_failed", "boom"))).toEqual({ label: "execute_failed: boom" });
    expect(errorInfo(new Error("plain"))).toEqual({ label: "plain" });
  });
});

describe("accountItems / columnItems", () => {
  it("account.list を @username@host の選択肢にする", () => {
    expect(
      accountItems([
        { id: "a1", username: "taro", host: "misskey.io" },
        { id: "a2", host: "example.com" },
      ]),
    ).toEqual([
      { value: "a1", label: "@taro@misskey.io" },
      { value: "a2", label: "example.com" },
    ]);
  });
  it("column.list を「名前 (無ければ種類) + ホスト」の選択肢にする", () => {
    expect(
      columnItems([
        { id: "c1", type: "timeline", name: "Home", accountHost: "misskey.io" },
        { id: "c2", type: "notifications", name: null, accountHost: null },
      ]),
    ).toEqual([
      { value: "c1", label: "Home (misskey.io)" },
      { value: "c2", label: "notifications" },
    ]);
  });
  it("配列でない応答や id の無い要素は捨てる", () => {
    expect(accountItems({ accounts: [] })).toEqual([]);
    expect(columnItems([null, "x", { type: "timeline" }, { id: 1 }])).toEqual([]);
  });
});
