const fs = require('fs');
const path = require('path');

const gameJsPath = path.join(__dirname, '../public/js/game.js');
const gameJsBackupPath = path.join(__dirname, '../public/js/game.js.bak');

// バックアップが存在する場合のみ復元
if (fs.existsSync(gameJsBackupPath)) {
    console.log("♻️ [BUILD] バックアップから元の game.js を復元しています...");
    fs.copyFileSync(gameJsBackupPath, gameJsPath);
    fs.unlinkSync(gameJsBackupPath);
    console.log("✅ [BUILD] 元のソースコードの復元が完了しました。");
}
