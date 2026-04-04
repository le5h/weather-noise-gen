# Weather Simulation

An immersive, interactive weather simulation web application featuring realistic particle effects, dynamic audio, and beautiful visual transitions.

## 🌦️ Features

### Weather Effects
- **☀️ Sunny** - Warm rays emanating from a glowing sun with river sounds
- **❄️ Snow** - Realistic snowflakes with gentle wind howl audio
- **💨 Windy** - Fast-moving particles with dynamic wind effects
- **🌧️ Rain** - Falling raindrops with authentic rain sounds
- **⛈️ Thunder** - Dramatic lightning strikes with thunder and heavy rain
- **🌫️ Foggy** - Slow-falling ash particles with distant siren sounds

### Interactive Elements
- **Start Screen** - Beautiful gradient introduction with smooth fade-in animation
- **Weather Controls** - Intuitive button interface to switch between weather modes
- **Dynamic Backgrounds** - Smooth gradient transitions matching each weather type
- **Real-time Audio** - Web Audio API-generated sounds synchronized with weather

### Technical Highlights
- **Canvas-based Particle System** - High-performance rendering with hundreds of particles
- **Web Audio API** - Procedurally generated weather sounds without external audio files
- **Responsive Design** - Adapts seamlessly to desktop, tablet, and mobile devices
- **Modern UI** - Glassmorphism effects, smooth animations, and micro-interactions

## 🚀 Quick Start

### Prerequisites
- Modern web browser with ES6 module support
- Web Audio API support (most modern browsers)

### Installation
1. Clone or download the project
2. Open `index.html` in your web browser
3. Click "Start Experience" to begin

### Local Development
```bash
# Serve the project locally (optional)
python -m http.server 8000
# or
npx serve .
```

## 🏗️ Project Structure

```
weather-simulation/
├── index.html              # Main HTML structure
├── styles.css              # Complete styling with responsive design
├── js/
│   ├── main.js             # Application controller and initialization
│   ├── weatherRenderer.js  # Particle system and canvas rendering
│   └── audioManager.js     # Web Audio API sound generation
└── README.md               # This file
```

## 🎯 Core Components

### WeatherApp (main.js)
The main application controller that:
- Manages weather state and transitions
- Coordinates between renderer and audio systems
- Handles user interactions and UI updates
- Controls the start screen experience

### WeatherRenderer (weatherRenderer.js)
Advanced particle rendering system featuring:
- **Particle Class** - Individual particle physics and behavior
- **Weather-specific behaviors** - Unique movement patterns for each weather type
- **Lightning System** - Procedural lightning generation with branching
- **Sun Rendering** - Dynamic sun with corona effects and ray emission
- **Performance Optimization** - Efficient canvas rendering and particle recycling

### AudioManager (audioManager.js)
Sophisticated audio synthesis using Web Audio API:
- **Procedural Sound Generation** - No external audio files required
- **Weather-specific Audio**:
  - River sounds with multi-layered water flow
  - Wind howl with filtered noise modulation
  - Rain with high-frequency noise filtering
  - Thunder with convolution reverb and dynamic filtering
  - Siren with stereo panning and echo effects
- **Dynamic Audio Mixing** - Smooth transitions between weather sounds

## 🎨 Design Features

### Visual Effects
- **Particle Physics** - Realistic movement with velocity, acceleration, and sway
- **Gradient Backgrounds** - Smooth color transitions for each weather mood
- **Glassmorphism UI** - Modern frosted glass effect on controls
- **Smooth Animations** - CSS transitions and canvas animations at 60fps

### User Interface
- **Responsive Controls** - Adaptive button layout for all screen sizes
- **Visual Feedback** - Hover states, active indicators, and micro-interactions
- **Accessibility** - ARIA labels and keyboard navigation support

## 🔧 Technical Implementation

### Canvas Rendering
- Hardware-accelerated 2D canvas
- Efficient particle pooling and recycling
- Optimized draw calls with minimal state changes
- Responsive canvas sizing with window resize handling

### Audio Architecture
- Modular audio graph construction
- Dynamic filter modulation for realistic effects
- Multi-layered sound synthesis
- Proper audio context management for browser compatibility

### Performance Optimizations
- Particle count management based on weather type
- Efficient memory usage with object pooling
- Optimized animation loops with requestAnimationFrame
- Minimal DOM manipulation

## 🌐 Browser Compatibility

- **Chrome/Edge** - Full support
- **Firefox** - Full support
- **Safari** - Full support (may require user interaction for audio)
- **Mobile** - Optimized for iOS Safari and Android Chrome

## 🎮 Usage

1. **Launch the App** - Open `index.html` in your browser
2. **Start Experience** - Click the start button to enter the weather simulation
3. **Select Weather** - Use the bottom control panel to switch between weather types
4. **Immerse** - Enjoy the combined visual and audio experience

## 🔮 Future Enhancements

- [ ] Additional weather types (hail, tornado, rainbow)
- [ ] Time-based weather transitions
- [ ] User customization options
- [ ] Weather intensity controls
- [ ] Ambient temperature simulation
- [ ] Geographic location-based weather

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Feel free to submit pull requests for:
- New weather effects
- Performance improvements
- UI/UX enhancements
- Bug fixes

---

**Experience the beauty of weather through interactive art and sound.**
