import Enemy from './Enemy.js';

export default class DebugManager {
    constructor(game) {
        this.game = game;
        this.visible = false;
        this.initUI();
        this.bindInput();
    }

    bindInput() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F1') {
                e.preventDefault();
                this.toggleMenu();
            }
        });
    }

    toggleMenu() {
        this.visible = !this.visible;
        this.container.style.display = this.visible ? 'block' : 'none';
        if (this.visible) {
            this.updateStats();
        } else {
            // When closing, blur any active inputs so game keys work
            if (document.activeElement) {
                document.activeElement.blur();
            }
        }
    }

    initUI() {
        this.container = document.createElement('div');
        this.container.id = 'debug-menu';
        this.container.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #e74c3c;
            color: #fff;
            padding: 15px;
            font-family: monospace;
            z-index: 9999;
            width: 250px;
            display: none;
            border-radius: 5px;
            pointer-events: auto;
        `;

        const title = document.createElement('h3');
        title.innerText = "DEBUG MODE (F1)";
        title.style.cssText = "margin-top: 0; color: #e74c3c; text-align: center;";
        this.container.appendChild(title);

        // Pause / Play
        const pauseBtn = this.createButton('Pause / Play', () => {
            this.game.state.isRunning = !this.game.state.isRunning;
            if (this.game.state.isRunning) {
                this.game.lastTime = performance.now();
                requestAnimationFrame(this.game.gameLoop.bind(this.game));
            }
            console.log("Debug: Toggled Pause");
        });
        this.container.appendChild(pauseBtn);

        // Separator
        this.container.appendChild(this.createSeparator());

        // Wave Control
        const waveContainer = document.createElement('div');
        waveContainer.style.marginBottom = '10px';

        const waveLabel = document.createElement('label');
        waveLabel.innerText = "Set Wave: ";

        this.waveInput = document.createElement('input');
        this.waveInput.type = 'number';
        this.waveInput.min = '1';
        this.waveInput.max = '12';
        this.waveInput.value = '1';
        this.waveInput.style.cssText = "width: 50px; margin-right: 5px;";

        const setWaveBtn = document.createElement('button');
        setWaveBtn.innerText = "Go";
        setWaveBtn.onclick = () => {
            const val = parseInt(this.waveInput.value);
            if (val >= 1 && val <= 100) {
                this.game.waveManager.waveNumber = val;
                this.game.waveManager.waveInProgress = false;
                this.game.enemies = []; // Clear enemies? Maybe optional.
                this.game.state.isRunning = true;
                this.game.updateStatsUI();
                console.log(`Debug: Jumped to Wave ${val}`);
            }
        };

        waveContainer.appendChild(waveLabel);
        waveContainer.appendChild(this.waveInput);
        waveContainer.appendChild(setWaveBtn);
        this.container.appendChild(waveContainer);

        // Separator
        this.container.appendChild(this.createSeparator());

        // Spawn Controls
        const spawnLabel = document.createElement('div');
        spawnLabel.innerText = "Spawn Enemy:";
        spawnLabel.style.marginBottom = '5px';
        this.container.appendChild(spawnLabel);

        const btnGroup = document.createElement('div');
        btnGroup.style.display = 'flex';
        btnGroup.style.gap = '5px';

        btnGroup.appendChild(this.createButton('Basic', () => this.spawn('basic')));
        btnGroup.appendChild(this.createButton('Big', () => this.spawn('big')));
        btnGroup.appendChild(this.createButton('Huge', () => this.spawn('huge')));

        this.container.appendChild(btnGroup);

        this.container.appendChild(this.createSeparator());

        // Add 1000 Gold
        const goldBtn = this.createButton('+1000 Gold', () => {
            this.game.state.gold += 1000;
            this.game.updateStatsUI();
            this.game.updateUpgradeUIText();
        });
        this.container.appendChild(goldBtn);


        // Check if game container exists to append
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.appendChild(this.container);
        } else {
            document.body.appendChild(this.container);
        }
    }

    createButton(text, onClick) {
        const btn = document.createElement('button');
        btn.innerText = text;
        btn.onclick = onClick;
        btn.style.cssText = `
            background: #444;
            color: white;
            border: 1px solid #666;
            padding: 5px 10px;
            cursor: pointer;
            width: 100%;
            margin-bottom: 5px;
        `;
        btn.onmouseover = () => btn.style.background = '#555';
        btn.onmouseout = () => btn.style.background = '#444';
        return btn;
    }

    createSeparator() {
        const hr = document.createElement('hr');
        hr.style.borderColor = '#555';
        hr.style.margin = '10px 0';
        return hr;
    }

    spawn(type) {
        const enemy = new Enemy(this.game.map.waypoints, type, this.game.waveManager.level);
        this.game.enemies.push(enemy);
        console.log(`Debug: Spawned ${type} enemy`);
    }

    updateStats() {
        if (this.game && this.game.waveManager) {
            this.waveInput.value = this.game.waveManager.waveNumber;
        }
    }
}
