<div align="center">
  <img src="icon.png" width="128" height="128" alt="Watch History Manager Logo" />
  <h1>Watch History & Quick Watched</h1>
  <p><strong>A Seanime Extension by <a href="https://github.com/gametimeakhtab">gametimeakhtab</a></strong></p>
  <p>Chronological Watch History drawer & right-click "Mark as Watched" context menu actions for Seanime.</p>
</div>

---

## 🌟 Features (Nayi Khoobiyan)

### 1. 🎬 Mark Season as Watched (Anime):
- **3-Dot Dropdown Menu (Anime Page)**:
  - Download button ke bagal mein **3-dot dropdown menu** par:
    - **"Mark Season as Watched"**: Ek click mein poore season ke saare episodes watched mark ho jaate hain!
    - **"Mark Next Episode as Watched"**: Agla episode turant watched mark karega.
- **Anime Page Button**: Direct **"Mark Ep Watched"** button.
- **Right-Click Context Menu**:
  - Episode cards: **"Mark Episode as Watched"**.
  - Anime cards: **"Mark Next Episode as Watched"** aur **"Mark Season as Watched"**.

### 2. 📖 Manga Support (Mark Read & Whole Season Read):
- **3-Dot Dropdown Menu (Manga Page)**:
  - **"Mark Manga / Season as Completed"**: Poore manga / season ke chapters completed mark karega!
  - **"Mark Next Chapter as Read"**: Agla chapter read mark karega.
- **Manga Page Button**: Quick **"Mark Chapter Read"** button.
- **Media Card Context Menu for Manga**:
  - Right-click karke **"Mark Next Chapter as Read"** aur **"Mark Manga as Completed"**.

### 3. ⏱️ Strict Chronological Watch Order:
- Watch history items strictly **exact watch time (Latest watched first)** sort hote hain. Jo anime sabse latest dekha gaya hai, woh hamesha sabse upar rahega!

### 4. 🧹 Watched & Rewatching Filter Bug Fix:
- AniList par already watched / completed items ab active list ko clutter nahi karenge.
- **Rewatching Support**: Rewatch cycle ke unwatched episodes hi active list mein aayenge.
- **Active Only vs All Toggle**: Header mein `[Active]` aur `[All]` toggle diya gaya hai.
- **Drawer Buttons**: `Mark Ep [N] Watched`, `Mark Season Watched`, `Go to Anime`, `Remove`.

---

## 📁 File Structure

```text
extensions/watch-history-manager/
├── manifest.json                  # Extension metadata & permissions
├── index.js                       # Extension source code
├── watch-history-manager.json     # Bundled single-file extension
├── build.js                       # Auto-builder & deploy script
└── README.md                      # Documentation & Guide
```

---

## 🚀 Installation & Usage

Extension already active directory mein install ho chuka hai:
`C:\Users\User\AppData\Roaming\Seanime\extensions\watch-history-manager.json`

### Agar Seanime already chal raha hai:
1. Seanime open karein.
2. **Settings -> Extensions** mein jayein.
3. **"Reload Extensions"** button dabayein.
4. **"Watch History & Quick Watched"** ko Enable karein aur permissions allow karein (`anilist`, `storage`).

### Right Click Menu Test:
- Library ya kisi anime page par jao.
- Kisi bhi **Episode card** par right-click karo: **"Mark Episode as Watched"** option dikhega.
- Kisi bhi **Anime card** par right-click karo: **"Mark Next Episode as Watched"** aur **"Mark Anime as Completed"** options dikhenge.

### Watching History Tray Test:
- Topbar ya Sidebar mein **Watch History** tray icon par click karein.
- Ek sleek drawer khulega jisme aapki watch history latest-to-oldest order mein list hogi.
- Wahin se direct **Mark Watched** ya **Go to Anime** kar sakte hain.

---

## 🛠 Rebuilding

Agar aap code (`index.js` ya `manifest.json`) mein koi change karte hain:
```bash
node "extensions/watch-history-manager/build.js"
```
Yeh command automatically file bundle karegi aur Seanime ke extensions folder mein update kar degi.
