// ===== Utility =====
class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(v) { return new Vec2(this.x + v.x, this.y + v.y); }
    sub(v) { return new Vec2(this.x - v.x, this.y - v.y); }
    mul(s) { return new Vec2(this.x * s, this.y * s); }
    len() { return Math.hypot(this.x, this.y); }
    norm() {
        const l = this.len();
        return l ? this.mul(1 / l) : new Vec2(0, 0);
    }
}

// ===== Canvas & Globals =====
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// Keyboard state
const keys = {};
window.addEventListener("keydown", e => keys[e.code] = true);
window.addEventListener("keyup", e => keys[e.code] = false);

// Gamepad state
let gpIndex = null;
window.addEventListener("gamepadconnected", e => {
    if (gpIndex === null) {
        gpIndex = e.gamepad.index;
    }
});
window.addEventListener("gamepaddisconnected", e => {
    if (e.gamepad.index === gpIndex) gpIndex = null;
});

function readGamepad() {
    if (gpIndex === null) return null;
    const gp = navigator.getGamepads()[gpIndex];
    return gp && gp.connected ? gp : null;
}

// ===== Game Configuration =====
const GameConfig = {
    // Player
    playerSpeed: 250,
    playerRadius: 10,
    fireRate: 0.15,
    bulletSpeed: 450,
    bulletRadius: 4,
    
    // Enemy
    enemyBaseRadius: 12,
    enemyBaseSpeed: 100,
    enemySpawnBaseInterval: 2.0,
    enemySpawnMinInterval: 0.3,
    enemySpawnIntervalDecay: 0.95, // Slower difficulty ramp
    
    // Scoring
    baseEnemyScore: 10,
    scoreMultiplierDecay: 500, // Points needed to increase difficulty
    
    // Visual
    particleCount: 16,
    particleLifetime: 0.6,
    particleMinSpeed: 50,
    particleMaxSpeed: 150,
    
    // Game
    startingLives: 3,
    invulnerabilityTime: 1.5, // Seconds of invulnerability after hit
    
    // Powerups
    powerupDropChance: 0.15, // 15% chance
    powerupDuration: 15, // seconds
    powerupSpeed: 60,
    
    // Bombs
    startingBombs: 3,
    maxBombs: 5,
};

// ===== Visual Effects =====
class Particle {
    constructor(pos, vel, life, color, size = 2, type = "circle") {
        this.pos = pos;
        this.vel = vel;
        this.life = life;
        this.maxLife = life;
        this.color = color;
        this.size = size;
        this.type = type;
    }
    
    update(dt) {
        this.pos = this.pos.add(this.vel.mul(dt));
        this.life -= dt;
        
        // Add some drag for more natural movement
        this.vel = this.vel.mul(0.98);
    }
    
    draw() {
        const alpha = Math.max(this.life / this.maxLife, 0);
        ctx.globalAlpha = alpha;
        
        if (this.type === "spark") {
            // Bright spark effect
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.size * alpha, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        } else {
            // Regular particle
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1;
    }
}

class Trail {
    constructor(maxLength = 20) {
        this.points = [];
        this.maxLength = maxLength;
    }
    
    addPoint(pos) {
        this.points.push({x: pos.x, y: pos.y, time: Date.now()});
        if (this.points.length > this.maxLength) {
            this.points.shift();
        }
    }
    
    draw(color = "#fff", width = 2) {
        if (this.points.length < 2) return;
        
        ctx.strokeStyle = color;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        
        for (let i = 1; i < this.points.length; i++) {
            const alpha = i / this.points.length;
            ctx.globalAlpha = alpha * 0.7;
            ctx.lineWidth = width * alpha;
            
            ctx.beginPath();
            ctx.moveTo(this.points[i-1].x, this.points[i-1].y);
            ctx.lineTo(this.points[i].x, this.points[i].y);
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
    }
    
    clear() {
        this.points = [];
    }
}

function spawnBurst(pos, color, count = GameConfig.particleCount, type = "circle") {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = GameConfig.particleMinSpeed + Math.random() * (GameConfig.particleMaxSpeed - GameConfig.particleMinSpeed);
        const v = new Vec2(Math.cos(angle), Math.sin(angle)).mul(speed);
        const size = type === "spark" ? 3 + Math.random() * 2 : 2;
        const life = type === "spark" ? GameConfig.particleLifetime * 1.5 : GameConfig.particleLifetime;
        particles.push(new Particle(pos, v, life, color, size, type));
    }
}

function spawnExplosion(pos, color, size = "normal") {
    const count = size === "large" ? 32 : 16;
    const sparkCount = size === "large" ? 8 : 4;
    
    // Regular particles
    spawnBurst(pos, color, count, "circle");
    
    // Bright sparks
    spawnBurst(pos, color, sparkCount, "spark");
}

// ===== Powerup System =====
class Powerup {
    constructor(pos, type) {
        this.pos = pos;
        this.type = type;
        this.r = 8;
        this.age = 0;
        this.lifetime = 10; // seconds before disappearing
        this.pulsePhase = Math.random() * Math.PI * 2;
        
        // Type-specific properties
        switch (type) {
            case "triple":
                this.color = "#ff0";
                this.symbol = "3";
                break;
            case "laser":
                this.color = "#f00";
                this.symbol = "L";
                break;
            case "shield":
                this.color = "#0ff";
                this.symbol = "S";
                break;
        }
        
        // Gentle floating movement
        this.vel = new Vec2(
            (Math.random() - 0.5) * GameConfig.powerupSpeed,
            (Math.random() - 0.5) * GameConfig.powerupSpeed
        );
    }
    
    update(dt) {
        this.age += dt;
        this.pulsePhase += dt * 4;
        
        // Gentle floating
        this.pos = this.pos.add(this.vel.mul(dt));
        
        // Soft bouncing off screen edges
        if (this.pos.x - this.r < 0 || this.pos.x + this.r > canvas.width) {
            this.vel.x *= -1;
        }
        if (this.pos.y - this.r < 0 || this.pos.y + this.r > canvas.height) {
            this.vel.y *= -1;
        }
        
        // Keep on screen
        this.pos.x = Math.max(this.r, Math.min(canvas.width - this.r, this.pos.x));
        this.pos.y = Math.max(this.r, Math.min(canvas.height - this.r, this.pos.y));
        
        return this.age < this.lifetime;
    }
    
    draw() {
        const pulse = 0.7 + 0.3 * Math.sin(this.pulsePhase);
        const alpha = this.age > this.lifetime - 2 ? 
            Math.max(0, (this.lifetime - this.age) / 2) : 1; // Fade out in last 2 seconds
        
        ctx.globalAlpha = alpha;
        
        // Outer glow ring
        ctx.strokeStyle = this.color;
        ctx.shadowBlur = 20 * pulse;
        ctx.shadowColor = this.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.r + 2 * pulse, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner circle
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.r, 0, Math.PI * 2);
        ctx.fill();
        
        // Symbol
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#000";
        ctx.font = "bold 12px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.symbol, this.pos.x, this.pos.y);
        
        ctx.globalAlpha = 1;
    }
}

// ===== Entities =====
class Bullet {
    constructor(pos, vel) {
        this.pos = pos;
        this.vel = vel;
        this.r = GameConfig.bulletRadius;
        this.trail = new Trail(15);
        this.piercing = false;
    }
    
    update(dt) {
        this.pos = this.pos.add(this.vel.mul(dt));
        this.trail.addPoint(this.pos);
    }
    
    draw() {
        // Draw trail first
        this.trail.draw("#88f", 3);
        
        // Draw bullet with glow effect
        ctx.fillStyle = "#fff";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#88f";
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    
    offScreen() {
        return this.pos.x < -10 || this.pos.x > canvas.width + 10 ||
               this.pos.y < -10 || this.pos.y > canvas.height + 10;
    }
}

class LaserBullet extends Bullet {
    constructor(pos, vel) {
        super(pos, vel);
        this.piercing = true;
        this.r = GameConfig.bulletRadius * 1.2;
        this.trail = new Trail(20);
        this.hitCount = 0;
        this.maxHits = 3;
    }
    
    draw() {
        // Draw longer, brighter trail
        this.trail.draw("#f44", 4);
        
        // Draw laser bullet with red glow
        ctx.fillStyle = "#fff";
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#f44";
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.r, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner red core
        ctx.fillStyle = "#f44";
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.r * 0.6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    hit() {
        this.hitCount++;
        return this.hitCount >= this.maxHits;
    }
}

class Enemy {
    constructor(pos, vel, type = "basic") {
        this.pos = pos;
        this.vel = vel;
        this.type = type;
        this.trail = new Trail(type === "fast" ? 15 : 10);
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.age = 0;
        
        // Type-specific properties
        switch (type) {
            case "basic":
                this.r = GameConfig.enemyBaseRadius;
                this.scoreValue = GameConfig.baseEnemyScore;
                this.color = "#f0f";
                this.maxSpeed = 150;
                break;
            case "homing":
                this.r = GameConfig.enemyBaseRadius * 0.8;
                this.scoreValue = GameConfig.baseEnemyScore * 2;
                this.color = "#f80";
                this.maxSpeed = 120;
                this.homingStrength = 80;
                break;
            case "splitter":
                this.r = GameConfig.enemyBaseRadius * 1.2;
                this.scoreValue = GameConfig.baseEnemyScore * 3;
                this.color = "#8f0";
                this.maxSpeed = 100;
                this.hasSpawned = false;
                break;
            case "fast":
                this.r = GameConfig.enemyBaseRadius * 0.6;
                this.scoreValue = GameConfig.baseEnemyScore * 1.5;
                this.color = "#0ff";
                this.maxSpeed = 300;
                break;
            case "mini":
                this.r = GameConfig.enemyBaseRadius * 0.4;
                this.scoreValue = GameConfig.baseEnemyScore * 0.5;
                this.color = "#8f8";
                this.maxSpeed = 120;
                break;
        }
    }
    
    update(dt, playerPos) {
        this.age += dt;
        
        if (this.type === "homing" && playerPos) {
            // Homing behavior
            const toPlayer = playerPos.sub(this.pos).norm();
            const currentSpeed = this.vel.len();
            const targetVel = toPlayer.mul(Math.min(currentSpeed + this.homingStrength * dt, this.maxSpeed));
            this.vel = this.vel.add(targetVel.sub(this.vel).mul(dt * 2));
        } else if (this.type === "fast") {
            // Fast enemies maintain high speed
            const currentSpeed = this.vel.len();
            if (currentSpeed < this.maxSpeed * 0.8) {
                this.vel = this.vel.norm().mul(this.maxSpeed);
            }
        }
        
        // Movement with bouncing
        const nextPos = this.pos.add(this.vel.mul(dt));
        
        // Softer bouncing with some randomness
        if (nextPos.x - this.r < 0 || nextPos.x + this.r > canvas.width) {
            this.vel.x *= -0.9 + Math.random() * 0.2;
        }
        if (nextPos.y - this.r < 0 || nextPos.y + this.r > canvas.height) {
            this.vel.y *= -0.9 + Math.random() * 0.2;
        }
        
        this.pos = this.pos.add(this.vel.mul(dt));
        this.trail.addPoint(this.pos);
        this.pulsePhase += dt * (this.type === "fast" ? 10 : 5);
        
        // Keep enemies on screen
        this.pos.x = Math.max(this.r, Math.min(canvas.width - this.r, this.pos.x));
        this.pos.y = Math.max(this.r, Math.min(canvas.height - this.r, this.pos.y));
    }
    
    draw() {
        // Draw trail with type-specific color
        this.trail.draw(this.color, this.type === "fast" ? 2 : 1);
        
        // Pulsing glow effect
        const pulse = 0.7 + 0.3 * Math.sin(this.pulsePhase);
        
        // Type-specific rendering
        if (this.type === "splitter") {
            // Draw segments for splitter
            ctx.strokeStyle = this.color;
            ctx.shadowBlur = 15 * pulse;
            ctx.shadowColor = this.color;
            ctx.lineWidth = 3;
            
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 + this.age * 2;
                const x1 = this.pos.x + Math.cos(angle) * this.r * 0.5;
                const y1 = this.pos.y + Math.sin(angle) * this.r * 0.5;
                const x2 = this.pos.x + Math.cos(angle) * this.r;
                const y2 = this.pos.y + Math.sin(angle) * this.r;
                
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        } else if (this.type === "homing") {
            // Draw triangle for homing
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 12 * pulse;
            ctx.shadowColor = this.color;
            
            const angle = Math.atan2(this.vel.y, this.vel.x);
            ctx.save();
            ctx.translate(this.pos.x, this.pos.y);
            ctx.rotate(angle);
            
            ctx.beginPath();
            ctx.moveTo(this.r, 0);
            ctx.lineTo(-this.r * 0.6, -this.r * 0.6);
            ctx.lineTo(-this.r * 0.6, this.r * 0.6);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        } else {
            // Draw circle for basic, fast, and mini enemies
            ctx.strokeStyle = this.color;
            ctx.shadowBlur = 15 * pulse;
            ctx.shadowColor = this.color;
            ctx.lineWidth = this.type === "fast" ? 3 : 2;
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.r, 0, Math.PI * 2);
            ctx.stroke();
            
            // Inner bright circle
            const alpha = this.type === "fast" ? 0.5 * pulse : 0.3 * pulse;
            ctx.fillStyle = this.color.replace(")", `, ${alpha})`).replace("#", "rgba(").replace(/(.{2})/g, (match, p1) => parseInt(p1, 16) + ",").slice(0, -1) + ")";
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.r * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.shadowBlur = 0;
    }
    
    onDestroy() {
        // Return any mini enemies to spawn
        if (this.type === "splitter" && !this.hasSpawned) {
            this.hasSpawned = true;
            const miniEnemies = [];
            for (let i = 0; i < 3; i++) {
                const angle = (i / 3) * Math.PI * 2;
                const vel = new Vec2(Math.cos(angle), Math.sin(angle)).mul(150);
                miniEnemies.push(new Enemy(this.pos, vel, "mini"));
            }
            return miniEnemies;
        }
        return [];
    }
}

class Player {
    constructor() {
        this.pos = new Vec2(canvas.width / 2, canvas.height / 2);
        this.speed = GameConfig.playerSpeed;
        this.r = GameConfig.playerRadius;
        this.fireRate = GameConfig.fireRate;
        this.cd = 0;
        this.invulnerable = 0;
        this.trail = new Trail(12);
        this.thrustPhase = 0;
        
        // Powerup system
        this.powerups = {
            triple: 0,
            laser: 0,
            shield: 0
        };
        this.shieldHealth = 0;
    }
    
    update(dt) {
        // Movement
        let dir = new Vec2(0, 0);
        
        // Keyboard movement WASD
        if (keys["KeyW"]) dir = dir.add(new Vec2(0, -1));
        if (keys["KeyS"]) dir = dir.add(new Vec2(0, 1));
        if (keys["KeyA"]) dir = dir.add(new Vec2(-1, 0));
        if (keys["KeyD"]) dir = dir.add(new Vec2(1, 0));
        
        // Gamepad left stick
        const gp = readGamepad();
        if (gp) {
            const ax = gp.axes[0], ay = gp.axes[1];
            if (Math.hypot(ax, ay) > 0.2) dir = dir.add(new Vec2(ax, ay));
        }
        
        const isMoving = dir.x || dir.y;
        if (isMoving) {
            this.pos = this.pos.add(dir.norm().mul(this.speed * dt));
            this.trail.addPoint(this.pos);
            this.thrustPhase += dt * 15;
            
            // Add thrust particles
            if (Math.random() < 0.3) {
                const thrustDir = dir.norm().mul(-1);
                const spread = 0.5;
                const thrustVel = thrustDir.add(new Vec2(
                    (Math.random() - 0.5) * spread,
                    (Math.random() - 0.5) * spread
                )).mul(80);
                
                particles.push(new Particle(
                    this.pos.add(thrustDir.mul(this.r + 2)),
                    thrustVel,
                    0.3,
                    "#0a0",
                    1
                ));
            }
        }
        
        // Keep player on screen
        this.pos.x = Math.max(this.r, Math.min(canvas.width - this.r, this.pos.x));
        this.pos.y = Math.max(this.r, Math.min(canvas.height - this.r, this.pos.y));
        
        // Shooting
        if (this.cd > 0) this.cd -= dt;
        
        let sdir = new Vec2(0, 0);
        // Keyboard arrows
        if (keys["ArrowUp"]) sdir = sdir.add(new Vec2(0, -1));
        if (keys["ArrowDown"]) sdir = sdir.add(new Vec2(0, 1));
        if (keys["ArrowLeft"]) sdir = sdir.add(new Vec2(-1, 0));
        if (keys["ArrowRight"]) sdir = sdir.add(new Vec2(1, 0));
        
        // Gamepad right stick (axes 2,3)
        if (gp) {
            const ax = gp.axes[2], ay = gp.axes[3];
            if (Math.hypot(ax, ay) > 0.25) sdir = sdir.add(new Vec2(ax, ay));
        }
        
        if ((sdir.x || sdir.y) && this.cd <= 0) {
            const shotDir = sdir.norm();
            const shotOrigin = this.pos.add(shotDir.mul(this.r + 4));
            
            if (this.powerups.triple > 0) {
                // Triple shot
                const spread = Math.PI / 8; // 22.5 degrees
                for (let i = -1; i <= 1; i++) {
                    const angle = Math.atan2(shotDir.y, shotDir.x) + i * spread;
                    const bulletDir = new Vec2(Math.cos(angle), Math.sin(angle));
                    bullets.push(new Bullet(shotOrigin, bulletDir.mul(GameConfig.bulletSpeed)));
                }
            } else if (this.powerups.laser > 0) {
                // Laser shot (faster, piercing bullets)
                bullets.push(new LaserBullet(shotOrigin, shotDir.mul(GameConfig.bulletSpeed * 1.5)));
            } else {
                // Normal shot
                bullets.push(new Bullet(shotOrigin, shotDir.mul(GameConfig.bulletSpeed)));
            }
            
            this.cd = this.fireRate;
            
            // Muzzle flash effect
            spawnBurst(shotOrigin, "#88f", 4, "spark");
            
            // Play shoot sound
            audioSystem.playSound('shoot', 0.3);
        }
        
        // Update powerup timers
        Object.keys(this.powerups).forEach(key => {
            if (this.powerups[key] > 0) {
                this.powerups[key] -= dt;
                if (this.powerups[key] <= 0) {
                    this.powerups[key] = 0;
                }
            }
        });
        
        // Update invulnerability
        if (this.invulnerable > 0) {
            this.invulnerable -= dt;
        }
    }
    
    draw() {
        // Draw movement trail
        if (this.trail.points.length > 0) {
            this.trail.draw("#0a0", 2);
        }
        
        // Flash when invulnerable
        if (this.invulnerable > 0 && Math.floor(this.invulnerable * 10) % 2 === 0) {
            ctx.fillStyle = "#0f0";
            ctx.globalAlpha = 0.5;
        } else {
            ctx.fillStyle = "#0f0";
            ctx.globalAlpha = 1;
        }
        
        // Player with glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#0f0";
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Draw shield if active
        if (this.shieldHealth > 0) {
            const shieldPulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.01);
            ctx.strokeStyle = "#0ff";
            ctx.shadowBlur = 15 * shieldPulse;
            ctx.shadowColor = "#0ff";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.r + 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        
        ctx.globalAlpha = 1;
    }
    
    hit() {
        if (this.invulnerable <= 0) {
            // Check shield first
            if (this.shieldHealth > 0) {
                this.shieldHealth--;
                this.invulnerable = GameConfig.invulnerabilityTime * 0.5; // Shorter invulnerability with shield
                spawnExplosion(this.pos, "#0ff");
                return false; // Shield absorbed the hit
            }
            
            this.invulnerable = GameConfig.invulnerabilityTime;
            return true;
        }
        return false;
    }
    
    addPowerup(type) {
        switch (type) {
            case "triple":
                this.powerups.triple = GameConfig.powerupDuration;
                break;
            case "laser":
                this.powerups.laser = GameConfig.powerupDuration;
                break;
            case "shield":
                this.powerups.shield = GameConfig.powerupDuration;
                this.shieldHealth = 3; // Shield can absorb 3 hits
                break;
        }
    }
}

// ===== Game State =====
let player, bullets, enemies, particles, powerups, spawnTimer, score, lives, bombs, lastTs;
let currentSpawnInterval;
let gameState = "playing"; // "playing", "gameover", "paused"
let highScore = 0;
let comboCount = 0;
let comboTimer = 0;
let scoreMultiplier = 1;
let bombEffect = null;

function reset() {
    player = new Player();
    bullets = [];
    enemies = [];
    particles = [];
    powerups = [];
    spawnTimer = 0;
    score = 0;
    lives = GameConfig.startingLives;
    bombs = GameConfig.startingBombs;
    currentSpawnInterval = GameConfig.enemySpawnBaseInterval;
    gameState = "playing";
    comboCount = 0;
    comboTimer = 0;
    scoreMultiplier = 1;
    bombEffect = null;
    
    // Load high score from localStorage
    loadHighScore();
    updateUI();
    
    // Start BGM
    audioSystem.startBGM();
}

function loadHighScore() {
    const saved = localStorage.getItem('geoshooter-highscore');
    if (saved) {
        highScore = parseInt(saved, 10) || 0;
    }
}

function saveHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('geoshooter-highscore', highScore.toString());
        return true; // New high score
    }
    return false;
}

function updateUI() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = lives;
    document.getElementById("bombs").textContent = bombs;
    document.getElementById("highscore").textContent = highScore;
    
    // Update combo display
    const comboDisplay = document.getElementById("combo-display");
    if (comboCount > 3) {
        comboDisplay.style.display = "block";
        document.getElementById("combo").textContent = comboCount;
        document.getElementById("multiplier").textContent = scoreMultiplier.toFixed(1);
    } else {
        comboDisplay.style.display = "none";
    }
}

function getDifficultyMultiplier() {
    // Smoother difficulty curve
    return 1 + Math.floor(score / GameConfig.scoreMultiplierDecay) * 0.1;
}

function spawnEnemy() {
    const edge = Math.floor(Math.random() * 4);
    let pos, vel;
    const speedMult = getDifficultyMultiplier();
    const baseSpeed = GameConfig.enemyBaseSpeed * speedMult;
    
    // Determine enemy type based on score
    let enemyType = "basic";
    const rand = Math.random();
    
    if (score > 500) {
        if (rand < 0.15) enemyType = "splitter";
        else if (rand < 0.35) enemyType = "homing";
        else if (rand < 0.55) enemyType = "fast";
        else enemyType = "basic";
    } else if (score > 200) {
        if (rand < 0.2) enemyType = "homing";
        else if (rand < 0.4) enemyType = "fast";
        else enemyType = "basic";
    } else if (score > 100) {
        if (rand < 0.3) enemyType = "fast";
        else enemyType = "basic";
    }
    
    switch (edge) {
        case 0: // Top
            pos = new Vec2(Math.random() * canvas.width, 0);
            vel = new Vec2((Math.random() - 0.5) * baseSpeed, baseSpeed * 0.5 + Math.random() * baseSpeed * 0.5);
            break;
        case 1: // Right
            pos = new Vec2(canvas.width, Math.random() * canvas.height);
            vel = new Vec2(-baseSpeed * 0.5 - Math.random() * baseSpeed * 0.5, (Math.random() - 0.5) * baseSpeed);
            break;
        case 2: // Bottom
            pos = new Vec2(Math.random() * canvas.width, canvas.height);
            vel = new Vec2((Math.random() - 0.5) * baseSpeed, -baseSpeed * 0.5 - Math.random() * baseSpeed * 0.5);
            break;
        default: // Left
            pos = new Vec2(0, Math.random() * canvas.height);
            vel = new Vec2(baseSpeed * 0.5 + Math.random() * baseSpeed * 0.5, (Math.random() - 0.5) * baseSpeed);
    }
    
    enemies.push(new Enemy(pos, vel, enemyType));
}

// ===== Bomb System =====
class BombEffect {
    constructor() {
        this.radius = 0;
        this.maxRadius = Math.max(canvas.width, canvas.height) * 0.7;
        this.duration = 1.0;
        this.age = 0;
        this.waves = [];
        
        // Create multiple expanding waves
        for (let i = 0; i < 3; i++) {
            this.waves.push({
                delay: i * 0.1,
                started: false
            });
        }
    }
    
    update(dt) {
        this.age += dt;
        
        // Update main expansion
        if (this.age <= this.duration) {
            const progress = this.age / this.duration;
            this.radius = this.maxRadius * Math.pow(progress, 0.5); // Square root for smooth expansion
        }
        
        return this.age < this.duration;
    }
    
    draw() {
        const center = player.pos;
        
        // Draw multiple expanding rings
        for (let i = 0; i < this.waves.length; i++) {
            const wave = this.waves[i];
            const waveAge = this.age - wave.delay;
            
            if (waveAge > 0) {
                const waveProgress = Math.min(waveAge / this.duration, 1);
                const waveRadius = this.maxRadius * Math.pow(waveProgress, 0.5);
                const alpha = 1 - waveProgress;
                
                ctx.strokeStyle = `rgba(255, 255, 0, ${alpha * 0.8})`;
                ctx.shadowBlur = 20 * alpha;
                ctx.shadowColor = "#ff0";
                ctx.lineWidth = 8 * alpha;
                ctx.beginPath();
                ctx.arc(center.x, center.y, waveRadius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        }
        
        // Draw filled blast area
        const alpha = Math.max(0, 1 - this.age / this.duration);
        ctx.fillStyle = `rgba(255, 255, 0, ${alpha * 0.1})`;
        ctx.beginPath();
        ctx.arc(center.x, center.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    getRadius() {
        return this.radius;
    }
}

function useBomb() {
    if (bombs <= 0 || bombEffect) return false;
    
    bombs--;
    updateUI();
    
    // Create bomb effect
    bombEffect = new BombEffect();
    
    // Destroy all enemies in range and award points
    let destroyedCount = 0;
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const distance = player.pos.sub(enemy.pos).len();
        
        if (distance <= bombEffect.maxRadius) {
            const destroyedEnemy = enemies.splice(i, 1)[0];
            score += destroyedEnemy.scoreValue;
            destroyedCount++;
            
            // Create explosion effect
            spawnExplosion(destroyedEnemy.pos, destroyedEnemy.color);
            
            // Handle splitter enemies
            const newEnemies = destroyedEnemy.onDestroy();
            enemies.push(...newEnemies);
        }
    }
    
    // Bonus points for multi-kill
    if (destroyedCount > 5) {
        score += destroyedCount * 5; // Bonus points
    }
    
    updateUI();
    
    // Play bomb sound
    audioSystem.playSound('gameOver', 0.3); // Reuse game over sound as bomb sound
    
    return true;
}

function gameOverScreen() {
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const isNewHighScore = saveHighScore();
    
    ctx.fillStyle = "#f00";
    ctx.font = "48px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 60);
    
    ctx.font = "20px sans-serif";
    ctx.fillStyle = "#fff";
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 - 20);
    
    if (isNewHighScore) {
        ctx.fillStyle = "#ff0";
        ctx.font = "bold 24px sans-serif";
        ctx.fillText("NEW HIGH SCORE!", canvas.width / 2, canvas.height / 2 + 10);
    } else {
        ctx.fillStyle = "#999";
        ctx.font = "18px sans-serif";
        ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 10);
    }
    
    ctx.font = "24px sans-serif";
    ctx.fillStyle = "#0f0";
    ctx.fillText("Press R / Start to Restart", canvas.width / 2, canvas.height / 2 + 60);
}

function pauseScreen() {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0f0";
    ctx.font = "48px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
    ctx.font = "24px sans-serif";
    ctx.fillText("Press P / Select to Resume", canvas.width / 2, canvas.height / 2 + 40);
}

function update(dt) {
    if (gameState !== "playing") return gameState === "gameover" ? false : true;
    
    player.update(dt);
    bullets.forEach(b => b.update(dt));
    enemies.forEach(e => e.update(dt, player.pos));
    particles.forEach(p => p.update(dt));
    powerups.forEach(p => p.update(dt));
    
    // Update bomb effect
    if (bombEffect) {
        if (!bombEffect.update(dt)) {
            bombEffect = null;
        }
    }
    
    // Collisions bullet-enemy
    outer: for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        for (let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];
            if (e.pos.sub(b.pos).len() < e.r + b.r) {
                const destroyedEnemy = enemies.splice(i, 1)[0];
                
                // Handle piercing bullets
                let removeBullet = true;
                if (b.piercing && b.hit) {
                    removeBullet = b.hit(); // LaserBullet handles hit counting
                }
                
                if (removeBullet) {
                    bullets.splice(j, 1);
                }
                
                // Combo system
                comboCount++;
                comboTimer = 3.0; // Reset combo timer
                scoreMultiplier = 1 + Math.floor(comboCount / 5) * 0.5; // Increase multiplier every 5 combo
                
                const points = Math.floor(destroyedEnemy.scoreValue * scoreMultiplier);
                score += points;
                updateUI();
                spawnExplosion(destroyedEnemy.pos, destroyedEnemy.color);
                
                // Play enemy hit sound
                audioSystem.playSound('enemyHit', 0.4);
                
                // Handle enemy destruction effects (e.g., splitter spawning mini enemies)
                const newEnemies = destroyedEnemy.onDestroy();
                enemies.push(...newEnemies);
                
                // Chance to drop powerup or bomb
                if (Math.random() < GameConfig.powerupDropChance) {
                    if (bombs < GameConfig.maxBombs && Math.random() < 0.2) {
                        // 20% chance for bomb when possible
                        bombs++;
                        updateUI();
                        spawnExplosion(destroyedEnemy.pos, "#ff0"); // Yellow explosion for bomb pickup
                    } else {
                        const powerupTypes = ["triple", "laser", "shield"];
                        const randomType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
                        powerups.push(new Powerup(destroyedEnemy.pos, randomType));
                    }
                }
                
                continue outer;
            }
        }
        
        // Player-enemy collision
        if (player.pos.sub(e.pos).len() < e.r + player.r && player.hit()) {
            enemies.splice(i, 1);
            lives--;
            updateUI();
            spawnExplosion(player.pos, "#f00", "large"); // Bigger explosion for player hit
            
            // Play player hit sound
            audioSystem.playSound('playerHit', 0.6);
            
            if (lives <= 0) {
                gameState = "gameover";
                audioSystem.stopBGM();
                audioSystem.playSound('gameOver', 0.8);
                return false;
            }
        }
    }
    
    // Player-powerup collisions
    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        if (player.pos.sub(p.pos).len() < player.r + p.r) {
            player.addPowerup(p.type);
            powerups.splice(i, 1);
            spawnExplosion(p.pos, p.color);
            
            // Play powerup sound
            audioSystem.playSound('powerup', 0.5);
        }
    }
    
    // Update combo timer
    if (comboTimer > 0) {
        comboTimer -= dt;
        if (comboTimer <= 0) {
            comboCount = 0;
            scoreMultiplier = 1;
            updateUI();
        }
    }
    
    // Clean up off-screen bullets, dead particles, and expired powerups
    bullets = bullets.filter(b => !b.offScreen());
    particles = particles.filter(p => p.life > 0);
    powerups = powerups.filter(p => p.update(dt));
    
    // Enemy spawning with smoother difficulty curve
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
        spawnEnemy();
        // Gradually decrease spawn interval
        currentSpawnInterval = Math.max(
            GameConfig.enemySpawnMinInterval,
            currentSpawnInterval * GameConfig.enemySpawnIntervalDecay
        );
        spawnTimer = currentSpawnInterval;
    }
    
    return true;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw game elements
    particles.forEach(p => p.draw());
    powerups.forEach(p => p.draw());
    player.draw();
    bullets.forEach(b => b.draw());
    enemies.forEach(e => e.draw());
    
    // Draw bomb effect
    if (bombEffect) {
        bombEffect.draw();
    }
    
    // Draw difficulty indicator
    ctx.fillStyle = "#666";
    ctx.font = "12px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`Difficulty: ${getDifficultyMultiplier().toFixed(1)}x`, 10, canvas.height - 10);
    
    // Draw active powerups
    let powerupY = 30;
    ctx.fillStyle = "#fff";
    ctx.font = "12px monospace";
    ctx.textAlign = "left";
    
    if (player.powerups.triple > 0) {
        ctx.fillText(`Triple Shot: ${Math.ceil(player.powerups.triple)}s`, 10, powerupY);
        powerupY += 15;
    }
    if (player.powerups.laser > 0) {
        ctx.fillText(`Laser: ${Math.ceil(player.powerups.laser)}s`, 10, powerupY);
        powerupY += 15;
    }
    if (player.powerups.shield > 0) {
        ctx.fillText(`Shield: ${player.shieldHealth} hits`, 10, powerupY);
        powerupY += 15;
    }
}

function loop(ts) {
    const dt = (ts - lastTs) / 1000;
    lastTs = ts;
    
    if (gameState === "paused") {
        draw();
        pauseScreen();
    } else if (update(dt)) {
        draw();
    } else {
        draw();
        gameOverScreen();
    }
    
    requestAnimationFrame(loop);
}

// Input handling
window.addEventListener("keydown", e => {
    if (e.code === "KeyR" && gameState === "gameover") {
        reset();
    } else if (e.code === "KeyP" && (gameState === "playing" || gameState === "paused")) {
        if (gameState === "playing") {
            gameState = "paused";
            audioSystem.setBGMVolume(0.1); // Lower BGM volume when paused
        } else {
            gameState = "playing";
            audioSystem.setBGMVolume(0.3); // Restore BGM volume
        }
    } else if (e.code === "Escape" && gameState === "paused") {
        gameState = "playing";
        audioSystem.setBGMVolume(0.3);
    } else if (e.code === "Space" && gameState === "playing") {
        useBomb();
    }
});

let lastGamepadButtons = {};

function pollGamepad() {
    const gp = readGamepad();
    if (gp) {
        // Check for button presses (not held)
        const currentButtons = {};
        for (let i = 0; i < gp.buttons.length; i++) {
            currentButtons[i] = gp.buttons[i].pressed;
        }
        
        if (gameState === "gameover" && gp.buttons[9].pressed && !lastGamepadButtons[9]) {
            reset();
        } else if ((gameState === "playing" || gameState === "paused") && gp.buttons[8].pressed && !lastGamepadButtons[8]) {
            // Select button for pause
            if (gameState === "playing") {
                gameState = "paused";
                audioSystem.setBGMVolume(0.1);
            } else {
                gameState = "playing";
                audioSystem.setBGMVolume(0.3);
            }
        } else if (gameState === "playing" && (gp.buttons[0].pressed || gp.buttons[1].pressed) && 
                   !(lastGamepadButtons[0] || lastGamepadButtons[1])) {
            // A or B button for bomb
            useBomb();
        }
        
        lastGamepadButtons = currentButtons;
    }
    requestAnimationFrame(pollGamepad);
}

// Initialize audio system and start game
async function startGame() {
    await audioSystem.init();
    reset();
    lastTs = performance.now();
    requestAnimationFrame(loop);
    pollGamepad();
}

// Handle user interaction to start audio
let gameStarted = false;
function handleFirstInteraction() {
    if (!gameStarted) {
        gameStarted = true;
        startGame();
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('keydown', handleFirstInteraction);
        document.removeEventListener('touchstart', handleFirstInteraction);
    }
}

// Wait for user interaction to start
document.addEventListener('click', handleFirstInteraction);
document.addEventListener('keydown', handleFirstInteraction);
document.addEventListener('touchstart', handleFirstInteraction);

// Show instructions
document.body.addEventListener('DOMContentLoaded', () => {
    const instructions = document.createElement('div');
    instructions.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #fff;
        font-family: monospace;
        text-align: center;
        z-index: 1000;
        background: rgba(0,0,0,0.8);
        padding: 20px;
        border: 2px solid #0f0;
    `;
    instructions.innerHTML = `
        <h2>GeoShooter - Twin Stick Arena</h2>
        <p>WASD: Move | Arrow Keys: Shoot</p>
        <p>SPACE: Bomb | P: Pause | R: Restart (Game Over)</p>
        <p>Gamepad supported</p>
        <p><strong>Click anywhere to start!</strong></p>
    `;
    document.body.appendChild(instructions);
    
    function removeInstructions() {
        if (instructions.parentNode) {
            instructions.parentNode.removeChild(instructions);
        }
    }
    
    document.addEventListener('click', removeInstructions);
    document.addEventListener('keydown', removeInstructions);
    document.addEventListener('touchstart', removeInstructions);
});