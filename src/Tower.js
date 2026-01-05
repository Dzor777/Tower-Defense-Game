import Projectile from './Projectile.js';

export default class Tower {
    constructor(x, y) {
        this.x = x; // Grid coordinates (col)
        this.y = y; // Grid coordinates (row)
        this.width = 32;
        this.height = 32;
        this.range = 150; // pixels
        this.damageLevel = 1;
        this.lastShotTime = 0;
        this.cost = 50;
    }

    update(deltaTime, enemies, projectiles, currentTime, currentCooldown, currentDamage, soundManager, currentRange) {
        if (currentTime - this.lastShotTime < currentCooldown) return;

        // Find target
        const target = this.findTarget(enemies, currentRange);
        if (target) {
            this.shoot(target, projectiles, currentDamage, soundManager);
            this.lastShotTime = currentTime;
        }
    }

    findTarget(enemies, range = 150) {
        // Filter enemies in range and calculate stats for sorting
        const inRange = [];

        for (const enemy of enemies) {
            // Calculate distance to enemy center
            const towerCenterX = this.x * 32 + 16;
            const towerCenterY = this.y * 32 + 16;
            const enemyCenterX = enemy.x + 16;
            const enemyCenterY = enemy.y + 16;

            const dx = enemyCenterX - towerCenterX;
            const dy = enemyCenterY - towerCenterY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= range) {
                const distToFinish = enemy.getDistanceToFinish();
                const totalDist = enemy.getTotalDistance();
                const pctTraveled = (totalDist - distToFinish) / totalDist;
                const isSpecialPriority = (enemy.type === 'big' || enemy.type === 'huge') && pctTraveled > 0.55;

                inRange.push({
                    enemy: enemy,
                    distFromTower: dist,
                    health: enemy.health,
                    distToFinish: distToFinish,
                    isSpecialPriority: isSpecialPriority
                });
            }
        }

        if (inRange.length === 0) return null;

        // Sort based on priority: Special Priority Units > Lowest HP > Closest to Castle
        inRange.sort((a, b) => {
            // Priority 0: Special Priority (Big/Huge > 55% traveled)
            if (a.isSpecialPriority !== b.isSpecialPriority) {
                return b.isSpecialPriority ? 1 : -1;
            }

            // Priority 1: Lowest HP
            if (a.health !== b.health) {
                return a.health - b.health;
            }

            // Priority 2: Closest to Castle (Smallest distance left)
            if (a.distToFinish !== b.distToFinish) {
                return a.distToFinish - b.distToFinish;
            }

            // Priority 3: Almost out of range (Largest distance from tower)
            return b.distFromTower - a.distFromTower;
        });

        return inRange[0].enemy;
    }

    shoot(target, projectiles, damage, soundManager) {
        // Spawn projectile from center of tower
        const pX = this.x * 32 + 16;
        const pY = this.y * 32 + 16;
        projectiles.push(new Projectile(pX, pY, target, damage, soundManager));
    }

    draw(renderer) {
        const drawSize = 48; // 50% larger than 32
        const offset = (32 - drawSize) / 2;

        renderer.drawImage('basic_tower',
            this.x * 32 + offset,
            this.y * 32 + offset,
            drawSize,
            drawSize
        );
    }
}
