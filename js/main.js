const canvas = document.getElementById('snowflakes');
const ctx = canvas.getContext('2d');

let width, height;
let flakes = [];
let mode = 'heavy'; // normal, heavy, windy, rain

// Background colors for each mode
const backgroundColors = {
    'normal': '#87CEEB',      // Sunny blue sky
    'heavy': '#000000',       // Dark winter night
    'windy': '#4A90E2',       // Stormy gray-blue
    'rain': '#1a365d'         // Rainy dark blue
};

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

class Flake {
    constructor(isRain = false) {
        this.isRain = isRain;
        
        if (isRain) {
            // Rain properties
            this.x = Math.random() * width;
            this.y = Math.random() * -height;
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = Math.random() * 15 + 15;
            this.size = Math.random() * 3 + 1;
        } else {
            // Snow properties
            this.x = Math.random() * width;
            this.y = Math.random() * -height;
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = mode === 'heavy' ? Math.random() * 8 + 6 : Math.random() * 3 + 1;
            this.size = mode === 'heavy' ? Math.random() * 6 + 3 : Math.random() * 4 + 1;
        }
        
        // Add some randomness to rotation and sway
        this.swaySpeed = (Math.random() - 0.5) * 0.2;
        this.swayAngle = Math.random() * Math.PI * 2;
    }

    update() {
        if (mode === 'windy') {
            // Wind mode: stronger horizontal movement, faster fall
            this.x += this.vx + (Math.random() - 0.5) * 4;
            this.y += this.vy + 2;
            
            // Add sway effect
            this.swayAngle += this.swaySpeed;
        } else if (mode === 'rain') {
            // Rain mode: straight down with slight horizontal drift, very fast
            this.x += this.vx;
            this.y += this.vy + 3;
            
            // Add some wobble to rain drops
            this.swayAngle += this.swaySpeed * 2;
        } else {
            // Normal and Heavy modes
            this.x += this.vx;
            this.y += this.vy;
            
            // Add sway effect for normal snow
            if (mode === 'normal') {
                this.swayAngle += this.swaySpeed;
                this.x += Math.sin(this.swayAngle) * 0.5;
            } else {
                // Heavy snow: more chaotic movement
                this.swayAngle += this.swaySpeed * 1.5;
                this.x += Math.sin(this.swayAngle) * 2;
            }
        }

        // Reset when out of bounds
        if (this.y > height + 100) {
            this.y = -Math.random() * 300 - 50;
            
            if (!this.isRain) {
                this.size = mode === 'heavy' ? Math.random() * 6 + 3 : Math.random() * 4 + 1;
            } else {
                // Rain stays consistent size
                this.size = Math.random() * 3 + 1;
            }
        }

        return true;
    }

    draw() {
        ctx.beginPath();
        
        if (this.isRain) {
            // Draw rain as lines
            const length = this.vy / 20;
            ctx.strokeStyle = `rgba(255, 255, 255, ${Math.random() * 0.8 + 0.3})`;
            ctx.lineWidth = Math.max(1, this.size);
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x, this.y + length);
            ctx.stroke();
        } else {
            // Draw snowflakes as circles with glow effect
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.size / 2
            );
            
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.7)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function init(count = 100) {
    resize();
    flakes = [];
    
    // Adjust count based on mode
    const counts = { 'normal': 50, 'heavy': 200, 'windy': 150, 'rain': 300 };
    const actualCount = counts[mode] || 100;
    
    for (let i = 0; i < actualCount; i++) {
        flakes.push(new Flake(mode === 'rain'));
    }
}

function animate() {
    // Create trail effect by drawing semi-transparent rectangle instead of clearing completely
    ctx.fillStyle = mode === 'rain' ? 'rgba(26, 54, 93, 0.1)' : 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw flakes
    for (const flake of flakes) {
        flake.update();
        flake.draw();
    }

    requestAnimationFrame(animate);
}

// Generate wind noise using Web Audio API
function initWindAudio() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create a buffer for wind noise
    const bufferSize = audioContext.sampleRate * 5; // 5 seconds of noise
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        // Generate white noise with some filtering to simulate wind
        let sample = Math.random() * 2 - 1;
        
        // Low-pass filter to make it sound like wind (not pure white noise)
        data[i] = (data[i - 1] + sample * 0.5) * 0.9;
    }
    
    const bufferSource = audioContext.createBufferSource();
    bufferSource.buffer = buffer;
    bufferSource.loop = true;
    bufferSource.connect(audioContext.destination);
}

// Generate rain noise using Web Audio API
function initRainAudio() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create a buffer for rain noise
    const bufferSize = audioContext.sampleRate * 5; // 5 seconds of noise
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        // Generate rain-like noise with multiple frequencies
        let sample = Math.random() * 2 - 1;
        
        // Add some frequency variation to simulate different sized drops
        data[i] = (data[i - 1] + sample * 0.3) * 0.95;
    }
    
    const bufferSource = audioContext.createBufferSource();
    bufferSource.buffer = buffer;
    bufferSource.loop = true;
    bufferSource.connect(audioContext.destination);
}

// Control buttons functionality
const controlBtns = document.querySelectorAll('.control-btn');

controlBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        mode = btn.dataset.mode;
        
        // Update active state
        controlBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update weather display text
        const weatherNames = {
            'normal': 'Sunny',
            'heavy': 'Heavy Snow',
            'windy': 'Windy Storm',
            'rain': 'Rain'
        };
        document.getElementById('weather-display').textContent = weatherNames[mode];
        
        // Change background color
        document.body.style.backgroundColor = backgroundColors[mode];
        
        // Stop previous audio and start new one if needed
        const windAudio = document.getElementById('wind-audio');
        const rainAudio = document.getElementById('rain-audio');
        
        function playAudio(audioElement, shouldPlay) {
            if (shouldPlay && !audioElement.paused) return;
            
            if (shouldPlay) {
                audioElement.play().catch(e => console.log('Audio play failed:', e));
            } else {
                audioElement.pause();
            }
        }
        
        playAudio(windAudio, mode === 'windy');
        playAudio(rainAudio, mode === 'rain');
        
        // Reset flakes when changing modes
        init();
    });
});

window.addEventListener('resize', () => {
    resize();
});

// Initialize and start animation
init();
animate();

// Initialize audio on first user interaction (browser policy)
document.body.addEventListener('click', function() {
    if (mode === 'windy') initWindAudio();
    else if (mode === 'rain') initRainAudio();
}, { once: true });