import { action, type KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { openDeepLink } from "../api";

type ComposeSettings = { text?: string; cw?: string; visibility?: string };

/** `notedeck://compose` で NoteDeck の投稿フォームを開く (プリセット可、送信は本人) */
@action({ UUID: "com.notedeck.streamdeck.compose" })
export class OpenCompose extends SingletonAction<ComposeSettings> {
  override async onKeyDown(ev: KeyDownEvent<ComposeSettings>): Promise<void> {
    const s = ev.payload.settings;
    await openDeepLink("compose", { text: s.text, cw: s.cw, visibility: s.visibility || undefined });
  }
}
