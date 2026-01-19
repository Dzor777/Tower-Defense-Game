export default class Enemy {
    constructor(waypoints, type = 'basic', level = 1) {
        this.waypoints = waypoints;
        this.waypointIndex = 0;
        this.x = waypoints[0].x;
        this.y = waypoints[0].y;
        this.type = type;
        this.level = level;

        this.markedForDeletion = false;

        // Base defaults
        this.speed = 0.1;
        this.health = 30;
        this.maxHealth = 30;
        this.width = 32;
        this.height = 32;
        this.reward = 10;

        // Type adjustments
        if (type === 'big') {
            this.health = 50;
            this.maxHealth = 50;
            this.width = 40;
            this.height = 40;
            this.speed = 0.12; // 20% faster than basic
            this.reward = 15;
        } else if (type === 'huge') {
            this.health = 100;
            this.maxHealth = 100;
            this.width = 50;
            this.height = 50;
            this.speed = 0.14; // 40% faster than basic
            this.reward = 20;
        }

        // Apply Manual HP Sets
        if (this.level >= 4) {
            // Level 4+ (New Game+ / The Void)
            // Scaling: Base Orc Stats * 1.3^(Level - 3)
            const multiplier = Math.pow(1.3, this.level - 3);

            if (this.type === 'basic') this.health = Math.round(40 * multiplier);
            else if (this.type === 'big') this.health = Math.round(90 * multiplier);
            else if (this.type === 'huge') this.health = Math.round(180 * multiplier);

        } else if (this.level === 3) {
            // Orcs (Level 3)
            if (this.type === 'basic') this.health = 40;
            else if (this.type === 'big') this.health = 90;
            else if (this.type === 'huge') this.health = 180;
        } else if (this.level === 2) {
            // Goblins (Level 2)
            if (this.type === 'basic') this.health = 35;
            else if (this.type === 'big') this.health = 75;
            else if (this.type === 'huge') this.health = 150;
        }

        // Apply Level-based Gold Scaling (+5g per level)
        this.reward += (this.level - 1) * 5;

        this.maxHealth = this.health;
        this.totalDistance = this.calculateTotalDistance();
    }

    update(deltaTime) {
        if (this.markedForDeletion) return;
        if (this.waypointIndex >= this.waypoints.length - 1) {
            this.reachedEnd();
            return;
        }

        const target = this.waypoints[this.waypointIndex + 1];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 2) {
            this.x = target.x;
            this.y = target.y;
            this.waypointIndex++;
        } else {
            this.x += (dx / dist) * this.speed * deltaTime;
            this.y += (dy / dist) * this.speed * deltaTime;
        }
    }

    drawBody(renderer) {
        const ctx = renderer.ctx;

        // Huge/Big get color tints if no special asset
        if (this.type === 'huge') {
            ctx.filter = 'hue-rotate(90deg) brightness(0.8)';
        } else if (this.type === 'big') {
            ctx.filter = 'hue-rotate(-45deg)';
        }

        let enemyAsset = 'basic_enemy';
        if (this.level === 2) enemyAsset = 'goblin';
        if (this.level >= 3) enemyAsset = 'orc';

        renderer.drawImage(enemyAsset, this.x, this.y, this.width, this.height);
        ctx.filter = 'none';
    }

    drawHealthBar(renderer) {
        const hpPercent = this.health / this.maxHealth;
        const ctx = renderer.ctx;

        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y - 10, this.width, 5);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x, this.y - 10, this.width * hpPercent, 5);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.markedForDeletion = true;
            return true;
        }
        return false;
    }

    getDistanceToFinish() {
        if (this.waypointIndex >= this.waypoints.length - 1) return 0;
        let distance = 0;
        const next = this.waypoints[this.waypointIndex + 1];
        const dx = next.x - this.x;
        const dy = next.y - this.y;
        distance += Math.sqrt(dx * dx + dy * dy);

        for (let i = this.waypointIndex + 1; i < this.waypoints.length - 1; i++) {
            const p1 = this.waypoints[i];
            const p2 = this.waypoints[i + 1];
            distance += Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        }
        return distance;
    }

    getTotalDistance() {
        return this.totalDistance;
    }

    calculateTotalDistance() {
        let distance = 0;
        for (let i = 0; i < this.waypoints.length - 1; i++) {
            const p1 = this.waypoints[i];
            const p2 = this.waypoints[i + 1];
            distance += Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        }
        return distance;
    }

    reachedEnd() {
        this.markedForDeletion = true;
    }
}
