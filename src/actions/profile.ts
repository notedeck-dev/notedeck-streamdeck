import { action, type KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { openDeepLink } from "../api";

type ProfileSettings = { name?: string };

/** `notedeck://profile/<name>` でデッキプロファイルを切り替える */
@action({ UUID: "com.notedeck.streamdeck.profile" })
export class SwitchProfile extends SingletonAction<ProfileSettings> {
  override async onKeyDown(ev: KeyDownEvent<ProfileSettings>): Promise<void> {
    const name = ev.payload.settings.name?.trim();
    if (!name) {
      await ev.action.showAlert();
      return;
    }
    await openDeepLink(`profile/${encodeURIComponent(name)}`);
  }
}
