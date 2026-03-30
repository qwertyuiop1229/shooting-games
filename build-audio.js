const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const otoDir = path.join(publicDir, 'oto');
const titleDir = path.join(otoDir, 'title');
const battleDir = path.join(otoDir, 'battle');
const outputFile = path.join(otoDir, 'audio-list.json');

// フォルダが存在しない場合は作成
if (!fs.existsSync(titleDir)) fs.mkdirSync(titleDir, { recursive: true });
if (!fs.existsSync(battleDir)) fs.mkdirSync(battleDir, { recursive: true });

function getMp3Files(dirPath, urlPrefix) {
    if (!fs.existsSync(dirPath)) return [];
    return fs.readdirSync(dirPath)
        .filter(file => file.toLowerCase().endsWith('.mp3'))
        .map(file => urlPrefix + encodeURIComponent(file));
}

const audioList = {
    title: getMp3Files(titleDir, 'oto/title/'),
    battle: getMp3Files(battleDir, 'oto/battle/')
};

fs.writeFileSync(outputFile, JSON.stringify(audioList, null, 2), 'utf-8');
console.log('Audio list generated:', audioList);
