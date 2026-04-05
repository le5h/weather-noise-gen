/**
 * Weather Particle Renderer
 * Handles all particle animation and rendering logic
 */

const TIME_SCALE = 60;

const PALETTE = {
    sun: {
        rayStart: 'rgba(255, 220, 100, 0.8)',
        rayMid: 'rgba(255, 200, 50, 0.4)',
        rayEnd: 'rgba(255, 180, 0, 0)',
        glowInner: 'rgba(255, 220, 100, 0.3)',
        glowMid: 'rgba(255, 200, 50, 0.2)',
        glowOuter: 'rgba(255, 180, 0, 0.1)',
        glowEdge: 'rgba(255, 160, 0, 0)',
        coreInner: '#fff5e6',
        coreMid: '#ffeb3b',
        coreOuter: '#ffc107'
    },
    drops: {
        rain: '#ffffff',
        thunder: 'rgba(200, 220, 255, 0.8)'
    },
    particles: {
        foggy: 'rgba(60, 60, 60, 0.8)',
        foggyShadow: 'rgba(40, 40, 40, 0.2)',
        snow: '#ffffff',
        snowShadow: 'rgba(255, 255, 255, 0.5)',
        oceanShimmer: 'rgba(255, 255, 255, 0.6)'
    },
    lightning: {
        skyFlashInner: (op) => `rgba(255, 255, 255, ${op * 0.25})`,
        skyFlashMid: (op) => `rgba(220, 235, 255, ${op * 0.15})`,
        skyFlashOuter: 'rgba(180, 200, 255, 0)',
        boltStart: (op) => `rgba(255, 255, 255, ${op})`,
        boltMid1: (op) => `rgba(220, 240, 255, ${op * 0.9})`,
        boltMid2: (op) => `rgba(180, 220, 255, ${op * 0.6})`,
        boltEnd: (op) => `rgba(150, 200, 255, ${op * 0.2})`,
        branch: (op) => `rgba(200, 220, 255, ${op})`,
        glow: (op) => `rgba(180, 220, 255, ${op})`,
        glowCore: (op) => `rgba(255, 255, 255, ${op * 0.8})`,
        glowOuter: (op) => `rgba(200, 230, 255, ${op * 0.4})`
    },
    leaves: [
        '#8B7355', '#A0826D', '#BC9A6A', '#C4A57B', '#9B866C',
        '#7A6A50', '#8B7D6B', '#9C8B7A', '#CD853F', '#DEB887',
        '#D2B48C', '#BDB76B'
    ],
    grass: {
        blades: ['#4a7c2a', '#5a8c3a', '#3a6c1a', '#6a9c4a', '#4a8c3a'],
        highlights: ['#6a9c4a', '#7aac5a', '#5a8c3a', '#8abc6a', '#6a9c5a']
    }
};

const WEATHER_TYPE_MAP = {
    sunny: 'sun',
    thunder: 'thunder',
    foggy: 'foggy',
    rain: 'rain',
    windy: 'windy',
    ocean: 'ocean',
    snow: 'snow'
};

const WEATHER_CONFIG = {
    sun: {
        init: (w, h, initial) => {
            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 150;
            return {
                x: w / 2 + Math.cos(angle) * distance,
                y: h / 3 + Math.sin(angle) * distance,
                vx: Math.cos(angle) * 1.5,
                vy: Math.sin(angle) * 1.5,
                size: Math.random() * 3 + 2,
                opacity: Math.random() * 0.6 + 0.4,
                pulsePhase: Math.random() * Math.PI * 2
            };
        }
    },
    thunder: {
        init: (w, h) => ({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 6,
            vy: Math.random() * 24 + 30,
            size: Math.random() * 3 + 2,
            opacity: Math.random() * 0.3 + 0.2,
            length: Math.random() * 20 + 15
        })
    },
    foggy: {
        init: (w, h) => ({
            x: Math.random() * w,
            y: Math.random() * -h,
            vx: (Math.random() - 0.5) * 0.04,
            vy: Math.random() * 0.4 + 0.2,
            size: Math.random() * 4 + 2,
            opacity: Math.random() * 0.3 + 0.1,
            swayAmount: Math.random() * 0.2 + 0.1,
            swaySpeed: Math.random() * 0.001 + 0.0005,
            swayAngle: Math.random() * Math.PI * 2
        })
    },
    snow: {
        init: () => ({
            vx: (Math.random() - 0.5) * 2,
            vy: Math.random() * 4 + 2,
            size: Math.random() * 3 + 1,
            opacity: Math.random() * 0.6 + 0.4,
            swayAmount: Math.random() * 4 + 2,
            swaySpeed: Math.random() * 0.02 + 0.01,
            swayAngle: Math.random() * Math.PI * 2
        })
    },
    rain: {
        init: () => ({
            vx: (Math.random() - 0.5) * 4,
            vy: Math.random() * 16 + 24,
            size: Math.random() * 2 + 1,
            opacity: Math.random() * 0.4 + 0.3,
            length: Math.random() * 15 + 10
        })
    },
    windy: {
        init: (w, h) => ({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: Math.random() * 6 + 4,
            vy: Math.random() * 2 + 1,
            size: Math.random() * 8 + 4,
            opacity: Math.random() * 0.4 + 0.6,
            swayAmount: Math.random() * 6 + 4,
            swaySpeed: Math.random() * 0.03 + 0.01,
            swayAngle: Math.random() * Math.PI * 2,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
            leafColor: null,
            leafType: Math.floor(Math.random() * 3)
        })
    },
    ocean: {
        SKY_COLORS: [
            { r: 200, g: 170, b: 180 },
            { r: 180, g: 150, b: 170 },
            { r: 160, g: 130, b: 160 },
            { r: 140, g: 110, b: 150 },
            { r: 120, g: 90, b: 130 }
        ],
        getPosition(w, h) {
            const centerBias = Math.random() < 0.7;
            const centerY = h * 0.5;
            if (centerBias) {
                return { x: Math.random() * w, y: centerY + Math.random() * h * 0.15 };
            }
            return { x: Math.random() * w, y: h * 0.5 + Math.random() * h * 0.5 };
        },
        getColor(verticalPos, colors) {
            const reflectionIntensity = 1 - verticalPos * 0.7;
            const colorChoice = colors[Math.floor(Math.random() * colors.length)];
            const brightness = 1.2 + reflectionIntensity * 0.3;
            return {
                particleColor: `rgba(${Math.min(255, colorChoice.r * brightness)}, ${Math.min(255, colorChoice.g * brightness)}, ${Math.min(255, colorChoice.b * brightness)}, ${0.3 + reflectionIntensity * 0.15})`,
                opacity: 0.2 + reflectionIntensity * 0.2
            };
        },
        init(w, h) {
            const { x, y } = this.getPosition(w, h);
            const verticalPos = (y - h * 0.5) / (h * 0.5);
            const thickness = 0.1 + verticalPos * 11.9;
            const baseSize = thickness * (0.5 + verticalPos * 0.5) * (1 + (Math.random() - 0.5) * 0.4);
            const colorData = this.getColor(verticalPos, this.SKY_COLORS);
            
            return {
                x, y,
                vx: (0.033 + verticalPos * 1.3) * (1 + (Math.random() - 0.5) * 0.1) * (Math.random() < 0.5 ? 1 : -1),
                vy: 0,
                baseSize,
                size: baseSize,
                thickness,
                shimmerPhase: Math.random() * Math.PI * 2,
                shimmerSpeed: Math.random() * 0.04 + 0.02,
                shimmerAmount: Math.random() * 0.3 + 0.2,
                particleColor: colorData.particleColor,
                opacity: colorData.opacity
            };
        }
    }
};

class Particle {
    constructor(type, canvasWidth, canvasHeight) {
        this.type = type;
        this.reset(canvasWidth, canvasHeight, true);
    }
    
    reset(canvasWidth, canvasHeight, initial = false) {
        const config = WEATHER_CONFIG[this.type];
        if (!config) return;

        const props = config.init(canvasWidth, canvasHeight, initial);
        Object.assign(this, props);

        // Set initial positions for types that don't specify x/y in config
        if (this.x === undefined) this.x = Math.random() * canvasWidth;
        if (this.y === undefined) this.y = initial ? Math.random() * canvasHeight : -20;

        // Initialize leaf color for windy
        if (this.type === 'windy' && this.leafColor === null) {
            this.leafColor = this.getRandomLeafColor();
        }
    }
    
    getRandomLeafColor() {
        return PALETTE.leaves[Math.floor(Math.random() * PALETTE.leaves.length)];
    }
    
    // Unified boundary helpers
    wrapHorizontal(canvasWidth, margin = 20) {
        if (this.x > canvasWidth + margin) this.x = -margin;
        if (this.x < -margin) this.x = canvasWidth + margin;
    }
    
    resetAtTop(canvasWidth, canvasHeight, margin = 20) {
        if (this.y > canvasHeight + margin) {
            this.y = -margin;
            this.x = Math.random() * canvasWidth;
        }
    }
    
    // Unified sway calculation
    getSwayX() {
        return this.vx + Math.sin(this.swayAngle) * this.swayAmount;
    }
    
    update(canvasWidth, canvasHeight, weatherType, deltaTime = 0) {
        // Use delta time for frame-independent animation, fallback to 60fps if no delta
        const dt = deltaTime || (1/60);
        
        this.swayAngle += this.swaySpeed * dt * TIME_SCALE;
        
        switch (weatherType) {
            case 'sunny':
                this.pulsePhase += 0.02 * dt * TIME_SCALE;
                this.x += this.vx * dt * TIME_SCALE;
                this.y += this.vy * dt * TIME_SCALE;
                
                // Teleport sun rays back to sun center when hitting edges
                if (this.x > canvasWidth + 50 || this.x < -50 || 
                    this.y > canvasHeight + 50 || this.y < -50) {
                    const centerX = canvasWidth / 2;
                    const centerY = canvasHeight / 3;
                    const angle = Math.random() * Math.PI * 2;
                    
                    this.x = centerX + Math.cos(angle) * 20;
                    this.y = centerY + Math.sin(angle) * 20;
                    this.vx = Math.cos(angle) * 0.5;
                    this.vy = Math.sin(angle) * 0.5;
                }
                break;
                
            case 'thunder':
            case 'rain':
                // Straight falling particles: thunder, rain
                this.x += this.vx * dt * TIME_SCALE;
                this.y += this.vy * dt * TIME_SCALE;
                this.wrapHorizontal(canvasWidth, 20);
                this.resetAtTop(canvasWidth, canvasHeight, 20);
                break;
                
            case 'foggy':
            case 'snow':
                // Swaying falling particles: foggy, snow
                this.x += this.getSwayX() * dt * TIME_SCALE;
                this.y += this.vy * dt * TIME_SCALE;
                this.wrapHorizontal(canvasWidth, 20);
                this.resetAtTop(canvasWidth, canvasHeight, 20);
                break;
                
            case 'windy':
                // Swaying with rotation for leaves
                this.x += this.getSwayX() * dt * TIME_SCALE;
                this.y += this.vy * dt * TIME_SCALE;
                this.rotation += this.rotationSpeed * dt * TIME_SCALE;
                this.wrapHorizontal(canvasWidth, 50);
                this.resetAtTop(canvasWidth, canvasHeight, 50);
                break;
                
            case 'ocean':
                this.shimmerPhase += this.shimmerSpeed * dt * TIME_SCALE;
                this.x += this.vx * dt * TIME_SCALE;
                this.size = this.baseSize * (1 + Math.sin(this.shimmerPhase) * this.shimmerAmount);
                this.wrapHorizontal(canvasWidth, 50);
                break;
        }
    }
    
    drawLeaf(ctx, color = null) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        ctx.fillStyle = color || this.leafColor;
        ctx.strokeStyle = color || this.leafColor;
        ctx.lineWidth = 1;
        
        switch (this.leafType) {
            case 0: // Maple leaf shape
                this.drawMapleLeaf(ctx);
                break;
            case 1: // Oak leaf shape
                this.drawOakLeaf(ctx);
                break;
            case 2: // Simple elliptical leaf
                this.drawSimpleLeaf(ctx);
                break;
        }
        
        ctx.restore();
    }
    
    drawMapleLeaf(ctx) {
        const scale = this.size / 4;
        ctx.scale(scale, scale);
        
        ctx.beginPath();
        // Simplified maple leaf - just a basic shape
        ctx.moveTo(0, -6);
        ctx.lineTo(-4, -2);
        ctx.lineTo(-6, 2);
        ctx.lineTo(-2, 4);
        ctx.lineTo(2, 4);
        ctx.lineTo(6, 2);
        ctx.lineTo(4, -2);
        ctx.closePath();
        ctx.fill();
    }
    
    drawOakLeaf(ctx) {
        const scale = this.size / 4;
        ctx.scale(scale, scale);
        
        ctx.beginPath();
        // Simplified oak leaf - basic teardrop
        ctx.moveTo(0, -6);
        ctx.bezierCurveTo(-4, -3, -4, 3, 0, 6);
        ctx.bezierCurveTo(4, 3, 4, -3, 0, -6);
        ctx.closePath();
        ctx.fill();
    }
    
    drawSimpleLeaf(ctx) {
        const scale = this.size / 4;
        ctx.scale(scale, scale);
        
        ctx.beginPath();
        // Very simple leaf shape
        ctx.ellipse(0, 0, 2, 5, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Drawing helpers
    drawLine(ctx, x1, y1, x2, y2, options = {}) {
        const { color = '#ffffff', width = 1, cap = 'round' } = options;
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = cap;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
    
    drawCircle(ctx, x, y, radius, options = {}) {
        const { color = '#ffffff', shadowBlur = 0, shadowColor = null } = options;
        ctx.fillStyle = color;
        if (shadowBlur) {
            ctx.shadowBlur = shadowBlur;
            ctx.shadowColor = shadowColor || color;
        }
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        if (shadowBlur) {
            ctx.shadowBlur = 0;
        }
    }
    
    draw(ctx, color = null) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        
        switch (this.type) {
            case 'sun':
                // Draw sun ray as glowing line
                const pulseOpacity = (Math.sin(this.pulsePhase) + 1) * 0.5;
                ctx.globalAlpha = this.opacity * pulseOpacity;
                
                const gradient = ctx.createLinearGradient(
                    this.x, this.y,
                    this.x - this.vx * 50, this.y - this.vy * 50
                );
                gradient.addColorStop(0, PALETTE.sun.rayStart);
                gradient.addColorStop(0.5, PALETTE.sun.rayMid);
                gradient.addColorStop(1, PALETTE.sun.rayEnd);
                
                ctx.strokeStyle = gradient;
                ctx.lineWidth = this.size * 2;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x - this.vx * 30, this.y - this.vy * 30);
                ctx.stroke();
                break;
                
            case 'rain':
            case 'thunder':
                // Unified rain drop drawing - only color differs
                const dropColor = this.type === 'thunder' 
                    ? (color || PALETTE.drops.thunder) 
                    : (color || PALETTE.drops.rain);
                this.drawLine(ctx, this.x, this.y, 
                    this.x - this.vx * 0.5, this.y - this.length,
                    { color: dropColor, width: this.size });
                break;
                
            case 'foggy':
                this.drawCircle(ctx, this.x, this.y, this.size, {
                    color: color || PALETTE.particles.foggy,
                    shadowBlur: 3,
                    shadowColor: PALETTE.particles.foggyShadow
                });
                break;
                
            case 'snow':
                this.drawCircle(ctx, this.x, this.y, this.size, {
                    color: color || PALETTE.particles.snow,
                    shadowBlur: 10,
                    shadowColor: PALETTE.particles.snowShadow
                });
                break;
                
            case 'windy':
                // Draw autumn leaf
                this.drawLeaf(ctx, color);
                break;
                
            case 'ocean':
                ctx.fillStyle = color || this.particleColor;
                ctx.shadowBlur = 6;
                ctx.shadowColor = PALETTE.particles.oceanShimmer;
                ctx.beginPath();
                
                // Create shamshed ellipse: very wide and thin based on thickness
                const ellipseWidth = Math.max(0.1, this.size * 4);
                const ellipseHeight = Math.max(0.1, this.thickness * 0.3);
                
                ctx.ellipse(this.x, this.y, ellipseWidth, ellipseHeight, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        
        ctx.restore();
    }
}

export class WeatherRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.particles = [];
        this.currentWeather = 'snow';
        this.particleCount = 200;
        this.lightning = {
            active: false,
            x: 0,
            y: 0,
            endX: 0,
            endY: 0,
            opacity: 0,
            branches: []
        };
        this.grass = {
            blades: [],
            time: 0
        };
    }
    
    resize(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        
        // Recreate grass blades when resized
        this.initGrass();
        
        // Recreate particles when resized so they reposition correctly
        // Only needed for sun (centers at h/3) and ocean (centers at h*0.5)
        // Other weather types naturally adapt via wrapping/resetting at edges
        if (this.particles.length > 0 && (this.currentWeather === 'sunny' || this.currentWeather === 'ocean')) {
            this.createParticles();
        }
    }
    
    setWeather(weather, particleCount) {
        // Only recreate particles if weather actually changes or particle count changes
        // But always create particles on first load (when particles array is empty)
        if (this.currentWeather === weather && this.particleCount === particleCount && this.particles.length > 0) {
            return; // Same weather with existing particles, don't reset
        }
        
        this.currentWeather = weather;
        this.particleCount = particleCount;
        this.createParticles();
        
        // Initialize grass for sunny weather
        if (weather === 'sunny') {
            this.initGrass();
        }
    }
    
    createParticles() {
        this.particles = [];
        
        if (this.particleCount === 0) {
            return;
        }
        
        const particleType = WEATHER_TYPE_MAP[this.currentWeather] || 'snow';
        
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(new Particle(particleType, this.canvasWidth, this.canvasHeight));
        }
    }
    
    reset() {
        // Clear all particles
        this.particles = [];
        
        // Reset lightning state
        this.lightning = {
            active: false,
            x: 0,
            y: 0,
            endX: 0,
            endY: 0,
            opacity: 0,
            branches: []
        };
        
        // Reset weather to default
        this.currentWeather = 'snow';
        this.particleCount = 0;
    }
    
    update(deltaTime = 0) {
        this.particles.forEach(particle => {
            particle.update(this.canvasWidth, this.canvasHeight, this.currentWeather, deltaTime);
        });
        
        // Update grass animation for sunny weather
        if (this.currentWeather === 'sunny') {
            this.grass.time += deltaTime || 0.016;
        }
    }
    
    draw(ctx) {
        // Draw lightning for thunder weather
        if (this.currentWeather === 'thunder') {
            this.drawLightning(ctx);
            this.updateLightning();
        }
        
        // Apply silhouette effect during lightning
        let particleOpacity = 1;
        let particleColor = null;
        
        if (this.currentWeather === 'thunder' && this.lightning.active && this.lightning.opacity > 0.5) {
            particleOpacity = 1;
            particleColor = 'rgba(0, 0, 0, 1)';
        }
        
        // Draw particles
        this.particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha *= particleOpacity;
            if (particleColor) {
                particle.draw(ctx, particleColor);
            } else {
                particle.draw(ctx);
            }
            ctx.restore();
        });
        
        // Draw sun for sunny weather (drawn over particles)
        if (this.currentWeather === 'sunny') {
            this.drawSun(ctx);
            this.drawGrass(ctx);
        }
        
        ctx.restore();
    }
    
    drawLightning(ctx) {
        if (!this.lightning.active) return;
        
        ctx.save();
        
        // Brighten sky when lightning strikes - enhanced whitening effect
        if (this.lightning.opacity > 0.3) {
            // Full screen white overlay for maximum whitening
            ctx.save();
            ctx.fillStyle = `rgba(255, 255, 255, ${this.lightning.opacity * 0.15})`;
            ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
            ctx.restore();
            
            const skyFlash = ctx.createRadialGradient(
                this.lightning.x, this.lightning.y, 0,
                this.lightning.x, this.lightning.y, this.canvasWidth * 0.8
            );
            skyFlash.addColorStop(0, PALETTE.lightning.skyFlashInner(this.lightning.opacity));
            skyFlash.addColorStop(0.4, PALETTE.lightning.skyFlashMid(this.lightning.opacity));
            skyFlash.addColorStop(1, PALETTE.lightning.skyFlashOuter);
            
            ctx.fillStyle = skyFlash;
            ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        }
        
        // Draw main lightning bolt with bloom effect
        const mainGradient = ctx.createLinearGradient(
            this.lightning.x, this.lightning.y,
            this.lightning.endX, this.lightning.endY
        );
        mainGradient.addColorStop(0, PALETTE.lightning.boltStart(this.lightning.opacity));
        mainGradient.addColorStop(0.3, PALETTE.lightning.boltMid1(this.lightning.opacity));
        mainGradient.addColorStop(0.7, PALETTE.lightning.boltMid2(this.lightning.opacity));
        mainGradient.addColorStop(1, PALETTE.lightning.boltEnd(this.lightning.opacity));
        
        // Draw thick meandering lightning bolt with length-based thickness and tapering
        const lengthFactor = Math.min(2, this.lightning.mainLength / 200); // Thicker for longer bolts, max 2x
        
        // Draw main bolt as continuous path with tapering thickness
        const points = this.lightning.points;
        
        for (let i = 3; i >= 0; i--) {
            // Create gradient along the path for natural brightness
            const gradient = ctx.createLinearGradient(
                points[0].x, points[0].y,
                points[points.length - 1].x, points[points.length - 1].y
            );
            gradient.addColorStop(0, PALETTE.lightning.boltStart(this.lightning.opacity * (0.3 + i * 0.2)));
            gradient.addColorStop(0.5, PALETTE.lightning.boltStart(this.lightning.opacity * (0.25 + i * 0.18)));
            gradient.addColorStop(1, PALETTE.lightning.boltStart(this.lightning.opacity * (0.2 + i * 0.15)));
            
            ctx.strokeStyle = gradient;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // Add glow for outer layers - enhanced glow effect
            if (i < 3) {
                ctx.shadowBlur = 60 + i * 20;
                ctx.shadowColor = i === 0 
                    ? PALETTE.lightning.glowCore(this.lightning.opacity * 0.5)
                    : PALETTE.lightning.glowOuter(this.lightning.opacity * 0.3);
            }
            
            // Draw the entire path with variable width using line segments
            ctx.beginPath();
            for (let segment = 0; segment < points.length - 1; segment++) {
                const segmentProgress = segment / (points.length - 1); // 0 at start, 1 at end
                const taperFactor = 1 - segmentProgress * 0.7; // Taper to 30% thickness at tip
                const width = ((8 - i * 2) + Math.random() * 2) * lengthFactor * taperFactor;
                
                if (segment === 0) {
                    ctx.moveTo(points[segment].x, points[segment].y);
                }
                
                // Set width for this segment and draw to next point
                ctx.lineWidth = width;
                ctx.lineTo(points[segment + 1].x, points[segment + 1].y);
            }
            ctx.stroke();
        }
        
        // Draw branches and searching trails with depth-based thickness
        this.lightning.branches.forEach(branch => {
            const branchDepth = branch.depth || 0;
            const isTrail = branch.isTrail || false;
            const branchLength = branch.length || 30; // Use actual branch length
            const maxDepth = 5; // Updated for new depth system
            
            for (let i = 2; i >= 0; i--) {
                let baseWidth;
                
                // Calculate length-based thickness factor
                const lengthFactor = Math.min(1.5, branchLength / 40); // Thicker for longer branches, max 1.5x
                
                if (isTrail) {
                    // Searching trails are thicker now, but still affected by length
                    baseWidth = ((1.5 - i * 0.3) + Math.random() * 0.3) * lengthFactor;
                } else {
                    // Regular branches get progressively thinner with depth
                    const depthThickness = 2 - (branchDepth * 0.5); // Each level 0.5 thinner
                    baseWidth = (depthThickness - i * 0.3 + Math.random() * 0.3) * lengthFactor;
                }
                
                const depthFactor = 1 - (branchDepth / maxDepth) * 0.9; // More aggressive thickness reduction
                const width = baseWidth * depthFactor;
                
                let opacity = this.lightning.opacity * (0.2 + i * 0.1) * (1 - branchDepth * 0.3);
                if (isTrail) opacity *= 0.6; // Trails are dimmer
                
                ctx.strokeStyle = PALETTE.lightning.branch(opacity);
                ctx.lineWidth = Math.max(isTrail ? 0.5 : 0.2, width);
                ctx.lineCap = 'round';
                
                if (i === 0) {
                    const glowFactor = isTrail ? 0.5 : 1.0;
                    ctx.shadowBlur = 25 * (1 - branchDepth * 0.3) * glowFactor;
                    ctx.shadowColor = PALETTE.lightning.glowOuter(opacity * 0.5);
                }
                
                ctx.beginPath();
                ctx.moveTo(branch.startX, branch.startY);
                ctx.lineTo(branch.endX, branch.endY);
                ctx.stroke();
            }
        });
        
        ctx.restore();
    }
    
    updateLightning() {
        if (!this.lightning.active) {
            // Much rarer lightning (0.3% chance per frame)
            if (Math.random() < 0.003) {
                this.createLightning();
            }
            return;
        }
        
        // Slower fade out for longer visibility
        this.lightning.opacity -= 0.02;
        if (this.lightning.opacity <= 0) {
            this.lightning.active = false;
        }
    }
    
    createLightning() {
        const startX = Math.random() * this.canvasWidth;
        const startY = 0;
        const endX = startX + (Math.random() - 0.5) * 200;
        const endY = 100 + Math.random() * (this.canvasHeight * 0.6);
        
        // Calculate main bolt length for thickness
        const mainLength = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        
        // Create main lightning bolt with meandering path
        const segments = 8 + Math.floor(Math.random() * 4); // 8-11 segments
        const points = [{x: startX, y: startY}];
        
        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            const baseX = startX + (endX - startX) * t;
            const baseY = startY + (endY - startY) * t;
            
            // Add meandering/swirl effect
            const meanderAmount = 30 * (1 - t); // Less meandering near the end
            const meanderX = baseX + (Math.random() - 0.5) * meanderAmount;
            const meanderY = baseY + (Math.random() - 0.5) * meanderAmount * 0.5;
            
            points.push({x: meanderX, y: meanderY});
        }
        points.push({x: endX, y: endY}); // Ensure end point is exact
        
        this.lightning = {
            active: true,
            x: startX,
            y: startY,
            endX: endX,
            endY: endY,
            points: points, // Store meandering main path
            mainLength: mainLength, // Store length for thickness calculation
            opacity: 1,
            branches: this.createLightningBranches(points, 0, 3) // Depth 3 for branches, depth 5 for main only
        };
        
        // Trigger thunder sound
        this.triggerThunder();
    }
    
    createLightningBranches(points, depth = 0, maxDepth = 3) {
        const branches = [];
        
        if (depth >= maxDepth) return branches;
        
        // Create branches at random nodes along the main path
        const nodeCount = 2 + Math.floor(Math.random() * 2); // 2-3 branch nodes
        const mainNodes = [];
        
        for (let i = 0; i < nodeCount; i++) {
            // Select random nodes along the main path, avoiding start and end
            const nodeIndex = 1 + Math.floor(Math.random() * (points.length - 2));
            mainNodes.push(points[nodeIndex]);
        }
        
        mainNodes.forEach(node => {
            const branchCount = 2 + Math.floor(Math.random() * 2); // 2-3 branches per node
            
            for (let i = 0; i < branchCount; i++) {
                // Smaller branches from nodes
                const angleVariation = (Math.random() - 0.5) * Math.PI / 2; // ±45 degrees
                let branchLength = 20 + Math.random() * 30 - (depth * 5); // Shorter branches with depth
                
                // Reduce length for subsequent branch levels
                if (depth > 0) {
                    branchLength *= (1 - depth * 0.3); // Each level 30% shorter
                }
                
                const branchEndX = node.x + Math.cos(angleVariation) * branchLength;
                const branchEndY = node.y + Math.sin(angleVariation) * branchLength;
                
                branches.push({
                    startX: node.x,
                    startY: node.y,
                    endX: branchEndX,
                    endY: branchEndY,
                    depth: depth,
                    length: branchLength // Store length for thickness calculation
                });
                
                // Add searching trails (+2-3 depth only)
                if (depth < 2 && Math.random() < 0.7) { // Only for first 2 depths, 70% chance
                    const trailCount = 1 + Math.floor(Math.random() * 2); // 1-2 searching trails
                    for (let j = 0; j < trailCount; j++) {
                        const trailAngle = angleVariation + (Math.random() - 0.5) * Math.PI / 4; // ±22.5 degrees from branch
                        const trailLength = branchLength * (0.3 + Math.random() * 0.4); // 30-70% of branch length
                        
                        const trailEndX = branchEndX + Math.cos(trailAngle) * trailLength;
                        const trailEndY = branchEndY + Math.sin(trailAngle) * trailLength;
                        
                        branches.push({
                            startX: branchEndX,
                            startY: branchEndY,
                            endX: trailEndX,
                            endY: trailEndY,
                            depth: depth + 2, // Depth +2 for searching trails
                            isTrail: true,
                            length: trailLength // Store length for thickness calculation
                        });
                    }
                }
                
                // Recursively create sub-branches (much smaller)
                if (depth < maxDepth - 1 && Math.random() < 0.4) { // 40% chance to continue branching
                    const subBranches = this.createLightningBranches([{x: branchEndX, y: branchEndY}], depth + 1, maxDepth);
                    branches.push(...subBranches);
                }
            }
        });
        
        return branches;
    }
    
    triggerThunder() {
        // Calculate position-based audio parameters
        const centerX = this.canvasWidth / 2;
        const lightningX = this.lightning.x;
        const distanceFromCenter = Math.abs(lightningX - centerX) / centerX; // 0 = center, 1 = edge
        
        // Calculate panning: -1 (left) to 1 (right)
        const pan = (lightningX - centerX) / centerX;
        
        // Calculate time delay based on distance (closer = shorter delay)
        const baseDelay = 500; // Base 500ms delay
        const distanceDelay = distanceFromCenter * 300; // Up to 300ms additional delay
        const totalDelay = baseDelay + distanceDelay;
        
        // Delay thunder sound with position-based timing
        setTimeout(() => {
            if (this.onThunder) {
                this.onThunder({
                    pan: pan,
                    distance: distanceFromCenter
                });
            }
        }, totalDelay);
    }
    
    drawSun(ctx) {
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 3;
        const sunRadius = 60;
        
        const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, sunRadius * 3);
        glowGradient.addColorStop(0, PALETTE.sun.glowInner);
        glowGradient.addColorStop(0.3, PALETTE.sun.glowMid);
        glowGradient.addColorStop(0.6, PALETTE.sun.glowOuter);
        glowGradient.addColorStop(1, PALETTE.sun.glowEdge);
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, sunRadius * 3, 0, Math.PI * 2);
        ctx.fill();
        
        const sunGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, sunRadius);
        sunGradient.addColorStop(0, PALETTE.sun.coreInner);
        sunGradient.addColorStop(0.7, PALETTE.sun.coreMid);
        sunGradient.addColorStop(1, PALETTE.sun.coreOuter);
        
        ctx.fillStyle = sunGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, sunRadius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    initGrass() {
        if (!this.canvasWidth || !this.canvasHeight) return;
        
        const bladeCount = Math.floor(this.canvasWidth / 12); // Reduced count: one blade every 12 pixels
        this.grass.blades = [];
        
        for (let i = 0; i < bladeCount; i++) {
            const x = (i / bladeCount) * this.canvasWidth + (Math.random() - 0.5) * 8;
            const baseHeight = 90 + Math.random() * 150; // 90-240px height (3x larger)
            const heightVariation = Math.random() * 60;
            
            this.grass.blades.push({
                x: x,
                baseY: this.canvasHeight,
                height: baseHeight + heightVariation,
                width: 6 + Math.random() * 9, // 3x wider: 6-15px
                color: PALETTE.grass.blades[Math.floor(Math.random() * PALETTE.grass.blades.length)],
                highlight: PALETTE.grass.highlights[Math.floor(Math.random() * PALETTE.grass.highlights.length)],
                swaySpeed: 0.5 + Math.random() * 1.5,
                swayOffset: Math.random() * Math.PI * 2,
                stiffness: 0.3 + Math.random() * 0.4,
                curveAmount: 30 + Math.random() * 60 // 3x curve amount
            });
        }
    }
    
    drawGrass(ctx) {
        if (this.grass.blades.length === 0) {
            this.initGrass();
        }
        
        ctx.save();
        
        const time = this.grass.time;
        const windStrength = 15 + Math.sin(time * 0.5) * 5; // Varying wind strength
        
        this.grass.blades.forEach(blade => {
            // Calculate sway based on wind and blade properties
            const sway = Math.sin(time * blade.swaySpeed + blade.swayOffset) * windStrength * blade.stiffness;
            const tipX = blade.x + sway + blade.curveAmount;
            const tipY = blade.baseY - blade.height + Math.abs(sway) * 0.3;
            
            // Control point for quadratic curve
            const ctrlX = blade.x + sway * 0.5;
            const ctrlY = blade.baseY - blade.height * 0.6;
            
            // Draw grass blade as curved path
            ctx.beginPath();
            ctx.moveTo(blade.x - blade.width / 2, blade.baseY);
            
            // Left side curve
            ctx.quadraticCurveTo(
                blade.x - blade.width / 4, 
                blade.baseY - blade.height * 0.5,
                tipX, 
                tipY
            );
            
            // Right side curve
            ctx.quadraticCurveTo(
                blade.x + blade.width / 4,
                blade.baseY - blade.height * 0.5,
                blade.x + blade.width / 2,
                blade.baseY
            );
            
            ctx.closePath();
            
            // Gradient from base to tip
            const gradient = ctx.createLinearGradient(blade.x, blade.baseY, tipX, tipY);
            gradient.addColorStop(0, blade.color);
            gradient.addColorStop(0.7, blade.highlight);
            gradient.addColorStop(1, blade.highlight);
            
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Add subtle highlight on the left edge
            ctx.beginPath();
            ctx.moveTo(blade.x - blade.width / 2, blade.baseY);
            ctx.quadraticCurveTo(
                blade.x - blade.width / 4,
                blade.baseY - blade.height * 0.5,
                tipX,
                tipY
            );
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        });
        
        ctx.restore();
    }
}
