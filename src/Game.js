import Renderer from './Renderer.js';
import Map from './Map.js';
import WaveManager from './WaveManager.js';
import Tower from './Tower.js';
import DebugManager from './DebugManager.js';
import SoundManager from './SoundManager.js';

export default class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.lastTime = 0;

        this.renderer = new Renderer(this.ctx);
        this.map = new Map(this.renderer, this.width, this.height, 32);
        this.debugManager = new DebugManager(this);
        this.soundManager = new SoundManager();

        // Game Entities Lists
        this.enemies = [];
        this.towers = [];
        this.projectiles = [];

        this.waveManager = new WaveManager(this.map.waypoints);

        this.state = {
            gold: 150,
            lives: 20,
            wave: 1,
            isRunning: false,
            // Build Mode State
            placingTower: false,
            selectedTowerCost: 50,
            maxTowers: 15,
            mouseX: 0,
            mouseY: 0,
            // Global Upgrade State - Fire Rate
            towerLevel: 1,
            maxTowerLevel: 15,
            baseCooldown: 2000,
            targetCooldown: 500,
            // Global Upgrade State - Damage
            damageLevel: 1,
            maxDamageLevel: 10,
            baseDamage: 10,
            // Global Upgrade State - Range
            rangeLevel: 1,
            maxRangeLevel: 3,
            baseRange: 150,

            baseUpgradeCost: 50,
            upgradeIncrement: 25,

            level: 1,
            maxTowers: 15,

            // Castle damage effect
            castleDamageFlash: 0
        };

        this.waveManager.onLevelComplete = (newLevel) => {
            this.handleLevelTransition(newLevel);
        };

        this.waveManager.onGameComplete = () => {
            this.handleGameComplete();
        };

        this.bindEvents();
    }

    bindEvents() {
        // Start Wave Button
        const startBtn = document.getElementById('start-wave-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.waveManager.startWave(this.enemies);
            });
        }

        // Build Menu Button
        const towerBtn = document.getElementById('btn-basic-tower');
        if (towerBtn) {
            towerBtn.addEventListener('click', () => {
                this.state.placingTower = !this.state.placingTower;
                if (this.state.placingTower) {
                    towerBtn.classList.add('selected');
                } else {
                    towerBtn.classList.remove('selected');
                }
            });
        }
        // Level Selection
        const lvl1Btn = document.getElementById('select-lvl-1');
        const lvl2Btn = document.getElementById('select-lvl-2');
        const lvl3Btn = document.getElementById('select-lvl-3');
        const selector = document.getElementById('level-selector');

        if (lvl1Btn && selector) {
            lvl1Btn.addEventListener('click', () => {
                selector.style.display = 'none';
                this.initLevel(1);
            });
        }

        if (lvl2Btn && selector) {
            lvl2Btn.addEventListener('click', () => {
                selector.style.display = 'none';
                this.initLevel(2);
            });
        }

        if (lvl3Btn && selector) {
            lvl3Btn.addEventListener('click', () => {
                selector.style.display = 'none';
                this.initLevel(3);
            });
        }

        const lvl4Btn = document.getElementById('select-lvl-4');
        if (lvl4Btn && selector) {
            lvl4Btn.addEventListener('click', () => {
                selector.style.display = 'none';
                this.initLevel(4);
            });
        }

        // Fire Rate Upgrade Button
        const upgradeBtn = document.getElementById('upgrade-btn');
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => {
                this.upgradeFireRate();
            });
        }

        // Damage Upgrade Button
        const dmgUpgradeBtn = document.getElementById('dmg-upgrade-btn');
        if (dmgUpgradeBtn) {
            dmgUpgradeBtn.addEventListener('click', () => {
                this.upgradeDamage();
            });
        }

        // Max Upgrade Buttons
        const maxRateBtn = document.getElementById('max-upgrade-btn');
        if (maxRateBtn) {
            maxRateBtn.addEventListener('click', () => {
                this.upgradeFireRateToMax();
            });
        }
        const maxDmgBtn = document.getElementById('max-dmg-upgrade-btn');
        if (maxDmgBtn) {
            maxDmgBtn.addEventListener('click', () => {
                this.upgradeDamageToMax();
            });
        }

        // Range Upgrade Button
        const rangeUpgradeBtn = document.getElementById('range-upgrade-btn');
        if (rangeUpgradeBtn) {
            rangeUpgradeBtn.addEventListener('click', () => {
                this.upgradeRange();
            });
        }

        const maxRangeBtn = document.getElementById('max-range-upgrade-btn');
        if (maxRangeBtn) {
            maxRangeBtn.addEventListener('click', () => {
                this.upgradeRangeToMax();
            });
        }

        // Canvas interactions
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleCanvasClick(x, y);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.state.mouseX = e.clientX - rect.left;
            this.state.mouseY = e.clientY - rect.top;
        });

        // Cancel placement on right click
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.state.placingTower = false;
            const btn = document.getElementById('btn-basic-tower');
            if (btn) btn.classList.remove('selected');
        });

        // Stats UI initial update
        this.cacheUIElements();
        this.updateStatsUI();
        this.updateUpgradeUIText();
    }

    cacheUIElements() {
        this.uiElements = {
            gold: document.getElementById('gold-display'),
            lives: document.getElementById('lives-display'),
            wave: document.getElementById('wave-display'),
            count: document.getElementById('tower-count-display'),
            towerBtn: document.getElementById('btn-basic-tower'),
            upgradeText: document.getElementById('upgrade-text'),
            upgradeBtn: document.getElementById('upgrade-btn'),
            maxUpgradeBtn: document.getElementById('max-upgrade-btn'),
            dmgText: document.getElementById('dmg-upgrade-text'),
            dmgBtn: document.getElementById('dmg-upgrade-btn'),
            maxDmgBtn: document.getElementById('max-dmg-upgrade-btn'),
            rangeText: document.getElementById('range-upgrade-text'),
            rangeBtn: document.getElementById('range-upgrade-btn'),
            maxRangeBtn: document.getElementById('max-range-upgrade-btn')
        };
    }

    initLevel(levelNum) {
        this.waveManager.level = levelNum;
        this.state.level = levelNum;
        this.state.isRunning = true;

        if (levelNum > 1) {
            // If starting at Level 2, we don't need a transition alert
            // But we should ensure everything is clean
            this.handleLevelTransition(levelNum, true);
        }

        this.updateStatsUI();
        this.updateUpgradeUIText();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    getFireRateUpgradeCost() {
        const rawCost = this.state.baseUpgradeCost + (this.state.towerLevel - 1) * this.state.upgradeIncrement;
        return Math.min(rawCost, 200);
    }

    getDamageUpgradeCost() {
        const rawCost = this.state.baseUpgradeCost + (this.state.damageLevel - 1) * this.state.upgradeIncrement;
        return Math.min(rawCost, 200);
    }

    getTowerCost() {
        const freeInflationCount = 5;
        if (this.towers.length < freeInflationCount) return 50;
        return 50 + (this.towers.length - freeInflationCount + 1) * 5;
    }

    getCurrentCooldown() {
        const range = this.state.baseCooldown - this.state.targetCooldown;
        const steps = this.state.maxTowerLevel - 1;
        const decrementPerLevel = range / steps;
        return Math.round(this.state.baseCooldown - ((this.state.towerLevel - 1) * decrementPerLevel));
    }

    getCurrentDamage() {
        const maxMult = 2.0;
        const steps = this.state.maxDamageLevel - 1;
        const multPerLevel = (maxMult - 1.0) / steps;
        const currentMult = 1.0 + (this.state.damageLevel - 1) * multPerLevel;
        return this.state.baseDamage * currentMult;
    }

    getRangeUpgradeCost() {
        // 1000, 2000, 3000
        return this.state.rangeLevel * 1000;
    }

    getCurrentRange() {
        // +10% per level above 1
        return this.state.baseRange * (1 + 0.1 * (this.state.rangeLevel - 1));
    }

    upgradeFireRate() {
        const cost = this.getFireRateUpgradeCost();
        if (this.state.towerLevel < this.state.maxTowerLevel && this.state.gold >= cost) {
            this.state.gold -= cost;
            this.state.towerLevel++;
            this.updateStatsUI();
            this.updateUpgradeUIText();
        }
    }

    upgradeDamage() {
        const cost = this.getDamageUpgradeCost();
        if (this.state.damageLevel < this.state.maxDamageLevel && this.state.gold >= cost) {
            this.state.gold -= cost;
            this.state.damageLevel++;
            this.updateStatsUI();
            this.updateUpgradeUIText();
        }
    }

    upgradeFireRateToMax() {
        let cost = this.getFireRateUpgradeCost();
        while (this.state.towerLevel < this.state.maxTowerLevel && this.state.gold >= cost) {
            this.state.gold -= cost;
            this.state.towerLevel++;
            cost = this.getFireRateUpgradeCost();
        }
        this.updateStatsUI();
        this.updateUpgradeUIText();
    }

    upgradeDamageToMax() {
        let cost = this.getDamageUpgradeCost();
        while (this.state.damageLevel < this.state.maxDamageLevel && this.state.gold >= cost) {
            this.state.gold -= cost;
            this.state.damageLevel++;
            cost = this.getDamageUpgradeCost();
        }
        this.updateStatsUI();
        this.updateUpgradeUIText();
    }

    upgradeRange() {
        const cost = this.getRangeUpgradeCost();
        if (this.state.rangeLevel < this.state.maxRangeLevel && this.state.gold >= cost) {
            this.state.gold -= cost;
            this.state.rangeLevel++;
            this.updateStatsUI();
            this.updateUpgradeUIText();
        }
    }

    upgradeRangeToMax() {
        let cost = this.getRangeUpgradeCost();
        while (this.state.rangeLevel < this.state.maxRangeLevel && this.state.gold >= cost) {
            this.state.gold -= cost;
            this.state.rangeLevel++;
            cost = this.getRangeUpgradeCost();
        }
        this.updateStatsUI();
        this.updateUpgradeUIText();
    }

    updateUpgradeUIText() {
        // Fire Rate
        const { upgradeText, upgradeBtn, maxUpgradeBtn, dmgText, dmgBtn, maxDmgBtn } = this.uiElements;

        if (upgradeText && upgradeBtn) {
            const currentCD = this.getCurrentCooldown();
            if (this.state.towerLevel >= this.state.maxTowerLevel) {
                upgradeText.innerText = `Fire Rate Lvl: ${this.state.towerLevel} (MAX)`;
                upgradeBtn.style.display = 'none';
                if (maxUpgradeBtn) maxUpgradeBtn.style.display = 'none';
            } else {
                const range = this.state.baseCooldown - this.state.targetCooldown;
                const nextCD = Math.round(this.state.baseCooldown - (this.state.towerLevel * (range / (this.state.maxTowerLevel - 1))));
                const cost = this.getFireRateUpgradeCost();
                upgradeText.innerText = `Fire Rate Lvl: ${this.state.towerLevel} -> ${this.state.towerLevel + 1}\nCooldown: ${currentCD}ms -> ${nextCD}ms`;
                upgradeBtn.innerText = `Upgrade Rate (${cost}g)`;
                upgradeBtn.style.display = 'block';

                // Update Max Button
                if (maxUpgradeBtn) {
                    let totalCost = 0;
                    let simLevel = this.state.towerLevel;
                    // Calculate cost to max
                    while (simLevel < this.state.maxTowerLevel) {
                        const rawCost = this.state.baseUpgradeCost + (simLevel - 1) * this.state.upgradeIncrement;
                        totalCost += Math.min(rawCost, 200);
                        simLevel++;
                    }
                    maxUpgradeBtn.style.display = 'block';
                    maxUpgradeBtn.innerText = `Max Rate (${totalCost}g)`;
                    maxUpgradeBtn.disabled = this.state.gold < totalCost;
                    maxUpgradeBtn.style.opacity = this.state.gold < totalCost ? '0.5' : '1';
                }
            }
        }

        // Damage
        if (dmgText && dmgBtn) {
            const currentDmg = this.getCurrentDamage().toFixed(1);
            if (this.state.damageLevel >= this.state.maxDamageLevel) {
                dmgText.innerText = `Damage Lvl: ${this.state.damageLevel} (MAX)`;
                dmgBtn.style.display = 'none';
                if (maxDmgBtn) maxDmgBtn.style.display = 'none';
            } else {
                const steps = this.state.maxDamageLevel - 1;
                const nextDmg = (this.state.baseDamage * (1.0 + this.state.damageLevel * (1.0 / steps))).toFixed(1);
                const cost = this.getDamageUpgradeCost();
                dmgText.innerText = `Damage Lvl: ${this.state.damageLevel} -> ${this.state.damageLevel + 1}\nDamage: ${currentDmg} -> ${nextDmg}`;
                dmgBtn.innerText = `Upgrade Damage (${cost}g)`;
                dmgBtn.style.display = 'block';

                // Update Max Button
                if (maxDmgBtn) {
                    let totalCost = 0;
                    let simLevel = this.state.damageLevel;
                    // Calculate cost to max
                    while (simLevel < this.state.maxDamageLevel) {
                        const rawCost = this.state.baseUpgradeCost + (simLevel - 1) * this.state.upgradeIncrement;
                        totalCost += Math.min(rawCost, 200);
                        simLevel++;
                    }
                    maxDmgBtn.style.display = 'block';
                    maxDmgBtn.innerText = `Max Dmg (${totalCost}g)`;
                    maxDmgBtn.disabled = this.state.gold < totalCost;
                    maxDmgBtn.style.opacity = this.state.gold < totalCost ? '0.5' : '1';
                }
            }
        }

        // Range
        const { rangeText, rangeBtn, maxRangeBtn } = this.uiElements;
        if (rangeText && rangeBtn) {
            const currentRange = this.getCurrentRange().toFixed(0);
            if (this.state.rangeLevel >= this.state.maxRangeLevel) {
                rangeText.innerText = `Range Lvl: ${this.state.rangeLevel} (MAX)`;
                rangeBtn.style.display = 'none';
                if (maxRangeBtn) maxRangeBtn.style.display = 'none';
            } else {
                const nextRange = (this.state.baseRange * (1 + 0.1 * this.state.rangeLevel)).toFixed(0);
                const cost = this.getRangeUpgradeCost();
                rangeText.innerText = `Range Lvl: ${this.state.rangeLevel} -> ${this.state.rangeLevel + 1}\nRadius: ${currentRange}px -> ${nextRange}px`;
                rangeBtn.innerText = `Upgrade Range (${cost}g)`;
                rangeBtn.style.display = 'block';

                // Update Max Button
                if (maxRangeBtn) {
                    let totalCost = 0;
                    let simLevel = this.state.rangeLevel;
                    while (simLevel < this.state.maxRangeLevel) {
                        totalCost += simLevel * 1000;
                        simLevel++;
                    }
                    maxRangeBtn.style.display = 'block';
                    maxRangeBtn.innerText = `Max Range (${totalCost}g)`;
                    maxRangeBtn.disabled = this.state.gold < totalCost;
                    maxRangeBtn.style.opacity = this.state.gold < totalCost ? '0.5' : '1';
                }
            }
        }
    }

    async start() {
        const assets = {
            'grass': 'assets/grass.png',
            'path': 'assets/path.png',
            'basic_tower': 'assets/tower_trans.png',
            'basic_enemy': 'assets/slime_trans.png',
            'goblin': 'assets/goblin_trans.png',
            'orc': 'assets/orc_trans.png',
            'castle': 'assets/castle.png',
            'tree': 'assets/tree.png',
            'rock': 'assets/rock.png'
        };

        this.renderer.preload(assets, () => {
            // Don't set isRunning here, let Level Selector handle it
            this.updateStatsUI();
            this.updateUpgradeUIText();
        });
    }

    handleCanvasClick(x, y) {
        if (!this.state.placingTower) return;
        const col = Math.floor(x / 32);
        const row = Math.floor(y / 32);

        if (this.towers.length >= this.state.maxTowers) {
            console.log("Max towers reached");
            return;
        }

        if (this.isValidBuildLocation(col, row)) {
            const currentCost = this.getTowerCost();
            if (this.state.gold >= currentCost) {
                this.buildTower(col, row);
            }
        }
    }

    isValidBuildLocation(col, row) {
        if (this.map.isTileBlocked(col, row)) return false;
        if (this.towers.some(t => t.x === col && t.y === row)) return false;

        // Block first 2 squares of path start neighbors
        // Path starts at (0, 5) and (1, 5)
        const isNearStart = (
            (Math.abs(col - 0) <= 0 && Math.abs(row - 5) <= 1) || // neighbors of (0,5)
            (Math.abs(col - 1) <= 0 && Math.abs(row - 5) <= 1)    // neighbors of (1,5)
            // Wait, this is blocking more than neighbors. 
            // If col=0, row=4 or 6. If col=1, row=4 or 6.
        );

        // Let's explicitly check the 4 grass tiles adjacent to (0,5) and (1,5)
        const startTiles = [{ x: 0, y: 5 }, { x: 1, y: 5 }];
        const isStartNeighbor = startTiles.some(st => {
            return (Math.abs(col - st.x) + Math.abs(row - st.y)) === 1;
        });
        if (isStartNeighbor) return false;

        const neighbors = [{ x: col + 1, y: row }, { x: col - 1, y: row }, { x: col, y: row + 1 }, { x: col, y: row - 1 }];
        const isNearPath = neighbors.some(n => {
            if (n.x >= 0 && n.x < this.map.cols && n.y >= 0 && n.y < this.map.rows) {
                return this.map.grid[n.y][n.x] === 1;
            }
            return false;
        });
        if (!isNearPath) return false;

        const isNearTower = neighbors.some(n => this.towers.some(t => t.x === n.x && t.y === n.y));
        return !isNearTower;
    }

    buildTower(col, row) {
        const currentCost = this.getTowerCost();
        this.state.gold -= currentCost;
        this.towers.push(new Tower(col, row));
        this.updateStatsUI();
        this.updateUpgradeUIText();
    }

    updateStatsUI() {
        if (!this.uiElements) return;
        const { gold, lives, wave, count, towerBtn } = this.uiElements;

        if (gold) gold.innerText = `Gold: ${this.state.gold}`;
        if (lives) lives.innerText = `Lives: ${this.state.lives}`;
        if (wave) wave.innerText = `Lvl ${this.waveManager.level} Wave: ${this.waveManager.waveNumber}`;
        if (count) count.innerText = `Towers: ${this.towers.length}/${this.state.maxTowers}`;

        // Update Tower Cost in Build Menu
        const currentCost = this.getTowerCost();
        if (towerBtn) {
            towerBtn.title = `Basic Tower (${currentCost}g)`;
            const costSpan = towerBtn.querySelector('span');
            if (costSpan) costSpan.innerText = `${currentCost}g`;
        }
    }

    update(deltaTime) {
        if (!this.state.isRunning) return;
        this.waveManager.update(deltaTime);
        const currentCD = this.getCurrentCooldown();
        const currentDmg = this.getCurrentDamage();
        const currentRange = this.getCurrentRange(); // NEW: Get current range

        // Update Towers
        this.towers.forEach(t => t.update(deltaTime, this.enemies, this.projectiles, performance.now(), currentCD, currentDmg, this.soundManager, currentRange)); // NEW: Pass currentRange

        // Update Projectiles
        this.projectiles.forEach(p => p.update(deltaTime));
        // Optimized removal: Filter create new array (O(N)) instead of splice loop (O(N^2))
        this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);

        // Update Enemies
        this.enemies.forEach(enemy => {
            enemy.update(deltaTime);
            if (enemy.markedForDeletion) {
                if (enemy.health <= 0) {
                    this.state.gold += enemy.reward || 10;
                    this.updateStatsUI();
                    this.updateUpgradeUIText();
                    this.soundManager.playEnemyDeath();
                } else {
                    this.state.lives -= 1;
                    this.state.castleDamageFlash = 500;
                    this.updateStatsUI();
                    if (this.state.lives <= 0) this.gameOver();
                }
            }
        });

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            if (this.enemies[i].markedForDeletion) {
                this.enemies.splice(i, 1);
            }
        }

        if (this.state.castleDamageFlash > 0) {
            this.state.castleDamageFlash -= deltaTime;
            if (this.state.castleDamageFlash < 0) this.state.castleDamageFlash = 0;
        }
    }

    draw() {
        this.renderer.clear(this.width, this.height);
        this.map.draw();
        this.towers.forEach(t => t.draw(this.renderer));
        this.enemies.forEach(e => e.drawBody(this.renderer));
        this.projectiles.forEach(p => p.draw(this.renderer));

        if (this.state.placingTower) this.drawBuildGrid();

        // Draw Health Bars LAST so they appear above the build grid
        this.enemies.forEach(e => e.drawHealthBar(this.renderer));
        if (this.state.castleDamageFlash > 0) {
            const alpha = this.state.castleDamageFlash / 500;
            this.ctx.globalAlpha = alpha * 0.5;
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.fillRect(this.map.castlePos.x * 32, this.map.castlePos.y * 32, 64, 64);
            this.ctx.globalAlpha = 1.0;
        }
    }

    drawBuildGrid() {
        const hoverCol = Math.floor(this.state.mouseX / 32);
        const hoverRow = Math.floor(this.state.mouseY / 32);
        this.ctx.globalAlpha = 0.3;
        for (let y = 0; y < this.map.rows; y++) {
            for (let x = 0; x < this.map.cols; x++) {
                if (this.isValidBuildLocation(x, y)) {
                    this.ctx.fillStyle = '#2ecc71';
                    this.ctx.fillRect(x * 32, y * 32, 32, 32);
                    this.ctx.strokeStyle = '#27ae60';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(x * 32, y * 32, 32, 32);
                }
            }
        }
        this.ctx.globalAlpha = 1.0;
        if (this.isValidBuildLocation(hoverCol, hoverRow)) {
            const centerX = hoverCol * 32 + 16;
            const centerY = hoverRow * 32 + 16;

            // Draw Ghost Tower to show footprint/appearance
            this.ctx.globalAlpha = 0.5;
            const drawSize = 48;
            const offset = (32 - drawSize) / 2;
            this.renderer.drawImage('basic_tower', hoverCol * 32 + offset, hoverRow * 32 + offset, drawSize, drawSize);
            this.ctx.globalAlpha = 1.0;

            const currentRange = this.getCurrentRange();
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, currentRange, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(46, 204, 113, 0.15)';
            this.ctx.fill();
            this.ctx.strokeStyle = '#2ecc71';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }

    gameLoop(timestamp) {
        if (!this.state.isRunning) return;
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        this.update(deltaTime);
        this.draw();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    handleLevelTransition(newLevel, silent = false) {
        if (!silent) {
            let msg = `LEVEL COMPLETE! Moving to Level ${newLevel}`;
            if (newLevel === 2) msg += ": The Goblins are attacking! (Stats Reset)";
            else if (newLevel === 3) msg += ": The Orcs have arrived! (Stats Reset)";
            else if (newLevel >= 4) msg += ": THE VOID STARES BACK... (Stats Reset)";

            alert(msg);
        }

        // "Start over from the beginning" - Reset all save level
        this.enemies = [];
        this.projectiles = [];
        this.towers = [];

        if (newLevel >= 4) {
            this.state.gold = 350 + (newLevel - 3) * 50;
        } else if (newLevel === 3) {
            this.state.gold = 350;
        } else if (newLevel === 2) {
            this.state.gold = 250;
        } else {
            this.state.gold = 150;
        }
        this.state.lives = 20;
        this.state.towerLevel = 1;
        this.state.damageLevel = 1;
        this.state.rangeLevel = 1;
        this.state.maxTowers = 15 + (newLevel - 1) * 2;

        this.waveManager.level = newLevel;
        this.waveManager.waveNumber = 1;

        this.updateStatsUI();
        this.updateUpgradeUIText();
    }

    handleGameComplete() {
        this.state.isRunning = false;

        const container = document.getElementById('game-container');
        const endScreen = document.createElement('div');
        endScreen.id = 'game-complete-screen';
        endScreen.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: #f1c40f;
            font-family: 'Courier New', Courier, monospace;
            z-index: 1000;
            animation: fadeIn 3s ease-in-out;
        `;

        endScreen.innerHTML = `
            <h1 style="font-size: 48px; margin-bottom: 20px; text-shadow: 0 0 10px #f1c40f;">VICTORY!</h1>
            <p style="font-size: 24px; color: white; margin-bottom: 40px;">Thank you for playing</p>
            <div style="position: absolute; bottom: 20px; right: 20px; color: rgba(255, 255, 255, 0.6); font-size: 14px;">
                Made by Dylan Roth
            </div>
            <button onclick="location.reload()" style="background: #f1c40f; color: black; border: none; padding: 10px 20px; font-weight: bold; cursor: pointer; border-radius: 5px;">Play Again</button>
        `;

        container.appendChild(endScreen);
    }

    gameOver() {
        this.state.isRunning = false;
        alert("Game Over!");
        location.reload();
    }
}
