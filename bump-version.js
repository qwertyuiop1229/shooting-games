const fs = require('fs');
const p = require('path');
const filePath = p.join(__dirname, 'public', 'index.html');
let html = fs.readFileSync(filePath, 'utf-8');

const match = html.match(/const GAME_VERSION = '(\d+)\.(\d+)\.(\d+)'/);
if (match) {
    const major = parseInt(match[1]);
    const minor = parseInt(match[2]);
    const patch = parseInt(match[3]) + 1;
    const newVersion = `${major}.${minor}.${patch}`;
    html = html.replace(/const GAME_VERSION = '\d+\.\d+\.\d+'/, `const GAME_VERSION = '${newVersion}'`);
    fs.writeFileSync(filePath, html, 'utf-8');
    console.log(`Version bumped to ${newVersion}`);
} else {
    console.log('GAME_VERSION not found, skipping.');
}
