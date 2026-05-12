class Roulette{

    constructor(config = {}){
        this.canvas = config.canvas || document.getElementById(config.canvasId || 'ruleta');

        if (!this.canvas) {
            throw new Error('Canvas element not found');
        }
    }
    
}