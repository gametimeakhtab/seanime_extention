 <div align="center">
  <img src="icon.png" width="128" height="128" alt="Watch History Manager Logo" />
  <h1>Watch History & Quick Watched</h1>
  <p><strong>A Seanime Extension by <a href="https://github.com/gametimeakhtab">gametimeakhtab</a></strong></p>
  <p>A chronological watch history drawer with convenient right-click context menu actions for marking anime episodes as watched and manga chapters as read.</p>
</div>

---

## 🌟 Features

### 1. 🎬 Mark Anime Seasons as Watched

- **Three-Dot Dropdown Menu (Anime Page):**
  - **Mark Season as Watched:** Mark all episodes in a season as watched with a single click.
  - **Mark Next Episode as Watched:** Instantly mark the next episode as watched.
- **Anime Page Button:** A dedicated **Mark Ep Watched** button for quickly marking episodes as watched.
- **Right-Click Context Menu:**
  - **Episode Cards:** Mark individual episodes as watched.
  - **Anime Cards:** Mark the next episode as watched or mark the entire season as watched.

### 2. 📖 Manga Support (Mark as Read & Complete Seasons)

- **Three-Dot Dropdown Menu (Manga Page):**
  - **Mark Manga / Season as Completed:** Mark all chapters in a manga or season as completed.
  - **Mark Next Chapter as Read:** Instantly mark the next chapter as read.
- **Manga Page Button:** A dedicated **Mark Chapter Read** button for quick access.
- **Manga Card Context Menu:**
  - Right-click a manga card to access **Mark Next Chapter as Read** and **Mark Manga as Completed**.

### 3. ⏱️ Strict Chronological Watch History

- Watch history entries are sorted by their exact watch timestamps, with the **most recently watched items displayed first**.
- The latest watched anime always appears at the top of the history list.

### 4. 🧹 Watched Items & Rewatching Filter Fix

- **Completed Items:** Anime already marked as watched or completed on AniList will no longer clutter the active list.
- **Rewatching Support:** Only unwatched episodes from the current rewatch cycle appear in the active list.
- **Active Only vs. All Toggle:** Switch between **Active** and **All** views directly from the drawer header.
- **Drawer Actions:**
  - `Mark Ep [N] Watched`
  - `Mark Season Watched`
  - `Go to Anime`
  - `Remove`

---

## 📁 File Structure

```text
extensions/watch-history-manager/
├── manifest.json                  # Extension metadata and permissions
├── index.js                       # Extension source code
├── watch-history-manager.json     # Bundled single-file extension
├── build.js                       # Automated build and deployment script
└── README.md                      # Documentation and usage guide
```

---

## 🚀 Installation & Usage

The extension has already been installed in the following directory:

```text
C:\Users\User\AppData\Roaming\Seanime\extensions\watch-history-manager.json
```

### If Seanime Is Already Running

1. Open Seanime.
2. Navigate to **Settings → Extensions**.
3. Click **Reload Extensions**.
4. Enable **Watch History & Quick Watched**.
5. Grant the required permissions: `anilist` and `storage`.

### Testing the Right-Click Context Menu

1. Open your library or navigate to an anime page.
2. Right-click any **episode card** and look for the **Mark Episode as Watched** option.
3. Right-click any **anime card** to access options such as **Mark Next Episode as Watched** and **Mark Anime as Completed**.

### Testing the Watch History Drawer

1. Click the **Watch History** tray icon in the top bar or sidebar.
2. A sleek drawer will open, displaying your watch history in chronological order, from newest to oldest.
3. Use the available actions to mark episodes as watched or navigate directly to an anime page.

---

## 🛠️ Rebuilding the Extension

Whenever you modify the extension's source files, such as `index.js` or `manifest.json`, run the following command from your project root:

```bash
node "extensions/watch-history-manager/build.js"
```

This command automatically bundles the extension and deploys the updated file to Seanime's extensions directory.

