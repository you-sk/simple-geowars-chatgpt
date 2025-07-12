import Vec2 from './Vec2.js';
import { Trail } from './Bullet.js';

/**
 * Enemy class for various enemy types
 */
class Enemy {
    constructor(pos, vel, type = "basic", gameConfig) {
        this.pos = pos;
        this.vel = vel;
        this.type = type;
        this.trail = new Trail(type === "fast" ? 15 : 10);
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.age = 0;
        
        // Default config values if not provided
        const config = gameConfig || {
            enemyBaseRadius: 12,
            baseEnemyScore: 10
        };
        
        // Type-specific properties
        switch (type) {
            case "basic":
                this.r = config.enemyBaseRadius;
                this.scoreValue = config.baseEnemyScore;
                this.color = "#f0f";
                this.maxSpeed = 150;
                break;
            case "homing":
                this.r = config.enemyBaseRadius * 0.8;
                this.scoreValue = config.baseEnemyScore * 2;
                this.color = "#f80";
                this.maxSpeed = 120;
                this.homingStrength = 80;
                break;
            case "splitter":
                this.r = config.enemyBaseRadius * 1.2;
                this.scoreValue = config.baseEnemyScore * 3;
                this.color = "#8f0";
                this.maxSpeed = 100;
                this.hasSpawned = false;
                break;
            case "fast":
                this.r = config.enemyBaseRadius * 0.6;
                this.scoreValue = config.baseEnemyScore * 1.5;
                this.color = "#0ff";
                this.maxSpeed = 300;
                break;
            case "mini":
                this.r = config.enemyBaseRadius * 0.4;
                this.scoreValue = config.baseEnemyScore * 0.5;
                this.color = "#8f8";
                this.maxSpeed = 120;
                break;
        }
    }
    
    update(dt, playerPos, canvas) {
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
        if (canvas && (nextPos.x - this.r < 0 || nextPos.x + this.r > canvas.width)) {
            this.vel.x *= -0.9 + Math.random() * 0.2;
        }
        if (canvas && (nextPos.y - this.r < 0 || nextPos.y + this.r > canvas.height)) {
            this.vel.y *= -0.9 + Math.random() * 0.2;
        }
        
        this.pos = this.pos.add(this.vel.mul(dt));
        this.trail.addPoint(this.pos);
        this.pulsePhase += dt * (this.type === "fast" ? 10 : 5);
        
        // Keep enemies on screen
        if (canvas) {
            this.pos.x = Math.max(this.r, Math.min(canvas.width - this.r, this.pos.x));
            this.pos.y = Math.max(this.r, Math.min(canvas.height - this.r, this.pos.y));
        }
    }
    
    draw(ctx) {
        // Draw trail with type-specific color
        this.trail.draw(ctx, this.color, this.type === "fast" ? 2 : 1);
        
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

export default Enemy;