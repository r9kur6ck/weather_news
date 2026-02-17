/**
 * Weather Canvas Animation - 天気アニメーション描画
 * Canvas 2D を使ったフルスクリーン天気エフェクト
 */

const WEATHER_COLORS = {
    sunny: {
        sky: ['#1a3a5c', '#2563eb', '#38bdf8'],
        accent: '#fbbf24',
    },
    partly_cloudy: {
        sky: ['#1e293b', '#334155', '#60a5fa'],
        accent: '#e2e8f0',
    },
    cloudy: {
        sky: ['#1e293b', '#334155', '#475569'],
        accent: '#94a3b8',
    },
    rainy: {
        sky: ['#0f172a', '#1e293b', '#334155'],
        accent: '#38bdf8',
    },
    storm: {
        sky: ['#0a0a0a', '#1a1a2e', '#16213e'],
        accent: '#f87171',
    },
};

class Particle {
    constructor(canvas, type) {
        this.canvas = canvas;
        this.type = type;
        this.reset();
    }

    reset() {
        const w = this.canvas.width;
        const h = this.canvas.height;

        switch (this.type) {
            case 'sparkle':
                this.x = Math.random() * w;
                this.y = Math.random() * h;
                this.size = Math.random() * 3 + 1;
                this.alpha = Math.random();
                this.speed = Math.random() * 0.02 + 0.01;
                this.phase = Math.random() * Math.PI * 2;
                break;

            case 'cloud':
                this.x = -200 + Math.random() * (w + 400);
                this.y = Math.random() * h * 0.4;
                this.width = Math.random() * 200 + 100;
                this.height = Math.random() * 60 + 30;
                this.speed = Math.random() * 0.3 + 0.1;
                this.alpha = Math.random() * 0.3 + 0.1;
                break;

            case 'rain':
                this.x = Math.random() * w;
                this.y = Math.random() * h - h;
                this.length = Math.random() * 20 + 10;
                this.speed = Math.random() * 8 + 6;
                this.alpha = Math.random() * 0.5 + 0.2;
                this.wind = Math.random() * 2 - 0.5;
                break;

            case 'ripple':
                this.x = Math.random() * w;
                this.y = h * 0.7 + Math.random() * h * 0.3;
                this.radius = 0;
                this.maxRadius = Math.random() * 30 + 10;
                this.speed = Math.random() * 0.5 + 0.3;
                this.alpha = 0.4;
                break;

            case 'sunray':
                this.angle = Math.random() * Math.PI * 2;
                this.length = Math.random() * 300 + 200;
                this.width = Math.random() * 3 + 1;
                this.speed = Math.random() * 0.003 + 0.001;
                this.alpha = Math.random() * 0.15 + 0.05;
                break;
        }
    }
}

export class WeatherCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.currentWeather = null;
        this.targetColors = WEATHER_COLORS.cloudy;
        this.currentColors = { ...WEATHER_COLORS.cloudy };
        this.animationId = null;
        this.lightningTimer = 0;
        this.lightningAlpha = 0;
        this.shakeX = 0;
        this.shakeY = 0;
        this.time = 0;
        this.sunX = 0;
        this.sunY = 0;

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.startIdleAnimation();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.sunX = this.canvas.width * 0.75;
        this.sunY = this.canvas.height * 0.2;
    }

    startIdleAnimation() {
        this.setWeather('idle');
    }

    setWeather(weather) {
        if (this.currentWeather === weather) return;
        this.currentWeather = weather;
        this.particles = [];

        const w = this.canvas.width;
        const h = this.canvas.height;

        if (weather === 'idle') {
            this.targetColors = {
                sky: ['#0a0e1a', '#111827', '#1e293b'],
                accent: '#38bdf8',
            };
            // Subtle sparkles for idle
            for (let i = 0; i < 40; i++) {
                this.particles.push(new Particle(this.canvas, 'sparkle'));
            }
        } else {
            this.targetColors = WEATHER_COLORS[weather] || WEATHER_COLORS.cloudy;
        }

        switch (weather) {
            case 'sunny':
                for (let i = 0; i < 60; i++) {
                    this.particles.push(new Particle(this.canvas, 'sparkle'));
                }
                for (let i = 0; i < 12; i++) {
                    this.particles.push(new Particle(this.canvas, 'sunray'));
                }
                break;

            case 'partly_cloudy':
                for (let i = 0; i < 30; i++) {
                    this.particles.push(new Particle(this.canvas, 'sparkle'));
                }
                for (let i = 0; i < 6; i++) {
                    this.particles.push(new Particle(this.canvas, 'sunray'));
                }
                for (let i = 0; i < 5; i++) {
                    this.particles.push(new Particle(this.canvas, 'cloud'));
                }
                break;

            case 'cloudy':
                for (let i = 0; i < 8; i++) {
                    this.particles.push(new Particle(this.canvas, 'cloud'));
                }
                break;

            case 'rainy':
                for (let i = 0; i < 4; i++) {
                    this.particles.push(new Particle(this.canvas, 'cloud'));
                }
                for (let i = 0; i < 120; i++) {
                    this.particles.push(new Particle(this.canvas, 'rain'));
                }
                for (let i = 0; i < 8; i++) {
                    this.particles.push(new Particle(this.canvas, 'ripple'));
                }
                break;

            case 'storm':
                for (let i = 0; i < 6; i++) {
                    this.particles.push(new Particle(this.canvas, 'cloud'));
                }
                for (let i = 0; i < 200; i++) {
                    this.particles.push(new Particle(this.canvas, 'rain'));
                }
                for (let i = 0; i < 12; i++) {
                    this.particles.push(new Particle(this.canvas, 'ripple'));
                }
                break;
        }

        if (!this.animationId) {
            this.animate();
        }
    }

    drawSkyGradient() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const colors = this.targetColors.sky;

        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(0.5, colors[1]);
        gradient.addColorStop(1, colors[2]);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    }

    drawSun(x, y) {
        const ctx = this.ctx;

        // Glow
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 120);
        glow.addColorStop(0, 'rgba(251, 191, 36, 0.4)');
        glow.addColorStop(0.3, 'rgba(251, 191, 36, 0.15)');
        glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(x - 150, y - 150, 300, 300);

        // Core
        const sunGrad = ctx.createRadialGradient(x, y, 0, x, y, 40);
        sunGrad.addColorStop(0, '#fff7ed');
        sunGrad.addColorStop(0.5, '#fbbf24');
        sunGrad.addColorStop(1, '#f59e0b');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(x, y, 36 + Math.sin(this.time * 2) * 3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawCloud(p) {
        const ctx = this.ctx;
        ctx.fillStyle = `rgba(200, 210, 220, ${p.alpha})`;
        ctx.beginPath();

        // Draw cloud as overlapping circles
        const cx = p.x;
        const cy = p.y;
        const w = p.width;
        const h = p.height;

        ctx.arc(cx, cy, h * 0.5, 0, Math.PI * 2);
        ctx.arc(cx - w * 0.25, cy + h * 0.1, h * 0.4, 0, Math.PI * 2);
        ctx.arc(cx + w * 0.25, cy + h * 0.1, h * 0.45, 0, Math.PI * 2);
        ctx.arc(cx - w * 0.1, cy - h * 0.2, h * 0.35, 0, Math.PI * 2);
        ctx.arc(cx + w * 0.12, cy - h * 0.15, h * 0.38, 0, Math.PI * 2);
        ctx.fill();
    }

    drawRain(p) {
        const ctx = this.ctx;
        ctx.strokeStyle = `rgba(150, 200, 255, ${p.alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.wind * 3, p.y + p.length);
        ctx.stroke();
    }

    drawRipple(p) {
        const ctx = this.ctx;
        ctx.strokeStyle = `rgba(150, 200, 255, ${p.alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.radius, p.radius * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawSparkle(p) {
        const ctx = this.ctx;
        const alpha = Math.abs(Math.sin(this.time * p.speed * 60 + p.phase));
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }

    drawSunray(p) {
        const ctx = this.ctx;
        const x = this.sunX;
        const y = this.sunY;
        const angle = p.angle + this.time * p.speed;

        ctx.strokeStyle = `rgba(251, 191, 36, ${p.alpha})`;
        ctx.lineWidth = p.width;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle) * 50, y + Math.sin(angle) * 50);
        ctx.lineTo(x + Math.cos(angle) * p.length, y + Math.sin(angle) * p.length);
        ctx.stroke();
    }

    drawLightning() {
        if (this.lightningAlpha <= 0) return;

        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Flash
        ctx.fillStyle = `rgba(255, 255, 255, ${this.lightningAlpha * 0.3})`;
        ctx.fillRect(0, 0, w, h);

        // Lightning bolt
        if (this.lightningAlpha > 0.5) {
            ctx.strokeStyle = `rgba(200, 180, 255, ${this.lightningAlpha})`;
            ctx.lineWidth = 3;
            ctx.shadowColor = '#a78bfa';
            ctx.shadowBlur = 20;

            const startX = w * 0.3 + Math.random() * w * 0.4;
            let x = startX;
            let y = 0;

            ctx.beginPath();
            ctx.moveTo(x, y);
            while (y < h * 0.7) {
                x += (Math.random() - 0.5) * 60;
                y += Math.random() * 40 + 20;
                ctx.lineTo(x, y);

                // Branch
                if (Math.random() < 0.3) {
                    ctx.moveTo(x, y);
                    const bx = x + (Math.random() - 0.5) * 80;
                    const by = y + Math.random() * 60;
                    ctx.lineTo(bx, by);
                    ctx.moveTo(x, y);
                }
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }

    updateParticles() {
        const w = this.canvas.width;
        const h = this.canvas.height;

        for (const p of this.particles) {
            switch (p.type) {
                case 'cloud':
                    p.x += p.speed;
                    if (p.x > w + 200) {
                        p.x = -250;
                        p.y = Math.random() * h * 0.35;
                    }
                    break;

                case 'rain':
                    p.x += p.wind;
                    p.y += p.speed;
                    if (p.y > h) {
                        p.x = Math.random() * w;
                        p.y = -p.length;
                    }
                    break;

                case 'ripple':
                    p.radius += p.speed;
                    p.alpha -= 0.004;
                    if (p.radius > p.maxRadius || p.alpha <= 0) {
                        p.x = Math.random() * w;
                        p.y = h * 0.7 + Math.random() * h * 0.3;
                        p.radius = 0;
                        p.alpha = 0.4;
                    }
                    break;

                case 'sparkle':
                    // Sparkles don't move, they just pulse via draw
                    break;

                case 'sunray':
                    // Rotation handled in draw
                    break;
            }
        }

        // Lightning for storm
        if (this.currentWeather === 'storm') {
            this.lightningTimer -= 1;
            this.lightningAlpha *= 0.92;
            if (this.lightningTimer <= 0) {
                if (Math.random() < 0.005) {
                    this.lightningAlpha = 1;
                    this.lightningTimer = 6;
                    this.shakeX = (Math.random() - 0.5) * 8;
                    this.shakeY = (Math.random() - 0.5) * 8;
                }
            }
        }

        // Decay shake
        this.shakeX *= 0.9;
        this.shakeY *= 0.9;
    }

    animate() {
        this.time += 0.016;
        const ctx = this.ctx;

        ctx.save();
        ctx.translate(this.shakeX, this.shakeY);

        // Draw sky
        this.drawSkyGradient();

        // Draw sun for sunny / partly_cloudy
        if (this.currentWeather === 'sunny' || this.currentWeather === 'partly_cloudy') {
            this.drawSun(this.sunX, this.sunY);
        }

        // Draw particles by type order
        const drawOrder = ['sunray', 'cloud', 'sparkle', 'rain', 'ripple'];
        for (const type of drawOrder) {
            for (const p of this.particles) {
                if (p.type !== type) continue;
                switch (type) {
                    case 'cloud': this.drawCloud(p); break;
                    case 'rain': this.drawRain(p); break;
                    case 'ripple': this.drawRipple(p); break;
                    case 'sparkle': this.drawSparkle(p); break;
                    case 'sunray': this.drawSunray(p); break;
                }
            }
        }

        // Lightning
        this.drawLightning();

        this.updateParticles();

        ctx.restore();

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}
