export default class Projectile {
    constructor(x, y, target, damage = 10, soundManager) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.soundManager = soundManager;
        this.speed = 0.4;
        this.markedForDeletion = false;
        this.radius = 4;
    }

    update(deltaTime) {
        if (!this.target || this.target.markedForDeletion) {
            this.markedForDeletion = true;
            return;
        }

        const dx = this.target.x + 16 - this.x; // +16 to aim for center
        const dy = this.target.y + 16 - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 10 || (this.speed * deltaTime) >= dist) { // Hit
            this.target.takeDamage(this.damage);
            if (this.soundManager) this.soundManager.playEnemyHit();
            this.markedForDeletion = true;
        } else {
            this.x += (dx / dist) * this.speed * deltaTime;
            this.y += (dy / dist) * this.speed * deltaTime;
        }
    }

    draw(renderer) {
        const ctx = renderer.ctx;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#f1c40f'; // Goldish bullet
        ctx.fill();
        ctx.closePath();
    }
}
