import { action, type KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import streamDeck from "@elgato/streamdeck";
import { describeError, execute } from "../api";

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
    if (!s.text?.trim() || !s.accountId?.trim()) {
      streamDeck.logger.warn("post: text and accountId are required");
      await ev.action.showAlert();
      return;
    }
    try {
      await execute("notes.create", {
        accountId: s.accountId.trim(),
        text: s.text,
        visibility: s.visibility || "public",
        ...(s.cw?.trim() ? { cw: s.cw.trim() } : {}),
      });
      await ev.action.showOk();
    } catch (e) {
      streamDeck.logger.error(`post: ${describeError(e)}`);
      await ev.action.showAlert();
    }
  }
}
