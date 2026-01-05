export default class Map {
    constructor(renderer, width, height, tileSize) {
        this.renderer = renderer;
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.cols = Math.floor(width / tileSize);
        this.rows = Math.floor(height / tileSize);

        // 0 = grass, 1 = path
        this.grid = this.generateMap();
        this.waypoints = this.calculateWaypoints();

        // Castle position (at the end of the path)
        this.castlePos = { x: 24, y: 6 }; // Grid coordinates

        // Decorative elements
        this.decorations = this.generateDecorations();
    }

    generateMap() {
        let grid = [];
        for (let y = 0; y < this.rows; y++) {
            let row = [];
            for (let x = 0; x < this.cols; x++) {
                row.push(0); // Default grass
            }
            grid.push(row);
        }

        // Hardcoded path
        const pathCoordinates = [
            { x: 0, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 },
            { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 5, y: 7 }, { x: 5, y: 8 }, { x: 5, y: 9 },
            { x: 6, y: 9 }, { x: 7, y: 9 }, { x: 8, y: 9 }, { x: 9, y: 9 }, { x: 10, y: 9 },
            { x: 11, y: 9 }, { x: 12, y: 9 }, { x: 12, y: 8 }, { x: 12, y: 7 }, { x: 12, y: 6 },
            { x: 12, y: 5 }, { x: 12, y: 4 }, { x: 12, y: 3 }, { x: 13, y: 3 }, { x: 14, y: 3 },
            { x: 15, y: 3 }, { x: 16, y: 3 }, { x: 17, y: 3 }, { x: 18, y: 3 }, { x: 19, y: 3 },
            { x: 20, y: 3 }, { x: 20, y: 4 }, { x: 20, y: 5 }, { x: 20, y: 6 }, { x: 20, y: 7 },
            { x: 21, y: 7 }, { x: 22, y: 7 }, { x: 23, y: 7 }, { x: 24, y: 7 }
        ];

        pathCoordinates.forEach(p => {
            if (p.x < this.cols && p.y < this.rows) {
                grid[p.y][p.x] = 1;
            }
        });

        return grid;
    }

    calculateWaypoints() {
        return [
            { x: 0 * this.tileSize, y: 5 * this.tileSize },
            { x: 5 * this.tileSize, y: 5 * this.tileSize },
            { x: 5 * this.tileSize, y: 9 * this.tileSize },
            { x: 12 * this.tileSize, y: 9 * this.tileSize },
            { x: 12 * this.tileSize, y: 3 * this.tileSize },
            { x: 20 * this.tileSize, y: 3 * this.tileSize },
            { x: 20 * this.tileSize, y: 7 * this.tileSize },
            { x: 24 * this.tileSize + 16, y: 7 * this.tileSize } // Castle center
        ];
    }

    generateDecorations() {
        // Larger 3x3 trees and rocks
        const decorations = [];

        // Large Trees (coords are top-left tile)
        decorations.push({ type: 'tree', x: 1, y: 1 });
        decorations.push({ type: 'tree', x: 7, y: 1 });
        decorations.push({ type: 'tree', x: 16, y: 0 });
        decorations.push({ type: 'tree', x: 2, y: 11 });
        decorations.push({ type: 'tree', x: 10, y: 11 });
        decorations.push({ type: 'tree', x: 17, y: 11 });

        // Rocks
        decorations.push({ type: 'rock', x: 7, y: 5 });
        decorations.push({ type: 'rock', x: 14, y: 8 });
        decorations.push({ type: 'rock', x: 22, y: 11 });
        decorations.push({ type: 'rock', x: 4, y: 15 });

        return decorations;
    }

    draw() {
        // Draw base tiles
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const tileType = this.grid[y][x];
                const imageKey = tileType === 1 ? 'path' : 'grass';
                this.renderer.drawImage(
                    imageKey,
                    x * this.tileSize,
                    y * this.tileSize,
                    this.tileSize,
                    this.tileSize
                );
            }
        }

        // Draw decorations
        this.decorations.forEach(deco => {
            const size = deco.type === 'tree' ? this.tileSize * 3 : this.tileSize;
            this.renderer.drawImage(
                deco.type,
                deco.x * this.tileSize,
                deco.y * this.tileSize,
                size,
                size
            );
        });

        // Draw castle (64x64, so takes 2x2 tiles)
        this.renderer.drawImage(
            'castle',
            this.castlePos.x * this.tileSize,
            this.castlePos.y * this.tileSize,
            64,
            64
        );
    }

    isTileBlocked(col, row) {
        // Boundary check
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return true;

        // Check if path
        if (this.grid[row][col] === 1) return true;

        // Check if castle area (2x2)
        if (col >= this.castlePos.x && col < this.castlePos.x + 2 &&
            row >= this.castlePos.y && row < this.castlePos.y + 2) return true;

        // Check if tree area (3x3)
        for (const deco of this.decorations) {
            if (deco.type === 'tree') {
                if (col >= deco.x && col < deco.x + 3 &&
                    row >= deco.y && row < deco.y + 3) return true;
            } else if (deco.type === 'rock') {
                if (col === deco.x && row === deco.y) return true;
            }
        }

        return false;
    }

    isBuildTile(x, y) {
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);
        return !this.isTileBlocked(col, row);
    }
}
