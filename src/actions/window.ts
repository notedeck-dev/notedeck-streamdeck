import { action, type KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import streamDeck from "@elgato/streamdeck";
import { describeError, execute } from "../api";

/** `app.hide`: Boss Key。NoteDeck 1.80 以降 */
@action({ UUID: "com.notedeck.streamdeck.hide" })
export class HideWindow extends SingletonAction {
  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    await run(ev, "app.hide");
  }
}

/** `app.show`: ウィンドウを前に出す。NoteDeck 1.80 以降 */
@action({ UUID: "com.notedeck.streamdeck.show" })
export class ShowWindow extends SingletonAction {
  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    await run(ev, "app.show");
  }
}

async function run(ev: KeyDownEvent, id: string): Promise<void> {
  try {
    await execute(id);
    await ev.action.showOk();
  } catch (e) {
    streamDeck.logger.error(`${id}: ${describeError(e)}`);
    await ev.action.showAlert();
  }
}
