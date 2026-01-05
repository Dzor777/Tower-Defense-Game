export default class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterVolume = 0.3;
        this.enabled = true;

        // Audio throttling
        this.lastHitTime = 0;
        this.lastDeathTime = 0;
        this.hitCooldown = 0.08; // Min 80ms between hit sounds
        this.deathCooldown = 0.1; // Min 100ms between death sounds
    }

    playEnemyDeath() {
        if (!this.enabled) return;
        this.resumeContext();

        const now = this.ctx.currentTime;
        if (now - this.lastDeathTime < this.deathCooldown) return;
        this.lastDeathTime = now;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        // "Thump" body fall sound
        osc.type = 'triangle'; // Triangle gives a bit more "meat" than sine but less harsh than saw/square
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playEnemyHit() {
        if (!this.enabled) return;
        this.resumeContext();

        const now = this.ctx.currentTime;
        if (now - this.lastHitTime < this.hitCooldown) return;
        this.lastHitTime = now;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        // "Thwack" impact sound
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(this.masterVolume * 0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    resumeContext() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
}
