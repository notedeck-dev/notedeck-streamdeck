import { action, type KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { openDeepLink, runOnKey } from "../api";
import { NoteDeckApiError } from "../apiLogic";

type ProfileSettings = { name?: string };

/** `notedeck://profile/<name>` でデッキプロファイルを切り替える */
@action({ UUID: "com.notedeck.streamdeck.profile" })
export class SwitchProfile extends SingletonAction<ProfileSettings> {
  override async onKeyDown(ev: KeyDownEvent<ProfileSettings>): Promise<void> {
    const name = ev.payload.settings.name?.trim();
    await runOnKey(ev, "profile", async () => {
      if (!name) throw new NoteDeckApiError(0, "missing_setting", "Profile name is not set");
      await openDeepLink(`profile/${encodeURIComponent(name)}`);
    });
  }
}
