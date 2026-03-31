const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const JavaScriptObfuscator = require('javascript-obfuscator');

try {
    const activeProject = execSync('firebase use').toString().toLowerCase();

    // 本番環境プロジェクト名が含まれる場合のみ難読化を実行
    if (activeProject.includes('astro-fray') || activeProject.includes('production')) {
        console.log("🔨 [BUILD] 本番環境へのデプロイを検知しました。コードの難読化（暗号化）を開始します...");

        const gameJsPath = path.join(__dirname, '../public/js/game.js');
        const gameJsBackupPath = path.join(__dirname, '../public/js/game.js.bak');

        // オリジナルのバックアップを作成
        if (!fs.existsSync(gameJsBackupPath)) {
            fs.copyFileSync(gameJsPath, gameJsBackupPath);
        } else {
            // 前回のバックアップが残っていたら復元（安全策）
            fs.copyFileSync(gameJsBackupPath, gameJsPath);
        }

        const sourceCode = fs.readFileSync(gameJsPath, 'utf8');

        // 難読化実行 (ゲームのFPSに影響が出ないよう、重すぎる設定はOFF)
        const obfuscationResult = JavaScriptObfuscator.obfuscate(sourceCode, {
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 0.1,
            stringArray: true,
            stringArrayEncoding: ['rc4'],
            stringArrayThreshold: 0.3,
            deadCodeInjection: false,
        });

        fs.writeFileSync(gameJsPath, obfuscationResult.getObfuscatedCode());
        console.log("✅ [BUILD] game.js の難読化に成功しました。");

    } else {
        console.log("⚡ [BUILD] テスト環境（dev）へのデプロイです。難読化をスキップします。");
    }
} catch (error) {
    console.error("❌ [BUILD ERROR] 難読化プロセスでエラーが発生しました:", error);
    process.exit(1);
}
