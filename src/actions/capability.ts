import { action, type KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { execute, runOnKey } from "../api";
import { NoteDeckApiError, parseParams } from "../apiLogic";

type CapabilitySettings = { capabilityId?: string; params?: string };

/**
 * 任意の capability を実行する (id + JSON の引数)。コマンドパレットでできることは
 * 全部ここから。権限と確認は NoteDeck 側の external principal の設定どおり。
 */
@action({ UUID: "com.notedeck.streamdeck.capability" })
export class RunCapability extends SingletonAction<CapabilitySettings> {
  override async onKeyDown(ev: KeyDownEvent<CapabilitySettings>): Promise<void> {
    const id = ev.payload.settings.capabilityId?.trim();
    await runOnKey(ev, `capability ${id}`, async () => {
      if (!id) throw new NoteDeckApiError(0, "missing_setting", "Capability ID is not set");
      await execute(id, parseParams(ev.payload.settings.params));
    });
  }
}
