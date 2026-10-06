import { action, type KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import streamDeck from "@elgato/streamdeck";
import { describeError, execute } from "../api";

type CapabilitySettings = { capabilityId?: string; params?: string };

/**
 * 任意の capability を実行する (id + JSON の引数)。コマンドパレットでできることは
 * 全部ここから。権限と確認は NoteDeck 側の external principal の設定どおり。
 */
@action({ UUID: "com.notedeck.streamdeck.capability" })
export class RunCapability extends SingletonAction<CapabilitySettings> {
  override async onKeyDown(ev: KeyDownEvent<CapabilitySettings>): Promise<void> {
    const id = ev.payload.settings.capabilityId?.trim();
    if (!id) {
      await ev.action.showAlert();
      return;
    }
    let params: Record<string, unknown> | undefined;
    const raw = ev.payload.settings.params?.trim();
    if (raw) {
      try {
        params = JSON.parse(raw) as Record<string, unknown>;
      } catch (e) {
        streamDeck.logger.error(`capability ${id}: params is not valid JSON: ${String(e)}`);
        await ev.action.showAlert();
        return;
      }
    }
    try {
      await execute(id, params);
      await ev.action.showOk();
    } catch (e) {
      streamDeck.logger.error(`capability ${id}: ${describeError(e)}`);
      await ev.action.showAlert();
    }
  }
}
