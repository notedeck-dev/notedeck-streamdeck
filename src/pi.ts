import streamDeck from "@elgato/streamdeck";
import { execute, ping, sendStatus } from "./api";
import { accountItems, columnItems, errorInfo } from "./apiLogic";

// sdpi-select の datasource 名 → 選択肢の取り方
const dataSources: Record<string, () => Promise<{ value: string; label: string }[]>> = {
  accounts: async () => accountItems(await execute("account.list")),
  columns: async () => columnItems(await execute("column.list")),
};

/** 設定画面 (ui/pi.js と sdpi-components) からの問い合わせに答える */
export function registerPropertyInspector(): void {
  streamDeck.ui.onSendToPlugin(async (ev) => {
    const payload = ev.payload;
    const event =
      typeof payload === "object" && payload !== null && !Array.isArray(payload) ? payload.event : undefined;
    if (event === "getStatus") {
      await sendStatus(ev.action.id);
    } else if (event === "testConnection") {
      try {
        await ping();
        await streamDeck.ui.sendToPropertyInspector({ event: "status", ok: true });
      } catch (e) {
        await streamDeck.ui.sendToPropertyInspector({ event: "status", error: errorInfo(e) });
      }
    } else if (typeof event === "string" && Object.hasOwn(dataSources, event)) {
      // sdpi-select は返事が来るまで「読み込み中」のままなので、取れなくても必ず返す。
      // 取れなかった理由は選べない項目として見せ、ID は手入力できる
      let items: { value: string; label: string; disabled?: boolean }[];
      try {
        items = await dataSources[event]();
      } catch (e) {
        items = [{ value: "", label: errorInfo(e).label, disabled: true }];
      }
      await streamDeck.ui.sendToPropertyInspector({ event, items });
    }
  });
}
