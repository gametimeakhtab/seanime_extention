const fs = require('fs');
const path = require('path');

const dir = __dirname;
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
const payload = fs.readFileSync(path.join(dir, 'index.js'), 'utf8');

const extension = {
  id: manifest.id,
  name: manifest.name,
  version: manifest.version,
  manifestURI: manifest.manifestURI || "",
  language: manifest.language,
  type: manifest.type,
  description: manifest.description,
  author: manifest.author,
  icon: manifest.icon || "",
  website: manifest.website || "",
  readme: "",
  lang: manifest.lang,
  payload: payload,
  plugin: manifest.plugin
};

const outputJson = JSON.stringify(extension, null, 2);

// 1. Write to local repo extensions folder
const localOutput = path.join(dir, 'watch-history-manager.json');
fs.writeFileSync(localOutput, outputJson, 'utf8');
console.log('Generated local extension JSON:', localOutput);

// 2. Write to AppData/Roaming/Seanime/extensions/
const appData = process.env.APPDATA;
if (appData) {
  const seanimeExtDir = path.join(appData, 'Seanime', 'extensions');
  if (fs.existsSync(seanimeExtDir)) {
    const installedPath = path.join(seanimeExtDir, `${manifest.id}.json`);
    fs.writeFileSync(installedPath, outputJson, 'utf8');
    console.log('Installed directly to Seanime active extensions:', installedPath);
  }
}
