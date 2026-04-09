const { execSync } = require('child_process');

const projectId = process.env.GCLOUD_PROJECT;
let envName = 'dev'; // デフォルトはテスト環境

// FirebaseのアクティブなプロジェクトIDからCloudflareのデプロイ先を判定する
if (projectId === 'astro-fray') {
    envName = 'prod';
} else if (projectId === 'shooting-games-1') {
    envName = 'dev';
} else {
    console.log(`⚠️  未定義のFirebaseプロジェクト (${projectId}) が検出されました。デフォルトのテスト環境 (dev) として扱います。`);
}

console.log(`\n======================================================`);
console.log(`🚀 [Cloudflare Workers] Firebaseデプロイ連動開始`);
console.log(`   -> Target Environment: ${envName.toUpperCase()}`);
console.log(`======================================================\n`);

try {
    // wrangler deploy を対象の環境で実行
    // npx を利用し、astro-fray ディレクトリ（wrangler.jsonc がある場所）で実行する
    execSync(`npx wrangler deploy --env ${envName}`, {
        cwd: './astro-fray',
        stdio: 'inherit' // ターミナルにそのまま出力を流す
    });
    console.log(`\n✅ [Cloudflare Workers] デプロイが正常に完了しました！`);
} catch (error) {
    console.error(`\n❌ [Cloudflare Workers] デプロイ中にエラーが発生しました。`);
    process.exit(1);
}
