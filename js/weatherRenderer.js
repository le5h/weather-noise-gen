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
                // Sun rays emanating from center
                const angle = Math.random() * Math.PI * 2;
                const distance = 100 + Math.random() * 200;
                this.x = canvasWidth / 2 + Math.cos(angle) * distance;
                this.y = canvasHeight / 3 + Math.sin(angle) * distance;
                this.vx = Math.cos(angle) * 0.5;
                this.vy = Math.sin(angle) * 0.5;
                this.size = Math.random() * 2 + 1;
                this.opacity = Math.random() * 0.3 + 0.1;
                this.pulsePhase = Math.random() * Math.PI * 2;
                break;
                
            case 'thunder':
                // Rain particles for thunderstorm
                this.x = Math.random() * canvasWidth;
                this.y = Math.random() * -canvasHeight;
                this.vx = (Math.random() - 0.5) * 3;
                this.vy = Math.random() * 12 + 15;
                this.size = Math.random() * 3 + 2;
                this.opacity = Math.random() * 0.3 + 0.2; // Reduced from 0.6+0.4 to 0.3+0.2 for more transparency
                this.length = Math.random() * 20 + 15;
                break;
                
            case 'foggy':
                // Dark ash particles for foggy weather
                this.x = Math.random() * canvasWidth;
                this.y = Math.random() * -canvasHeight;
                this.vx = (Math.random() - 0.5) * 0.02; // Extremely slow side movement
                this.vy = Math.random() * 0.2 + 0.1; // Slower falling speed
                this.size = Math.random() * 4 + 2;
                this.opacity = Math.random() * 0.3 + 0.1;
                this.swayAmount = Math.random() * 0.1 + 0.05; // Minimal sway
                this.swaySpeed = Math.random() * 0.001 + 0.0005; // Very slow sway
                this.swayAngle = Math.random() * Math.PI * 2;
                break;
                
            case 'snow':
                this.vx = (Math.random() - 0.5) * 1;
                this.vy = Math.random() * 2 + 1;
                this.size = Math.random() * 3 + 1;
                this.opacity = Math.random() * 0.6 + 0.4;
                this.swayAmount = Math.random() * 2 + 1;
                this.swaySpeed = Math.random() * 0.02 + 0.01;
                this.swayAngle = Math.random() * Math.PI * 2;
                break;
                
            case 'rain':
                this.vx = (Math.random() - 0.5) * 2;
                this.vy = Math.random() * 8 + 12;
                this.size = Math.random() * 2 + 1;
                this.opacity = Math.random() * 0.4 + 0.3;
                this.length = Math.random() * 15 + 10;
                break;
                
            case 'windy':
                this.vx = Math.random() * 4 + 2;
                this.vy = Math.random() * 3 + 2;
                this.size = Math.random() * 2 + 1;
                this.opacity = Math.random() * 0.5 + 0.3;
                this.swayAmount = Math.random() * 4 + 2;
                this.swaySpeed = Math.random() * 0.05 + 0.02;
                this.swayAngle = Math.random() * Math.PI * 2;
                break;
        }
    }
    
    update(canvasWidth, canvasHeight, weatherType) {
        this.swayAngle += this.swaySpeed;
        
        switch (weatherType) {
            case 'sunny':
                this.pulsePhase += 0.02;
                this.x += this.vx;
                this.y += this.vy;
                
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
                this.x += this.vx;
                this.y += this.vy;
                
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
                this.x += this.vx + Math.sin(this.swayAngle) * this.swayAmount;
                this.y += this.vy;
                
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
                this.x += this.vx + Math.sin(this.swayAngle) * this.swayAmount;
                this.y += this.vy;
                
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
                this.x += this.vx;
                this.y += this.vy;
                
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
                this.x += this.vx + Math.sin(this.swayAngle) * this.swayAmount;
                this.y += this.vy;
                
                // Wrap windy particles both horizontally and vertically
                if (this.x > canvasWidth + 50) this.x = -50;
                if (this.x < -50) this.x = canvasWidth + 50;
                if (this.y > canvasHeight + 50) this.y = -50;
                if (this.y < -50) this.y = canvasHeight + 50;
                break;
        }
    }
    
    draw(ctx) {
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
                ctx.strokeStyle = 'rgba(200, 220, 255, 0.8)';
                ctx.lineWidth = this.size;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x - this.vx * 0.5, this.y - this.length);
                ctx.stroke();
                break;
                
            case 'foggy':
                // Draw dark ash particles with gray color for lighter background
                ctx.fillStyle = 'rgba(60, 60, 60, 0.8)';
                ctx.shadowBlur = 3;
                ctx.shadowColor = 'rgba(40, 40, 40, 0.2)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'snow':
            case 'windy':
                // Draw snowflake
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 10;
                ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'rain':
                // Draw rain drop
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = this.size;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x - this.vx * 0.5, this.y - this.length);
                ctx.stroke();
                break;
        }
        
        ctx.restore();
    }
    
    drawWithColor(ctx, color) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        
        switch (this.type) {
            case 'thunder':
                // Draw heavy rain drops with custom color
                ctx.strokeStyle = color;
                ctx.lineWidth = this.size;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x - this.vx * 0.5, this.y - this.length);
                ctx.stroke();
                break;
                
            case 'foggy':
                // Draw ash particles with custom color
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'rain':
                // Draw rain drop with custom color
                ctx.strokeStyle = color;
                ctx.lineWidth = this.size;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x - this.vx * 0.5, this.y - this.length);
                ctx.stroke();
                break;
                
            case 'snow':
            case 'windy':
                // Draw snowflake with custom color
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
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
        
        // Recreate particles with new dimensions
        if (this.particles.length > 0) {
            this.createParticles();
        }
    }
    
    setWeather(weather, particleCount) {
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
            default:
                particleType = 'snow';
        }
        
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(new Particle(particleType, this.canvasWidth, this.canvasHeight));
        }
    }
    
    update() {
        this.particles.forEach(particle => {
            particle.update(this.canvasWidth, this.canvasHeight, this.currentWeather);
        });
    }
    
    draw(ctx) {
        // Draw lightning for thunder weather
        if (this.currentWeather === 'thunder') {
            this.drawLightning(ctx);
            this.updateLightning();
        }
        
        // Draw sun for sunny weather
        if (this.currentWeather === 'sunny') {
            this.drawSun(ctx);
        }
        
        // Apply silhouette effect during lightning
        let particleOpacity = 1;
        let particleColor = null;
        
        if (this.currentWeather === 'thunder' && this.lightning.active && this.lightning.opacity > 0.5) {
            particleOpacity = 1; // Keep full opacity but change color
            particleColor = 'rgba(0, 0, 0, 1)'; // Completely black
        }
        
        // Draw particles with adjusted color
        this.particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha *= particleOpacity;
            
            if (particleColor) {
                // Override particle color to black during lightning
                particle.drawWithColor(ctx, particleColor);
            } else {
                particle.draw(ctx);
            }
            
            ctx.restore();
        });
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
        
        // Draw thick lightning bolt with multiple layers for bloom
        for (let i = 3; i >= 0; i--) {
            const width = (8 - i * 2) + Math.random() * 2;
            const opacity = this.lightning.opacity * (0.3 + i * 0.2);
            
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // Add glow for outer layers
            if (i < 2) {
                ctx.shadowBlur = 30 + i * 10;
                ctx.shadowColor = `rgba(180, 220, 255, ${opacity * 0.5})`;
            }
            
            ctx.beginPath();
            ctx.moveTo(this.lightning.x, this.lightning.y);
            ctx.lineTo(this.lightning.endX, this.lightning.endY);
            ctx.stroke();
        }
        
        // Draw branches with similar bloom effect
        this.lightning.branches.forEach(branch => {
            for (let i = 2; i >= 0; i--) {
                const width = (4 - i) + Math.random() * 1;
                const opacity = this.lightning.opacity * (0.2 + i * 0.15);
                
                ctx.strokeStyle = `rgba(200, 220, 255, ${opacity})`;
                ctx.lineWidth = width;
                ctx.lineCap = 'round';
                
                if (i === 0) {
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = `rgba(180, 220, 255, ${opacity * 0.4})`;
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
        
        this.lightning = {
            active: true,
            x: startX,
            y: startY,
            endX: endX,
            endY: endY,
            opacity: 1,
            branches: this.createLightningBranches(startX, startY, endX, endY)
        };
        
        // Trigger thunder sound
        this.triggerThunder();
    }
    
    createLightningBranches(startX, startY, endX, endY) {
        const branches = [];
        const branchCount = 2 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < branchCount; i++) {
            const t = 0.3 + Math.random() * 0.4;
            const branchX = startX + (endX - startX) * t + (Math.random() - 0.5) * 50;
            const branchY = startY + (endY - startY) * t + Math.random() * 30;
            
            branches.push({
                startX: startX + (endX - startX) * t,
                startY: startY + (endY - startY) * t,
                endX: branchX,
                endY: branchY
            });
        }
        
        return branches;
    }
    
    triggerThunder() {
        // This will be connected to audio manager
        if (this.onThunder) {
            this.onThunder();
        }
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
        
        // Draw sun corona
        ctx.strokeStyle = 'rgba(255, 220, 100, 0.6)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const x1 = centerX + Math.cos(angle) * (sunRadius + 10);
            const y1 = centerY + Math.sin(angle) * (sunRadius + 10);
            const x2 = centerX + Math.cos(angle) * (sunRadius + 25);
            const y2 = centerY + Math.sin(angle) * (sunRadius + 25);
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    }
}
