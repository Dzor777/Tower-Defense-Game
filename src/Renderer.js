export default class Renderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.images = {};
        this.loaded = 0;
        this.toLoad = 0;
    }

    preload(sources, callback) {
        this.toLoad = Object.keys(sources).length;
        this.loaded = 0;

        if (this.toLoad === 0) {
            callback();
            return;
        }

        for (let key in sources) {
            this.images[key] = new Image();
            this.images[key].src = sources[key];
            this.images[key].onload = () => {
                this.loaded++;
                if (this.loaded === this.toLoad) {
                    callback();
                }
            };
            this.images[key].onerror = () => {
                console.error(`Failed to load image: ${sources[key]}`);
            };
        }
    }

    clear(width, height) {
        this.ctx.clearRect(0, 0, width, height);
    }

    drawImage(key, x, y, w, h) {
        if (this.images[key]) {
            this.ctx.drawImage(this.images[key], x, y, w, h);
        }
    }
}
