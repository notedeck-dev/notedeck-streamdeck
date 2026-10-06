import { action, type KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { openDeepLink } from "../api";

type ColumnSettings = { columnId?: string };

/** `notedeck://column/<id>` でカラムをフォーカスする */
@action({ UUID: "com.notedeck.streamdeck.column" })
export class FocusColumn extends SingletonAction<ColumnSettings> {
  override async onKeyDown(ev: KeyDownEvent<ColumnSettings>): Promise<void> {
    const id = ev.payload.settings.columnId?.trim();
    if (!id) {
      await ev.action.showAlert();
      return;
    }
    await openDeepLink(`column/${encodeURIComponent(id)}`);
  }
}
