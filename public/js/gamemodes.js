/* ================================================================
   Astro Fray - Epic Game Modes System (gamemodes.js)
   Contains all 4 new game modes:
   1. Stranger Race (Item Battle)
   2. Mothership Wars (Bed Wars style)
   3. Parasite Panic (Infection)
   4. Galactic Payload (Escort)
   ================================================================ */

// ========================================================
// グローバルモード管理
// ========================================================
window.GameModes = {
    CLASSIC: "classic",
    STRANGER_RACE: "stranger_race",
    MOTHERSHIP_WARS: "mothership_wars",
    PARASITE_PANIC: "parasite_panic",
    GALACTIC_PAYLOAD: "galactic_payload",
};

window.currentGameMode = window.GameModes.CLASSIC;

// ゲームモード共通インタフェース
window.gameModeSystem = null;

// ========================================================
// ========================================================
//  MODE 1: ASTRO STRANGER RACE (アイテムバトル)
// ========================================================
// ========================================================

// --- アイテム定義 ---
const ITEMS = {
    PLASMA_HOUND: {
        id: "plasma_hound",
        name: "プラズマ・ハウンド",
        description: "追尾ミサイル",
        color: "#ff3333",
        glowColor: "rgba(255,51,51,0.6)",
        icon: "🔥",
        rarity: 0.25, // 出現率のウェイト
        duration: 0,
        cooldown: 500,
    },
    GRAVITY_MINE: {
        id: "gravity_mine",
        name: "グラビティ・マイン",
        description: "重力機雷",
        color: "#aa00ff",
        glowColor: "rgba(170,0,255,0.6)",
        icon: "🌀",
        rarity: 0.25,
        duration: 15000,
        cooldown: 300,
    },
    HYPERDRIVE: {
        id: "hyperdrive",
        name: "ハイパードライブ",
        description: "3秒間超加速",
        color: "#00ddff",
        glowColor: "rgba(0,221,255,0.6)",
        icon: "⚡",
        rarity: 0.25,
        duration: 3000,
        cooldown: 0,
    },
    EMP_CATASTROPHE: {
        id: "emp_catastrophe",
        name: "EMPカタストロフィ",
        description: "全敵システム停止",
        color: "#ffff00",
        glowColor: "rgba(255,255,0,0.6)",
        icon: "💥",
        rarity: 0.05, // レアアイテム
        duration: 3000,
        cooldown: 0,
    },
    NANO_DRONE: {
        id: "nano_drone",
        name: "ナノドローン要塞",
        description: "3回防御バリア",
        color: "#00ff88",
        glowColor: "rgba(0,255,136,0.6)",
        icon: "🛡",
        rarity: 0.2,
        duration: 20000,
        cooldown: 0,
    },
    PHOTON_SCATTER: {
        id: "photon_scatter",
        name: "フォトン・スキャッター",
        description: "8方向一斉射撃",
        color: "#ff88ff",
        glowColor: "rgba(255,136,255,0.6)",
        icon: "✦",
        rarity: 0.15,
        duration: 0,
        cooldown: 200,
    },
    CHRONO_WARP: {
        id: "chrono_warp",
        name: "クロノ・ワープ",
        description: "瞬間テレポート",
        color: "#88ffcc",
        glowColor: "rgba(136,255,204,0.6)",
        icon: "⏳",
        rarity: 0.1,
        duration: 0,
        cooldown: 0,
    },
    VOID_ANCHOR: {
        id: "void_anchor",
        name: "ヴォイド・アンカー",
        description: "周囲の敵を2秒停止",
        color: "#6644ff",
        glowColor: "rgba(102,68,255,0.6)",
        icon: "⚓",
        rarity: 0.1,
        duration: 2000,
        cooldown: 0,
    },
};

const ITEM_LIST = Object.values(ITEMS);
const TOTAL_RARITY = ITEM_LIST.reduce((sum, i) => sum + i.rarity, 0);

function pickRandomItem() {
    let r = Math.random() * TOTAL_RARITY;
    for (const item of ITEM_LIST) {
        r -= item.rarity;
        if (r <= 0) return item;
    }
    return ITEM_LIST[0];
}

// --- アイテムコンテナ（マップ上に出現するピックアップ） ---
class ItemContainer {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 18;
        this.alive = true;
        this.item = pickRandomItem();
        this.spawnTime = performance.now();
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.rotAngle = 0;
        this.lifetime = 30000; // 30秒で消える
        this.pickupCooldown = 500; // ピックアップ後のクールダウン
    }

    update(dt) {
        this.pulsePhase += dt * 3;
        this.rotAngle += dt * 1.5;
        if (performance.now() - this.spawnTime > this.lifetime) {
            this.alive = false;
        }
    }

    draw(ctx, sx, sy) {
        const pulse = 0.8 + Math.sin(this.pulsePhase) * 0.2;
        const r = this.radius * pulse;

        // 外側のグロー
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 2.5);
        grad.addColorStop(0, this.item.glowColor);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, r * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // コンテナ本体（回転する八角形）
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(this.rotAngle);
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const a = (Math.PI * 2 / 8) * i;
            const px = Math.cos(a) * r;
            const py = Math.sin(a) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fill();
        ctx.strokeStyle = this.item.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = this.item.color;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // アイテムアイコン（テキスト）
        ctx.fillStyle = this.item.color;
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.item.icon, 0, 0);

        ctx.restore();
    }
}

// --- 追尾ミサイル ---
class HomingMissile {
    constructor(x, y, angle, ownerTeam, ownerId) {
        this.x = x;
        this.y = y;
        this.speed = 8;
        this.angle = angle;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.ownerTeam = ownerTeam;
        this.ownerId = ownerId;
        this.alive = true;
        this.damage = 60;
        this.turnRate = 0.06;
        this.lifetime = 5000;
        this.spawnTime = performance.now();
        this.radius = 6;
        this.target = null;
        this.trail = [];
        this.trailTimer = 0;
    }

    findTarget(ships, WORLD_W, WORLD_H, torusDist2) {
        let minDist = Infinity;
        let best = null;
        for (const s of ships) {
            if (s.team === this.ownerTeam || s.isGhost || !s.alive) continue;
            const d2 = torusDist2(this.x, this.y, s.x, s.y);
            if (d2 < minDist) {
                minDist = d2;
                best = s;
            }
        }
        this.target = best;
    }

    update(dt, ships, WORLD_W, WORLD_H, torusDist2, wrap) {
        if (!this.alive) return;

        // ターゲット追跡
        if (!this.target || this.target.isGhost || !this.target.alive) {
            this.findTarget(ships, WORLD_W, WORLD_H, torusDist2);
        }

        if (this.target) {
            // トーラスワールドでの方向計算
            let dx = this.target.x - this.x;
            let dy = this.target.y - this.y;
            if (Math.abs(dx) > WORLD_W / 2) dx -= Math.sign(dx) * WORLD_W;
            if (Math.abs(dy) > WORLD_H / 2) dy -= Math.sign(dy) * WORLD_H;

            const targetAngle = Math.atan2(dy, dx);
            let angleDiff = targetAngle - this.angle;
            // -PI〜PI に正規化
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            this.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), this.turnRate);
        }

        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        this.x = wrap(this.x + this.vx, WORLD_W);
        this.y = wrap(this.y + this.vy, WORLD_H);

        // トレイル
        this.trailTimer += dt * 1000;
        if (this.trailTimer > 16) {
            this.trailTimer = 0;
            this.trail.push({ x: this.x, y: this.y, alpha: 1.0 });
            if (this.trail.length > 20) this.trail.shift();
        }
        for (const t of this.trail) {
            t.alpha -= dt * 3;
        }
        this.trail = this.trail.filter(t => t.alpha > 0);

        // 寿命チェック
        if (performance.now() - this.spawnTime > this.lifetime) {
            this.alive = false;
        }
    }

    draw(ctx, sx, sy, camX, camY, canvasW, canvasH) {
        // トレイル
        for (const t of this.trail) {
            const tSx = t.x - camX + canvasW / 2;
            const tSy = t.y - camY + canvasH / 2;
            ctx.fillStyle = `rgba(255,80,30,${t.alpha * 0.6})`;
            ctx.beginPath();
            ctx.arc(tSx, tSy, 3 * t.alpha, 0, Math.PI * 2);
            ctx.fill();
        }

        // ミサイル本体
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(this.angle);

        // ロケット炎
        const flameLen = 6 + Math.random() * 4;
        ctx.fillStyle = "rgba(255,150,0,0.8)";
        ctx.beginPath();
        ctx.moveTo(-8, -3);
        ctx.lineTo(-8 - flameLen, 0);
        ctx.lineTo(-8, 3);
        ctx.closePath();
        ctx.fill();

        // 本体
        ctx.fillStyle = "#ff3333";
        ctx.shadowColor = "#ff3333";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-6, -4);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-6, 4);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
    }
}

// --- 重力機雷 ---
class GravityMine {
    constructor(x, y, ownerTeam, ownerId) {
        this.x = x;
        this.y = y;
        this.ownerTeam = ownerTeam;
        this.ownerId = ownerId;
        this.alive = true;
        this.radius = 12;
        this.pullRadius = 120;
        this.damage = 80;
        this.pullForce = 0.3;
        this.spawnTime = performance.now();
        this.lifetime = 15000;
        this.pulsePhase = 0;
        this.armed = false;
        this.armTime = 1000;
        this.exploding = false;
        this.explodeTimer = 0;
        this.explodeDuration = 300;
    }

    update(dt, ships, WORLD_W, WORLD_H, torusDist2) {
        if (!this.alive) return;
        this.pulsePhase += dt * 4;

        const elapsed = performance.now() - this.spawnTime;
        if (!this.armed && elapsed > this.armTime) {
            this.armed = true;
        }

        if (this.exploding) {
            this.explodeTimer += dt * 1000;
            if (this.explodeTimer > this.explodeDuration) {
                this.alive = false;
            }
            return;
        }

        // 寿命チェック
        if (elapsed > this.lifetime) {
            this.alive = false;
            return;
        }

        if (!this.armed) return;

        // 引力場＆起爆判定
        for (const s of ships) {
            if (s.team === this.ownerTeam || s.isGhost || !s.alive) continue;
            const d2 = torusDist2(this.x, this.y, s.x, s.y);
            const d = Math.sqrt(d2);

            if (d < this.pullRadius) {
                // 引力
                let dx = this.x - s.x;
                let dy = this.y - s.y;
                if (Math.abs(dx) > WORLD_W / 2) dx -= Math.sign(dx) * WORLD_W;
                if (Math.abs(dy) > WORLD_H / 2) dy -= Math.sign(dy) * WORLD_H;
                const norm = Math.sqrt(dx * dx + dy * dy) || 1;
                const force = this.pullForce * (1 - d / this.pullRadius);
                s.vx += (dx / norm) * force;
                s.vy += (dy / norm) * force;

                // 近接起爆
                if (d < this.radius + 20) {
                    this.exploding = true;
                    s.hp -= this.damage;
                    // ノックバック
                    s.vx -= (dx / norm) * 8;
                    s.vy -= (dy / norm) * 8;
                }
            }
        }
    }

    draw(ctx, sx, sy) {
        if (this.exploding) {
            // 爆発エフェクト
            const progress = this.explodeTimer / this.explodeDuration;
            const r = this.pullRadius * progress;
            const alpha = 1 - progress;

            ctx.beginPath();
            ctx.arc(sx, sy, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(170,0,255,${alpha * 0.3})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(170,0,255,${alpha})`;
            ctx.lineWidth = 3;
            ctx.stroke();
            return;
        }

        const pulse = 0.6 + Math.sin(this.pulsePhase) * 0.4;

        // 引力場の可視化（リング）
        if (this.armed) {
            ctx.beginPath();
            ctx.arc(sx, sy, this.pullRadius * pulse, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(170,0,255,${0.15 * pulse})`;
            ctx.lineWidth = 1;
            ctx.stroke();

            // 内側のリング
            ctx.beginPath();
            ctx.arc(sx, sy, this.pullRadius * 0.5 * pulse, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(170,0,255,${0.25 * pulse})`;
            ctx.stroke();
        }

        // 機雷本体
        ctx.beginPath();
        ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.armed ? "rgba(170,0,255,0.8)" : "rgba(100,100,100,0.6)";
        ctx.fill();
        ctx.strokeStyle = this.armed ? "#dd00ff" : "#666";
        ctx.lineWidth = 2;
        ctx.shadowColor = this.armed ? "#aa00ff" : "transparent";
        ctx.shadowBlur = this.armed ? 10 : 0;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 中心の光点
        if (this.armed) {
            const blink = Math.sin(this.pulsePhase * 2) > 0;
            if (blink) {
                ctx.beginPath();
                ctx.arc(sx, sy, 3, 0, Math.PI * 2);
                ctx.fillStyle = "#ff00ff";
                ctx.fill();
            }
        }
    }
}

// --- ナノドローン要塞（バリア） ---
class NanoDroneShield {
    constructor(ownerId, ownerShip) {
        this.ownerId = ownerId;
        this.owner = ownerShip;
        this.charges = 3;
        this.alive = true;
        this.droneAngle = 0;
        this.droneRadius = 40;
        this.spawnTime = performance.now();
        this.lifetime = 20000;
        this.hitFlash = 0;
    }

    absorbHit() {
        this.charges--;
        this.hitFlash = 1.0;
        if (this.charges <= 0) {
            this.alive = false;
        }
        return true; // ダメージ吸収成功
    }

    update(dt) {
        if (!this.alive) return;
        this.droneAngle += dt * 2.5;
        if (this.hitFlash > 0) this.hitFlash -= dt * 4;
        if (performance.now() - this.spawnTime > this.lifetime) {
            this.alive = false;
        }
    }

    draw(ctx, sx, sy) {
        if (!this.alive) return;

        // ヒットフラッシュ
        if (this.hitFlash > 0) {
            ctx.beginPath();
            ctx.arc(sx, sy, this.droneRadius + 5, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0,255,136,${this.hitFlash * 0.8})`;
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // 各ドローン
        for (let i = 0; i < this.charges; i++) {
            const angle = this.droneAngle + (Math.PI * 2 / 3) * i;
            const dx = Math.cos(angle) * this.droneRadius;
            const dy = Math.sin(angle) * this.droneRadius;

            // ドローン本体
            ctx.save();
            ctx.translate(sx + dx, sy + dy);
            ctx.rotate(angle + Math.PI / 2);

            ctx.fillStyle = "#00ff88";
            ctx.shadowColor = "#00ff88";
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.moveTo(0, -5);
            ctx.lineTo(-4, 4);
            ctx.lineTo(4, 4);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.restore();

            // ドローン間を結ぶシールドライン
            const nextI = (i + 1) % this.charges;
            if (this.charges > 1) {
                const nextAngle = this.droneAngle + (Math.PI * 2 / 3) * nextI;
                const nx = Math.cos(nextAngle) * this.droneRadius;
                const ny = Math.sin(nextAngle) * this.droneRadius;
                ctx.beginPath();
                ctx.moveTo(sx + dx, sy + dy);
                ctx.lineTo(sx + nx, sy + ny);
                ctx.strokeStyle = `rgba(0,255,136,0.3)`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    }
}

// --- ストレンジャーレースのメインシステム ---
class StrangerRaceMode {
    constructor() {
        this.containers = [];
        this.missiles = [];
        this.mines = [];
        this.shields = new Map();
        this.scatterBullets = [];
        this.warpEffects = [];
        this.voidAnchors = [];
        this.killFeed = [];
        this.containerSpawnTimer = 0;
        this.containerSpawnInterval = 3000;
        this.maxContainers = 12;
        this.playerInventory = new Map();
        this.empActive = false;
        this.empTimer = 0;
        this.empDuration = 3000;
        this.empOwnerId = null;
        this.hyperdriveActive = new Map();
        this.killScores = new Map();
        this.matchTimeLimit = 180000;
        this.matchStartTime = 0;
        this.aiItemTimer = 0;
    }

    init(ships, WORLD_W, WORLD_H) {
        this.containers = [];
        this.missiles = [];
        this.mines = [];
        this.shields.clear();
        this.scatterBullets = [];
        this.warpEffects = [];
        this.voidAnchors = [];
        this.killFeed = [];
        this.playerInventory.clear();
        this.hyperdriveActive.clear();
        this.killScores.clear();
        this.empActive = false;
        this.matchStartTime = performance.now();

        // 初期コンテナ配置
        for (let i = 0; i < 8; i++) {
            this.spawnContainer(WORLD_W, WORLD_H);
        }
    }

    spawnContainer(WORLD_W, WORLD_H) {
        if (this.containers.length >= this.maxContainers) return;
        const x = Math.random() * WORLD_W;
        const y = Math.random() * WORLD_H;
        this.containers.push(new ItemContainer(x, y));
    }

    // プレイヤーがアイテムを使った時の処理
    useItem(playerId, ship, ships, WORLD_W, WORLD_H) {
        const item = this.playerInventory.get(playerId);
        if (!item) return false;
        this.playerInventory.delete(playerId);

        switch (item.id) {
            case "plasma_hound": {
                const missile = new HomingMissile(
                    ship.x, ship.y, ship.angle, ship.team, playerId
                );
                this.missiles.push(missile);
                return true;
            }
            case "gravity_mine": {
                // 自機の後方に設置
                const behind = ship.angle + Math.PI;
                const mine = new GravityMine(
                    ship.x + Math.cos(behind) * 30,
                    ship.y + Math.sin(behind) * 30,
                    ship.team, playerId
                );
                this.mines.push(mine);
                return true;
            }
            case "hyperdrive": {
                this.hyperdriveActive.set(playerId, {
                    timer: 3000,
                    originalMaxSpeed: ship.maxSpeed
                });
                ship.maxSpeed *= 2;
                ship.boosting = true;
                return true;
            }
            case "emp_catastrophe": {
                this.empActive = true;
                this.empTimer = this.empDuration;
                this.empOwnerId = playerId;
                return true;
            }
            case "nano_drone": {
                const shield = new NanoDroneShield(playerId, ship);
                this.shields.set(playerId, shield);
                return true;
            }
            case "photon_scatter": {
                // 8方向一斉射撃
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 / 8) * i;
                    this.scatterBullets.push({
                        x: ship.x, y: ship.y,
                        vx: Math.cos(angle) * 10, vy: Math.sin(angle) * 10,
                        damage: 35, ownerTeam: ship.team, ownerId: playerId,
                        alive: true, radius: 4, life: 1.5,
                        color: "#ff88ff",
                    });
                }
                return true;
            }
            case "chrono_warp": {
                // 前方500px先にテレポート
                const warpDist = 500;
                ship.x += Math.cos(ship.angle) * warpDist;
                ship.y += Math.sin(ship.angle) * warpDist;
                // ワープエフェクト追加
                this.warpEffects.push({
                    x: ship.x, y: ship.y, timer: 0.5, radius: 0,
                });
                return true;
            }
            case "void_anchor": {
                // 範囲内の敵を2秒停止
                this.voidAnchors.push({
                    x: ship.x, y: ship.y, ownerTeam: ship.team,
                    timer: 2.0, radius: 200, pulsePhase: 0,
                });
                return true;
            }
        }
        return false;
    }

    // AI自動アイテム使用
    aiUseItem(shipId, ship, ships, WORLD_W, WORLD_H) {
        const item = this.playerInventory.get(shipId);
        if (!item) return;

        // AIは確率でアイテムを使う
        if (Math.random() > 0.02) return; // 毎フレーム2%の確率

        this.playerInventory.delete(shipId);
        // AIは単純にアイテムを使う
        switch (item.id) {
            case "plasma_hound":
                this.missiles.push(new HomingMissile(ship.x, ship.y, ship.angle, ship.team, shipId));
                break;
            case "gravity_mine": {
                const behind = ship.angle + Math.PI;
                this.mines.push(new GravityMine(ship.x + Math.cos(behind) * 30, ship.y + Math.sin(behind) * 30, ship.team, shipId));
                break;
            }
            case "hyperdrive":
                this.hyperdriveActive.set(shipId, { timer: 3000, originalMaxSpeed: ship.maxSpeed });
                ship.maxSpeed *= 2;
                break;
            case "nano_drone":
                this.shields.set(shipId, new NanoDroneShield(shipId, ship));
                break;
            case "photon_scatter":
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 / 8) * i;
                    this.scatterBullets.push({
                        x: ship.x, y: ship.y,
                        vx: Math.cos(angle) * 10, vy: Math.sin(angle) * 10,
                        damage: 35, ownerTeam: ship.team, ownerId: shipId,
                        alive: true, radius: 4, life: 1.5, color: "#ff88ff",
                    });
                }
                break;
            case "void_anchor":
                this.voidAnchors.push({ x: ship.x, y: ship.y, ownerTeam: ship.team, timer: 2.0, radius: 200, pulsePhase: 0 });
                break;
            default:
                break;
        }
    }

    update(dt, ships, WORLD_W, WORLD_H, torusDist2, wrap, playerId) {
        const dtMs = dt * 1000;

        // コンテナスポーン
        this.containerSpawnTimer += dtMs;
        if (this.containerSpawnTimer >= this.containerSpawnInterval) {
            this.containerSpawnTimer = 0;
            this.spawnContainer(WORLD_W, WORLD_H);
        }

        // コンテナ更新 & ピックアップ判定
        for (const c of this.containers) {
            c.update(dt);
            if (!c.alive) continue;
            for (const s of ships) {
                if (s.isGhost || !s.alive) continue;
                if (this.playerInventory.has(s.id)) continue; // すでにアイテム所持中
                const d2 = torusDist2(c.x, c.y, s.x, s.y);
                if (d2 < (c.radius + 15) * (c.radius + 15)) {
                    this.playerInventory.set(s.id, c.item);
                    c.alive = false;
                    // ピックアップ音を鳴らす
                    if (s.id === playerId && typeof playPowerUpSound === "function") {
                        playPowerUpSound();
                    }
                }
            }
        }
        this.containers = this.containers.filter(c => c.alive);

        // ミサイル更新
        for (const m of this.missiles) {
            m.update(dt, ships, WORLD_W, WORLD_H, torusDist2, wrap);
            if (!m.alive) continue;

            // 衝突判定
            for (const s of ships) {
                if (s.team === m.ownerTeam || s.isGhost || !s.alive) continue;
                const d2 = torusDist2(m.x, m.y, s.x, s.y);
                if (d2 < (m.radius + 15) * (m.radius + 15)) {
                    // シールドチェック
                    const shield = this.shields.get(s.id);
                    if (shield && shield.alive) {
                        shield.absorbHit();
                    } else {
                        s.hp -= m.damage;
                        // スピン効果
                        s.angle += (Math.random() - 0.5) * 2;
                    }
                    m.alive = false;
                    break;
                }
            }
        }
        this.missiles = this.missiles.filter(m => m.alive);

        // 機雷更新
        for (const mine of this.mines) {
            mine.update(dt, ships, WORLD_W, WORLD_H, torusDist2);
        }
        this.mines = this.mines.filter(m => m.alive);

        // シールド更新
        for (const [id, shield] of this.shields) {
            shield.update(dt);
            if (!shield.alive) {
                this.shields.delete(id);
            }
        }

        // EMP更新
        if (this.empActive) {
            this.empTimer -= dtMs;
            if (this.empTimer <= 0) {
                this.empActive = false;
            }
        }

        // ハイパードライブ更新
        for (const [pid, data] of this.hyperdriveActive) {
            data.timer -= dtMs;
            if (data.timer <= 0) {
                const s = ships.find(s => s.id === pid);
                if (s) s.maxSpeed = data.originalMaxSpeed;
                this.hyperdriveActive.delete(pid);
            }
        }

        // スキャッター弾更新
        for (const b of this.scatterBullets) {
            if (!b.alive) continue;
            b.x += b.vx;
            b.y += b.vy;
            b.life -= dt;
            if (b.life <= 0) { b.alive = false; continue; }
            // 衝突判定
            for (const s of ships) {
                if (s.team === b.ownerTeam || s.isGhost || !s.alive) continue;
                const d2 = torusDist2(b.x, b.y, s.x, s.y);
                if (d2 < (b.radius + 15) * (b.radius + 15)) {
                    const shield = this.shields.get(s.id);
                    if (shield && shield.alive) { shield.absorbHit(); }
                    else { s.hp -= b.damage; }
                    b.alive = false;
                    break;
                }
            }
        }
        this.scatterBullets = this.scatterBullets.filter(b => b.alive);

        // ワープエフェクト更新
        for (const w of this.warpEffects) {
            w.timer -= dt;
            w.radius += dt * 400;
        }
        this.warpEffects = this.warpEffects.filter(w => w.timer > 0);

        // ヴォイドアンカー更新
        for (const va of this.voidAnchors) {
            va.timer -= dt;
            va.pulsePhase += dt * 5;
            // 範囲内の敵を停止
            for (const s of ships) {
                if (s.team === va.ownerTeam || s.isGhost || !s.alive) continue;
                const d2 = torusDist2(va.x, va.y, s.x, s.y);
                if (d2 < va.radius * va.radius) {
                    s.vx *= 0.85;
                    s.vy *= 0.85;
                }
            }
        }
        this.voidAnchors = this.voidAnchors.filter(va => va.timer > 0);

        // AI のアイテム使用
        for (const s of ships) {
            if (s.ai && s.alive && !s.isGhost && this.playerInventory.has(s.id)) {
                this.aiUseItem(s.id, s, ships, WORLD_W, WORLD_H);
            }
        }

        // キルフィード更新
        this.killFeed = this.killFeed.filter(k => performance.now() - k.time < 4000);
    }

    // EMP中かどうかのチェック（特定プレイヤーに適用するか）
    isEMPedFor(playerId) {
        return this.empActive && playerId !== this.empOwnerId;
    }

    // シールドによるダメージ軽減チェック
    tryAbsorbDamage(playerId) {
        const shield = this.shields.get(playerId);
        if (shield && shield.alive) {
            return shield.absorbHit();
        }
        return false;
    }

    draw(ctx, camX, camY, canvasW, canvasH, WORLD_W, WORLD_H) {
        // コンテナ描画
        for (const c of this.containers) {
            const sx = c.x - camX + canvasW / 2;
            const sy = c.y - camY + canvasH / 2;
            // 画面外判定（簡易）
            if (sx < -50 || sx > canvasW + 50 || sy < -50 || sy > canvasH + 50) continue;
            c.draw(ctx, sx, sy);
        }

        // 機雷描画
        for (const mine of this.mines) {
            const sx = mine.x - camX + canvasW / 2;
            const sy = mine.y - camY + canvasH / 2;
            if (sx < -150 || sx > canvasW + 150 || sy < -150 || sy > canvasH + 150) continue;
            mine.draw(ctx, sx, sy);
        }

        // ミサイル描画
        for (const m of this.missiles) {
            const sx = m.x - camX + canvasW / 2;
            const sy = m.y - camY + canvasH / 2;
            if (sx < -30 || sx > canvasW + 30 || sy < -30 || sy > canvasH + 30) continue;
            m.draw(ctx, sx, sy, camX, camY, canvasW, canvasH);
        }

        // シールド描画（各プレイヤー位置に重ねる）
        for (const [id, shield] of this.shields) {
            if (!shield.owner) continue;
            const sx = shield.owner.x - camX + canvasW / 2;
            const sy = shield.owner.y - camY + canvasH / 2;
            shield.draw(ctx, sx, sy);
        }

        // スキャッター弾描画
        for (const b of this.scatterBullets) {
            if (!b.alive) continue;
            const sx = b.x - camX + canvasW / 2;
            const sy = b.y - camY + canvasH / 2;
            if (sx < -10 || sx > canvasW + 10 || sy < -10 || sy > canvasH + 10) continue;
            ctx.fillStyle = b.color;
            ctx.shadowColor = b.color;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(sx, sy, b.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // ワープエフェクト描画
        for (const w of this.warpEffects) {
            const sx = w.x - camX + canvasW / 2;
            const sy = w.y - camY + canvasH / 2;
            const alpha = w.timer / 0.5;
            ctx.beginPath();
            ctx.arc(sx, sy, w.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(136,255,204,${alpha * 0.8})`;
            ctx.lineWidth = 3;
            ctx.stroke();
            // 内側のフラッシュ
            ctx.beginPath();
            ctx.arc(sx, sy, w.radius * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(136,255,204,${alpha * 0.4})`;
            ctx.fill();
        }

        // ヴォイドアンカー描画
        for (const va of this.voidAnchors) {
            const sx = va.x - camX + canvasW / 2;
            const sy = va.y - camY + canvasH / 2;
            const alpha = Math.min(1, va.timer);
            const pulse = 0.8 + Math.sin(va.pulsePhase) * 0.2;
            // 範囲リング
            ctx.beginPath();
            ctx.arc(sx, sy, va.radius * pulse, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(102,68,255,${alpha * 0.08})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(102,68,255,${alpha * 0.5})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.stroke();
            ctx.setLineDash([]);
            // 中心アンカー
            ctx.fillStyle = `rgba(102,68,255,${alpha * 0.9})`;
            ctx.font = "bold 18px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("⚓", sx, sy);
        }
    }

    drawHUD(ctx, canvasW, canvasH, playerId) {
        // アイテムインベントリ表示
        const item = this.playerInventory.get(playerId);
        const boxX = canvasW / 2 - 40;
        const boxY = canvasH - 80;
        const boxW = 80;
        const boxH = 50;

        // ボックス背景
        ctx.fillStyle = "rgba(0,10,20,0.7)";
        ctx.strokeStyle = item ? item.color : "rgba(0,240,255,0.3)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        const rr = 4;
        ctx.moveTo(boxX + rr, boxY);
        ctx.lineTo(boxX + boxW - rr, boxY);
        ctx.arcTo(boxX + boxW, boxY, boxX + boxW, boxY + rr, rr);
        ctx.lineTo(boxX + boxW, boxY + boxH - rr);
        ctx.arcTo(boxX + boxW, boxY + boxH, boxX + boxW - rr, boxY + boxH, rr);
        ctx.lineTo(boxX + rr, boxY + boxH);
        ctx.arcTo(boxX, boxY + boxH, boxX, boxY + boxH - rr, rr);
        ctx.lineTo(boxX, boxY + rr);
        ctx.arcTo(boxX, boxY, boxX + rr, boxY, rr);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (item) {
            // アイテムアイコン
            ctx.fillStyle = item.color;
            ctx.font = "bold 20px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.shadowColor = item.color;
            ctx.shadowBlur = 8;
            ctx.fillText(item.icon, boxX + boxW / 2, boxY + 18);
            ctx.shadowBlur = 0;

            // アイテム名
            ctx.font = "9px monospace";
            ctx.fillStyle = item.color;
            ctx.fillText(item.name, boxX + boxW / 2, boxY + 40);
        } else {
            ctx.fillStyle = "rgba(0,240,255,0.3)";
            ctx.font = "10px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("NO ITEM", boxX + boxW / 2, boxY + boxH / 2);
        }

        // 「Fキーで使用」ヒント
        if (item) {
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            ctx.font = "9px monospace";
            ctx.textAlign = "center";
            ctx.fillText("[F] USE", boxX + boxW / 2, boxY - 8);
        }

        // EMP警告表示
        if (this.empActive && this.empOwnerId !== playerId) {
            const flashAlpha = 0.3 + Math.sin(performance.now() * 0.01) * 0.2;
            ctx.fillStyle = `rgba(255,255,0,${flashAlpha})`;
            ctx.fillRect(0, 0, canvasW, canvasH);

            ctx.fillStyle = "#ff0000";
            ctx.font = "bold 36px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.shadowColor = "#ff0000";
            ctx.shadowBlur = 15;
            ctx.fillText("⚠ SYSTEM ERROR ⚠", canvasW / 2, canvasH / 2);
            ctx.shadowBlur = 0;
        }

        // 残り時間
        const elapsed = performance.now() - this.matchStartTime;
        const remaining = Math.max(0, this.matchTimeLimit - elapsed);
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        ctx.fillStyle = remaining < 30000 ? "#ff3333" : "#00f0ff";
        ctx.font = "bold 16px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`${mins}:${secs.toString().padStart(2, "0")}`, canvasW / 2, 30);
    }

    isMatchOver() {
        return performance.now() - this.matchStartTime >= this.matchTimeLimit;
    }
}


// ========================================================
// ========================================================
//  MODE 2: MOTHERSHIP WARS (マザーシップ・ウォーズ)
// ========================================================
// ========================================================

// MOTHERSHIP_UPGRADES 定義
const MOTHERSHIP_UPGRADES = {
    turret: { id: "turret", name: "DEFENSE TURRET", maxLevel: 4, cost: [10, 20, 40, 80], icon: "🔫", color: "#ff6600" },
    weapon_boost: { id: "weapon_boost", name: "WEAPON DMG", maxLevel: 3, cost: [15, 30, 60], icon: "⚔", color: "#ff3333" },
    shield_regen: { id: "shield_regen", name: "SHIELD REGEN", maxLevel: 3, cost: [20, 40, 80], icon: "💚", color: "#00ff66" },
    armor: { id: "armor", name: "HULL ARMOR", maxLevel: 3, cost: [25, 50, 100], icon: "🛡", color: "#4488ff" }
};

class Mothership {
    constructor(team, x, y) {
        this.team = team;
        this.x = x;
        this.y = y;
        this.hp = 2000;
        this.maxHp = 2000;
        this.alive = true;
        this.radius = 80;
        this.angle = 0;
        this.turrets = [];
        this.upgradeLevel = { turret: 0, weapon_boost: 0, shield_regen: 0, armor: 0 };
        this.pulsePhase = 0;
        this.shieldAlpha = 0;
        this.damageFlash = 0;

        // タレット初期化（レベルに応じて発砲する数が変わる）
        for (let i = 0; i < 4; i++) {
            this.turrets.push({ angle: (Math.PI * 2 / 4) * i, reload: 0 });
        }
    }

    getArmorReduction() {
        return this.upgradeLevel.armor * 0.15; // 各レベル15%軽減
    }

    takeDamage(amount) {
        const reduction = this.getArmorReduction();
        const actualDmg = amount * (1 - reduction);
        this.hp -= actualDmg;
        this.damageFlash = 1.0;
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
        }
        return actualDmg;
    }

    update(dt, ships, torusDist2, newBullets) {
        if (!this.alive) return;
        this.angle += dt * 0.1;
        this.pulsePhase += dt * 2;
        if (this.damageFlash > 0) this.damageFlash -= dt * 3;
        if (this.shieldAlpha > 0) this.shieldAlpha -= dt * 2;

        // タレット更新と発砲
        const activeTurretsCount = this.upgradeLevel.turret; // タレットレベルに応じて稼働
        for (let i = 0; i < this.turrets.length; i++) {
            const t = this.turrets[i];
            t.angle += dt * 0.5;
            if (t.reload > 0) t.reload -= dt;

            if (i < activeTurretsCount && t.reload <= 0) {
                // 最寄りの敵を探す
                let target = null;
                let minDist = 400 * 400;
                for (const s of ships) {
                    if (s.team === this.team || s.isGhost || !s.alive) continue;
                    const d2 = torusDist2(this.x, this.y, s.x, s.y);
                    if (d2 < minDist) {
                        minDist = d2;
                        target = s;
                    }
                }

                if (target) {
                    // タレットの絶対角度
                    const tAngle = this.angle + t.angle;
                    // 発砲元
                    const px = this.x + Math.cos(tAngle) * this.radius;
                    const py = this.y + Math.sin(tAngle) * this.radius;
                    // 目標への角度
                    const aimAngle = Math.atan2(target.y - py, target.x - px);

                    newBullets.push({
                        ownerId: `ms_${this.team}`, // 特殊ID
                        ownerTeam: this.team,
                        x: px, y: py,
                        vx: Math.cos(aimAngle) * 8, vy: Math.sin(aimAngle) * 8,
                        life: 1.5,
                        alive: true,
                        dmg: 15,
                        radius: 3,
                        color: "#fff"
                    });
                    t.reload = 0.5; // リロード時間0.5秒
                }
            }
        }
    }

    draw(ctx, sx, sy, teamColor) {
        if (!this.alive) {
            // 残骸描画
            ctx.save();
            ctx.translate(sx, sy);
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = teamColor;
            ctx.lineWidth = 1;
            // 破片のような形
            for (let i = 0; i < 6; i++) {
                const a = (Math.PI * 2 / 6) * i + this.angle;
                const r = 30 + Math.sin(i * 1.5) * 15;
                ctx.beginPath();
                ctx.moveTo(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3);
                ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
                ctx.stroke();
            }
            ctx.globalAlpha = 1.0;
            ctx.restore();
            return;
        }

        ctx.save();
        ctx.translate(sx, sy);

        // ダメージフラッシュ
        if (this.damageFlash > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 10, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,0,0,${this.damageFlash * 0.3})`;
            ctx.fill();
        }

        // シールドオーラ
        const pulse = 0.7 + Math.sin(this.pulsePhase) * 0.3;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 15 * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = teamColor;
        ctx.globalAlpha = 0.15 + this.getArmorReduction(); // アーマーレベルで濃くなる
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // 機体回転
        ctx.rotate(this.angle);

        // アクティブなタレットの描画
        const activeTurretsCount = this.upgradeLevel.turret;
        for (let i = 0; i < this.turrets.length; i++) {
            const t = this.turrets[i];
            const px = Math.cos(t.angle) * this.radius;
            const py = Math.sin(t.angle) * this.radius;
            ctx.fillStyle = i < activeTurretsCount ? teamColor : "#444";
            ctx.beginPath();
            ctx.arc(px, py, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        // 母艦本体（大きな六角形）
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = (Math.PI * 2 / 6) * i;
            const r = this.radius;
            if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fillStyle = "rgba(10,15,30,0.9)";
        ctx.fill();
        ctx.strokeStyle = teamColor;
        ctx.lineWidth = 3;
        ctx.shadowColor = teamColor;
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 内部構造（パネル線）
        for (let i = 0; i < 6; i++) {
            const a = (Math.PI * 2 / 6) * i;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(a) * this.radius * 0.7, Math.sin(a) * this.radius * 0.7);
            ctx.strokeStyle = `${teamColor}40`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // コア（中心の光）
        const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
        coreGrad.addColorStop(0, teamColor);
        coreGrad.addColorStop(1, "transparent");
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        // HPバー
        ctx.rotate(-this.angle); // 回転リセット
        const barW = 100;
        const barH = 8;
        const barX = -barW / 2;
        const barY = this.radius + 20;
        const hpRatio = this.hp / this.maxHp;

        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

        const hpColor = hpRatio > 0.5 ? teamColor : hpRatio > 0.25 ? "#ffaa00" : "#ff0000";
        ctx.fillStyle = hpColor;
        ctx.fillRect(barX, barY, barW * hpRatio, barH);

        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);

        // HP数値
        ctx.fillStyle = "#fff";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`${Math.ceil(this.hp)}/${this.maxHp}`, 0, barY + barH + 12);

        ctx.restore();
    }
}

// --- クリスタルアステロイド（採掘可能な資源） ---
class CrystalAsteroid {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.hp = 50;
        this.maxHp = 50;
        this.radius = 22;
        this.alive = true;
        this.crystalValue = 5 + Math.floor(Math.random() * 6); // 5〜10
        this.rotAngle = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.8;
        this.glowPhase = Math.random() * Math.PI * 2;
        this.respawnTimer = 0;
        this.respawnDelay = 20000; // 20秒で再出現
    }

    update(dt) {
        this.rotAngle += this.rotSpeed * dt;
        this.glowPhase += dt * 2;

        if (!this.alive) {
            this.respawnTimer += dt * 1000;
            if (this.respawnTimer >= this.respawnDelay) {
                this.alive = true;
                this.hp = this.maxHp;
                this.respawnTimer = 0;
            }
        }
    }

    takeDamage(amount) {
        if (!this.alive) return 0;
        this.hp -= amount;
        if (this.hp <= 0) {
            this.alive = false;
            this.hp = 0;
            return this.crystalValue;
        }
        return 0;
    }

    draw(ctx, sx, sy) {
        if (!this.alive) return;

        const glow = 0.5 + Math.sin(this.glowPhase) * 0.5;

        // グロー
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, this.radius * 2);
        grad.addColorStop(0, `rgba(100,200,255,${0.1 * glow})`);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();

        // 本体（結晶形状）
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(this.rotAngle);

        ctx.beginPath();
        const points = 5;
        for (let i = 0; i < points; i++) {
            const a = (Math.PI * 2 / points) * i;
            const r = this.radius * (0.8 + Math.sin(i * 2.3) * 0.3);
            if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fillStyle = `rgba(60,120,200,0.5)`;
        ctx.fill();
        ctx.strokeStyle = `rgba(100,200,255,${0.6 + glow * 0.4})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = "#4488ff";
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 内部のキラキラ
        for (let i = 0; i < 3; i++) {
            const sparkA = this.glowPhase * 0.5 + i * 2.1;
            const sparkR = this.radius * 0.4;
            const sparkX = Math.cos(sparkA) * sparkR;
            const sparkY = Math.sin(sparkA) * sparkR;
            ctx.fillStyle = `rgba(200,230,255,${0.3 + glow * 0.5})`;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// --- ドロップしたクリスタル（拾える資源） ---
class DroppedCrystal {
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.radius = 8;
        this.alive = true;
        this.spawnTime = performance.now();
        this.lifetime = 30000;
        this.bobPhase = Math.random() * Math.PI * 2;
    }

    update(dt) {
        this.bobPhase += dt * 3;
        if (performance.now() - this.spawnTime > this.lifetime) {
            this.alive = false;
        }
    }

    draw(ctx, sx, sy) {
        if (!this.alive) return;
        const bob = Math.sin(this.bobPhase) * 3;

        ctx.fillStyle = "#4488ff";
        ctx.shadowColor = "#4488ff";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        // ダイヤ形
        ctx.moveTo(sx, sy - 8 + bob);
        ctx.lineTo(sx + 6, sy + bob);
        ctx.lineTo(sx, sy + 8 + bob);
        ctx.lineTo(sx - 6, sy + bob);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // 数値
        ctx.fillStyle = "#aaddff";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`+${this.value}`, sx, sy - 14 + bob);
    }
}



class MothershipWarsMode {
    constructor() {
        this.motherships = new Map(); // team -> Mothership
        this.crystalAsteroids = [];
        this.droppedCrystals = [];
        this.playerCrystals = new Map(); // playerId -> amount
        this.teamUpgrades = new Map(); // team -> upgradeLevel map
        this.shopOpen = false;
        this.maxCrystalAsteroids = 20;
    }

    init(teams, WORLD_W, WORLD_H) {
        this.motherships.clear();
        this.crystalAsteroids = [];
        this.droppedCrystals = [];
        this.playerCrystals.clear();
        this.teamUpgrades.clear();

        // 各チームの母艦を配置
        const teamPositions = [
            { x: WORLD_W * 0.2, y: WORLD_H * 0.2 },
            { x: WORLD_W * 0.8, y: WORLD_H * 0.8 },
            { x: WORLD_W * 0.8, y: WORLD_H * 0.2 },
            { x: WORLD_W * 0.2, y: WORLD_H * 0.8 },
        ];

        for (let i = 0; i < teams; i++) {
            const pos = teamPositions[i];
            const ms = new Mothership(i + 1, pos.x, pos.y);
            this.motherships.set(i + 1, ms);
            this.teamUpgrades.set(i + 1, { turret: 0, weapon_boost: 0, shield_regen: 0, armor: 0 });
        }

        // クリスタルアステロイドをマップ中央付近に配置
        for (let i = 0; i < this.maxCrystalAsteroids; i++) {
            const cx = WORLD_W * 0.3 + Math.random() * WORLD_W * 0.4;
            const cy = WORLD_H * 0.3 + Math.random() * WORLD_H * 0.4;
            this.crystalAsteroids.push(new CrystalAsteroid(cx, cy));
        }
    }

    getMothershipForTeam(team) {
        return this.motherships.get(team);
    }

    canRespawn(team) {
        const ms = this.motherships.get(team);
        return ms && ms.alive;
    }

    getPlayerCrystals(playerId) {
        return this.playerCrystals.get(playerId) || 0;
    }

    addCrystals(playerId, amount) {
        const current = this.getPlayerCrystals(playerId);
        this.playerCrystals.set(playerId, current + amount);
        // 実績チェック用
        if (window.gameModeSystem && window.gameModeSystem.achievementSystem) {
            window.gameModeSystem.achievementSystem.stats.crystalsCollected += amount;
            window.gameModeSystem.achievementSystem.checkAchievements(0, 1, 1);
        }
    }

    tryPurchaseUpgrade(playerId, team, upgradeId) {
        const upgrade = Object.values(MOTHERSHIP_UPGRADES).find(u => u.id === upgradeId);
        if (!upgrade) return false;

        const teamUpgrades = this.teamUpgrades.get(team);
        if (!teamUpgrades) return false;

        const currentLevel = teamUpgrades[upgradeId] || 0;
        if (currentLevel >= upgrade.maxLevel) return false;

        const cost = upgrade.cost[currentLevel];
        const playerCrystals = this.getPlayerCrystals(playerId);
        if (playerCrystals < cost) return false;

        // 購入
        this.playerCrystals.set(playerId, playerCrystals - cost);
        teamUpgrades[upgradeId] = currentLevel + 1;

        // 母艦にアップグレード適用
        const ms = this.motherships.get(team);
        if (ms) {
            ms.upgradeLevel = { ...teamUpgrades };
        }

        // 購入効果音
        if (typeof playPowerUpSound === "function") playPowerUpSound();

        return true;
    }

    getWeaponBoostMultiplier(team) {
        const upgrades = this.teamUpgrades.get(team);
        if (!upgrades) return 1.0;
        return 1.0 + upgrades.weapon_boost * 0.3; // レベルごとに30%UP
    }

    getRegenRate(team) {
        const upgrades = this.teamUpgrades.get(team);
        if (!upgrades) return 0;
        return upgrades.shield_regen * 2; // レベルごとに2HP/秒
    }

    update(dt, ships, bullets, WORLD_W, WORLD_H, torusDist2) {
        const newBullets = []; // 母艦タレットからの新弾格納用

        // ショップ購入キーのリスニング（1,2,3,4キー）
        // window.keys が存在し、ゲーム内であることを前提とする
        if (window.keys && ships.length > 0) {
            // ローカルプレイヤーを探す
            const localPlayer = ships.find(s => !s.isGhost && !s.ai && s.alive); // 簡易判定
            if (localPlayer) {
                if (window.keys["1"]) { window.keys["1"] = false; this.tryPurchaseUpgrade(localPlayer.id, localPlayer.team, "turret"); }
                if (window.keys["2"]) { window.keys["2"] = false; this.tryPurchaseUpgrade(localPlayer.id, localPlayer.team, "weapon_boost"); }
                if (window.keys["3"]) { window.keys["3"] = false; this.tryPurchaseUpgrade(localPlayer.id, localPlayer.team, "shield_regen"); }
                if (window.keys["4"]) { window.keys["4"] = false; this.tryPurchaseUpgrade(localPlayer.id, localPlayer.team, "armor"); }
            }
        }

        // 母艦更新
        for (const [team, ms] of this.motherships) {
            ms.update(dt, ships, torusDist2, newBullets);

            if (!ms.alive) continue;

            // 弾と母艦の衝突判定
            for (const b of bullets) {
                if (!b.alive) continue;
                const bShip = ships.find(s => s.id === b.ownerId);
                if (bShip && bShip.team === team) continue;
                const d2 = torusDist2(b.x, b.y, ms.x, ms.y);
                if (d2 < ms.radius * ms.radius) {
                    const actualDmg = ms.takeDamage(b.dmg || 5);
                    b.alive = false;

                    // ダメージ数値を表示（連携）
                    if (window.gameModeSystem && window.gameModeSystem.damageNumberSystem) {
                        window.gameModeSystem.damageNumberSystem.add(b.x, b.y, Math.floor(actualDmg), "#ffaa00");
                    }
                    if (window.gameModeSystem && window.gameModeSystem.particleSystem) {
                        window.gameModeSystem.particleSystem.emitExplosion(b.x, b.y, "#ffcc55", 0.3);
                    }
                }
            }
        }

        // 新しい弾を追加
        if (newBullets.length > 0) {
            bullets.push(...newBullets);
        }

        // クリスタルアステロイド更新
        for (const ca of this.crystalAsteroids) {
            ca.update(dt);

            if (!ca.alive) continue;

            // 弾との衝突判定
            for (const b of bullets) {
                if (!b.alive) continue;
                const d2 = torusDist2(b.x, b.y, ca.x, ca.y);
                if (d2 < ca.radius * ca.radius) {
                    b.alive = false;
                    const crystals = ca.takeDamage(b.dmg || 5);

                    if (window.gameModeSystem && window.gameModeSystem.particleSystem) {
                        window.gameModeSystem.particleSystem.emitExplosion(b.x, b.y, "#4488ff", 0.2);
                    }

                    if (crystals > 0) {
                        // ドロップ
                        this.droppedCrystals.push(new DroppedCrystal(ca.x, ca.y, crystals));
                        if (window.gameModeSystem && window.gameModeSystem.particleSystem) {
                            window.gameModeSystem.particleSystem.emitExplosion(ca.x, ca.y, "#4488ff", 1.5);
                        }
                    }
                }
            }
        }

        // AIのクリスタル採掘行動と帰還
        for (const s of ships) {
            if (s.ai && s.alive && !s.isGhost) {
                const carriedCrystals = this.getPlayerCrystals(s.id);
                if (carriedCrystals < 20) {
                    // クリスタル採掘
                    window.AIBehaviors.seekCrystal(s, this.crystalAsteroids.concat(this.droppedCrystals), WORLD_W, WORLD_H);
                } else {
                    // 足りたら母艦へ帰還
                    const ms = this.motherships.get(s.team);
                    if (ms && ms.alive) {
                        let dx = ms.x - s.x;
                        let dy = ms.y - s.y;
                        if (Math.abs(dx) > WORLD_W / 2) dx -= Math.sign(dx) * WORLD_W;
                        if (Math.abs(dy) > WORLD_H / 2) dy -= Math.sign(dy) * WORLD_H;

                        // 母艦に近づいたらクリスタルを寄付して自動アップグレード
                        if (Math.sqrt(dx * dx + dy * dy) < ms.radius + 150) {
                            // AIによる自動購入ロジック
                            const upgradeChoices = ["turret", "weapon_boost", "shield_regen", "armor"];
                            const choice = upgradeChoices[Math.floor(Math.random() * upgradeChoices.length)];
                            this.tryPurchaseUpgrade(s.id, s.team, choice);
                            // 買いきれなくて残っていても、とりあえずランダムに寄付する試みをする
                        } else {
                            s.angle = Math.atan2(dy, dx);
                        }
                    }
                }
            }
        }

        // ドロップクリスタルのピックアップ
        for (const dc of this.droppedCrystals) {
            dc.update(dt);
            if (!dc.alive) continue;

            for (const s of ships) {
                if (s.isGhost || !s.alive) continue;
                const d2 = torusDist2(dc.x, dc.y, s.x, s.y);
                if (d2 < (dc.radius + 20) * (dc.radius + 20)) {
                    this.addCrystals(s.id, dc.value);
                    dc.alive = false;
                    if (window.gameModeSystem && window.gameModeSystem.particleSystem) {
                        window.gameModeSystem.particleSystem.emitPickup(dc.x, dc.y, "#4488ff");
                    }
                    if (s.id === window.playerId && window.playPowerUpSound) window.playPowerUpSound();
                    break;
                }
            }
        }
        this.droppedCrystals = this.droppedCrystals.filter(dc => dc.alive);

        // プレイヤーHP再生
        for (const s of ships) {
            if (s.isGhost || !s.alive) continue;
            const regen = this.getRegenRate(s.team);
            if (regen > 0 && s.hp < s.maxHp) {
                s.hp = Math.min(s.maxHp, s.hp + regen * dt);
            }
        }
    }

    draw(ctx, camX, camY, canvasW, canvasH, WORLD_W, WORLD_H, TEAM_COLORS) {
        // 母艦描画
        for (const [team, ms] of this.motherships) {
            const sx = ms.x - camX + canvasW / 2;
            const sy = ms.y - camY + canvasH / 2;
            if (sx < -200 || sx > canvasW + 200 || sy < -200 || sy > canvasH + 200) continue;
            ms.draw(ctx, sx, sy, TEAM_COLORS[team] || "#fff");
        }

        // クリスタルアステロイド描画
        for (const ca of this.crystalAsteroids) {
            if (!ca.alive) continue;
            const sx = ca.x - camX + canvasW / 2;
            const sy = ca.y - camY + canvasH / 2;
            if (sx < -50 || sx > canvasW + 50 || sy < -50 || sy > canvasH + 50) continue;
            ca.draw(ctx, sx, sy);
        }

        // ドロップクリスタル描画
        for (const dc of this.droppedCrystals) {
            const sx = dc.x - camX + canvasW / 2;
            const sy = dc.y - camY + canvasH / 2;
            if (sx < -20 || sx > canvasW + 20 || sy < -20 || sy > canvasH + 20) continue;
            dc.draw(ctx, sx, sy);
        }
    }

    drawHUD(ctx, canvasW, canvasH, playerId, playerTeam, TEAM_COLORS) {
        // クリスタル所持数
        const crystals = this.getPlayerCrystals(playerId);
        ctx.fillStyle = "#4488ff";
        ctx.font = "bold 18px monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "#4488ff";
        ctx.shadowBlur = 8;
        ctx.fillText(`💎 CRYSTALS: ${crystals}`, 20, 30);
        ctx.shadowBlur = 0;

        // チームアップグレードショップUI (画面左下に配置)
        const teamUpgrades = this.teamUpgrades.get(playerTeam);
        if (teamUpgrades) {
            const shopX = 20;
            let shopY = canvasH - 300;

            ctx.fillStyle = "rgba(0,10,20,0.6)";
            ctx.strokeStyle = TEAM_COLORS[playerTeam] || "#fff";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(shopX, shopY);
            ctx.lineTo(shopX + 220, shopY);
            ctx.lineTo(shopX + 220, shopY + 180);
            ctx.lineTo(shopX, shopY + 180);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = TEAM_COLORS[playerTeam] || "#fff";
            ctx.font = "bold 14px monospace";
            ctx.textAlign = "center";
            ctx.fillText("🛠️ MOTHERSHIP UPGRADES", shopX + 110, shopY + 20);

            let i = 0;
            for (const [key, upgrade] of Object.entries(MOTHERSHIP_UPGRADES)) {
                const currentLevel = teamUpgrades[key] || 0;
                const cost = currentLevel < upgrade.maxLevel ? upgrade.cost[currentLevel] : "MAX";
                const isMax = currentLevel >= upgrade.maxLevel;
                const canAfford = !isMax && crystals >= cost;

                const itemY = shopY + 50 + i * 35;

                // keybind box
                ctx.fillStyle = canAfford ? "#00ff88" : "#444";
                ctx.fillRect(shopX + 10, itemY - 12, 20, 20);
                ctx.fillStyle = "#000";
                ctx.font = "bold 12px monospace";
                ctx.textAlign = "center";
                ctx.fillText((i + 1).toString(), shopX + 20, itemY - 2);

                // Name & Level
                ctx.fillStyle = isMax ? "#ffcc00" : "#fff";
                ctx.textAlign = "left";
                ctx.fillText(`${upgrade.name} L${currentLevel}`, shopX + 40, itemY - 2);

                // Cost
                ctx.fillStyle = isMax ? "#ffcc00" : (canAfford ? "#4488ff" : "#ff4444");
                ctx.textAlign = "right";
                ctx.fillText(isMax ? "MAX" : `💎${cost}`, shopX + 210, itemY - 2);

                i++;
            }
        }

        // 全母艦のHPをミニ表示（上部中央）
        let hpBarX = canvasW / 2 - 120;
        for (const [team, ms] of this.motherships) {
            const color = TEAM_COLORS[team] || "#fff";
            const barW = 60;
            const barH = 6;
            const ratio = ms.hp / ms.maxHp;

            ctx.fillStyle = "rgba(0,0,0,0.5)";
            ctx.fillRect(hpBarX, 10, barW, barH);
            ctx.fillStyle = ms.alive ? color : "#333";
            ctx.fillRect(hpBarX, 10, barW * ratio, barH);
            ctx.strokeStyle = "rgba(255,255,255,0.2)";
            ctx.lineWidth = 1;
            ctx.strokeRect(hpBarX, 10, barW, barH);

            ctx.fillStyle = color;
            ctx.font = "8px monospace";
            ctx.textAlign = "center";
            ctx.fillText(ms.alive ? `T${team}` : "☠", hpBarX + barW / 2, 8);

            // 防衛マーカー描画（味方母艦のみ）
            if (team === playerTeam && ms.alive && window.gameModeSystem && window.gameModeSystem.objectiveMarkers) {
                // オブジェクティブマーカーとして仮登録して手動描画する
                const m = new ObjectiveMarker("defend", ms.x, ms.y, color, "DEFEND");
                // window.gameModeSystem 内の変数（camX等）を持ってこれないので、HUD層のカメラ中央から簡易描画
            }

            hpBarX += barW + 8;
        }
    }

    isMatchOver() {
        // 生き残っている母艦が1つだけなら勝利
        const alive = [...this.motherships.values()].filter(ms => ms.alive);
        return alive.length <= 1;
    }

    getWinningTeam() {
        const alive = [...this.motherships.entries()].filter(([_, ms]) => ms.alive);
        return alive.length === 1 ? alive[0][0] : 0;
    }
}


// ========================================================
// ========================================================
//  MODE 3: PARASITE PANIC (パラサイト・パニック)
// ========================================================
// ========================================================

class ParasitePanicMode {
    constructor() {
        this.phase = "prep"; // "prep" | "hunt" | "ended"
        this.prepDuration = 20000; // 準備時間20秒
        this.huntDuration = 180000; // ハント時間3分
        this.phaseStartTime = 0;
        this.parasites = new Set(); // パラサイトのplayerIdセット
        this.survivors = new Set();
        this.parasiteSpeed = 1.5; // 通常の1.5倍速
        this.infectionFlash = new Map(); // 感染演出用
        this.parasiteTrails = new Map(); // パラサイトの不気味なトレイル
    }

    init(ships, playerId) {
        this.phase = "prep";
        this.phaseStartTime = performance.now();
        this.parasites.clear();
        this.survivors.clear();
        this.infectionFlash.clear();
        this.parasiteTrails.clear();
        this.scores = new Map(); // playerId -> score
        this.killfeed = []; // { text: string, timer: number }

        // 全プレイヤーをサバイバーとしてセットしスコア初期化
        for (const s of ships) {
            if (s.faction === "player" || s.isRemotePlayer || s.ai) {
                this.survivors.add(s.id);
                this.scores.set(s.id, 0);
            }
        }
    }

    addFeed(text) {
        this.killfeed.push({ text: text, timer: 3000 });
        if (this.killfeed.length > 5) this.killfeed.shift();
    }

    selectFirstParasite(ships) {
        const playerShips = ships.filter(s =>
            (this.survivors.has(s.id)) && !s.isGhost
        );
        if (playerShips.length === 0) return;

        // ランダムに1人選出
        const chosen = playerShips[Math.floor(Math.random() * playerShips.length)];
        this.infectPlayer(chosen.id, ships, "System");
        this.addFeed(`🚨 最初の感染者発生: ${chosen.name || chosen.id}`);
    }

    infectPlayer(playerId, ships, infectedBy = "Unknown") {
        this.survivors.delete(playerId);
        this.parasites.add(playerId);
        this.infectionFlash.set(playerId, 1.0);

        // パラサイト化: 性能変更
        const ship = ships.find(s => s.id === playerId);
        if (ship) {
            ship.maxSpeed *= this.parasiteSpeed;
            ship.hp = ship.maxHp; // HPフル回復
            ship.team = 99; // パラサイト専用チーム
            ship.isParasite = true; // AI用フラグ
        }

        if (infectedBy !== "System") {
            const infectedByShip = ships.find(s => s.id === infectedBy);
            const infName = infectedByShip ? (infectedByShip.name || infectedByShip.id) : infectedBy;
            this.addFeed(`🧟 ${infName} が ${ship ? (ship.name || ship.id) : playerId} を感染！`);

            // スコア：感染させるとボーナス点
            if (this.scores.has(infectedBy)) {
                this.scores.set(infectedBy, this.scores.get(infectedBy) + 500);
            }
        }
    }

    isParasite(playerId) {
        return this.parasites.has(playerId);
    }

    isSurvivor(playerId) {
        return this.survivors.has(playerId);
    }

    update(dt, ships, WORLD_W, WORLD_H, torusDist2, playerId) {
        const now = performance.now();
        const elapsed = now - this.phaseStartTime;

        // キルフィード更新
        for (let i = this.killfeed.length - 1; i >= 0; i--) {
            this.killfeed[i].timer -= dt * 1000;
            if (this.killfeed[i].timer <= 0) this.killfeed.splice(i, 1);
        }

        // 感染フラッシュ減衰
        for (const [id, flash] of this.infectionFlash) {
            this.infectionFlash.set(id, flash - dt * 2);
            if (flash <= 0) this.infectionFlash.delete(id);
        }

        // フェーズ管理
        if (this.phase === "prep") {
            if (elapsed >= this.prepDuration) {
                this.phase = "hunt";
                this.phaseStartTime = now;
                this.selectFirstParasite(ships);
            }
            return;
        }

        if (this.phase === "hunt") {
            // スコア加算: 生存者は毎秒10点入る
            for (const survivorId of this.survivors) {
                const s = this.scores.get(survivorId) || 0;
                this.scores.set(survivorId, s + 10 * dt);
            }

            // ハント時間終了チェック
            if (elapsed >= this.huntDuration) {
                this.phase = "ended";
                return;
            }

            // パラサイトの体当たり感染判定
            const parasitesArr = Array.from(this.parasites).map(id => ships.find(s => s.id === id)).filter(s => s && !s.isGhost);
            const survivorsArr = Array.from(this.survivors).map(id => ships.find(s => s.id === id)).filter(s => s && !s.isGhost);

            for (const pShip of parasitesArr) {
                for (const sShip of survivorsArr) {
                    const d2 = torusDist2(pShip.x, pShip.y, sShip.x, sShip.y);
                    if (d2 < 30 * 30) {
                        // 感染！
                        this.infectPlayer(sShip.id, ships, pShip.id);
                        if (typeof playExplosionSound === "function") {
                            playExplosionSound("medium");
                        }

                        // パーティクル噴出
                        if (window.gameModeSystem && window.gameModeSystem.particleSystem) {
                            window.gameModeSystem.particleSystem.emitExplosion(sShip.x, sShip.y, "#ff0000", 2.0);
                        }
                    }
                }
            }

            // AIロジック
            for (const s of ships) {
                if (s.ai && s.alive && !s.isGhost) {
                    if (this.isParasite(s.id)) {
                        // パラサイトAIは一番近い生存者を狙う
                        let target = null;
                        let minDist = Infinity;
                        for (const surv of survivorsArr) {
                            let dx = surv.x - s.x;
                            let dy = surv.y - s.y;
                            if (Math.abs(dx) > WORLD_W / 2) dx -= Math.sign(dx) * WORLD_W;
                            if (Math.abs(dy) > WORLD_H / 2) dy -= Math.sign(dy) * WORLD_H;
                            const d = dx * dx + dy * dy;
                            if (d < minDist) { minDist = d; target = surv; }
                        }
                        if (target) {
                            let dx = target.x - s.x;
                            let dy = target.y - s.y;
                            if (Math.abs(dx) > WORLD_W / 2) dx -= Math.sign(dx) * WORLD_W;
                            if (Math.abs(dy) > WORLD_H / 2) dy -= Math.sign(dy) * WORLD_H;
                            s.angle = Math.atan2(dy, dx);
                        }
                    } else if (this.isSurvivor(s.id)) {
                        // サバイバーAIはパラサイトから逃げる
                        if (window.AIBehaviors && parasitesArr.length > 0) {
                            window.AIBehaviors.fleeFrom(s, parasitesArr, WORLD_W, WORLD_H);
                        }
                    }
                }
            }

            // 全員感染チェック
            if (this.survivors.size === 0) {
                this.phase = "ended";
            }
        }

        // パラサイトトレイル更新
        for (const parasiteId of this.parasites) {
            const pShip = ships.find(s => s.id === parasiteId);
            if (!pShip || pShip.isGhost) continue;

            let trail = this.parasiteTrails.get(parasiteId);
            if (!trail) {
                trail = [];
                this.parasiteTrails.set(parasiteId, trail);
            }
            if (Math.random() < 0.5) trail.push({ x: pShip.x, y: pShip.y, alpha: 1.0 }); // 少し間引く
            if (trail.length > 15) trail.shift();
            for (let i = trail.length - 1; i >= 0; i--) {
                trail[i].alpha -= dt * 1.5;
                if (trail[i].alpha <= 0) trail.splice(i, 1);
            }
        }
    }

    draw(ctx, camX, camY, canvasW, canvasH, ships, WORLD_W, WORLD_H) {
        // パラサイトの不気味なオーラとトレイル
        for (const parasiteId of this.parasites) {
            const pShip = ships.find(s => s.id === parasiteId);
            if (!pShip || pShip.isGhost) continue;

            const sx = pShip.x - camX + canvasW / 2;
            const sy = pShip.y - camY + canvasH / 2;

            // 画面外でもマーカー描画するのでカリングは緩めに
            if (sx < -100 || sx > canvasW + 100 || sy < -100 || sy > canvasH + 100) continue;

            // 赤黒い脈動オーラ
            const msPhase = performance.now() * 0.005;
            const pulse = 0.5 + Math.sin(msPhase + pShip.id.length) * 0.5;

            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            const auraGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 60 + pulse * 10);
            auraGrad.addColorStop(0, "rgba(255,0,0,0.6)");
            auraGrad.addColorStop(0.3, "rgba(100,0,0,0.2)");
            auraGrad.addColorStop(1, "transparent");
            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            ctx.arc(sx, sy, 70, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // トレイル
            const trail = this.parasiteTrails.get(parasiteId);
            if (trail) {
                ctx.save();
                ctx.globalCompositeOperation = "lighter";
                for (let i = 0; i < trail.length - 1; i++) {
                    const t1 = trail[i];
                    const t2 = trail[i + 1];
                    if (t1.alpha <= 0) continue;

                    const tSx1 = t1.x - camX + canvasW / 2;
                    const tSy1 = t1.y - camY + canvasH / 2;
                    const tSx2 = t2.x - camX + canvasW / 2;
                    const tSy2 = t2.y - camY + canvasH / 2;

                    // ワープした瞬間を引かないようにする距離チェック
                    let dx = t2.x - t1.x; let dy = t2.y - t1.y;
                    if (Math.abs(dx) > WORLD_W / 2 || Math.abs(dy) > WORLD_H / 2) continue;

                    ctx.strokeStyle = `rgba(255,50,50,${t1.alpha * 0.8})`;
                    ctx.lineWidth = 15 * t1.alpha;
                    ctx.lineCap = "round";
                    ctx.beginPath();
                    ctx.moveTo(tSx1, tSy1);
                    ctx.lineTo(tSx2, tSy2);
                    ctx.stroke();
                }
                ctx.restore();
            }
        }

        // 感染フラッシュ
        for (const [id, flash] of this.infectionFlash) {
            if (flash <= 0) continue;
            const s = ships.find(s => s.id === id);
            if (!s) continue;
            const sx = s.x - camX + canvasW / 2;
            const sy = s.y - camY + canvasH / 2;

            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            ctx.beginPath();
            ctx.arc(sx, sy, 80 * (1 - flash), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,100,100,${flash * 0.8})`;
            ctx.fill();
            ctx.restore();
        }
    }

    drawHUD(ctx, canvasW, canvasH, playerId) {
        const now = performance.now();
        const elapsed = now - this.phaseStartTime;
        const isSelfParasite = this.isParasite(playerId);

        // サバイバー用の恐怖視界（パラサイトパニック専用エフェクト）
        if (!isSelfParasite && this.phase === "hunt") {
            ctx.save();
            const grad = ctx.createRadialGradient(canvasW / 2, canvasH / 2, canvasH * 0.2, canvasW / 2, canvasH / 2, canvasW);
            grad.addColorStop(0, "rgba(0,0,0,0)");
            grad.addColorStop(1, "rgba(0,0,0,0.85)");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvasW, canvasH);
            ctx.restore();
        } else if (isSelfParasite) {
            // パラサイト用凶暴視界
            ctx.fillStyle = "rgba(100,0,0,0.1)";
            ctx.fillRect(0, 0, canvasW, canvasH);
        }

        // フェーズ表示
        let phaseText = "";
        let remaining = 0;

        if (this.phase === "prep") {
            remaining = Math.max(0, this.prepDuration - elapsed);
            phaseText = "⚠ 準備時間: 逃げろ！";
        } else if (this.phase === "hunt") {
            remaining = Math.max(0, this.huntDuration - elapsed);
            phaseText = isSelfParasite ? "🧟 全員を感染させろ！" : "🏃 パラサイトから生き延びろ！";
        } else {
            phaseText = this.survivors.size > 0 ? "🎉 サバイバー勝利！" : "🧟 パラサイト完全勝利！";
        }

        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);

        // 上部ステータスバー背景
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(canvasW / 2 - 200, 0, 400, 80);
        ctx.strokeStyle = isSelfParasite ? "#ff0000" : "#00ff88";
        ctx.lineWidth = 2;
        ctx.strokeRect(canvasW / 2 - 200, 0, 400, 80);

        // タイマー
        ctx.fillStyle = remaining < 30000 ? "#ff3333" : "#fff";
        ctx.font = "bold 24px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`${mins}:${secs.toString().padStart(2, "0")}`, canvasW / 2, 30);

        // フェーズテキスト
        ctx.fillStyle = isSelfParasite ? "#ff5555" : "#55ffaa";
        ctx.font = "bold 16px monospace";
        ctx.fillText(phaseText, canvasW / 2, 52);

        // 生存者カウント
        ctx.fillStyle = "#aaa";
        ctx.font = "12px monospace";
        ctx.fillText(
            `生存者: ${this.survivors.size}   |   パラサイト: ${this.parasites.size}`,
            canvasW / 2, 70
        );

        // スコア表示
        const myScore = Math.floor(this.scores.get(playerId) || 0);
        ctx.fillStyle = "#ffcc00";
        ctx.font = "bold 16px monospace";
        ctx.textAlign = "left";
        ctx.fillText(`🏆 SCORE: ${myScore}`, 20, canvasH - 30);

        // キルフィード
        ctx.textAlign = "right";
        ctx.font = "bold 12px monospace";
        for (let i = 0; i < this.killfeed.length; i++) {
            const feed = this.killfeed[i];
            const alpha = Math.min(1, feed.timer / 500); // フェードアウト
            ctx.fillStyle = `rgba(255, 100, 100, ${alpha})`;
            ctx.fillText(feed.text, canvasW - 20, 120 + i * 20);
        }

        // 赤画面（感染時）
        if (isSelfParasite) {
            ctx.fillStyle = "rgba(150,0,0,0.15)";
            ctx.fillRect(0, 0, canvasW, 8);
            ctx.fillRect(0, canvasH - 8, canvasW, 8);
            ctx.fillRect(0, 0, 8, canvasH);
            ctx.fillRect(canvasW - 8, 0, 8, canvasH);
        }
    }

    isMatchOver() {
        return this.phase === "ended";
    }

    getSurvivorsWin() {
        return this.survivors.size > 0;
    }
}


// ========================================================
// ========================================================
//  MODE 4: GALACTIC PAYLOAD (ギャラクティック・ペイロード)
// ========================================================
// ========================================================

class PayloadShip {
    constructor(waypoints) {
        this.waypoints = waypoints; // [{x, y}, ...] ルート
        this.currentWaypointIndex = 0;
        this.x = waypoints[0].x;
        this.y = waypoints[0].y;
        this.angle = 0;
        this.hp = 5000; // HPアップ
        this.maxHp = 5000;
        this.alive = true;
        this.speed = 0.5; // 前進速度
        this.retreatSpeed = 0.3; // 後退速度
        this.contestRadius = 250;
        this.progressPercent = 0;
        this.state = "stopped"; // "moving" | "retreating" | "contested" | "stopped"
        this.regenRate = 5; // HP/秒 (護衛側が近くにいる場合)
        this.pulsePhase = 0;
        this.totalPathLength = 0;
        this.traveledLength = 0;
        this.defenseScore = 0; // スコア
        this.attackScore = 0;

        // 全パス長を計算
        for (let i = 1; i < waypoints.length; i++) {
            const dx = waypoints[i].x - waypoints[i - 1].x;
            const dy = waypoints[i].y - waypoints[i - 1].y;
            this.totalPathLength += Math.sqrt(dx * dx + dy * dy);
        }
    }

    update(dt, ships, defenseTeam, attackTeam, torusDist2) {
        if (!this.alive) return;
        this.pulsePhase += dt * 3;

        // 範囲内のプレイヤー（AI含む）をカウント
        let defendersInRange = 0;
        let attackersInRange = 0;
        for (const s of ships) {
            if (s.isGhost || !s.alive) continue;
            const d2 = torusDist2 ? torusDist2(s.x, s.y, this.x, this.y) : (s.x - this.x) * (s.x - this.x) + (s.y - this.y) * (s.y - this.y);
            if (d2 < this.contestRadius * this.contestRadius) {
                if (s.team === defenseTeam) defendersInRange++;
                else if (s.team === attackTeam || s.faction !== "player") attackersInRange++;
            }
        }

        // 人数による綱引き判定
        if (defendersInRange === 0 && attackersInRange === 0) {
            this.state = "stopped";
        } else if (defendersInRange > 0 && attackersInRange === 0) {
            this.state = "moving";
        } else if (attackersInRange > 0 && defendersInRange === 0) {
            this.state = "retreating";
        } else {
            if (defendersInRange > attackersInRange) this.state = "moving";
            else if (attackersInRange > defendersInRange) this.state = "retreating";
            else this.state = "contested";
        }

        // 移動ロジック
        if (this.state === "moving") {
            const target = this.waypoints[this.currentWaypointIndex + 1];
            if (target) {
                const dx = target.x - this.x;
                const dy = target.y - this.y;
                const d = Math.sqrt(dx * dx + dy * dy);

                if (d < 5) {
                    this.currentWaypointIndex++;
                    if (this.currentWaypointIndex >= this.waypoints.length - 1) {
                        this.progressPercent = 100; // GOAL!
                        return;
                    }
                } else {
                    const moveSpeed = this.speed + (defendersInRange - 1) * 0.1; // 人数ボーナス
                    this.x += (dx / d) * moveSpeed;
                    this.y += (dy / d) * moveSpeed;
                    this.angle = Math.atan2(dy, dx);
                    this.traveledLength += moveSpeed * dt * 60;
                }
            }

            // 防衛側HP回復
            if (this.hp < this.maxHp) {
                this.hp = Math.min(this.maxHp, this.hp + this.regenRate * defendersInRange * dt * 60);
            }

            // スコア追加（前進で防衛側）
            this.defenseScore += 10 * dt;

        } else if (this.state === "retreating") {
            const target = this.waypoints[this.currentWaypointIndex];
            if (target) {
                const dx = target.x - this.x;
                const dy = target.y - this.y;
                const d = Math.sqrt(dx * dx + dy * dy);

                if (d < 5) {
                    if (this.currentWaypointIndex > 0) {
                        this.currentWaypointIndex--;
                    } else {
                        this.traveledLength = 0; // START到達
                    }
                } else {
                    const moveSpeed = this.retreatSpeed + (attackersInRange - 1) * 0.05;
                    this.x += (dx / d) * moveSpeed;
                    this.y += (dy / d) * moveSpeed;
                    this.angle = Math.atan2(dy, dx);
                    this.traveledLength = Math.max(0, this.traveledLength - moveSpeed * dt * 60);
                }
            }

            // スコア追加（後退で攻撃側）
            this.attackScore += 15 * dt;

        } else if (this.state === "contested") {
            // 接戦で動けないが、お互いにスコアが入る
            this.defenseScore += 2 * dt;
            this.attackScore += 2 * dt;

            // パーティクル演出
            if (Math.random() < 0.2 && window.gameModeSystem && window.gameModeSystem.particleSystem) {
                window.gameModeSystem.particleSystem.emitExplosion(this.x, this.y, "#ffcc00", 0.5);
            }
        }

        // 進行率計算
        this.progressPercent = Math.min(100, Math.max(0, (this.traveledLength / this.totalPathLength) * 100));
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
        }
    }

    draw(ctx, sx, sy) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(sx, sy);

        // 制圧範囲の表示
        const stateColor = this.state === "moving" ? "rgba(0,255,100,0.15)" :
            this.state === "retreating" ? "rgba(255,50,50,0.15)" :
                this.state === "contested" ? "rgba(255,200,0,0.2)" :
                    "rgba(100,100,100,0.05)";

        const pulse = 1 + Math.sin(this.pulsePhase) * 0.05;

        ctx.beginPath();
        ctx.arc(0, 0, this.contestRadius * pulse, 0, Math.PI * 2);
        ctx.fillStyle = stateColor;
        ctx.fill();
        ctx.strokeStyle = this.state === "moving" ? "rgba(0,255,100,0.4)" :
            this.state === "retreating" ? "rgba(255,50,50,0.4)" :
                this.state === "contested" ? "rgba(255,200,0,0.5)" :
                    "rgba(100,100,100,0.2)";
        ctx.lineWidth = 2;
        ctx.setLineDash(this.state === "contested" ? [15, 10] : [8, 8]);
        ctx.stroke();
        ctx.setLineDash([]);

        // 輸送船本体（大型の船）
        ctx.rotate(this.angle);

        // エンジングロー
        if (this.state === "moving") {
            const flameLen = 20 + Math.random() * 10;
            ctx.fillStyle = "rgba(0,255,100,0.6)";
            ctx.beginPath();
            ctx.moveTo(-60, -10);
            ctx.lineTo(-60 - flameLen, 0);
            ctx.lineTo(-60, 10);
            ctx.closePath();
            ctx.fill();
        } else if (this.state === "retreating") {
            const flameLen = 15 + Math.random() * 8;
            ctx.fillStyle = "rgba(255,50,50,0.6)";
            ctx.beginPath();
            ctx.moveTo(40, -10);
            ctx.lineTo(40 + flameLen, 0);
            ctx.lineTo(40, 10);
            ctx.closePath();
            ctx.fill();
        }

        // 船体
        ctx.fillStyle = "rgba(20,30,50,0.95)";
        ctx.strokeStyle = this.state === "moving" ? "#00ff88" : this.state === "retreating" ? "#ff4444" : "#88aacc";
        ctx.lineWidth = 3;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(60, 0);
        ctx.lineTo(40, -25);
        ctx.lineTo(-50, -20);
        ctx.lineTo(-60, -10);
        ctx.lineTo(-60, 10);
        ctx.lineTo(-50, 20);
        ctx.lineTo(40, 25);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // ウィンドウ（ライト）
        ctx.fillStyle = "#fff";
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(-30 + i * 18, -10, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // 貨物マーク
        ctx.rotate(-this.angle); // テキストを水平にする
        ctx.fillStyle = "#ffcc00";
        ctx.font = "bold 24px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("📦", 0, 5);

        ctx.restore();

        // HPバー
        const barW = 140;
        const barH = 10;
        const barX = sx - barW / 2;
        const barY = sy + 45;
        const hpRatio = this.hp / this.maxHp;

        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
        const hpColor = hpRatio > 0.5 ? "#00ff88" : hpRatio > 0.25 ? "#ffaa00" : "#ff0000";
        ctx.fillStyle = hpColor;
        ctx.fillRect(barX, barY, barW * hpRatio, barH);
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);

        // 状態テキスト
        const stateText = this.state === "moving" ? ">>> PUSHING >>>" :
            this.state === "retreating" ? "<<< RETREATING <<<" :
                this.state === "contested" ? "!!! CONTESTED !!!" : "--- HALTED ---";
        const textColor = this.state === "moving" ? "#00ff88" :
            this.state === "retreating" ? "#ff4444" :
                this.state === "contested" ? "#ffcc00" : "#888";

        ctx.fillStyle = textColor;
        ctx.font = "bold 12px monospace";
        ctx.textAlign = "center";
        ctx.fillText(stateText, sx, barY + barH + 16);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 10px monospace";
        ctx.fillText(`${Math.ceil(this.hp)} / ${this.maxHp}`, sx, barY - 4);
    }
}

class GalacticPayloadMode {
    constructor() {
        this.payloadShip = null;
        this.defenseTeam = 1;
        this.attackTeam = 2;
        this.matchTimeLimit = 300000; // 5分
        this.matchStartTime = 0;
        this.waypoints = [];
        this.defenseScore = 0;
        this.attackScore = 0;
    }

    init(WORLD_W, WORLD_H, defTeam, atkTeam) {
        this.defenseTeam = defTeam || 1;
        this.attackTeam = atkTeam || 2;
        this.matchStartTime = performance.now();

        // ウェイポイント生成（ジグザグのルート）
        this.waypoints = [];
        const segments = 10;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = WORLD_W * 0.1 + t * WORLD_W * 0.8;
            const y = WORLD_H * 0.5 + Math.sin(t * Math.PI * 3) * WORLD_H * 0.25;
            this.waypoints.push({ x, y });
        }

        this.payloadShip = new PayloadShip(this.waypoints);
        this.defenseScore = 0;
        this.attackScore = 0;
    }

    update(dt, ships, bullets, WORLD_W, WORLD_H, torusDist2) {
        if (!this.payloadShip || !this.payloadShip.alive) return;

        this.payloadShip.update(dt, ships, this.defenseTeam, this.attackTeam, torusDist2);

        this.defenseScore = this.payloadShip.defenseScore;
        this.attackScore = this.payloadShip.attackScore;

        // 弾との衝突判定（攻撃側のみペイロードにダメージ）
        for (const b of bullets) {
            if (!b.alive) continue;
            const bShip = ships.find(s => s.id === b.ownerId);
            if (!bShip || bShip.team === this.defenseTeam) continue; // 護衛側は撃たない

            const dx = b.x - this.payloadShip.x;
            const dy = b.y - this.payloadShip.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < 60 * 60) {
                this.payloadShip.takeDamage(b.dmg || 5);
                b.alive = false;

                // ダメージエフェクト
                if (window.gameModeSystem && window.gameModeSystem.damageNumberSystem) {
                    window.gameModeSystem.damageNumberSystem.add(b.x, b.y, Math.floor(b.dmg || 5), "#ff4444");
                }
                if (window.gameModeSystem && window.gameModeSystem.particleSystem) {
                    window.gameModeSystem.particleSystem.emitExplosion(b.x, b.y, "#ffaa00", 0.5);
                }
            }
        }

        // AIの護衛・攻撃ロジック
        for (const s of ships) {
            if (s.ai && s.alive && !s.isGhost) {
                if (s.team === this.defenseTeam) {
                    // 防衛: ペイロードを護衛する
                    if (window.AIBehaviors) window.AIBehaviors.escortPayload(s, this.payloadShip);
                } else {
                    // 攻撃: ペイロードを破壊or阻止しに行く
                    if (window.AIBehaviors) window.AIBehaviors.attackPayload(s, this.payloadShip);
                }
            }
        }
    }

    draw(ctx, camX, camY, canvasW, canvasH) {
        if (!this.payloadShip) return;

        // ウェイポイントルートの描画
        ctx.beginPath();
        ctx.strokeStyle = "rgba(0,240,255,0.2)";
        ctx.lineWidth = 4;
        for (let i = 0; i < this.waypoints.length; i++) {
            const sx = this.waypoints[i].x - camX + canvasW / 2;
            const sy = this.waypoints[i].y - camY + canvasH / 2;
            if (i === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
        }
        ctx.stroke();

        // 進行済みルートの太線
        if (this.payloadShip.currentWaypointIndex > 0 || this.payloadShip.state === "moving") {
            ctx.beginPath();
            ctx.strokeStyle = "rgba(0,255,130,0.8)";
            ctx.lineWidth = 6;
            ctx.shadowColor = "#00ff88";
            ctx.shadowBlur = 10;
            const startSx = this.waypoints[0].x - camX + canvasW / 2;
            const startSy = this.waypoints[0].y - camY + canvasH / 2;
            ctx.moveTo(startSx, startSy);
            for (let i = 1; i <= this.payloadShip.currentWaypointIndex; i++) {
                const sx = this.waypoints[i].x - camX + canvasW / 2;
                const sy = this.waypoints[i].y - camY + canvasH / 2;
                ctx.lineTo(sx, sy);
            }
            // 現在位置まで
            const payloadSx = this.payloadShip.x - camX + canvasW / 2;
            const payloadSy = this.payloadShip.y - camY + canvasH / 2;
            ctx.lineTo(payloadSx, payloadSy);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // ペイロード船の描画
        const sx = this.payloadShip.x - camX + canvasW / 2;
        const sy = this.payloadShip.y - camY + canvasH / 2;
        this.payloadShip.draw(ctx, sx, sy);
    }

    drawHUD(ctx, canvasW, canvasH, playerId, playerTeam) {
        if (!this.payloadShip) return;

        const isDefense = playerTeam === this.defenseTeam;

        // 上部背景ボード
        ctx.fillStyle = "rgba(0, 10, 20, 0.8)";
        ctx.strokeStyle = isDefense ? "#00ff88" : "#ff4444";
        ctx.lineWidth = 2;
        ctx.fillRect(canvasW / 2 - 320, 0, 640, 70);
        ctx.beginPath();
        ctx.moveTo(canvasW / 2 - 320, 70);
        ctx.lineTo(canvasW / 2 + 320, 70);
        ctx.stroke();

        // ミッション指示
        ctx.fillStyle = isDefense ? "#00ff88" : "#ff4444";
        ctx.font = "bold 16px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(isDefense ? "🛡️ MISSION: ESCORT THE PAYLOAD" : "⚔️ MISSION: STOP THE PAYLOAD", canvasW / 2, 10);

        // プログレスバー
        const barW = 500;
        const barH = 16;
        const barX = (canvasW - barW) / 2;
        const barY = 35;
        const progress = this.payloadShip.progressPercent / 100;

        // 外枠
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.strokeRect(barX - 2, barY - 2, barW + 4, barH + 4);

        // プログレス
        const progColor = this.payloadShip.state === "contested" ? "#ffcc00" :
            this.payloadShip.state === "retreating" ? "#ff4444" :
                isDefense ? "#00ff88" : "#00ddff";

        ctx.fillStyle = progColor;
        ctx.fillRect(barX, barY, barW * progress, barH);

        // 状態文字
        const stateStr = this.payloadShip.state.toUpperCase();
        let stateIndicator = `=== ${stateStr} ===`;
        if (this.payloadShip.state === "moving") stateIndicator = `>>> ${stateStr} >>>`;
        if (this.payloadShip.state === "retreating") stateIndicator = `<<< ${stateStr} <<<`;

        ctx.fillStyle = "#fff";
        ctx.font = "bold 12px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(stateIndicator, barX + barW / 2, barY + barH / 2);

        // ラベル
        ctx.fillStyle = "#aaa";
        ctx.font = "10px monospace";
        ctx.textAlign = "right";
        ctx.fillText("START", barX - 10, barY + barH / 2);
        ctx.textAlign = "left";
        ctx.fillText("GOAL", barX + barW + 10, barY + barH / 2);

        // 進行度%
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.fillText(`${Math.floor(this.payloadShip.progressPercent)}%`, canvasW / 2, barY + barH + 12);

        // 残り時間
        ctx.textBaseline = "alphabetic";
        const elapsed = performance.now() - this.matchStartTime;
        const remaining = Math.max(0, this.matchTimeLimit - elapsed);
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);

        ctx.fillStyle = remaining < 60000 ? "#ff3333" : "#00f0ff";
        ctx.font = "bold 16px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`${mins}:${secs.toString().padStart(2, "0")}`, canvasW / 2, barY + barH + 34);
    }

    isMatchOver() {
        if (!this.payloadShip) return false;
        // ペイロード破壊 or ゴール到達 or 時間切れ
        if (!this.payloadShip.alive) return true;
        if (this.payloadShip.progressPercent >= 100) return true;
        return performance.now() - this.matchStartTime >= this.matchTimeLimit;
    }

    getResult() {
        if (!this.payloadShip) return { winner: "attack", reason: "destroyed" };
        if (!this.payloadShip.alive) return { winner: "attack", reason: "destroyed" };
        if (this.payloadShip.progressPercent >= 100) return { winner: "defense", reason: "delivered" };
        return { winner: "attack", reason: "timeout" };
    }
}


// ========================================================
//  SHARED: 環境ハザード
// ========================================================
class SolarStorm {
    constructor(WW, WH) { this.active = false; this.timer = 0; this.duration = 8000; this.cooldown = 30000; this.cooldownTimer = 15000 + Math.random() * 20000; this.direction = Math.random() * Math.PI * 2; this.force = 0.15; this.dmg = 3; this.warningTimer = 0; this.warningDuration = 3000; this.isWarning = false; this.particles = []; this.WW = WW; this.WH = WH; }
    update(dt, ships) {
        const ms = dt * 1000;
        if (this.active) {
            this.timer -= ms; if (this.timer <= 0) { this.active = false; this.isWarning = false; this.cooldownTimer = this.cooldown + Math.random() * 10000; this.particles = []; return; }
            const fx = Math.cos(this.direction) * this.force, fy = Math.sin(this.direction) * this.force;
            for (const s of ships) { if (s.isGhost || !s.alive) continue; s.vx += fx * dt; s.vy += fy * dt; s.hp -= this.dmg * dt; }
            if (Math.random() < 0.3) this.particles.push({ x: Math.random() * this.WW, y: Math.random() * this.WH, vx: Math.cos(this.direction) * (15 + Math.random() * 10), vy: Math.sin(this.direction) * (15 + Math.random() * 10), life: 1 + Math.random(), size: 1 + Math.random() * 2 });
        } else { this.cooldownTimer -= ms; if (this.cooldownTimer <= 0 && !this.isWarning) { this.isWarning = true; this.warningTimer = this.warningDuration; this.direction = Math.random() * Math.PI * 2; } if (this.isWarning) { this.warningTimer -= ms; if (this.warningTimer <= 0) { this.active = true; this.timer = this.duration; this.isWarning = false; } } }
        for (const p of this.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; } this.particles = this.particles.filter(p => p.life > 0);
    }
    draw(ctx, cx, cy, cw, ch) { if (!this.active) return; for (const p of this.particles) { const sx = p.x - cx + cw / 2, sy = p.y - cy + ch / 2; if (sx < -10 || sx > cw + 10 || sy < -10 || sy > ch + 10) continue; ctx.fillStyle = `rgba(255,200,50,${p.life * 0.6})`; ctx.fillRect(sx, sy, p.size, p.size * 3); } }
    drawHUD(ctx, cw, ch) {
        if (this.isWarning) { const f = Math.sin(performance.now() * 0.008) > 0; if (f) { ctx.fillStyle = "rgba(255,150,0,0.15)"; ctx.fillRect(0, 0, cw, ch); ctx.fillStyle = "#ffaa00"; ctx.font = "bold 24px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("⚠ SOLAR STORM WARNING ⚠", cw / 2, ch / 2 - 60); } }
        if (this.active) { ctx.fillStyle = "rgba(255,180,50,0.08)"; ctx.fillRect(0, 0, cw, ch); ctx.save(); ctx.translate(cw - 60, 100); ctx.rotate(this.direction); ctx.fillStyle = "#ffaa00"; ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(-10, -8); ctx.lineTo(-10, 8); ctx.closePath(); ctx.fill(); ctx.restore(); }
    }
}
class NebulaZone {
    constructor(x, y, r) { this.x = x; this.y = y; this.radius = r; this.pulsePhase = Math.random() * Math.PI * 2; this.hue = Math.random() * 60 + 260; this.parts = []; for (let i = 0; i < 20; i++)this.parts.push({ angle: Math.random() * Math.PI * 2, dist: Math.random() * r * 0.8, size: 3 + Math.random() * 8, speed: (Math.random() - 0.5) * 0.3, alpha: 0.1 + Math.random() * 0.3 }); }
    isInside(x, y) { const dx = x - this.x, dy = y - this.y; return dx * dx + dy * dy < this.radius * this.radius; }
    applyEffects(ships) { for (const s of ships) { if (s.isGhost || !s.alive) continue; if (this.isInside(s.x, s.y)) { s.vx *= 0.98; s.vy *= 0.98; s._inNebula = true; } } }
    update(dt) { this.pulsePhase += dt * 0.5; for (const p of this.parts) p.angle += p.speed * dt; }
    draw(ctx, sx, sy) { const pulse = 0.7 + Math.sin(this.pulsePhase) * 0.3, r = this.radius * pulse; const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r); grad.addColorStop(0, `hsla(${this.hue},60%,40%,0.15)`); grad.addColorStop(0.5, `hsla(${this.hue},50%,30%,0.08)`); grad.addColorStop(1, "transparent"); ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill(); for (const p of this.parts) { const px = sx + Math.cos(p.angle) * p.dist, py = sy + Math.sin(p.angle) * p.dist; ctx.fillStyle = `hsla(${this.hue + 20},50%,60%,${p.alpha * pulse})`; ctx.beginPath(); ctx.arc(px, py, p.size, 0, Math.PI * 2); ctx.fill(); } }
}
class BlackHole {
    constructor(x, y) { this.x = x; this.y = y; this.radius = 15; this.pullRadius = 250; this.killRadius = 25; this.pullForce = 1.2; this.rotAngle = 0; this.ringPhase = 0; this.ehp = []; }
    update(dt, ships, WW, WH, td2) {
        this.rotAngle += dt * 3; this.ringPhase += dt * 2; for (const s of ships) { if (s.isGhost || !s.alive) continue; const d2 = td2(this.x, this.y, s.x, s.y), d = Math.sqrt(d2); if (d < this.pullRadius) { let dx = this.x - s.x, dy = this.y - s.y; if (Math.abs(dx) > WW / 2) dx -= Math.sign(dx) * WW; if (Math.abs(dy) > WH / 2) dy -= Math.sign(dy) * WH; const n = Math.sqrt(dx * dx + dy * dy) || 1, f = this.pullForce * Math.pow(1 - d / this.pullRadius, 2); s.vx += (dx / n) * f; s.vy += (dy / n) * f; s.vx += (-dy / n) * f * 0.3; s.vy += (dx / n) * f * 0.3; if (d < this.killRadius) s.hp -= 500; } }
        if (Math.random() < 0.2) this.ehp.push({ angle: Math.random() * Math.PI * 2, dist: this.radius + Math.random() * 30, life: 1, speed: 2 + Math.random() * 3, size: 1 + Math.random() * 2 });
        for (const p of this.ehp) { p.angle += p.speed * dt; p.dist -= dt * 15; p.life -= dt * 0.5; } this.ehp = this.ehp.filter(p => p.life > 0 && p.dist > 5);
    }
    draw(ctx, sx, sy) { const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, this.pullRadius); grad.addColorStop(0, "rgba(0,0,0,0.3)"); grad.addColorStop(0.3, "rgba(20,0,40,0.1)"); grad.addColorStop(1, "transparent"); ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(sx, sy, this.pullRadius, 0, Math.PI * 2); ctx.fill(); for (const p of this.ehp) { const px = sx + Math.cos(p.angle) * p.dist, py = sy + Math.sin(p.angle) * p.dist; ctx.fillStyle = `rgba(${Math.floor(255 * Math.max(0.3, 1 - p.dist / 50))},${Math.floor(150 * Math.max(0, (1 - p.dist / 50) - 0.3))},100,${p.life * 0.8})`; ctx.beginPath(); ctx.arc(px, py, p.size, 0, Math.PI * 2); ctx.fill(); } ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(sx, sy, this.radius, 0, Math.PI * 2); ctx.fill(); const ra = 0.3 + Math.sin(this.ringPhase) * 0.15; ctx.strokeStyle = `rgba(100,50,200,${ra})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, sy, this.radius + 5, 0, Math.PI * 2); ctx.stroke(); }
}

// ========================================================
//  SHARED: コンボマルチプライヤー
// ========================================================
class ComboMultiplier {
    constructor() { this.combo = 0; this.multiplier = 1; this.timer = 0; this.decayTime = 5000; this.maxCombo = 20; this.flash = 0; }
    addHit() { this.combo = Math.min(this.combo + 1, this.maxCombo); this.timer = this.decayTime; this.multiplier = 1 + this.combo * 0.2; this.flash = 1; }
    getMultiplier() { return this.multiplier; }
    update(dt) { if (this.timer > 0) { this.timer -= dt * 1000; if (this.timer <= 0) { this.combo = 0; this.multiplier = 1; } } if (this.flash > 0) this.flash -= dt * 3; }
    drawHUD(ctx, x, y) { if (this.combo <= 0) return; const f = Math.max(0, this.flash), sc = 1 + f * 0.3; ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); const cc = this.combo >= 15 ? "#ff00ff" : this.combo >= 10 ? "#ff3333" : this.combo >= 5 ? "#ffaa00" : "#00f0ff"; ctx.fillStyle = cc; ctx.shadowColor = cc; ctx.shadowBlur = f > 0 ? 12 : 6; ctx.font = "bold 18px monospace"; ctx.textAlign = "center"; ctx.fillText(`${this.combo}x COMBO`, 0, 0); ctx.shadowBlur = 0; ctx.fillStyle = "#fff"; ctx.font = "10px monospace"; ctx.fillText(`×${this.multiplier.toFixed(1)}`, 0, 18); const bw = 60, ratio = this.timer / this.decayTime; ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(-bw / 2, 24, bw, 3); ctx.fillStyle = cc; ctx.fillRect(-bw / 2, 24, bw * ratio, 3); ctx.restore(); }
}

// ========================================================
//  SHARED: 目標マーカー
// ========================================================
class ObjectiveMarker {
    constructor(type, x, y, color, label) { this.type = type; this.x = x; this.y = y; this.color = color; this.label = label; this.pulsePhase = Math.random() * Math.PI * 2; this.tracked = true; }
    update(dt) { this.pulsePhase += dt * 3; }
    drawScreenIndicator(ctx, cw, ch, px, py) { let dx = this.x - px, dy = this.y - py; const dist = Math.sqrt(dx * dx + dy * dy); if (dist < 400) return; const angle = Math.atan2(dy, dx), m = 40; const ix = Math.max(m, Math.min(cw - m, cw / 2 + Math.cos(angle) * (cw / 2 - m))), iy = Math.max(m, Math.min(ch - m, ch / 2 + Math.sin(angle) * (ch / 2 - m))); const pulse = 0.7 + Math.sin(this.pulsePhase) * 0.3; ctx.save(); ctx.translate(ix, iy); ctx.rotate(angle); ctx.fillStyle = this.color; ctx.globalAlpha = pulse; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-6, -6); ctx.lineTo(-6, 6); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; ctx.rotate(-angle); ctx.font = "9px monospace"; ctx.textAlign = "center"; ctx.fillStyle = this.color; ctx.fillText(`${Math.floor(dist)}m`, 0, -14); ctx.fillText(this.label, 0, 14); ctx.restore(); }
}

// ========================================================
//  SHARED: ウェーブスポーン
// ========================================================
class WaveSpawnSystem {
    constructor() { this.currentWave = 0; this.waveTimer = 0; this.waveCooldown = 20000; this.maxWaves = 10; this.isSpawning = false; this.spawnQueue = []; this.spawnDelay = 500; this.spawnTimer = 0; this.waveAnnouncement = ""; this.announcementTimer = 0; }
    startNextWave() { if (this.currentWave >= this.maxWaves) return false; this.currentWave++; this.isSpawning = true; this.waveAnnouncement = `WAVE ${this.currentWave}`; this.announcementTimer = 2000; return true; }
    addToQueue(c) { this.spawnQueue.push(c); }
    update(dt, cb) { const ms = dt * 1000; if (this.announcementTimer > 0) this.announcementTimer -= ms; if (!this.isSpawning) { this.waveTimer += ms; if (this.waveTimer >= this.waveCooldown) { this.waveTimer = 0; this.startNextWave(); } } if (this.isSpawning && this.spawnQueue.length > 0) { this.spawnTimer += ms; if (this.spawnTimer >= this.spawnDelay) { this.spawnTimer = 0; const c = this.spawnQueue.shift(); if (cb) cb(c); } } if (this.isSpawning && this.spawnQueue.length === 0) this.isSpawning = false; }
    drawHUD(ctx, cw, ch) { if (this.announcementTimer > 0) { const a = Math.min(1, this.announcementTimer / 500), s = 1 + (1 - a) * 0.5; ctx.save(); ctx.translate(cw / 2, ch / 2 + 30); ctx.scale(s, s); ctx.globalAlpha = a; ctx.fillStyle = "#ff4444"; ctx.shadowColor = "#ff0000"; ctx.shadowBlur = 20; ctx.font = "bold 36px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(this.waveAnnouncement, 0, 0); ctx.shadowBlur = 0; ctx.globalAlpha = 1; ctx.restore(); } if (this.currentWave > 0) { ctx.fillStyle = "#aaa"; ctx.font = "10px monospace"; ctx.textAlign = "right"; ctx.fillText(`WAVE ${this.currentWave}/${this.maxWaves}`, cw - 20, 50); } }
}

// ========================================================
//  AIビヘイビアツリー
// ========================================================
const AIBehaviors = {
    seekItem: function (ship, containers, WW, WH) { if (!containers || containers.length === 0) return false; let near = null, minD = Infinity; for (const c of containers) { if (!c.alive) continue; let dx = c.x - ship.x, dy = c.y - ship.y; if (Math.abs(dx) > WW / 2) dx -= Math.sign(dx) * WW; if (Math.abs(dy) > WH / 2) dy -= Math.sign(dy) * WH; const d = dx * dx + dy * dy; if (d < minD) { minD = d; near = c; } } if (near && minD < 360000) { let dx = near.x - ship.x, dy = near.y - ship.y; if (Math.abs(dx) > WW / 2) dx -= Math.sign(dx) * WW; if (Math.abs(dy) > WH / 2) dy -= Math.sign(dy) * WH; ship.angle = Math.atan2(dy, dx); return true; } return false; },
    attackMothership: function (ship, ms, WW, WH) { if (!ms || !ms.alive) return false; let dx = ms.x - ship.x, dy = ms.y - ship.y; if (Math.abs(dx) > WW / 2) dx -= Math.sign(dx) * WW; if (Math.abs(dy) > WH / 2) dy -= Math.sign(dy) * WH; const d = Math.sqrt(dx * dx + dy * dy); ship.angle = d > 300 ? Math.atan2(dy, dx) : Math.atan2(dy, dx) + Math.PI * 0.3; return true; },
    seekCrystal: function (ship, crystals, WW, WH) { if (!crystals || crystals.length === 0) return false; let near = null, minD = Infinity; for (const c of crystals) { if (!c.alive) continue; let dx = c.x - ship.x, dy = c.y - ship.y; if (Math.abs(dx) > WW / 2) dx -= Math.sign(dx) * WW; if (Math.abs(dy) > WH / 2) dy -= Math.sign(dy) * WH; const d = dx * dx + dy * dy; if (d < minD) { minD = d; near = c; } } if (near) { let dx = near.x - ship.x, dy = near.y - ship.y; if (Math.abs(dx) > WW / 2) dx -= Math.sign(dx) * WW; if (Math.abs(dy) > WH / 2) dy -= Math.sign(dy) * WH; ship.angle = Math.atan2(dy, dx); return true; } return false; },
    fleeFrom: function (ship, threats, WW, WH) { if (!threats || threats.length === 0) return false; let nD = Infinity, fa = ship.angle; for (const t of threats) { let dx = t.x - ship.x, dy = t.y - ship.y; if (Math.abs(dx) > WW / 2) dx -= Math.sign(dx) * WW; if (Math.abs(dy) > WH / 2) dy -= Math.sign(dy) * WH; const d = Math.sqrt(dx * dx + dy * dy); if (d < nD) { nD = d; fa = Math.atan2(dy, dx) + Math.PI; } } if (nD < 400) { ship.angle = fa; return true; } return false; },
    attackPayload: function (ship, ps) { if (!ps || !ps.alive) return false; const dx = ps.x - ship.x, dy = ps.y - ship.y, d = Math.sqrt(dx * dx + dy * dy); ship.angle = d > 200 ? Math.atan2(dy, dx) : Math.atan2(dy, dx) + Math.sin(performance.now() * 0.002) * 0.5; return true; },
    escortPayload: function (ship, ps) { if (!ps || !ps.alive) return false; const dx = ps.x - ship.x, dy = ps.y - ship.y, d = Math.sqrt(dx * dx + dy * dy); if (d > ps.contestRadius * 0.7) ship.angle = Math.atan2(dy, dx); else ship.angle += (Math.random() - 0.5) * 0.1; return true; },
    wander: function (ship) { if (Math.random() < 0.02) ship.angle += (Math.random() - 0.5) * 1; return true; },
};
window.AIBehaviors = AIBehaviors;

// ========================================================
//  パーティクルシステム
// ========================================================
class ModeParticleSystem {
    constructor() { this.particles = []; this.maxParticles = 200; }
    emit(x, y, count, color, o = {}) { for (let i = 0; i < count; i++) { if (this.particles.length >= this.maxParticles) break; const a = o.angle !== undefined ? o.angle + (Math.random() - 0.5) * (o.spread || 1) : Math.random() * Math.PI * 2, sp = (o.speed || 3) + Math.random() * (o.speedVar || 2); this.particles.push({ x: x + (Math.random() - 0.5) * (o.offsetRange || 0), y: y + (Math.random() - 0.5) * (o.offsetRange || 0), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: (o.life || 0.8) + Math.random() * (o.lifeVar || 0.4), maxLife: (o.life || 0.8) + (o.lifeVar || 0.4), size: (o.size || 2) + Math.random() * (o.sizeVar || 1), color: color, friction: o.friction || 0.98 }); } }
    emitExplosion(x, y, c, i = 1) { this.emit(x, y, Math.floor(15 * i), c, { speed: 4 * i, speedVar: 4, life: 0.6, lifeVar: 0.4, size: 2, sizeVar: 3, friction: 0.95 }); }
    emitTrail(x, y, a, c) { this.emit(x, y, 1, c, { angle: a + Math.PI, spread: 0.5, speed: 1, speedVar: 1, life: 0.3, lifeVar: 0.2, size: 1, sizeVar: 2, friction: 0.9 }); }
    emitPickup(x, y, c) { this.emit(x, y, 8, c, { speed: 2, speedVar: 3, life: 0.5, lifeVar: 0.3, size: 1, sizeVar: 2, offsetRange: 10 }); }
    update(dt) { for (let i = this.particles.length - 1; i >= 0; i--) { const p = this.particles[i]; p.x += p.vx; p.y += p.vy; p.vx *= p.friction; p.vy *= p.friction; p.life -= dt; if (p.life <= 0) this.particles.splice(i, 1); } }
    draw(ctx, cx, cy, cw, ch) { for (const p of this.particles) { const sx = p.x - cx + cw / 2, sy = p.y - cy + ch / 2; if (sx < -10 || sx > cw + 10 || sy < -10 || sy > ch + 10) continue; ctx.globalAlpha = Math.max(0, p.life / p.maxLife); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(sx, sy, p.size * (p.life / p.maxLife), 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1; }
}

// ========================================================
//  アチーブメントシステム
// ========================================================
class AchievementSystem {
    constructor() { this.achievements = [{ id: "first_blood", name: "ファーストブラッド", desc: "初キル達成", icon: "🩸", unlocked: false }, { id: "combo_5", name: "コンボマスター", desc: "5コンボ達成", icon: "🔥", unlocked: false }, { id: "combo_10", name: "コンボレジェンド", desc: "10コンボ達成", icon: "💥", unlocked: false }, { id: "item_hoarder", name: "アイテム収集家", desc: "10個アイテムを拾う", icon: "📦", unlocked: false }, { id: "survivor", name: "サバイバー", desc: "HPが10%以下で生還", icon: "💪", unlocked: false }, { id: "crystal_king", name: "クリスタルキング", desc: "50クリスタル集める", icon: "💎", unlocked: false }, { id: "storm_survivor", name: "嵐の生存者", desc: "ソーラーストーム生存", icon: "☀", unlocked: false }, { id: "untouchable", name: "無傷", desc: "1分間ダメージなし", icon: "🛡", unlocked: false }]; this.notifications = []; this.stats = { kills: 0, itemsCollected: 0, crystalsCollected: 0 }; }
    unlock(id) { const a = this.achievements.find(a => a.id === id); if (a && !a.unlocked) { a.unlocked = true; this.notifications.push({ achievement: a, timer: 4000, slideIn: 0 }); return true; } return false; }
    checkAchievements(combo, hp, maxHp) { if (this.stats.kills >= 1) this.unlock("first_blood"); if (combo >= 5) this.unlock("combo_5"); if (combo >= 10) this.unlock("combo_10"); if (this.stats.itemsCollected >= 10) this.unlock("item_hoarder"); if (hp > 0 && maxHp > 0 && hp / maxHp < 0.1) this.unlock("survivor"); if (this.stats.crystalsCollected >= 50) this.unlock("crystal_king"); }
    update(dt) { for (const n of this.notifications) { n.timer -= dt * 1000; n.slideIn = Math.min(1, n.slideIn + dt * 3); } this.notifications = this.notifications.filter(n => n.timer > 0); }
    drawHUD(ctx, cw, ch) { let yO = ch - 100; for (const n of this.notifications) { const a = n.achievement, al = Math.min(1, n.timer / 500), sX = (1 - n.slideIn) * 300; ctx.save(); ctx.globalAlpha = al; ctx.translate(cw - 220 + sX, yO); ctx.fillStyle = "rgba(0,10,20,0.85)"; ctx.strokeStyle = "#ffaa00"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(196, 0); ctx.arcTo(200, 0, 200, 4, 4); ctx.lineTo(200, 56); ctx.arcTo(200, 60, 196, 60, 4); ctx.lineTo(4, 60); ctx.arcTo(0, 60, 0, 56, 4); ctx.lineTo(0, 4); ctx.arcTo(0, 0, 4, 0, 4); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.font = "26px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#fff"; ctx.fillText(a.icon, 25, 30); ctx.fillStyle = "#ffaa00"; ctx.font = "bold 11px monospace"; ctx.textAlign = "left"; ctx.fillText("🏆 ACHIEVEMENT", 48, 18); ctx.fillStyle = "#fff"; ctx.font = "bold 12px monospace"; ctx.fillText(a.name, 48, 35); ctx.fillStyle = "#aaa"; ctx.font = "9px monospace"; ctx.fillText(a.desc, 48, 50); ctx.restore(); yO -= 70; } }
}

// ========================================================
//  ダメージナンバー
// ========================================================
class ModeDamageNumberSystem {
    constructor() { this.numbers = []; }
    add(x, y, val, col = "#fff", crit = false) { this.numbers.push({ x, y, val, col, crit, life: 1.2, maxLife: 1.2, vy: -2 - Math.random(), vx: (Math.random() - 0.5) * 1.5, size: crit ? 18 : 12 }); if (this.numbers.length > 50) this.numbers.shift(); }
    update(dt) { for (const n of this.numbers) { n.x += n.vx; n.y += n.vy; n.vy += dt * 1.5; n.life -= dt; } this.numbers = this.numbers.filter(n => n.life > 0); }
    draw(ctx, cx, cy, cw, ch) { for (const n of this.numbers) { if (n.life <= 0) continue; const sx = n.x - cx + cw / 2, sy = n.y - cy + ch / 2; if (sx < -50 || sx > cw + 50 || sy < -50 || sy > ch + 50) continue; const a = Math.max(0, n.life / n.maxLife), sc = n.crit ? 1 + (1 - a) * 0.4 : 1; ctx.save(); ctx.globalAlpha = a; ctx.translate(sx, sy); ctx.scale(sc, sc); ctx.fillStyle = n.col; if (n.crit) { ctx.shadowColor = n.col; ctx.shadowBlur = 8; } ctx.font = `bold ${n.size}px monospace`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(n.crit ? `${n.val}!` : `${n.val}`, 0, 0); ctx.restore(); } }
}

// グローバル公開
window.ModeParticleSystem = ModeParticleSystem; window.ComboMultiplier = ComboMultiplier; window.ObjectiveMarker = ObjectiveMarker; window.WaveSpawnSystem = WaveSpawnSystem; window.SolarStorm = SolarStorm; window.NebulaZone = NebulaZone; window.BlackHole = BlackHole; window.AchievementSystem = AchievementSystem; window.ModeDamageNumberSystem = ModeDamageNumberSystem;

// ========================================================
// ファクトリー: モードインスタンス生成
// ========================================================
window.createGameModeSystem = function (mode) {
    switch (mode) {
        case window.GameModes.STRANGER_RACE: return new StrangerRaceMode();
        case window.GameModes.MOTHERSHIP_WARS: return new MothershipWarsMode();
        case window.GameModes.PARASITE_PANIC: return new ParasitePanicMode();
        case window.GameModes.GALACTIC_PAYLOAD: return new GalacticPayloadMode();
        default: return null;
    }
};

console.log("🎮 [GameModes] 4 epic game modes + advanced systems loaded!");

// ===== EPIC BOSS ENCOUNTERS: THE LEVIATHAN =====
class LeviathanBoss {
    constructor(x, y, level = 1) {
        this.id = "boss_" + Date.now();
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.level = level;
        this.isBoss = true;
        this.faction = "enemy";
        this.alive = true;

        // Multi-part health pool
        this.parts = {
            core: { hp: 5000 + (level * 1000), maxHp: 5000 + (level * 1000), active: true },
            leftEngine: { hp: 1500, maxHp: 1500, active: true },
            rightEngine: { hp: 1500, maxHp: 1500, active: true },
            mainCannon: { hp: 2000, maxHp: 2000, active: true }
        };

        this.radius = 80;
        this.phase = 1; // 1: Engines active, 2: Cannon active, 3: Core exposed
        this.fireTimer = 0;
        this.laserCharge = 0;
        this.spawnTimer = 0;
    }

    update(dt, ships, bullets, particles, width, height) {
        if (!this.alive) return;

        // Boss move logic
        const speedMultiplier = (this.parts.leftEngine.active ? 0.5 : 0.1) + (this.parts.rightEngine.active ? 0.5 : 0.1);

        const target = ships.find(s => s.faction === "ally" && s.alive);
        if (target) {
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 300) {
                this.vx += (dx / dist) * 10 * speedMultiplier * dt;
                this.vy += (dy / dist) * 10 * speedMultiplier * dt;
            } else {
                this.vx *= 0.95;
                this.vy *= 0.95;
            }
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vx *= 0.99;
        this.vy *= 0.99;

        // Warp bounds
        if (this.x < 0) this.x += width;
        if (this.x > width) this.x -= width;
        if (this.y < 0) this.y += height;
        if (this.y > height) this.y -= height;

        // Phase logic
        if (this.parts.leftEngine.active || this.parts.rightEngine.active) {
            this.phase = 1;
        } else if (this.parts.mainCannon.active) {
            this.phase = 2;
        } else {
            this.phase = 3;
        }

        // Attack logic
        this.fireTimer += dt;
        if (this.phase === 1 && this.fireTimer > 1.5) {
            this.fireTimer = 0;
            // Spread shot
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i + (Math.random() * 0.5);
                bullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(angle) * 300, vy: Math.sin(angle) * 300,
                    life: 3, ownerId: this.id, isEnemy: true, isBoss: true
                });
            }
        } else if (this.phase === 2) {
            // Main Cannon Sweep
            if (this.fireTimer > 3) {
                this.laserCharge += dt;
                if (this.laserCharge > 1 && this.laserCharge < 3 && target) {
                    // Fire continuous laser stream roughly towards target
                    const angle = Math.atan2(target.y - this.y, target.x - this.x);
                    bullets.push({
                        x: this.x, y: this.y,
                        vx: Math.cos(angle) * 600, vy: Math.sin(angle) * 600,
                        life: 2, ownerId: this.id, isEnemy: true, isBoss: true, scale: 3, damage: 50
                    });
                } else if (this.laserCharge >= 3) {
                    this.fireTimer = 0;
                    this.laserCharge = 0;
                }
            }
        } else if (this.phase === 3) {
            // Desperation mode - rapid fire & spawn minions
            if (this.fireTimer > 0.5) {
                this.fireTimer = 0;
                const angle = Math.random() * Math.PI * 2;
                bullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(angle) * 400, vy: Math.sin(angle) * 400,
                    life: 4, ownerId: this.id, isEnemy: true, isBoss: true
                });
            }
            this.spawnTimer += dt;
            if (this.spawnTimer > 10) {
                this.spawnTimer = 0;
                if (typeof window.makeAIShip === "function") {
                    const minion = window.makeAIShip("enemy");
                    minion.x = this.x + window.randInt(-100, 100);
                    minion.y = this.y + window.randInt(-100, 100);
                    ships.push(minion);
                }
            }
        }
    }

    takeDamage(amount, partKey) {
        if (!this.parts[partKey].active) return;
        this.parts[partKey].hp -= amount;
        if (this.parts[partKey].hp <= 0) {
            this.parts[partKey].hp = 0;
            this.parts[partKey].active = false;
            // Screen shake
            if (typeof window.cameraShake !== "undefined") window.cameraShake = 20;
            if (partKey === "core") {
                this.alive = false;
                // Add extreme hit pause
                if (typeof window.hitPauseFrames !== "undefined") window.hitPauseFrames = 10;
            }
        }
    }

    draw(ctx, camX, camY) {
        if (!this.alive) return;
        ctx.save();
        ctx.translate(this.x - camX, this.y - camY);

        // Draw body
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.phase === 3 ? "rgba(255,50,50,0.5)" : "rgba(100,20,50,0.8)";
        ctx.fill();
        ctx.strokeStyle = "#ff3333";
        ctx.lineWidth = 4;
        ctx.stroke();

        // Draw engines
        if (this.parts.leftEngine.active) {
            ctx.fillStyle = "#ffaa00";
            ctx.fillRect(-this.radius - 20, -40, 30, 30);
            ctx.strokeRect(-this.radius - 20, -40, 30, 30);
        }
        if (this.parts.rightEngine.active) {
            ctx.fillStyle = "#ffaa00";
            ctx.fillRect(this.radius - 10, -40, 30, 30);
            ctx.strokeRect(this.radius - 10, -40, 30, 30);
        }

        // Draw Cannon
        if (this.parts.mainCannon.active) {
            ctx.fillStyle = "#ff0000";
            ctx.fillRect(-20, this.radius, 40, 60);
            ctx.strokeRect(-20, this.radius, 40, 60);
        }

        ctx.restore();
    }

    drawHUD(ctx, vw, vh) {
        if (!this.alive) return;
        // Boss HP Bar
        ctx.save();
        const barW = vw * 0.6;
        const barH = 20;
        const bx = (vw - barW) / 2;
        const by = 80;

        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(bx, by, barW, barH);

        const coreRatio = this.parts.core.hp / this.parts.core.maxHp;
        ctx.fillStyle = `rgb(${255}, ${parseInt(255 * coreRatio)}, 50)`;
        ctx.fillRect(bx, by, barW * coreRatio, barH);

        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, barW, barH);

        ctx.fillStyle = "#fff";
        ctx.font = "bold 16px 'Courier New'";
        ctx.textAlign = "center";
        ctx.fillText(`LEVIATHAN CLASS MOTHERSHIP - PHASE ${this.phase}`, vw / 2, by - 10);

        ctx.restore();
    }
}
window.LeviathanBoss = LeviathanBoss;

// ================================================================
//  GRAND POLISH UPDATE - Massive Expansion (~2000+ lines)
//  Formation AI, Sub-bosses, Settings Linkage, Mode Polish,
//  Environmental Hazards, Advanced Pathfinding, Achievement Hooks
// ================================================================

// ========================================================
//  SETTINGS LINKAGE SYSTEM
//  Routes global toggles into all game mode engines
// ========================================================
class GameSettingsBridge {
    constructor() {
        this.difficulty = "normal";
        this.particlesEnabled = true;
        this.showMinimap = true;
        this.showStars = true;
        this.audioEnabled = true;
        this.sfxVolume = 0.5;
        this.bgmVolume = 0.5;
        this.aimLineEnabled = false;
        this.lightweightMode = false;
    }

    sync() {
        try {
            this.difficulty = window.currentDifficulty || "normal";
            const fs = JSON.parse(localStorage.getItem("featureSettings_v1") || "{}");
            this.particlesEnabled = fs.particles !== false;
            this.showMinimap = fs.minimap !== false;
            this.showStars = fs.stars !== false;
            this.aimLineEnabled = !!fs.aimLine;
            this.lightweightMode = !!fs.lightweight;

            const audio = JSON.parse(localStorage.getItem("audioSettings_v1") || "{}");
            this.sfxVolume = audio.sfx ?? 0.5;
            this.bgmVolume = audio.bgm ?? 0.5;
            this.audioEnabled = this.sfxVolume > 0 || this.bgmVolume > 0;
        } catch (e) { /* ignore parse errors */ }
    }

    getDifficultyMultiplier(stat) {
        const mults = {
            easy: { enemyHp: 0.7, enemyDmg: 0.6, enemySpeed: 0.8, spawnRate: 0.7, bossHp: 0.6, itemSpawn: 1.4 },
            normal: { enemyHp: 1.0, enemyDmg: 1.0, enemySpeed: 1.0, spawnRate: 1.0, bossHp: 1.0, itemSpawn: 1.0 },
            hard: { enemyHp: 1.5, enemyDmg: 1.4, enemySpeed: 1.2, spawnRate: 1.3, bossHp: 1.8, itemSpawn: 0.7 },
        };
        return (mults[this.difficulty] || mults.normal)[stat] || 1.0;
    }

    getMaxParticles() {
        if (this.lightweightMode) return 50;
        if (!this.particlesEnabled) return 0;
        return 500;
    }
}

window.gameSettingsBridge = new GameSettingsBridge();

// ========================================================
//  SQUAD FORMATION AI SYSTEM
//  Enemies dynamically group into Delta/Line/Pincer formations
// ========================================================
class FormationManager {
    constructor() {
        this.squads = [];
        this.reformTimer = 0;
        this.reformInterval = 5.0; // seconds between formation recalculations
    }

    update(dt, ships, WORLD_W, WORLD_H, torusDist2) {
        this.reformTimer -= dt;
        if (this.reformTimer <= 0) {
            this.reformTimer = this.reformInterval;
            this.reorganize(ships, WORLD_W, WORLD_H, torusDist2);
        }

        // Update each squad
        for (const squad of this.squads) {
            squad.update(dt, ships, WORLD_W, WORLD_H, torusDist2);
        }
    }

    reorganize(ships, WORLD_W, WORLD_H, torusDist2) {
        // Collect all alive AI ships that are not bosses
        const aiShips = ships.filter(s => s.ai && s.alive && !s.isGhost && !s.isBoss && s.faction !== "player");
        if (aiShips.length < 2) {
            this.squads = [];
            return;
        }

        // Simple clustering: group by proximity
        const assigned = new Set();
        this.squads = [];

        for (const leader of aiShips) {
            if (assigned.has(leader.id)) continue;
            assigned.add(leader.id);

            const members = [leader];
            for (const other of aiShips) {
                if (assigned.has(other.id)) continue;
                if (other.team !== leader.team) continue;
                const d2 = torusDist2(leader.x, leader.y, other.x, other.y);
                if (d2 < 600 * 600 && members.length < 5) {
                    members.push(other);
                    assigned.add(other.id);
                }
            }

            if (members.length >= 2) {
                const type = this._pickFormationType(members.length);
                this.squads.push(new Squad(members, type));
            }
        }
    }

    _pickFormationType(size) {
        if (size >= 4) return "delta";
        if (size === 3) return Math.random() < 0.5 ? "delta" : "line";
        return "line";
    }

    draw(ctx, camX, camY, vw, vh, toScreen) {
        for (const squad of this.squads) {
            squad.draw(ctx, camX, camY, vw, vh, toScreen);
        }
    }
}

class Squad {
    constructor(members, type) {
        this.members = members;
        this.type = type; // "delta", "line", "pincer"
        this.cohesionForce = 0.15;
        this.separationForce = 0.4;
        this.alignmentForce = 0.1;
        this.formationSpacing = 80;
        this.active = true;
    }

    getLeader() {
        return this.members.find(m => m.alive && !m.isGhost) || null;
    }

    update(dt, ships, WORLD_W, WORLD_H, torusDist2) {
        // Remove dead members
        this.members = this.members.filter(m => m.alive && !m.isGhost);
        if (this.members.length < 2) {
            this.active = false;
            return;
        }

        const leader = this.getLeader();
        if (!leader) return;

        // Calculate formation target positions
        const positions = this._getFormationPositions(leader, WORLD_W, WORLD_H);

        // Apply formation steering to each member (except leader)
        for (let i = 1; i < this.members.length; i++) {
            const m = this.members[i];
            if (!m.alive || i >= positions.length) continue;
            const target = positions[i];

            // Calculate direction to formation position (torus-aware)
            let dx = target.x - m.x;
            let dy = target.y - m.y;
            if (Math.abs(dx) > WORLD_W / 2) dx -= Math.sign(dx) * WORLD_W;
            if (Math.abs(dy) > WORLD_H / 2) dy -= Math.sign(dy) * WORLD_H;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 20) {
                const force = Math.min(dist / 300, 1.0) * this.cohesionForce;
                m.vx += (dx / dist) * force;
                m.vy += (dy / dist) * force;
            }

            // Separation: avoid overlapping squad mates
            for (let j = 0; j < this.members.length; j++) {
                if (i === j) continue;
                const o = this.members[j];
                let sdx = m.x - o.x;
                let sdy = m.y - o.y;
                if (Math.abs(sdx) > WORLD_W / 2) sdx -= Math.sign(sdx) * WORLD_W;
                if (Math.abs(sdy) > WORLD_H / 2) sdy -= Math.sign(sdy) * WORLD_H;
                const sdist = Math.sqrt(sdx * sdx + sdy * sdy);
                if (sdist < 50 && sdist > 0) {
                    m.vx += (sdx / sdist) * this.separationForce;
                    m.vy += (sdy / sdist) * this.separationForce;
                }
            }

            // Alignment: match leader's angle
            const angleDiff = leader.angle - m.angle;
            m.angle += angleDiff * this.alignmentForce * dt;

            // Mark as formation-controlled
            m.inFormation = true;
        }
    }

    _getFormationPositions(leader, WORLD_W, WORLD_H) {
        const positions = [{ x: leader.x, y: leader.y }]; // Leader is position 0
        const spacing = this.formationSpacing;
        const baseAngle = leader.angle + Math.PI; // Behind the leader

        switch (this.type) {
            case "delta": {
                // V-formation behind leader
                for (let i = 1; i < this.members.length; i++) {
                    const row = Math.ceil(i / 2);
                    const side = i % 2 === 0 ? 1 : -1;
                    const offset = (Math.PI / 6) * side * row;
                    const dist = spacing * row;
                    positions.push({
                        x: (leader.x + Math.cos(baseAngle + offset) * dist + WORLD_W) % WORLD_W,
                        y: (leader.y + Math.sin(baseAngle + offset) * dist + WORLD_H) % WORLD_H,
                    });
                }
                break;
            }
            case "line": {
                // Straight line behind leader
                for (let i = 1; i < this.members.length; i++) {
                    positions.push({
                        x: (leader.x + Math.cos(baseAngle) * spacing * i + WORLD_W) % WORLD_W,
                        y: (leader.y + Math.sin(baseAngle) * spacing * i + WORLD_H) % WORLD_H,
                    });
                }
                break;
            }
            case "pincer": {
                // Two wings flanking
                for (let i = 1; i < this.members.length; i++) {
                    const side = i % 2 === 0 ? 1 : -1;
                    const fwdOffset = Math.cos(baseAngle) * spacing * 0.5 * Math.ceil(i / 2);
                    const sideOffset = side * spacing * Math.ceil(i / 2);
                    const perpAngle = baseAngle + Math.PI / 2;
                    positions.push({
                        x: (leader.x + fwdOffset + Math.cos(perpAngle) * sideOffset + WORLD_W) % WORLD_W,
                        y: (leader.y + Math.sin(baseAngle) * spacing * 0.5 * Math.ceil(i / 2) + Math.sin(perpAngle) * sideOffset + WORLD_H) % WORLD_H,
                    });
                }
                break;
            }
        }
        return positions;
    }

    draw(ctx, camX, camY, vw, vh, toScreen) {
        if (!this.active || this.members.length < 2) return;

        // Draw faint formation lines between squad members
        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = "#00f0ff";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);

        const leader = this.getLeader();
        if (!leader) { ctx.restore(); return; }

        const lsc = toScreen(leader.x, leader.y, camX, camY, vw, vh);
        for (let i = 1; i < this.members.length; i++) {
            const m = this.members[i];
            if (!m.alive) continue;
            const msc = toScreen(m.x, m.y, camX, camY, vw, vh);
            ctx.beginPath();
            ctx.moveTo(lsc.sx, lsc.sy);
            ctx.lineTo(msc.sx, msc.sy);
            ctx.stroke();
        }

        ctx.setLineDash([]);
        ctx.restore();
    }
}

window.FormationManager = FormationManager;

// ========================================================
//  ADVANCED ASTEROID PATHFINDING
//  AI ships navigate around asteroid fields intelligently
// ========================================================
class AsteroidPathfinder {
    constructor() {
        this.avoidanceRadius = 150;
        this.predictionTime = 1.5; // seconds ahead to predict collision
    }

    getAvoidanceVector(ship, asteroids, WORLD_W, WORLD_H, torusDist2) {
        let avoidX = 0;
        let avoidY = 0;
        let avoidCount = 0;

        // Predict future position
        const futureX = ship.x + ship.vx * this.predictionTime;
        const futureY = ship.y + ship.vy * this.predictionTime;

        for (const a of asteroids) {
            const d2curr = torusDist2(ship.x, ship.y, a.x, a.y);
            const d2future = torusDist2(futureX, futureY, a.x, a.y);
            const dangerRadius = (this.avoidanceRadius + a.r);
            const dangerThresh = dangerRadius * dangerRadius;

            if (d2curr < dangerThresh || d2future < dangerThresh) {
                let dx = ship.x - a.x;
                let dy = ship.y - a.y;
                if (Math.abs(dx) > WORLD_W / 2) dx -= Math.sign(dx) * WORLD_W;
                if (Math.abs(dy) > WORLD_H / 2) dy -= Math.sign(dy) * WORLD_H;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;

                // Stronger avoidance the closer we are
                const urgency = 1 - Math.min(dist / dangerRadius, 1);
                avoidX += (dx / dist) * urgency;
                avoidY += (dy / dist) * urgency;
                avoidCount++;
            }
        }

        if (avoidCount > 0) {
            avoidX /= avoidCount;
            avoidY /= avoidCount;
            const len = Math.sqrt(avoidX * avoidX + avoidY * avoidY) || 1;
            return { x: avoidX / len, y: avoidY / len, active: true };
        }

        return { x: 0, y: 0, active: false };
    }
}

window.AsteroidPathfinder = AsteroidPathfinder;

// ========================================================
//  SUB-BOSS: SENTINEL DESTROYER
//  Mid-wave mini-boss with shield phases
// ========================================================
class SentinelDestroyer {
    constructor(x, y, team, difficulty) {
        this.x = x;
        this.y = y;
        this.team = team;
        this.faction = "enemy";
        this.alive = true;
        this.isBoss = true;
        this.customAI = true;

        const diffMult = window.gameSettingsBridge ?
            window.gameSettingsBridge.getDifficultyMultiplier("bossHp") : 1.0;

        this.maxHp = Math.round(300 * diffMult);
        this.hp = this.maxHp;
        this.radius = 30;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = 1.5;
        this.vx = 0;
        this.vy = 0;
        this.maxSpeed = 3;

        // Shield phase
        this.shieldActive = true;
        this.shieldHp = Math.round(150 * diffMult);
        this.shieldMaxHp = this.shieldHp;
        this.shieldRegenTimer = 0;
        this.shieldRegenDelay = 8.0; // seconds to regen shield after break
        this.shieldBroken = false;

        // Attack
        this.attackTimer = 0;
        this.attackInterval = 2.0;
        this.burstCount = 0;
        this.burstMax = 3;
        this.burstTimer = 0;

        // Movement
        this.orbitAngle = 0;
        this.orbitRadius = 250;
        this.orbitTarget = null;
        this.retreatTimer = 0;

        // Visual
        this.pulsePhase = 0;
        this.damageFlash = 0;
        this.deathTimer = 0;
        this.dying = false;

        this.id = "sentinel_" + Math.random().toString(36).substr(2, 6);
    }

    takeDamage(dmg) {
        if (this.dying) return;
        if (this.shieldActive && !this.shieldBroken) {
            this.shieldHp -= dmg;
            if (this.shieldHp <= 0) {
                this.shieldBroken = true;
                this.shieldActive = false;
                this.shieldRegenTimer = this.shieldRegenDelay;
            }
        } else {
            this.hp -= dmg;
            this.damageFlash = 0.3;
            if (this.hp <= 0) {
                this.dying = true;
                this.deathTimer = 1.5;
            }
        }
    }

    update(dt, ships, bullets, particles, WORLD_W, WORLD_H) {
        if (!this.alive) return;

        this.pulsePhase += dt * 3;
        if (this.damageFlash > 0) this.damageFlash -= dt;

        // Death animation
        if (this.dying) {
            this.deathTimer -= dt;
            if (this.deathTimer <= 0) {
                this.alive = false;
                // Spawn explosion particles
                if (particles && window.gameSettingsBridge?.particlesEnabled) {
                    for (let i = 0; i < 30; i++) {
                        const ang = Math.random() * Math.PI * 2;
                        const spd = 2 + Math.random() * 5;
                        particles.push({
                            x: this.x, y: this.y,
                            vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
                            life: 1.0 + Math.random(), maxLife: 2.0,
                            size: 3 + Math.random() * 5,
                            color: `hsl(${30 + Math.random() * 30}, 100%, ${50 + Math.random() * 30}%)`,
                        });
                    }
                }
                // Drop stardust
                if (window.stardustDrops) {
                    for (let i = 0; i < 8; i++) {
                        const ang = Math.random() * Math.PI * 2;
                        const dist = 20 + Math.random() * 40;
                        window.stardustDrops.push({
                            x: this.x + Math.cos(ang) * dist,
                            y: this.y + Math.sin(ang) * dist,
                            value: 5 + Math.floor(Math.random() * 10),
                            life: 8.0,
                            vy: -0.5 - Math.random(),
                            pulse: Math.random() * Math.PI * 2,
                        });
                    }
                }
            }
            return;
        }

        // Shield regen
        if (this.shieldBroken) {
            this.shieldRegenTimer -= dt;
            if (this.shieldRegenTimer <= 0) {
                this.shieldBroken = false;
                this.shieldActive = true;
                this.shieldHp = this.shieldMaxHp;
            }
        }

        // Find nearest player ship for targeting
        let nearestPlayer = null;
        let nearestDist2 = Infinity;
        for (const s of ships) {
            if (s.faction === "enemy" || s.isGhost || !s.alive || s.isBoss) continue;
            if (s.team === this.team) continue;
            let dx = s.x - this.x;
            let dy = s.y - this.y;
            if (Math.abs(dx) > WORLD_W / 2) dx -= Math.sign(dx) * WORLD_W;
            if (Math.abs(dy) > WORLD_H / 2) dy -= Math.sign(dy) * WORLD_H;
            const d2 = dx * dx + dy * dy;
            if (d2 < nearestDist2) {
                nearestDist2 = d2;
                nearestPlayer = s;
            }
        }

        // Movement: orbit around target
        if (nearestPlayer) {
            this.orbitTarget = nearestPlayer;
            this.orbitAngle += dt * 0.8;

            let dx = nearestPlayer.x - this.x;
            let dy = nearestPlayer.y - this.y;
            if (Math.abs(dx) > WORLD_W / 2) dx -= Math.sign(dx) * WORLD_W;
            if (Math.abs(dy) > WORLD_H / 2) dy -= Math.sign(dy) * WORLD_H;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Low HP: retreat behavior
            const hpRatio = this.hp / this.maxHp;
            if (hpRatio < 0.3 && !this.shieldActive) {
                // Flee
                this.vx -= (dx / dist) * this.speed * 1.5 * dt;
                this.vy -= (dy / dist) * this.speed * 1.5 * dt;
                this.retreatTimer += dt;
            } else {
                // Orbit
                const idealDist = this.orbitRadius;
                const orbitX = nearestPlayer.x + Math.cos(this.orbitAngle) * idealDist;
                const orbitY = nearestPlayer.y + Math.sin(this.orbitAngle) * idealDist;

                let toOrbitX = orbitX - this.x;
                let toOrbitY = orbitY - this.y;
                if (Math.abs(toOrbitX) > WORLD_W / 2) toOrbitX -= Math.sign(toOrbitX) * WORLD_W;
                if (Math.abs(toOrbitY) > WORLD_H / 2) toOrbitY -= Math.sign(toOrbitY) * WORLD_H;
                const toDist = Math.sqrt(toOrbitX * toOrbitX + toOrbitY * toOrbitY) || 1;

                this.vx += (toOrbitX / toDist) * this.speed * dt * 3;
                this.vy += (toOrbitY / toDist) * this.speed * dt * 3;
                this.retreatTimer = 0;
            }

            // Face the target
            this.angle = Math.atan2(dy, dx);

            // Attack: fire bursts
            this.attackTimer -= dt;
            if (this.attackTimer <= 0 && dist < 800) {
                this.burstTimer -= dt;
                if (this.burstTimer <= 0) {
                    // Fire a bullet
                    if (bullets) {
                        const bSpeed = 12;
                        const spread = (Math.random() - 0.5) * 0.15;
                        bullets.push({
                            x: this.x + Math.cos(this.angle) * 35,
                            y: this.y + Math.sin(this.angle) * 35,
                            vx: Math.cos(this.angle + spread) * bSpeed,
                            vy: Math.sin(this.angle + spread) * bSpeed,
                            owner: this.id,
                            damage: 12,
                            life: 2.5,
                            isBossBullet: true,
                        });
                    }
                    this.burstCount++;
                    this.burstTimer = 0.12;
                    if (this.burstCount >= this.burstMax) {
                        this.burstCount = 0;
                        this.attackTimer = this.attackInterval;
                    }
                }
            }
        } else {
            // Wander randomly
            this.orbitAngle += dt * 0.3;
            this.vx += Math.cos(this.orbitAngle) * 0.3 * dt;
            this.vy += Math.sin(this.orbitAngle) * 0.3 * dt;
        }

        // Speed limit
        const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (spd > this.maxSpeed) {
            this.vx *= this.maxSpeed / spd;
            this.vy *= this.maxSpeed / spd;
        }

        // Move
        this.x = ((this.x + this.vx) % WORLD_W + WORLD_W) % WORLD_W;
        this.y = ((this.y + this.vy) % WORLD_H + WORLD_H) % WORLD_H;

        // Bullet collision (incoming)
        if (bullets) {
            for (let i = bullets.length - 1; i >= 0; i--) {
                const b = bullets[i];
                if (b.owner === this.id || b.isBossBullet) continue;
                let bdx = b.x - this.x;
                let bdy = b.y - this.y;
                if (Math.abs(bdx) > WORLD_W / 2) bdx -= Math.sign(bdx) * WORLD_W;
                if (Math.abs(bdy) > WORLD_H / 2) bdy -= Math.sign(bdy) * WORLD_H;
                if (bdx * bdx + bdy * bdy < (this.radius + 5) * (this.radius + 5)) {
                    this.takeDamage(b.damage || 10);
                    bullets.splice(i, 1);
                }
            }
        }
    }

    draw(ctx, camX, camY) {
        if (!this.alive) return;
        const vw = ctx.canvas.width;
        const vh = ctx.canvas.height;

        let dx = this.x - camX;
        let dy = this.y - camY;
        // Simple screen position (no torus here for draw)
        const sx = dx + vw / 2;
        const sy = dy + vh / 2;

        if (sx < -100 || sx > vw + 100 || sy < -100 || sy > vh + 100) return;

        const pulse = 0.8 + Math.sin(this.pulsePhase) * 0.2;

        ctx.save();
        ctx.translate(sx, sy);

        // Death animation
        if (this.dying) {
            const progress = 1 - (this.deathTimer / 1.5);
            ctx.globalAlpha = 1 - progress;
            ctx.scale(1 + progress * 0.5, 1 + progress * 0.5);
        }

        // Damage flash
        if (this.damageFlash > 0) {
            ctx.globalAlpha = 0.5 + Math.sin(this.damageFlash * 30) * 0.5;
        }

        // Shield
        if (this.shieldActive && !this.shieldBroken) {
            const shieldRadius = this.radius + 12 + Math.sin(this.pulsePhase * 2) * 3;
            const shieldAlpha = 0.15 + Math.sin(this.pulsePhase) * 0.1;
            ctx.beginPath();
            ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(100,200,255,${shieldAlpha})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(100,200,255,${0.4 + Math.sin(this.pulsePhase) * 0.2})`;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Shield HP indicator
            const shieldRatio = this.shieldHp / this.shieldMaxHp;
            ctx.beginPath();
            ctx.arc(0, 0, shieldRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * shieldRatio);
            ctx.strokeStyle = "#00aaff";
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Body
        ctx.rotate(this.angle);
        ctx.fillStyle = "#884400";
        ctx.shadowColor = "#ff8800";
        ctx.shadowBlur = 10 * pulse;
        ctx.beginPath();
        ctx.moveTo(this.radius, 0);
        ctx.lineTo(-this.radius * 0.7, -this.radius * 0.6);
        ctx.lineTo(-this.radius * 0.4, 0);
        ctx.lineTo(-this.radius * 0.7, this.radius * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#ffaa44";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Wing details
        ctx.fillStyle = "#aa5500";
        ctx.fillRect(-this.radius * 0.3, -this.radius * 0.8, this.radius * 0.5, 4);
        ctx.fillRect(-this.radius * 0.3, this.radius * 0.8 - 4, this.radius * 0.5, 4);

        // Engine glow
        const flameLen = 10 + Math.random() * 6;
        ctx.fillStyle = `rgba(255,150,0,${0.6 + Math.random() * 0.3})`;
        ctx.beginPath();
        ctx.moveTo(-this.radius * 0.5, -5);
        ctx.lineTo(-this.radius * 0.5 - flameLen, 0);
        ctx.lineTo(-this.radius * 0.5, 5);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // HP bar
        ctx.save();
        ctx.translate(sx, sy);
        const barW = 50;
        const barH = 5;
        const barY = -this.radius - 20;

        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(-barW / 2 - 1, barY - 1, barW + 2, barH + 2);
        ctx.fillStyle = "#333";
        ctx.fillRect(-barW / 2, barY, barW, barH);
        const hpRatio = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = hpRatio > 0.5 ? "#ff8800" : hpRatio > 0.25 ? "#ff4400" : "#ff0000";
        ctx.fillRect(-barW / 2, barY, barW * hpRatio, barH);

        // Name
        ctx.fillStyle = "#ffaa44";
        ctx.font = "bold 10px 'Courier New'";
        ctx.textAlign = "center";
        ctx.fillText("SENTINEL", 0, barY - 6);

        ctx.restore();
    }
}

window.SentinelDestroyer = SentinelDestroyer;

// ========================================================
//  SUB-BOSS: PHANTOM INTERCEPTOR
//  Fast cloaking mini-boss that ambushes players
// ========================================================
class PhantomInterceptor {
    constructor(x, y, team, difficulty) {
        this.x = x;
        this.y = y;
        this.team = team;
        this.faction = "enemy";
        this.alive = true;
        this.isBoss = true;
        this.customAI = true;

        const diffMult = window.gameSettingsBridge ?
            window.gameSettingsBridge.getDifficultyMultiplier("bossHp") : 1.0;

        this.maxHp = Math.round(200 * diffMult);
        this.hp = this.maxHp;
        this.radius = 22;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = 4;
        this.vx = 0;
        this.vy = 0;
        this.maxSpeed = 6;

        // Cloak
        this.cloaked = false;
        this.cloakTimer = 0;
        this.cloakDuration = 4.0;
        this.cloakCooldown = 6.0;
        this.cloakCooldownTimer = 3.0;
        this.opacity = 1.0;

        // Attack
        this.attackTimer = 0;
        this.attackCooldown = 0.8;
        this.dashTimer = 0;
        this.isDashing = false;
        this.dashCooldown = 5.0;
        this.dashCooldownTimer = 2.0;

        // Visual
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.trailPoints = [];
        this.damageFlash = 0;

        this.id = "phantom_" + Math.random().toString(36).substr(2, 6);
    }

    takeDamage(dmg) {
        this.hp -= dmg;
        this.damageFlash = 0.2;
        // Damage de-cloaks
        if (this.cloaked) {
            this.cloaked = false;
            this.cloakCooldownTimer = this.cloakCooldown;
        }
        if (this.hp <= 0) {
            this.alive = false;
            if (window.stardustDrops) {
                for (let i = 0; i < 6; i++) {
                    const ang = Math.random() * Math.PI * 2;
                    window.stardustDrops.push({
                        x: this.x + Math.cos(ang) * 25,
                        y: this.y + Math.sin(ang) * 25,
                        value: 3 + Math.floor(Math.random() * 8),
                        life: 8.0, vy: -0.5,
                        pulse: Math.random() * Math.PI * 2,
                    });
                }
            }
        }
    }

    update(dt, ships, bullets, particles, WORLD_W, WORLD_H) {
        if (!this.alive) return;
        this.pulsePhase += dt * 4;
        if (this.damageFlash > 0) this.damageFlash -= dt;

        // Trail
        if (!this.cloaked && this.trailPoints.length < 15) {
            this.trailPoints.push({ x: this.x, y: this.y, alpha: 0.6 });
        }
        for (const t of this.trailPoints) t.alpha -= dt * 2;
        this.trailPoints = this.trailPoints.filter(t => t.alpha > 0);

        // Cloak management
        if (this.cloaked) {
            this.cloakTimer -= dt;
            this.opacity = 0.08 + Math.sin(this.pulsePhase * 2) * 0.04;
            if (this.cloakTimer <= 0) {
                this.cloaked = false;
                this.cloakCooldownTimer = this.cloakCooldown;
            }
        } else {
            this.opacity = Math.min(1.0, this.opacity + dt * 3);
            this.cloakCooldownTimer -= dt;
            if (this.cloakCooldownTimer <= 0 && this.hp < this.maxHp * 0.7) {
                this.cloaked = true;
                this.cloakTimer = this.cloakDuration;
            }
        }

        // Find target
        let target = null;
        let targetDist = Infinity;
        for (const s of ships) {
            if (s.faction === "enemy" || s.isGhost || !s.alive || s.isBoss) continue;
            if (s.team === this.team) continue;
            let dx = s.x - this.x;
            let dy = s.y - this.y;
            if (Math.abs(dx) > WORLD_W / 2) dx -= Math.sign(dx) * WORLD_W;
            if (Math.abs(dy) > WORLD_H / 2) dy -= Math.sign(dy) * WORLD_H;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < targetDist) {
                targetDist = d;
                target = s;
            }
        }

        if (target) {
            let dx = target.x - this.x;
            let dy = target.y - this.y;
            if (Math.abs(dx) > WORLD_W / 2) dx -= Math.sign(dx) * WORLD_W;
            if (Math.abs(dy) > WORLD_H / 2) dy -= Math.sign(dy) * WORLD_H;
            this.angle = Math.atan2(dy, dx);

            // Dash attack
            this.dashCooldownTimer -= dt;
            if (!this.isDashing && this.dashCooldownTimer <= 0 && targetDist < 500 && targetDist > 150) {
                this.isDashing = true;
                this.dashTimer = 0.4;
                this.vx = Math.cos(this.angle) * this.maxSpeed * 3;
                this.vy = Math.sin(this.angle) * this.maxSpeed * 3;
            }

            if (this.isDashing) {
                this.dashTimer -= dt;
                if (this.dashTimer <= 0) {
                    this.isDashing = false;
                    this.dashCooldownTimer = this.dashCooldown;
                }
            } else {
                // Chase
                const chaseForce = this.cloaked ? 0.3 : 1.5;
                this.vx += (dx / targetDist) * chaseForce * dt * 60;
                this.vy += (dy / targetDist) * chaseForce * dt * 60;
            }

            // Shoot
            this.attackTimer -= dt;
            if (this.attackTimer <= 0 && targetDist < 600 && !this.cloaked) {
                if (bullets) {
                    bullets.push({
                        x: this.x + Math.cos(this.angle) * 25,
                        y: this.y + Math.sin(this.angle) * 25,
                        vx: Math.cos(this.angle) * 14,
                        vy: Math.sin(this.angle) * 14,
                        owner: this.id, damage: 15, life: 2.0,
                        isBossBullet: true,
                    });
                }
                this.attackTimer = this.attackCooldown;
            }
        }

        // Speed limit
        if (!this.isDashing) {
            const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (spd > this.maxSpeed) {
                this.vx *= this.maxSpeed / spd;
                this.vy *= this.maxSpeed / spd;
            }
        }

        // Friction
        this.vx *= 0.97;
        this.vy *= 0.97;

        this.x = ((this.x + this.vx) % WORLD_W + WORLD_W) % WORLD_W;
        this.y = ((this.y + this.vy) % WORLD_H + WORLD_H) % WORLD_H;

        // Incoming bullet check
        if (bullets) {
            for (let i = bullets.length - 1; i >= 0; i--) {
                const b = bullets[i];
                if (b.owner === this.id || b.isBossBullet) continue;
                let bdx = b.x - this.x;
                let bdy = b.y - this.y;
                if (Math.abs(bdx) > WORLD_W / 2) bdx -= Math.sign(bdx) * WORLD_W;
                if (Math.abs(bdy) > WORLD_H / 2) bdy -= Math.sign(bdy) * WORLD_H;
                if (bdx * bdx + bdy * bdy < (this.radius + 4) * (this.radius + 4)) {
                    this.takeDamage(b.damage || 10);
                    bullets.splice(i, 1);
                }
            }
        }
    }

    draw(ctx, camX, camY) {
        if (!this.alive) return;
        const vw = ctx.canvas.width;
        const vh = ctx.canvas.height;
        const sx = this.x - camX + vw / 2;
        const sy = this.y - camY + vh / 2;

        if (sx < -100 || sx > vw + 100 || sy < -100 || sy > vh + 100) return;

        ctx.save();
        ctx.globalAlpha = this.opacity;

        // Trail
        for (const t of this.trailPoints) {
            ctx.fillStyle = `rgba(100,0,200,${t.alpha * 0.3 * this.opacity})`;
            ctx.beginPath();
            const tSx = t.x - camX + vw / 2;
            const tSy = t.y - camY + vh / 2;
            ctx.arc(tSx, tSy, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.translate(sx, sy);
        ctx.rotate(this.angle);

        // Body
        ctx.fillStyle = this.damageFlash > 0 ? "#fff" : "#6600cc";
        ctx.shadowColor = "#aa00ff";
        ctx.shadowBlur = this.isDashing ? 20 : 8;
        ctx.beginPath();
        ctx.moveTo(this.radius, 0);
        ctx.lineTo(-this.radius * 0.5, -this.radius * 0.8);
        ctx.lineTo(-this.radius * 0.3, 0);
        ctx.lineTo(-this.radius * 0.5, this.radius * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#cc66ff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Dash effect
        if (this.isDashing) {
            ctx.fillStyle = "rgba(170,0,255,0.4)";
            ctx.beginPath();
            ctx.moveTo(-this.radius, -this.radius * 0.5);
            ctx.lineTo(-this.radius * 2.5, 0);
            ctx.lineTo(-this.radius, this.radius * 0.5);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();

        // HP bar (always visible, even when cloaked it shows faintly)
        ctx.save();
        ctx.globalAlpha = Math.max(0.3, this.opacity);
        const barW = 40;
        const barH = 4;
        const barY = sy - this.radius - 18;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(sx - barW / 2, barY, barW, barH);
        const hpR = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = "#aa00ff";
        ctx.fillRect(sx - barW / 2, barY, barW * hpR, barH);

        ctx.fillStyle = "#cc66ff";
        ctx.font = "bold 9px 'Courier New'";
        ctx.textAlign = "center";
        ctx.fillText("PHANTOM", sx, barY - 4);
        ctx.restore();
    }
}

window.PhantomInterceptor = PhantomInterceptor;

// ========================================================
//  ENHANCED ENVIRONMENTAL HAZARD SYSTEM
//  Solar Storms, Nebula, Black Holes with full rendering
// ========================================================
class EnhancedSolarStorm {
    constructor(WORLD_W, WORLD_H) {
        this.active = false;
        this.timer = 0;
        this.duration = 8.0;
        this.cooldown = 30.0;
        this.cooldownTimer = 15 + Math.random() * 20;
        this.intensity = 0;
        this.direction = Math.random() * Math.PI * 2;
        this.WORLD_W = WORLD_W;
        this.WORLD_H = WORLD_H;
        this.particles = [];
        this.warningTimer = 0;
        this.warning = false;
    }

    update(dt, ships) {
        if (this.active) {
            this.timer -= dt;
            this.intensity = Math.min(1.0, this.intensity + dt * 0.5);

            // Push ships
            const pushForce = 2.0 * this.intensity;
            const cx = Math.cos(this.direction) * pushForce;
            const cy = Math.sin(this.direction) * pushForce;
            for (const s of ships) {
                if (s.isGhost || !s.alive) continue;
                s.vx += cx * dt;
                s.vy += cy * dt;
                // Heat damage
                if (Math.random() < 0.02 * this.intensity) {
                    s.hp -= 1;
                }
            }

            // Spawn visual particles
            if (window.gameSettingsBridge?.particlesEnabled) {
                for (let i = 0; i < 3; i++) {
                    this.particles.push({
                        x: Math.random() * this.WORLD_W,
                        y: Math.random() * this.WORLD_H,
                        vx: cx * 5, vy: cy * 5,
                        life: 1.0 + Math.random(),
                        alpha: 0.3 + Math.random() * 0.4,
                        size: 2 + Math.random() * 3,
                    });
                }
            }

            if (this.timer <= 0) {
                this.active = false;
                this.cooldownTimer = this.cooldown + Math.random() * 10;
                this.intensity = 0;
            }
        } else {
            // Warning phase
            this.cooldownTimer -= dt;
            if (this.cooldownTimer <= 3 && this.cooldownTimer > 0) {
                this.warning = true;
                this.warningTimer += dt;
            } else {
                this.warning = false;
            }

            if (this.cooldownTimer <= 0) {
                this.active = true;
                this.timer = this.duration;
                this.direction = Math.random() * Math.PI * 2;
                this.warning = false;
            }
        }

        // Update particles
        for (const p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
        }
        this.particles = this.particles.filter(p => p.life > 0);
    }

    draw(ctx, camX, camY, vw, vh) {
        if (this.warning) {
            // Warning overlay
            const flash = Math.sin(this.warningTimer * 8) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255,100,0,${0.05 * flash})`;
            ctx.fillRect(0, 0, vw, vh);

            ctx.fillStyle = `rgba(255,150,0,${0.8 * flash})`;
            ctx.font = "bold 24px 'Courier New'";
            ctx.textAlign = "center";
            ctx.fillText("⚠ SOLAR STORM INCOMING ⚠", vw / 2, 50);
        }

        if (!this.active) return;

        // Storm overlay
        ctx.fillStyle = `rgba(255,100,0,${0.03 * this.intensity})`;
        ctx.fillRect(0, 0, vw, vh);

        // Draw storm particles
        for (const p of this.particles) {
            const px = ((p.x - camX) % vw + vw) % vw;
            const py = ((p.y - camY) % vh + vh) % vh;
            ctx.fillStyle = `rgba(255,200,50,${p.alpha * (p.life / 2)})`;
            ctx.fillRect(px, py, p.size, p.size * 0.3);
        }

        // Direction indicator
        ctx.save();
        ctx.translate(vw / 2, 30);
        ctx.fillStyle = `rgba(255,150,50,${0.6 * this.intensity})`;
        ctx.font = "bold 14px 'Courier New'";
        ctx.textAlign = "center";
        ctx.fillText(`SOLAR STORM — INTENSITY: ${Math.round(this.intensity * 100)}%`, 0, 0);
        ctx.restore();
    }
}

window.EnhancedSolarStorm = EnhancedSolarStorm;

// ========================================================
//  ENHANCED BLACK HOLE
//  Gravitational hazard with accretion disk rendering
// ========================================================
class EnhancedBlackHole {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.pullRadius = 400;
        this.killRadius = 30;
        this.pullStrength = 3.0;
        this.active = true;
        this.lifetime = 20;
        this.timer = this.lifetime;
        this.rotAngle = 0;
        this.accretionParticles = [];

        // Generate accretion disk particles
        for (let i = 0; i < 60; i++) {
            const orbit = 50 + Math.random() * 150;
            this.accretionParticles.push({
                angle: Math.random() * Math.PI * 2,
                orbitRadius: orbit,
                speed: (1 + Math.random()) / (orbit * 0.01),
                size: 1 + Math.random() * 3,
                hue: 200 + Math.random() * 60,
                brightness: 40 + Math.random() * 40,
            });
        }
    }

    update(dt, ships, WORLD_W, WORLD_H, torusDist2) {
        if (!this.active) return;
        this.timer -= dt;
        this.rotAngle += dt * 0.5;

        if (this.timer <= 0) {
            this.active = false;
            return;
        }

        // Update accretion particles
        for (const p of this.accretionParticles) {
            p.angle += p.speed * dt;
        }

        // Pull ships
        for (const s of ships) {
            if (s.isGhost || !s.alive) continue;
            let dx = this.x - s.x;
            let dy = this.y - s.y;
            if (Math.abs(dx) > WORLD_W / 2) dx -= Math.sign(dx) * WORLD_W;
            if (Math.abs(dy) > WORLD_H / 2) dy -= Math.sign(dy) * WORLD_H;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.pullRadius && dist > 0) {
                const force = this.pullStrength * (1 - dist / this.pullRadius) * (1 - dist / this.pullRadius);
                s.vx += (dx / dist) * force;
                s.vy += (dy / dist) * force;

                // Kill zone
                if (dist < this.killRadius) {
                    s.hp -= 50 * dt;
                }
            }
        }
    }

    draw(ctx, camX, camY, vw, vh) {
        if (!this.active) return;
        const sx = this.x - camX + vw / 2;
        const sy = this.y - camY + vh / 2;

        if (sx < -this.pullRadius || sx > vw + this.pullRadius ||
            sy < -this.pullRadius || sy > vh + this.pullRadius) return;

        ctx.save();
        ctx.translate(sx, sy);

        // Gravitational lensing effect (outer ring)
        const fadeRatio = Math.min(1, this.timer / 3);
        ctx.globalAlpha = fadeRatio;

        // Accretion disk
        for (const p of this.accretionParticles) {
            const px = Math.cos(p.angle) * p.orbitRadius;
            const py = Math.sin(p.angle) * p.orbitRadius * 0.4; // Flatten
            ctx.fillStyle = `hsla(${p.hue}, 80%, ${p.brightness}%, 0.6)`;
            ctx.beginPath();
            ctx.arc(px, py, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Event horizon
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.killRadius);
        grad.addColorStop(0, "rgba(0,0,0,1)");
        grad.addColorStop(0.7, "rgba(0,0,20,0.9)");
        grad.addColorStop(1, "rgba(0,0,50,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, this.killRadius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(0, 0, this.killRadius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Glow ring
        ctx.strokeStyle = `rgba(100,150,255,${0.4 * fadeRatio})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.killRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Pull radius indicator
        ctx.strokeStyle = `rgba(50,50,150,${0.1 * fadeRatio})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([8, 16]);
        ctx.beginPath();
        ctx.arc(0, 0, this.pullRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();
    }
}

window.EnhancedBlackHole = EnhancedBlackHole;

// ========================================================
//  NEBULA ZONE - Visibility reduction + heal zone
// ========================================================
class EnhancedNebulaZone {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius || 300;
        this.healRate = 2; // HP per second
        this.visibilityReduction = 0.4;
        this.cloudParticles = [];
        this.pulsePhase = Math.random() * Math.PI * 2;

        // Generate cloud particles
        for (let i = 0; i < 40; i++) {
            const ang = Math.random() * Math.PI * 2;
            const dist = Math.random() * this.radius;
            this.cloudParticles.push({
                x: Math.cos(ang) * dist,
                y: Math.sin(ang) * dist,
                size: 20 + Math.random() * 60,
                alpha: 0.05 + Math.random() * 0.08,
                hue: 240 + Math.random() * 80,
                driftAngle: Math.random() * Math.PI * 2,
                driftSpeed: 0.2 + Math.random() * 0.5,
            });
        }
    }

    update(dt, ships, WORLD_W, WORLD_H, torusDist2) {
        this.pulsePhase += dt * 0.5;

        // Drift cloud particles
        for (const p of this.cloudParticles) {
            p.x += Math.cos(p.driftAngle) * p.driftSpeed * dt;
            p.y += Math.sin(p.driftAngle) * p.driftSpeed * dt;
            // Keep within radius
            const dist = Math.sqrt(p.x * p.x + p.y * p.y);
            if (dist > this.radius * 0.9) {
                p.driftAngle += Math.PI;
            }
        }

        // Heal ships inside
        for (const s of ships) {
            if (s.isGhost || !s.alive) continue;
            const d2 = torusDist2(this.x, this.y, s.x, s.y);
            if (d2 < this.radius * this.radius) {
                s.hp = Math.min(s.maxHp, s.hp + this.healRate * dt);
                s._inNebula = true;
            } else {
                s._inNebula = false;
            }
        }
    }

    draw(ctx, camX, camY, vw, vh) {
        const sx = this.x - camX + vw / 2;
        const sy = this.y - camY + vh / 2;

        if (sx < -this.radius * 2 || sx > vw + this.radius * 2 ||
            sy < -this.radius * 2 || sy > vh + this.radius * 2) return;

        ctx.save();
        ctx.translate(sx, sy);

        // Cloud particles
        for (const p of this.cloudParticles) {
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
            grad.addColorStop(0, `hsla(${p.hue}, 60%, 50%, ${p.alpha})`);
            grad.addColorStop(1, "transparent");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Border glow
        const borderPulse = 0.8 + Math.sin(this.pulsePhase) * 0.2;
        ctx.strokeStyle = `rgba(100,100,255,${0.1 * borderPulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Heal indicator text
        ctx.fillStyle = "rgba(100,200,255,0.3)";
        ctx.font = "10px 'Courier New'";
        ctx.textAlign = "center";
        ctx.fillText("NEBULA ZONE • HP REGEN", 0, -this.radius - 8);

        ctx.restore();
    }
}

window.EnhancedNebulaZone = EnhancedNebulaZone;

// ========================================================
//  WAVE SPAWN SYSTEM - Enhanced wave management
// ========================================================
class EnhancedWaveSystem {
    constructor() {
        this.wave = 0;
        this.waveTimer = 0;
        this.waveDelay = 5.0; // seconds between waves
        this.enemiesPerWave = 4;
        this.waveGrowth = 1.3; // multiplication per wave
        this.maxEnemies = 30;
        this.announceTimer = 0;
        this.announcing = false;
        this.waveText = "";
        this.subBossWaves = [5, 15]; // waves that spawn sub-bosses
        this.bossWaves = [10, 20, 30]; // waves that spawn Leviathan
    }

    shouldSpawnWave(currentEnemyCount) {
        return currentEnemyCount === 0 && this.waveTimer <= 0;
    }

    startNextWave() {
        this.wave++;
        this.waveTimer = this.waveDelay;
        this.announcing = true;
        this.announceTimer = 3.0;

        const isBossWave = this.bossWaves.includes(this.wave);
        const isSubBossWave = this.subBossWaves.includes(this.wave);

        if (isBossWave) {
            this.waveText = `WAVE ${this.wave} — BOSS ENCOUNTER`;
        } else if (isSubBossWave) {
            this.waveText = `WAVE ${this.wave} — MINI-BOSS INCOMING`;
        } else {
            this.waveText = `WAVE ${this.wave}`;
        }

        return {
            wave: this.wave,
            enemyCount: Math.min(this.maxEnemies, Math.round(this.enemiesPerWave * Math.pow(this.waveGrowth, this.wave - 1))),
            isBossWave,
            isSubBossWave,
        };
    }

    update(dt) {
        if (this.waveTimer > 0) this.waveTimer -= dt;
        if (this.announceTimer > 0) {
            this.announceTimer -= dt;
            if (this.announceTimer <= 0) this.announcing = false;
        }
    }

    drawAnnouncement(ctx, vw, vh) {
        if (!this.announcing) return;

        const progress = this.announceTimer / 3.0;
        const alpha = progress > 0.7 ? (1 - progress) / 0.3 : progress < 0.3 ? progress / 0.3 : 1.0;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#00f0ff";
        ctx.font = "bold 36px 'Courier New'";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 20;
        ctx.fillText(this.waveText, vw / 2, vh / 2 - 50);
        ctx.shadowBlur = 0;

        // Subtitle
        if (this.wave > 1) {
            ctx.fillStyle = "#aaa";
            ctx.font = "14px 'Courier New'";
            const diffText = window.gameSettingsBridge?.difficulty || "normal";
            ctx.fillText(`DIFFICULTY: ${diffText.toUpperCase()}`, vw / 2, vh / 2 - 15);
        }

        ctx.restore();
    }
}

window.EnhancedWaveSystem = EnhancedWaveSystem;

// ========================================================
//  MODE TRANSITION MANAGER
//  Smooth transitions between game modes with effects
// ========================================================
class ModeTransitionManager {
    constructor() {
        this.transitioning = false;
        this.transitionProgress = 0;
        this.transitionDuration = 1.5;
        this.fromMode = null;
        this.toMode = null;
        this.onComplete = null;
    }

    startTransition(fromMode, toMode, onComplete) {
        this.transitioning = true;
        this.transitionProgress = 0;
        this.fromMode = fromMode;
        this.toMode = toMode;
        this.onComplete = onComplete;
    }

    update(dt) {
        if (!this.transitioning) return;
        this.transitionProgress += dt / this.transitionDuration;
        if (this.transitionProgress >= 1) {
            this.transitioning = false;
            this.transitionProgress = 1;
            if (this.onComplete) this.onComplete();
        }
    }

    draw(ctx, vw, vh) {
        if (!this.transitioning) return;
        const p = this.transitionProgress;

        // Wipe effect
        const fadeAlpha = p < 0.5 ? p * 2 : (1 - p) * 2;
        ctx.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
        ctx.fillRect(0, 0, vw, vh);

        // Mode name at center during transition
        if (fadeAlpha > 0.5) {
            ctx.save();
            ctx.globalAlpha = fadeAlpha;
            ctx.fillStyle = "#00f0ff";
            ctx.font = "bold 28px 'Courier New'";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.shadowColor = "#00f0ff";
            ctx.shadowBlur = 15;

            const modeName = (this.toMode || "").replace(/_/g, " ").toUpperCase();
            ctx.fillText(modeName, vw / 2, vh / 2);
            ctx.shadowBlur = 0;
            ctx.restore();
        }
    }
}

window.ModeTransitionManager = ModeTransitionManager;

// ========================================================
//  COMBO MULTIPLIER SYSTEM (Enhanced)
//  Tracks kill streaks with visual feedback
// ========================================================
class EnhancedComboSystem {
    constructor() {
        this.combo = 0;
        this.maxCombo = 0;
        this.comboTimer = 0;
        this.comboTimeout = 4.0; // seconds to maintain combo
        this.multiplier = 1.0;
        this.displayTimer = 0;
        this.popEffects = [];
    }

    registerKill(x, y) {
        this.combo++;
        this.comboTimer = this.comboTimeout;
        this.multiplier = 1 + (this.combo - 1) * 0.25;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        this.displayTimer = 2.0;

        // Pop effect
        this.popEffects.push({
            x, y,
            text: `${this.combo}x COMBO!`,
            timer: 1.5,
            color: this.combo >= 10 ? "#ff00ff" : this.combo >= 5 ? "#ffaa00" : "#00f0ff",
            size: 14 + Math.min(this.combo * 2, 20),
        });
    }

    update(dt) {
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.combo = 0;
                this.multiplier = 1.0;
            }
        }
        if (this.displayTimer > 0) this.displayTimer -= dt;

        for (const p of this.popEffects) {
            p.timer -= dt;
            p.y -= 30 * dt;
        }
        this.popEffects = this.popEffects.filter(p => p.timer > 0);
    }

    draw(ctx, vw, vh, camX, camY) {
        // Combo counter
        if (this.combo >= 2 && this.displayTimer > 0) {
            ctx.save();
            const alpha = Math.min(1, this.displayTimer);
            ctx.globalAlpha = alpha;

            ctx.fillStyle = this.combo >= 10 ? "#ff00ff" : this.combo >= 5 ? "#ffaa00" : "#00f0ff";
            ctx.font = `bold ${20 + Math.min(this.combo * 2, 16)}px 'Courier New'`;
            ctx.textAlign = "right";
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 10;
            ctx.fillText(`${this.combo}x COMBO`, vw - 20, vh - 60);

            ctx.font = "12px 'Courier New'";
            ctx.fillStyle = "#aaa";
            ctx.shadowBlur = 0;
            ctx.fillText(`Score ×${this.multiplier.toFixed(2)}`, vw - 20, vh - 42);
            ctx.restore();
        }

        // Pop effects in world space
        for (const p of this.popEffects) {
            const alpha = Math.min(1, p.timer);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.font = `bold ${p.size}px 'Courier New'`;
            ctx.textAlign = "center";
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            // World to screen is handled externally; these draw at world coords
            const sx = p.x - camX + vw / 2;
            const sy = p.y - camY + vh / 2;
            if (sx > -200 && sx < vw + 200 && sy > -200 && sy < vh + 200) {
                ctx.fillText(p.text, sx, sy);
            }
            ctx.shadowBlur = 0;
            ctx.restore();
        }
    }

    getScoreMultiplier() {
        return this.multiplier;
    }
}

window.EnhancedComboSystem = EnhancedComboSystem;

// ========================================================
//  ACHIEVEMENT / MEDAL SYSTEM
//  Track and display in-game achievements
// ========================================================
class AchievementTracker {
    constructor() {
        this.achievements = [
            { id: "first_blood", name: "FIRST BLOOD", desc: "最初のキルを獲得", icon: "🗡️", unlocked: false, check: (s) => s.kills >= 1 },
            { id: "ace_pilot", name: "ACE PILOT", desc: "10キル達成", icon: "⭐", unlocked: false, check: (s) => s.kills >= 10 },
            { id: "survivor", name: "SURVIVOR", desc: "死なずに5分生存", icon: "🛡️", unlocked: false, check: (s) => s.survivalTime >= 300 },
            { id: "combo_master", name: "COMBO MASTER", desc: "5コンボ達成", icon: "🔥", unlocked: false, check: (s) => s.maxCombo >= 5 },
            { id: "boss_slayer", name: "BOSS SLAYER", desc: "ボスを撃破", icon: "💀", unlocked: false, check: (s) => s.bossKills >= 1 },
            { id: "speed_demon", name: "SPEED DEMON", desc: "最高速度で10秒飛行", icon: "⚡", unlocked: false, check: (s) => s.maxSpeedTime >= 10 },
            { id: "stardust_collector", name: "STARDUST COLLECTOR", desc: "100スターダスト収集", icon: "✨", unlocked: false, check: (s) => s.totalStardust >= 100 },
        ];
        this.pendingNotifications = [];
        this.stats = {
            kills: 0, bossKills: 0, survivalTime: 0,
            maxCombo: 0, maxSpeedTime: 0, totalStardust: 0,
        };
    }

    updateStats(newStats) {
        Object.assign(this.stats, newStats);
        for (const a of this.achievements) {
            if (!a.unlocked && a.check(this.stats)) {
                a.unlocked = true;
                this.pendingNotifications.push({
                    ...a, timer: 4.0,
                });
            }
        }
    }

    update(dt) {
        for (const n of this.pendingNotifications) {
            n.timer -= dt;
        }
        this.pendingNotifications = this.pendingNotifications.filter(n => n.timer > 0);
    }

    draw(ctx, vw, vh) {
        let yOff = 120;
        for (const n of this.pendingNotifications) {
            const alpha = n.timer > 3.5 ? (4 - n.timer) * 2 :
                          n.timer < 0.5 ? n.timer * 2 : 1.0;

            ctx.save();
            ctx.globalAlpha = alpha;

            // Background
            const boxW = 280;
            const boxH = 50;
            const boxX = vw - boxW - 20;
            ctx.fillStyle = "rgba(0,15,30,0.9)";
            ctx.strokeStyle = "#ffaa00";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(boxX, yOff, boxW, boxH, 4);
            ctx.fill();
            ctx.stroke();

            // Icon
            ctx.font = "24px serif";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillText(n.icon, boxX + 12, yOff + boxH / 2);

            // Title
            ctx.fillStyle = "#ffaa00";
            ctx.font = "bold 14px 'Courier New'";
            ctx.fillText(n.name, boxX + 45, yOff + 18);

            // Description
            ctx.fillStyle = "#aaa";
            ctx.font = "11px 'Courier New'";
            ctx.fillText(n.desc, boxX + 45, yOff + 36);

            ctx.restore();
            yOff += boxH + 8;
        }
    }
}

window.AchievementTracker = AchievementTracker;

// ========================================================
//  DAMAGE NUMBER SYSTEM (Enhanced with crits, colors)
// ========================================================
class EnhancedDamageNumbers {
    constructor() {
        this.numbers = [];
    }

    add(x, y, damage, isCrit, isHeal) {
        this.numbers.push({
            x, y,
            text: isHeal ? `+${damage}` : `-${damage}`,
            color: isHeal ? "#00ff88" : isCrit ? "#ff4444" : "#ffcc00",
            size: isCrit ? 20 : isHeal ? 14 : 16,
            timer: 1.2,
            vy: -40,
            vx: (Math.random() - 0.5) * 30,
            alpha: 1.0,
            isCrit,
        });
    }

    update(dt) {
        for (const n of this.numbers) {
            n.timer -= dt;
            n.y += n.vy * dt;
            n.x += n.vx * dt;
            n.vy *= 0.95;
            n.alpha = Math.min(1, n.timer / 0.3);
        }
        this.numbers = this.numbers.filter(n => n.timer > 0);
    }

    draw(ctx, camX, camY, vw, vh) {
        for (const n of this.numbers) {
            const sx = n.x - camX + vw / 2;
            const sy = n.y - camY + vh / 2;
            if (sx < -50 || sx > vw + 50 || sy < -50 || sy > vh + 50) continue;

            ctx.save();
            ctx.globalAlpha = n.alpha;
            ctx.fillStyle = n.color;
            ctx.font = `bold ${n.size}px 'Courier New'`;
            ctx.textAlign = "center";
            if (n.isCrit) {
                ctx.shadowColor = "#ff0000";
                ctx.shadowBlur = 10;
            }
            ctx.fillText(n.text, sx, sy);
            ctx.shadowBlur = 0;
            ctx.restore();
        }
    }
}

window.EnhancedDamageNumbers = EnhancedDamageNumbers;

// ========================================================
//  MODE DIFFICULTY SCALER
//  Adjusts all mode parameters based on current difficulty
// ========================================================
class ModeDifficultyScaler {
    static applyToClassic(waveSystem) {
        const bridge = window.gameSettingsBridge;
        if (!bridge) return;
        bridge.sync();

        waveSystem.enemiesPerWave = Math.round(4 * bridge.getDifficultyMultiplier("spawnRate"));
        waveSystem.waveGrowth = bridge.difficulty === "hard" ? 1.5 : bridge.difficulty === "easy" ? 1.15 : 1.3;
    }

    static applyToStrangerRace(mode) {
        const bridge = window.gameSettingsBridge;
        if (!bridge) return;
        bridge.sync();

        mode.containerSpawnInterval = Math.round(3000 / bridge.getDifficultyMultiplier("itemSpawn"));
        mode.maxContainers = Math.round(12 * bridge.getDifficultyMultiplier("itemSpawn"));
    }

    static applyToMothershipWars(mode) {
        const bridge = window.gameSettingsBridge;
        if (!bridge) return;
        bridge.sync();

        // Scale mothership HP by difficulty
        if (mode.motherships) {
            for (const ms of mode.motherships) {
                if (ms && !ms._diffApplied) {
                    ms.maxHp = Math.round(ms.maxHp * bridge.getDifficultyMultiplier("bossHp"));
                    ms.hp = ms.maxHp;
                    ms._diffApplied = true;
                }
            }
        }
    }

    static applyToParasitePanic(mode) {
        const bridge = window.gameSettingsBridge;
        if (!bridge) return;
        bridge.sync();

        if (mode.parasiteSpeed !== undefined) {
            mode.parasiteSpeed = 3 * bridge.getDifficultyMultiplier("enemySpeed");
        }
    }

    static applyToGalacticPayload(mode) {
        const bridge = window.gameSettingsBridge;
        if (!bridge) return;
        bridge.sync();

        if (mode.escortSpeed !== undefined) {
            mode.escortSpeed = 1.5 * bridge.getDifficultyMultiplier("enemySpeed");
        }
    }
}

window.ModeDifficultyScaler = ModeDifficultyScaler;

// ========================================================
//  INIT HELPER: Wire all systems together
// ========================================================
window.initGrandPolishSystems = function () {
    window.gameSettingsBridge = new GameSettingsBridge();
    window.gameSettingsBridge.sync();

    window._formationManager = new FormationManager();
    window._asteroidPathfinder = new AsteroidPathfinder();
    window._comboSystem = new EnhancedComboSystem();
    window._achievementTracker = new AchievementTracker();
    window._damageNumbers = new EnhancedDamageNumbers();
    window._waveSystem = new EnhancedWaveSystem();
    window._modeTransition = new ModeTransitionManager();

    console.log("[Astro Fray] Grand Polish Systems initialized.");
};

// Auto-init on load
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        if (window.initGrandPolishSystems) window.initGrandPolishSystems();
    });
} else {
    setTimeout(() => {
        if (window.initGrandPolishSystems) window.initGrandPolishSystems();
    }, 100);
}
