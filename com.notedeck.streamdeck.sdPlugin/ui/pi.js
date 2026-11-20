// 設定画面の共通部分: 文言 (en / ja)、最後のエラーと接続確認の表示、一覧から選んだ ID の反映。
// sdpi-components.js の後、<body> の前に読む (部品が属性の __MSG_<key>__ を訳すのは生成時)。
const { i18n, streamDeckClient } = window.SDPIComponents;

i18n.locales = {
  en: {
    apiUrl: "NoteDeck API URL",
    token: "API token",
    tokenHint: "Settings → Permissions → API tokens",
    test: "Test connection",
    status: "Status",
    connected: "Connected to NoteDeck",
    optional: "optional",
    pick: "Pick from NoteDeck…",
    account: "Account",
    accountId: "Account ID",
    accountIdHint: "optional; NoteDeck picks one when empty",
    text: "Text",
    cw: "CW",
    visibility: "Visibility",
    visDefault: "NoteDeck's default",
    visPublic: "Public",
    visHome: "Home",
    visFollowers: "Followers",
    visDirect: "Direct",
    visSpecified: "Direct (no recipients)",
    postNote: "NoteDeck shows a confirmation before posting. Needs the notes.write permission for external tools.",
    composeNote: "Opens NoteDeck's own post form via notedeck://compose. No token needed.",
    capabilityId: "Capability ID",
    capabilityIdHint: "e.g. notes.create, app.hide, column.add",
    params: "Params (JSON)",
    capabilityNote:
      "Browse ids and parameters at http://127.0.0.1:19820/api/capabilities (with the token) or in NoteDeck's API docs column.",
    column: "Column",
    columnId: "Column ID",
    columnNote:
      "Focusing uses notedeck://column/<id> and needs no token. The list needs the token and the deck.read permission for external tools; without them, type the ID.",
    profileName: "Profile name",
    profileNameHint: "display name or id",
    profileNote: "Uses notedeck://profile/<name>. No token needed.",
    windowNote: "Needs NoteDeck 1.80 or later.",
    err_no_token: "Set the NoteDeck API token",
    err_bad_url: "The API URL must point to this computer (127.0.0.1, localhost or [::1])",
    err_bad_params: "Params must be a JSON object",
    err_bad_response: "Unexpected response (is the API URL really NoteDeck?)",
    err_missing_setting: "A required setting of this key is empty",
    err_unreachable: "NoteDeck is not running",
    err_unauthorized: "Invalid API token",
    err_permission_denied: "Not allowed for external tools (NoteDeck: Settings → Permissions → External)",
    err_user_cancelled: "Cancelled in NoteDeck",
  },
  ja: {
    apiUrl: "NoteDeck API の URL",
    token: "API トークン",
    tokenHint: "設定 → 権限 → API トークン",
    test: "接続を確認",
    status: "状態",
    connected: "NoteDeck に接続できました",
    optional: "任意",
    pick: "NoteDeck から選ぶ…",
    account: "アカウント",
    accountId: "アカウント ID",
    accountIdHint: "任意。空なら NoteDeck が選びます",
    text: "本文",
    cw: "CW",
    visibility: "公開範囲",
    visDefault: "NoteDeck の既定",
    visPublic: "パブリック",
    visHome: "ホーム",
    visFollowers: "フォロワー",
    visDirect: "ダイレクト",
    visSpecified: "ダイレクト (宛先なし)",
    postNote: "投稿の前に NoteDeck が確認を出します。外部ツールへの notes.write の許可が必要です。",
    composeNote: "notedeck://compose で NoteDeck の投稿フォームを開きます。トークンは要りません。",
    capabilityId: "Capability ID",
    capabilityIdHint: "例: notes.create, app.hide, column.add",
    params: "引数 (JSON)",
    capabilityNote:
      "ID と引数は http://127.0.0.1:19820/api/capabilities (トークンが必要) か、NoteDeck の API ドキュメントカラムで調べられます。",
    column: "カラム",
    columnId: "カラム ID",
    columnNote:
      "フォーカスは notedeck://column/<id> を使い、トークンは要りません。一覧にはトークンと、外部ツールへの deck.read の許可が必要です。無ければ ID を入力してください。",
    profileName: "プロファイル名",
    profileNameHint: "表示名または ID",
    profileNote: "notedeck://profile/<名前> を使います。トークンは要りません。",
    windowNote: "NoteDeck 1.80 以降が必要です。",
    err_no_token: "NoteDeck の API トークンを設定してください",
    err_bad_url: "API の URL はこのコンピューター (127.0.0.1 / localhost / [::1]) を指す必要があります",
    err_bad_params: "引数は JSON の object で書いてください",
    err_bad_response: "想定外の応答です (API の URL は NoteDeck のものですか?)",
    err_missing_setting: "このキーの必須の設定が空です",
    err_unreachable: "NoteDeck が起動していません",
    err_unauthorized: "API トークンが無効です",
    err_permission_denied: "外部ツールに許可されていません (NoteDeck: 設定 → 権限 → 外部)",
    err_user_cancelled: "NoteDeck でキャンセルされました",
  },
};

function message(label) {
  const m = /^__MSG_(.+)__$/.exec(label);
  return (m && i18n.getMessage(m[1])) || label;
}

document.addEventListener("DOMContentLoaded", () => {
  const status = document.getElementById("nd-status");
  const statusItem = status.closest("sdpi-item");
  statusItem.style.display = "none";
  streamDeckClient.sendToPropertyInspector.subscribe((ev) => {
    if (ev.payload?.event !== "status") return;
    const { error, ok } = ev.payload;
    status.textContent = error
      ? message(error.label) + (error.detail ? `: ${error.detail}` : "")
      : ok
        ? i18n.getMessage("connected")
        : "";
    status.style.color = error ? "#e0a030" : "";
    statusItem.style.display = status.textContent ? "" : "none";
  });
  streamDeckClient.send("sendToPlugin", { event: "getStatus" });

  document.getElementById("nd-test")?.addEventListener("click", () => {
    streamDeckClient.send("sendToPlugin", { event: "testConnection" });
  });

  // 一覧 (sdpi-select) と手入力 (sdpi-textfield) は同じ setting を持つ。部品同士は互いの変更を
  // 知らないので、片方が変わったらもう片方の表示を合わせる
  for (const select of document.querySelectorAll("sdpi-select[datasource]")) {
    const field = document.querySelector(`sdpi-textfield[setting="${select.getAttribute("setting")}"]`);
    select.addEventListener("valuechange", () => {
      if (select.value) field.value = select.value;
    });
    field.addEventListener("valuechange", () => {
      select.value = field.value;
    });
  }

  // 「ダイレクト」は宛先を渡せないので選択肢から外した。保存済みのキーだけは、表示が実際の動作と
  // ずれないよう選択肢に戻す
  const visibility = document.querySelector("sdpi-select[data-legacy-specified]");
  if (visibility) {
    streamDeckClient.getSettings().then(({ settings }) => {
      if (settings.visibility !== "specified") return;
      const option = document.createElement("option");
      option.value = "specified";
      option.text = i18n.getMessage("visSpecified");
      visibility.append(option);
    });
  }
});
