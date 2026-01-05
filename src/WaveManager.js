import Enemy from './Enemy.js';

export default class WaveManager {
    constructor(waypoints) {
        this.waypoints = waypoints;
        this.enemies = [];
        this.waveNumber = 1;
        this.level = 1;
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1000;
        this.waveInProgress = false;

        this.waves = {
            1: { count: 5, interval: 1500 },
            2: { count: 10, interval: 1200 },
            3: { count: 15, interval: 1000 },
            4: { count: 25, interval: 800 },
            5: { count: 50, interval: 500 }
        };
    }

    startWave(gameEnemiesList) {
        if (this.waveInProgress) return;

        this.enemies = gameEnemiesList;
        const rawConfig = this.waves[this.waveNumber] || { count: 40 + this.waveNumber * 5, interval: 400 };
        const totalToSpawn = Math.min(50, rawConfig.count);

        this.spawnQueue = [];

        if (this.waveNumber >= 8) {
            // Percent-based logic for Wave 8+
            // Shift Basic (50% -> 20%) and Huge (20% -> 50%) by Wave 12
            let shift = (Math.max(0, this.waveNumber - 8) * 7.5); // 30% shift over 4 waves
            let basicPct = 50 - shift;
            let hugePct = 20 + shift;
            let bigPct = 30;

            if (basicPct < 20) basicPct = 20;
            if (hugePct > 50) hugePct = 50;

            const basicCount = Math.floor(totalToSpawn * (basicPct / 100));
            const bigCount = Math.floor(totalToSpawn * (bigPct / 100));
            const hugeCount = totalToSpawn - basicCount - bigCount;

            for (let i = 0; i < basicCount; i++) this.spawnQueue.push('basic');
            for (let i = 0; i < bigCount; i++) this.spawnQueue.push('big');
            for (let i = 0; i < hugeCount; i++) this.spawnQueue.push('huge');

            this.shuffleQueue();

        } else if (this.waveNumber === 7) {
            for (let i = 0; i < totalToSpawn; i++) this.spawnQueue.push('basic');
            for (let i = 0; i < 5; i++) {
                const index = Math.floor(Math.random() * this.spawnQueue.length);
                this.spawnQueue.splice(index, 0, 'big');
            }
        } else if (this.waveNumber >= 5) {
            for (let i = 0; i < totalToSpawn; i++) this.spawnQueue.push('basic');
            for (let i = 0; i < 3; i++) {
                const index = Math.floor(Math.random() * this.spawnQueue.length);
                this.spawnQueue.splice(index, 0, 'big');
            }
            if (Math.random() < 0.5) {
                const index = Math.floor(Math.random() * this.spawnQueue.length);
                this.spawnQueue.splice(index, 0, 'huge');
            }
        } else {
            for (let i = 0; i < totalToSpawn; i++) this.spawnQueue.push('basic');
        }

        this.spawnInterval = rawConfig.interval;
        this.waveInProgress = true;
        this.spawnTimer = 0;
        console.log(`Starting Level ${this.level} Wave ${this.waveNumber}. Queue size: ${this.spawnQueue.length}`);
    }

    shuffleQueue() {
        for (let i = this.spawnQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.spawnQueue[i], this.spawnQueue[j]] = [this.spawnQueue[j], this.spawnQueue[i]];
        }
    }

    update(deltaTime) {
        if (!this.waveInProgress) return;

        if (this.spawnQueue.length > 0) {
            this.spawnTimer -= deltaTime;
            if (this.spawnTimer <= 0) {
                this.spawnEnemy();
                this.spawnTimer = this.spawnInterval;
            }
        } else {
            if (this.enemies.length === 0) {
                this.waveComplete();
            }
        }
    }

    spawnEnemy() {
        if (this.spawnQueue.length === 0) return;
        const type = this.spawnQueue.shift();
        this.enemies.push(new Enemy(this.waypoints, type, this.level));
    }

    waveComplete() {
        this.waveInProgress = false;

        if (this.waveNumber === 12) {
            // Level Transition (Infinite Levels)
            this.level++;
            this.waveNumber = 1;
            if (this.onLevelComplete) this.onLevelComplete(this.level);
        } else {
            this.waveNumber++;
        }

        this.updateUI();
    }

    updateUI() {
        const waveDisplay = document.getElementById('wave-display');
        if (waveDisplay) {
            waveDisplay.innerText = `Lvl ${this.level} Wave: ${this.waveNumber}`;
        }
    }
}
