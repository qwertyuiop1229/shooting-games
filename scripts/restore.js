const fs = require('fs');
const path = require('path');

const filesToRestore = ['game.js', 'gamemodes.js'];

for (const fileName of filesToRestore) {
    const filePath = path.join(__dirname, '../public/js/', fileName);
    const backupPath = filePath + '.bak';

    // バックアップが存在する場合のみ復元
    if (fs.existsSync(backupPath)) {
        console.log(`♻️ [BUILD] バックアップから元の ${fileName} を復元しています...`);
        fs.copyFileSync(backupPath, filePath);
        fs.unlinkSync(backupPath);
        console.log(`✅ [BUILD] 元のソースコードの復元が完了しました。`);
    }
}
