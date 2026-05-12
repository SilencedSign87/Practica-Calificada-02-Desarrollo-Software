const TWO_PI = Math.PI * 2;
const ROULETTE_CONTAINER_PADDING = 20;
const ROULETTE_COLORS = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#33FFF5', '#F5FF33'];
const SPIN_DURATION = 5000; // ms

class Roulette {

    constructor(config = {}) {
        this.canvas = config.canvas || document.getElementById(config.canvasId || 'ruleta');

        if (!this.canvas) {
            throw new Error('Canvas element not found');
        }

        this.ctx = this.canvas.getContext('2d');

        this.options = [];
        this.rotation = 0;
        this.isSpinning = false;

        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.radius = Math.min(this.centerX, this.centerY) - ROULETTE_CONTAINER_PADDING;

        this.draw(); // Initial draw
    }

    RenderOptions(options = []) {
        this.options = options;
        this.draw(); // Update draw
    }

    draw() {
        const ctx = this.ctx;

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (!this.options.length) return;

        const arcSize = TWO_PI / this.options.length;

        this.options.forEach((option, index) => {
            const startAngle = index * arcSize + this.rotation;
            const endAngle = startAngle + arcSize;

            //segmento
            ctx.beginPath();
            ctx.moveTo(this.centerX, this.centerY);
            ctx.arc(
                this.centerX,
                this.centerY,
                this.radius,
                startAngle,
                endAngle);

            ctx.fillStyle = ROULETTE_COLORS[index % ROULETTE_COLORS.length];

            ctx.fill();
            ctx.save();

            // texto
            ctx.translate(this.centerX, this.centerY);
            ctx.rotate(startAngle + arcSize / 2);

            ctx.fillStyle = '#000';
            ctx.font = '16px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(option, this.radius - 10, 5);

            ctx.restore();
        });

        this.drawPointer();
    }

    drawPointer() {
        const ctx = this.ctx;

        ctx.beginPath();

        ctx.moveTo(this.centerX + this.radius + 10, this.centerY);
        ctx.lineTo(this.centerX + this.radius - 20, this.centerY - 15);
        ctx.lineTo(this.centerX + this.radius - 20, this.centerY + 15);

        ctx.closePath();

        ctx.fillStyle = "red";
        ctx.fill();
    }

    start(callback) { // spin the roulette
        if (this.isSpinning || !this.options.length) return;

        this.isSpinning = true;

        const extraSpins = Math.floor(Math.random() * 3) + 3; // Random extra spins between 3 and 5
        const randomAngle = Math.random() * TWO_PI; // Random angle to land on

        const targetLocation = this.rotation + extraSpins * TWO_PI + randomAngle;
        const startLocation = this.rotation;

        const start = performance.now();

        const animate = (time) => { // Animation loop
            const elapsed = time - start;
            const progress = Math.min(elapsed / SPIN_DURATION, 1);

            //ease out effect
            const easeOut = 1 - Math.pow(1 - progress, 3);

            this.rotation =  startRotation + (targetLocation - startRotation) * easeOut;

            this.draw();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.rotation = targetLocation % TWO_PI; // Normalize rotation

                this.isSpinning = false;
                const winner = this.getWinner();
                if (callback) {
                    callback(winner);
                }
            }
        };

        requestAnimationFrame(animate); // Start animation
    }

    getWinner() {
        const arcSize = TWO_PI / this.options.length;

        const normalized =
            (TWO_PI - this.rotation) % TWO_PI; // Normalize rotation to [0, TWO_PI]

        const index =
            Math.floor(normalized / arcSize) %
            this.options.length;

        return this.options[index];
    }

}