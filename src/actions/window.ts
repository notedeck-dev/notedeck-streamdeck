import { action, type KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { execute, runOnKey } from "../api";

/** `app.hide`: Boss Key。NoteDeck 1.80 以降 */
@action({ UUID: "com.notedeck.streamdeck.hide" })
export class HideWindow extends SingletonAction {
  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    await runOnKey(ev, "app.hide", () => execute("app.hide"));
  }
}

/** `app.show`: ウィンドウを前に出す。NoteDeck 1.80 以降 */
@action({ UUID: "com.notedeck.streamdeck.show" })
export class ShowWindow extends SingletonAction {
  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    await runOnKey(ev, "app.show", () => execute("app.show"));
  }
}
