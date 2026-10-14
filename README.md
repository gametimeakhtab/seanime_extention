<div align="center">
  <img src="icon.png" width="128" height="128" alt="Watch History Manager Logo" />
  <h1>Watch History & Quick Watched</h1>
  <p><strong>A Seanime Extension by <a href="https://github.com/gametimeakhtab">gametimeakhtab</a></strong></p>
  <p>Chronological Watch History drawer & right-click "Mark as Watched" context menu actions for Seanime.</p>
</div>

---

## 🌟 Features (Khoobiyan)

1. **Chronological Watching History (In Order Watching)**:
   - Topbar / Sidebar icon pe click karke **Watch History Drawer** open hota hai.
   - History items strictly **chronological order** (sabse latest watched episode sabse upar) mein display hote hain.
   - Har history item mein dikhta hai:
     - Anime Name (AniList library metadata se mapped)
     - Episode Number (e.g., `EP 4`)
     - Playback Progress bar aur exact time (e.g., `18:42 / 24:10 (77%)`)
     - Relative time (e.g., `5m ago`, `2h ago`, `Yesterday`)
   - **Quick Actions per item**:
     - `Mark Watched`: AniList pe episode watched mark karega aur toast dikhayega.
     - `Go to Anime`: Seedha us anime ke page par navigate karega.
     - `Remove`: Watch history se item remove karega.
   - **Auto Refresh**: Drawer open hote hi history automatically refresh ho jaati hai.

2. **Right-Click Context Menu ("Mark as Watched")**:
   - **Episode Cards**: Kisi bhi episode card par right-click karo -> **"Mark Episode as Watched"** option milega. Click karte hi AniList progress update ho jayegi!
   - **Anime / Media Cards**: Anime card par right-click karne par do options:
     - **"Mark Next Episode as Watched"**: Current progress ko +1 karke update karega.
     - **"Mark Anime as Completed"**: Poore anime ko completed mark karega.

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
