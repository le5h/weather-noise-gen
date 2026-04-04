/**
 * Weather Particle Renderer
 * Handles all particle animation and rendering logic
 */

class Particle {
    constructor(type, canvasWidth, canvasHeight) {
        this.type = type;
        this.reset(canvasWidth, canvasHeight, true);
    }
    
    reset(canvasWidth, canvasHeight, initial = false) {
        this.x = Math.random() * canvasWidth;
        this.y = initial ? Math.random() * canvasHeight : -20;
        
        switch (this.type) {
            case 'sun':
                // Sun rays emanating from center - make longer and brighter
                const angle = Math.random() * Math.PI * 2;
                const distance = 50 + Math.random() * 150; // Closer to sun for brighter effect
                this.x = canvasWidth / 2 + Math.cos(angle) * distance;
                this.y = canvasHeight / 3 + Math.sin(angle) * distance;
                this.vx = Math.cos(angle) * 1.5; // Faster movement for longer rays
                this.vy = Math.sin(angle) * 1.5; // Faster movement for longer rays
                this.size = Math.random() * 3 + 2; // Larger size for brightness
                this.opacity = Math.random() * 0.6 + 0.4; // Brighter opacity
                this.pulsePhase = Math.random() * Math.PI * 2;
                break;
                
            case 'thunder':
                // Rain particles for thunderstorm - start in place
                this.x = Math.random() * canvasWidth;
                this.y = Math.random() * canvasHeight; // Start randomly in canvas, not from top
                this.vx = (Math.random() - 0.5) * 6; // Increased from 3 to 6
                this.vy = Math.random() * 24 + 30; // Increased from 12+15 to 24+30
                this.size = Math.random() * 3 + 2;
                this.opacity = Math.random() * 0.3 + 0.2; // Reduced from 0.6+0.4 to 0.3+0.2 for more transparency
                this.length = Math.random() * 20 + 15;
                break;
                
            case 'foggy':
                // Dark ash particles for foggy weather
                this.x = Math.random() * canvasWidth;
                this.y = Math.random() * -canvasHeight;
                this.vx = (Math.random() - 0.5) * 0.04; // Increased from 0.02 to 0.04
                this.vy = Math.random() * 0.4 + 0.2; // Increased from 0.2+0.1 to 0.4+0.2
                this.size = Math.random() * 4 + 2;
                this.opacity = Math.random() * 0.3 + 0.1;
                this.swayAmount = Math.random() * 0.2 + 0.1; // Increased sway amount
                this.swaySpeed = Math.random() * 0.001 + 0.0005; // Very slow sway
                this.swayAngle = Math.random() * Math.PI * 2;
                break;
                
            case 'snow':
                this.vx = (Math.random() - 0.5) * 2; // Increased from 1 to 2
                this.vy = Math.random() * 4 + 2; // Increased from 2+1 to 4+2
                this.size = Math.random() * 3 + 1;
                this.opacity = Math.random() * 0.6 + 0.4;
                this.swayAmount = Math.random() * 4 + 2; // Increased sway amount
                this.swaySpeed = Math.random() * 0.02 + 0.01;
                this.swayAngle = Math.random() * Math.PI * 2;
                break;
                
            case 'rain':
                this.vx = (Math.random() - 0.5) * 4; // Increased from 2 to 4
                this.vy = Math.random() * 16 + 24; // Increased from 8+12 to 16+24
                this.size = Math.random() * 2 + 1;
                this.opacity = Math.random() * 0.4 + 0.3;
                this.length = Math.random() * 15 + 10;
                break;
                
            case 'windy':
                // Autumn falling leaves
                this.x = Math.random() * canvasWidth;
                this.y = Math.random() * canvasHeight;
                this.vx = Math.random() * 6 + 4; // Wind movement
                this.vy = Math.random() * 2 + 1; // Gentle falling
                this.size = Math.random() * 8 + 4; // Larger leaf size
                this.opacity = Math.random() * 0.4 + 0.6; // Good visibility
                this.swayAmount = Math.random() * 6 + 4; // More sway for leaves
                this.swaySpeed = Math.random() * 0.03 + 0.01;
                this.swayAngle = Math.random() * Math.PI * 2;
                this.rotation = Math.random() * Math.PI * 2; // Random initial rotation
                this.rotationSpeed = (Math.random() - 0.5) * 0.1; // Rotation speed
                this.leafColor = this.getRandomLeafColor(); // Autumn leaf color
                this.leafType = Math.floor(Math.random() * 3); // Different leaf shapes
                break;
                
            case 'ocean':
                // Ocean shimmer particles with specified requirements
                // Y position with falling distribution - more particles near horizon
                const centerBias = Math.random() < 0.7; // 70% chance to spawn near horizon
                if (centerBias) {
                    // Y near horizon with gaussian-like distribution
                    const centerY = canvasHeight * 0.5; // Horizon line
                    const spreadY = Math.random() * canvasHeight * 0.15; // 15% height spread below horizon
                    
                    this.x = Math.random() * canvasWidth; // X completely random
                    this.y = centerY + Math.random() * spreadY;
                } else {
                    // Spawn anywhere in water area
                    this.x = Math.random() * canvasWidth; // X completely random
                    this.y = canvasHeight * 0.5 + Math.random() * canvasHeight * 0.5;
                }
                
                // Vertical position determines thickness: 50% = near 0px, 100% = 12px
                const verticalPosition = (this.y - canvasHeight * 0.5) / (canvasHeight * 0.5); // 0 to 1
                const thickness = 0.1 + verticalPosition * 11.9; // 0.1px to 12px (near zero at horizon)
                
                // Deterministic properties: horizon = almost 0, lower = bigger, lower = faster
                // Using vertical position where higher (closer to 100% bottom) = bigger and faster
                const distanceFactor = verticalPosition; // 0 at 50%, 1 at 100% - so higher = faster/bigger
                
                // Base size and speed with deterministic relationship
                const baseSpeed = 0.033 + distanceFactor * 1.3; // 0.033-1.33 range, 3x slower
                const baseSize = thickness * (0.5 + distanceFactor * 0.5); // Size based on thickness + position
                
                // Apply variations: 20% size, 5% speed
                const sizeVariation = 1 + (Math.random() - 0.5) * 0.4; // 80%-120% of base size
                const speedVariation = 1 + (Math.random() - 0.5) * 0.1; // 95%-105% of base speed
                
                // Direction: left to right or right to left
                const direction = Math.random() < 0.5 ? 1 : -1;
                
                this.vx = baseSpeed * speedVariation * direction;
                this.vy = 0; // No vertical movement
                
                this.baseSize = baseSize * sizeVariation;
                this.size = this.baseSize;
                this.thickness = thickness; // Store thickness for shamshed ellipse
                
                // Shimmer properties for size changes while moving
                this.shimmerPhase = Math.random() * Math.PI * 2;
                this.shimmerSpeed = Math.random() * 0.04 + 0.02; // Speed of size change
                this.shimmerAmount = Math.random() * 0.3 + 0.2; // Amplitude of size change
                
                // Ocean shimmer colors based on sky but brighter than water
                const reflectionIntensity = 1 - verticalPosition * 0.7; // More reflection near horizon
                
                // Sky colors but ensure they're brighter than marine water
                const skyColors = [
                    { r: 200, g: 170, b: 180 }, // Bright warm pinkish-purple
                    { r: 180, g: 150, b: 170 }, // Bright lighter purple  
                    { r: 160, g: 130, b: 160 }, // Bright warm purple-blue
                    { r: 140, g: 110, b: 150 }, // Bright purple-blue
                    { r: 120, g: 90, b: 130 }    // Bright twilight purple
                ];
                
                const colorChoice = skyColors[Math.floor(Math.random() * skyColors.length)];
                const brightness = 1.2 + reflectionIntensity * 0.3; // 1.2 to 1.5 brightness
                
                this.particleColor = `rgba(${Math.min(255, colorChoice.r * brightness)}, ${Math.min(255, colorChoice.g * brightness)}, ${Math.min(255, colorChoice.b * brightness)}, ${0.3 + reflectionIntensity * 0.15})`;
                
                this.opacity = 0.2 + reflectionIntensity * 0.2; // Much more subtle
                break;
        }
    }
    
    getRandomLeafColor() {
        const autumnColors = [
            '#8B7355', // Muted brown
            '#A0826D', // Light brown
            '#BC9A6A', // Sandy brown
            '#C4A57B', // Beige
            '#9B866C', // Tan
            '#7A6A50', // Dark tan
            '#8B7D6B', // Olive brown
            '#9C8B7A', // Dusty brown
            '#CD853F', // Peru (muted)
            '#DEB887', // Burlywood
            '#D2B48C', // Tan
            '#BDB76B', // Khaki
            '#BDB76B', // Dark khaki
            '#8B7355', // Muted brown
            '#A0826D', // Light brown
            '#9C8B7A', // Dusty brown
            '#8B7D6B', // Olive brown
            '#7A6A50'  // Dark tan
        ];
        return autumnColors[Math.floor(Math.random() * autumnColors.length)];
    }
    
    update(canvasWidth, canvasHeight, weatherType, deltaTime = 0) {
        // Use delta time for frame-independent animation, fallback to 60fps if no delta
        const dt = deltaTime || (1/60);
        
        this.swayAngle += this.swaySpeed * dt * 60; // Normalize to 60fps baseline
        
        switch (weatherType) {
            case 'sunny':
                this.pulsePhase += 0.02 * dt * 60;
                this.x += this.vx * dt * 60;
                this.y += this.vy * dt * 60;
                
                // Teleport sun rays back to sun center when hitting edges
                if (this.x > canvasWidth + 50 || this.x < -50 || 
                    this.y > canvasHeight + 50 || this.y < -50) {
                    // Reset to sun center with new random direction
                    const centerX = canvasWidth / 2;
                    const centerY = canvasHeight / 3;
                    const angle = Math.random() * Math.PI * 2;
                    
                    this.x = centerX + Math.cos(angle) * 20; // Start near sun
                    this.y = centerY + Math.sin(angle) * 20;
                    this.vx = Math.cos(angle) * 0.5;
                    this.vy = Math.sin(angle) * 0.5;
                }
                break;
                
            case 'thunder':
                this.x += this.vx * dt * 60;
                this.y += this.vy * dt * 60;
                
                // Wrap thunder rain horizontally
                if (this.x > canvasWidth + 20) this.x = -20;
                if (this.x < -20) this.x = canvasWidth + 20;
                
                // Reset from top when falling off bottom
                if (this.y > canvasHeight + 20) {
                    this.y = -20;
                    this.x = Math.random() * canvasWidth;
                }
                break;
                
            case 'foggy':
                this.x += (this.vx + Math.sin(this.swayAngle) * this.swayAmount) * dt * 60;
                this.y += this.vy * dt * 60;
                
                // Wrap ash particles horizontally
                if (this.x > canvasWidth + 20) this.x = -20;
                if (this.x < -20) this.x = canvasWidth + 20;
                
                // Reset from top when falling off bottom (very slow)
                if (this.y > canvasHeight + 20) {
                    this.y = -20;
                    this.x = Math.random() * canvasWidth;
                }
                break;
                
            case 'snow':
                this.x += (this.vx + Math.sin(this.swayAngle) * this.swayAmount) * dt * 60;
                this.y += this.vy * dt * 60;
                
                // Wrap snow particles horizontally
                if (this.x > canvasWidth + 20) this.x = -20;
                if (this.x < -20) this.x = canvasWidth + 20;
                
                // Reset from top when falling off bottom
                if (this.y > canvasHeight + 20) {
                    this.y = -20;
                    this.x = Math.random() * canvasWidth;
                }
                break;
                
            case 'rain':
                this.x += this.vx * dt * 60;
                this.y += this.vy * dt * 60;
                
                // Wrap rain horizontally
                if (this.x > canvasWidth + 20) this.x = -20;
                if (this.x < -20) this.x = canvasWidth + 20;
                
                // Reset from top when falling off bottom
                if (this.y > canvasHeight + 20) {
                    this.y = -20;
                    this.x = Math.random() * canvasWidth;
                }
                break;
                
            case 'windy':
                this.x += (this.vx + Math.sin(this.swayAngle) * this.swayAmount) * dt * 60;
                this.y += this.vy * dt * 60;
                this.rotation += this.rotationSpeed * dt * 60; // Update rotation
                
                // Wrap leaves horizontally, reset from top when falling off bottom
                if (this.x > canvasWidth + 50) this.x = -50;
                if (this.x < -50) this.x = canvasWidth + 50;
                
                // Reset from top when falling off bottom (like falling leaves)
                if (this.y > canvasHeight + 50) {
                    this.y = -50;
                    this.x = Math.random() * canvasWidth;
                }
                break;
                
            case 'ocean':
                this.shimmerPhase += this.shimmerSpeed * dt * 60;
                this.x += this.vx * dt * 60; // Horizontal movement only
                
                // Size changes over time to imitate shimmer
                this.size = this.baseSize * (1 + Math.sin(this.shimmerPhase) * this.shimmerAmount);
                
                // Wrap horizontally
                if (this.x > canvasWidth + 50) this.x = -50;
                if (this.x < -50) this.x = canvasWidth + 50;
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
                gradient.addColorStop(0, 'rgba(255, 220, 100, 0.8)');
                gradient.addColorStop(0.5, 'rgba(255, 200, 50, 0.4)');
                gradient.addColorStop(1, 'rgba(255, 180, 0, 0)');
                
                ctx.strokeStyle = gradient;
                ctx.lineWidth = this.size * 2;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x - this.vx * 30, this.y - this.vy * 30);
                ctx.stroke();
                break;
                
            case 'thunder':
                // Draw heavy rain drops for thunderstorm
                ctx.strokeStyle = color || 'rgba(200, 220, 255, 0.8)';
                ctx.lineWidth = this.size;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x - this.vx * 0.5, this.y - this.length);
                ctx.stroke();
                break;
                
            case 'foggy':
                // Draw dark ash particles with gray color for lighter background
                ctx.fillStyle = color || 'rgba(60, 60, 60, 0.8)';
                ctx.shadowBlur = 3;
                ctx.shadowColor = 'rgba(40, 40, 40, 0.2)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'snow':
                // Draw snowflake
                ctx.fillStyle = color || '#ffffff';
                ctx.shadowBlur = 10;
                ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'windy':
                // Draw autumn leaf
                this.drawLeaf(ctx, color);
                break;
                
            case 'rain':
                // Draw rain drop
                ctx.strokeStyle = color || '#ffffff';
                ctx.lineWidth = this.size;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x - this.vx * 0.5, this.y - this.length);
                ctx.stroke();
                break;
                
            case 'ocean':
                // Draw ocean shimmer particle as shamshed ellipse with thickness-based rendering
                ctx.fillStyle = color || this.particleColor;
                ctx.shadowBlur = 6;
                ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                
                // Create shamshed ellipse: very wide and thin based on thickness
                const ellipseWidth = Math.max(0.1, this.size * 4); // Very wide for shamshed effect
                const ellipseHeight = Math.max(0.1, this.thickness * 0.3); // Use thickness for height
                
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
    }
    
    resize(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        
        // Don't recreate particles on resize - just update canvas dimensions
        // Particles will adapt to new dimensions in their update methods
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
    }
    
    createParticles() {
        this.particles = [];
        
        if (this.particleCount === 0) {
            return;
        }
        
        let particleType;
        switch (this.currentWeather) {
            case 'sunny':
                particleType = 'sun';
                break;
            case 'thunder':
                particleType = 'thunder';
                break;
            case 'foggy':
                particleType = 'foggy';
                break;
            case 'rain':
                particleType = 'rain';
                break;
            case 'windy':
                particleType = 'windy';
                break;
            case 'ocean':
                particleType = 'ocean';
                break;
            default:
                particleType = 'snow';
        }
        
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(new Particle(particleType, this.canvasWidth, this.canvasHeight));
        }
    }
    
    update(deltaTime = 0) {
        this.particles.forEach(particle => {
            particle.update(this.canvasWidth, this.canvasHeight, this.currentWeather, deltaTime);
        });
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
        }
        
        ctx.restore();
    }
    
    drawLightning(ctx) {
        if (!this.lightning.active) return;
        
        ctx.save();
        
        // Brighten sky when lightning strikes
        if (this.lightning.opacity > 0.5) {
            const skyFlash = ctx.createRadialGradient(
                this.lightning.x, this.lightning.y, 0,
                this.lightning.x, this.lightning.y, this.canvasWidth
            );
            skyFlash.addColorStop(0, `rgba(255, 255, 255, ${this.lightning.opacity * 0.1})`);
            skyFlash.addColorStop(0.5, `rgba(200, 220, 255, ${this.lightning.opacity * 0.05})`);
            skyFlash.addColorStop(1, 'rgba(100, 150, 255, 0)');
            
            ctx.fillStyle = skyFlash;
            ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        }
        
        // Draw main lightning bolt with bloom effect
        const mainGradient = ctx.createLinearGradient(
            this.lightning.x, this.lightning.y,
            this.lightning.endX, this.lightning.endY
        );
        mainGradient.addColorStop(0, `rgba(255, 255, 255, ${this.lightning.opacity})`);
        mainGradient.addColorStop(0.3, `rgba(220, 240, 255, ${this.lightning.opacity * 0.9})`);
        mainGradient.addColorStop(0.7, `rgba(180, 220, 255, ${this.lightning.opacity * 0.6})`);
        mainGradient.addColorStop(1, `rgba(150, 200, 255, ${this.lightning.opacity * 0.2})`);
        
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
            gradient.addColorStop(0, `rgba(255, 255, 255, ${this.lightning.opacity * (0.3 + i * 0.2)})`);
            gradient.addColorStop(0.5, `rgba(255, 255, 255, ${this.lightning.opacity * (0.25 + i * 0.18)})`);
            gradient.addColorStop(1, `rgba(255, 255, 255, ${this.lightning.opacity * (0.2 + i * 0.15)})`);
            
            ctx.strokeStyle = gradient;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // Add glow for outer layers
            if (i < 2) {
                ctx.shadowBlur = 30 + i * 10;
                ctx.shadowColor = `rgba(180, 220, 255, ${this.lightning.opacity * (0.15 + i * 0.1)})`;
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
                
                ctx.strokeStyle = `rgba(200, 220, 255, ${opacity})`;
                ctx.lineWidth = Math.max(isTrail ? 0.5 : 0.2, width); // Higher minimum for trails
                ctx.lineCap = 'round';
                
                if (i === 0) {
                    const glowFactor = isTrail ? 0.3 : 0.6;
                    ctx.shadowBlur = 10 * (1 - branchDepth * 0.5) * glowFactor;
                    ctx.shadowColor = `rgba(180, 220, 255, ${opacity * 0.3})`;
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
        
        // Draw sun glow
        const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, sunRadius * 3);
        glowGradient.addColorStop(0, 'rgba(255, 220, 100, 0.3)');
        glowGradient.addColorStop(0.3, 'rgba(255, 200, 50, 0.2)');
        glowGradient.addColorStop(0.6, 'rgba(255, 180, 0, 0.1)');
        glowGradient.addColorStop(1, 'rgba(255, 160, 0, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, sunRadius * 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw sun core
        const sunGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, sunRadius);
        sunGradient.addColorStop(0, '#fff5e6');
        sunGradient.addColorStop(0.7, '#ffeb3b');
        sunGradient.addColorStop(1, '#ffc107');
        
        ctx.fillStyle = sunGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, sunRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Static sun corona rays removed - now using dynamic particle rays only
    }
}
