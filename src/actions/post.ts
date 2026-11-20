import { action, type KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { execute, runOnKey } from "../api";
import { NoteDeckApiError } from "../apiLogic";

type PostSettings = {
  accountId?: string;
  text?: string;
  cw?: string;
  visibility?: string;
};

/**
 * プリセット本文を `notes.create` で投稿する。送信は NoteDeck 側の確認ダイアログを
 * 経る (外部ツールからの書込は NoteDeck が必ず確認する)。`notes.write` の許可が要る。
 */
@action({ UUID: "com.notedeck.streamdeck.post" })
export class PostNote extends SingletonAction<PostSettings> {
  override async onKeyDown(ev: KeyDownEvent<PostSettings>): Promise<void> {
    const s = ev.payload.settings;
    await runOnKey(ev, "post", async () => {
      if (!s.text?.trim()) throw new NoteDeckApiError(0, "missing_setting", "Text is not set");
      await execute("notes.create", {
        ...(s.accountId?.trim() ? { accountId: s.accountId.trim() } : {}),
        text: s.text,
        visibility: s.visibility || "public",
        ...(s.cw?.trim() ? { cw: s.cw.trim() } : {}),
      });
    });
  }
}
