# NoteDeck for Stream Deck

Post, run capabilities and jump around [NoteDeck](https://github.com/notedeck-dev/notedeck) (a Misskey client, "Misskey Pro") from Stream Deck keys. The plugin talks to NoteDeck's built-in HTTP API on `127.0.0.1:19820` and to `notedeck://` links, so NoteDeck has to be installed on the same machine (running for the API actions).

## Actions

| Action | What it does | Needs |
| --- | --- | --- |
| **Post Note** | Post a preset text (optional account / CW / visibility). NoteDeck shows its usual confirmation before sending. | token + `notes.write` |
| **Open Post Form** | Open NoteDeck's post form, optionally with preset text (`notedeck://compose`). | nothing |
| **Run Capability** | Run any NoteDeck capability by id with JSON parameters (everything the command palette, plugins and AI can do). | token + whatever the capability needs |
| **Focus Column** | Focus a deck column (`notedeck://column/<id>`). | nothing |
| **Switch Deck Profile** | Switch the deck profile by name (`notedeck://profile/<name>`). | nothing |
| **Hide NoteDeck** / **Show NoteDeck** | Boss Key: hide the window, or bring it back (`app.hide` / `app.show`, NoteDeck 1.80+). | token (no permission) |

Actions marked "nothing" use deep links: no token, no permission, no confirmation dialog, because you are the one pressing the key. The key shows ✓ on success and ⚠ on failure; the reason is shown as **Status** in the key's settings and written to the plugin log (`com.notedeck.streamdeck.sdPlugin/logs`). For the deep link actions ✓ only means the link was handed to the OS: NoteDeck ignores a column id or profile name it does not know. While NoteDeck is waiting for your confirmation, pressing the same key again does nothing.

## Setup

1. In NoteDeck open **Settings → Permissions → API tokens** and issue a token.
2. Drop a NoteDeck action on a key. In its settings, fill **NoteDeck API URL** (leave the default; it has to be this computer) and **API token** once; they are shared by every NoteDeck key. **Test connection** tells you whether NoteDeck answers with that token.
3. External tools get a read-only permission set by default. In the same Permissions window, under **External**, allow what you want: `notes.write` for Post Note, and whatever a Run Capability key needs.
4. Writes (post / memo) are always confirmed inside the NoteDeck window.

Accounts (Post Note) and columns (Focus Column) can be picked from a list in the key's settings. The column list needs the token and the `deck.read` permission for external tools, which is off by default; without it, type the id (from `column.list`, `GET /api/deck/columns` or NoteDeck's API docs column). Deck profiles have no list in NoteDeck's API, so type the profile name.

## Development

```sh
npm install
npm run build        # bundle to com.notedeck.streamdeck.sdPlugin/bin
npm run lint         # biome
npm run typecheck
npm test             # vitest
npm run validate     # streamdeck validate
npm run pack         # .streamDeckPlugin for distribution
```

On a machine with the Stream Deck app: `npx streamdeck link com.notedeck.streamdeck.sdPlugin` installs the folder as a development plugin, and `npm run watch` rebuilds and restarts it on change. `validate` and `pack` also run on Linux.

## License

MIT. NoteDeck itself is AGPL-3.0; this plugin is a separate client of its public API.
