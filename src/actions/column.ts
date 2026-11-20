import { action, type KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { openDeepLink, runOnKey } from "../api";
import { NoteDeckApiError } from "../apiLogic";

type ColumnSettings = { columnId?: string };

/** `notedeck://column/<id>` でカラムをフォーカスする */
@action({ UUID: "com.notedeck.streamdeck.column" })
export class FocusColumn extends SingletonAction<ColumnSettings> {
  override async onKeyDown(ev: KeyDownEvent<ColumnSettings>): Promise<void> {
    const id = ev.payload.settings.columnId?.trim();
    await runOnKey(ev, "column", async () => {
      if (!id) throw new NoteDeckApiError(0, "missing_setting", "Column ID is not set");
      await openDeepLink(`column/${encodeURIComponent(id)}`);
    });
  }
}
