// ===== Audio System =====
class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.bgmGain = null;
        this.sfxGain = null;
        this.masterGain = null;
        this.bgmSource = null;
        this.enabled = false;
        this.bgmBuffer = null;
    }
    
    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create gain nodes for volume control
            this.masterGain = this.audioContext.createGain();
            this.bgmGain = this.audioContext.createGain();
            this.sfxGain = this.audioContext.createGain();
            
            // Connect gain nodes
            this.bgmGain.connect(this.masterGain);
            this.sfxGain.connect(this.masterGain);
            this.masterGain.connect(this.audioContext.destination);
            
            // Set initial volumes
            this.masterGain.gain.value = 0.7;
            this.bgmGain.gain.value = 0.3;
            this.sfxGain.gain.value = 0.5;
            
            // Generate procedural sounds
            this.generateSounds();
            this.generateBGM();
            
            this.enabled = true;
            
            // Resume audio context if needed (for autoplay policies)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
        } catch (error) {
            console.warn('Audio initialization failed:', error);
            this.enabled = false;
        }
    }
    
    generateSounds() {
        if (!this.audioContext) return;
        
        // Shooting sound
        this.sounds.shoot = this.createShootSound();
        
        // Enemy hit sound
        this.sounds.enemyHit = this.createEnemyHitSound();
        
        // Player hit sound
        this.sounds.playerHit = this.createPlayerHitSound();
        
        // Powerup collect sound
        this.sounds.powerup = this.createPowerupSound();
        
        // Game over sound
        this.sounds.gameOver = this.createGameOverSound();
    }
    
    createShootSound() {
        const duration = 0.1;
        const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * duration, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / this.audioContext.sampleRate;
            const envelope = Math.exp(-t * 30);
            const noise = (Math.random() * 2 - 1) * envelope * 0.1;
            const tone = Math.sin(2 * Math.PI * (800 + t * 200) * t) * envelope * 0.3;
            data[i] = noise + tone;
        }
        
        return buffer;
    }
    
    createEnemyHitSound() {
        const duration = 0.15;
        const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * duration, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / this.audioContext.sampleRate;
            const envelope = Math.exp(-t * 20);
            const freq = 400 - t * 300;
            data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.4;
        }
        
        return buffer;
    }
    
    createPlayerHitSound() {
        const duration = 0.3;
        const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * duration, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / this.audioContext.sampleRate;
            const envelope = Math.exp(-t * 8);
            const noise = (Math.random() * 2 - 1) * envelope * 0.3;
            const tone = Math.sin(2 * Math.PI * (200 - t * 150) * t) * envelope * 0.5;
            data[i] = noise + tone;
        }
        
        return buffer;
    }
    
    createPowerupSound() {
        const duration = 0.4;
        const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * duration, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / this.audioContext.sampleRate;
            const envelope = Math.exp(-t * 3);
            const freq = 440 + t * 880; // Rising tone
            data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
        }
        
        return buffer;
    }
    
    createGameOverSound() {
        const duration = 1.0;
        const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * duration, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / this.audioContext.sampleRate;
            const envelope = Math.exp(-t * 2);
            const freq = 220 - t * 180; // Falling tone
            data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.4;
        }
        
        return buffer;
    }
    
    generateBGM() {
        if (!this.audioContext) return;
        
        const duration = 16; // 16 second loop
        const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * duration, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Simple electronic music pattern
        const bpm = 140;
        const beatDuration = 60 / bpm;
        
        for (let i = 0; i < data.length; i++) {
            const t = i / this.audioContext.sampleRate;
            const beat = Math.floor(t / beatDuration) % 16;
            
            let sample = 0;
            
            // Bass line
            if (beat % 4 === 0) {
                const bassFreq = beat % 8 === 0 ? 55 : 73.42; // A1 or D2
                const bassEnv = Math.max(0, 1 - (t % beatDuration) / beatDuration);
                sample += Math.sin(2 * Math.PI * bassFreq * t) * bassEnv * 0.15;
            }
            
            // Arpeggio
            if (beat % 2 === 1) {
                const arpFreqs = [220, 277.18, 329.63, 440]; // A3, C#4, E4, A4
                const arpFreq = arpFreqs[beat % 4];
                const arpEnv = Math.max(0, 1 - (t % (beatDuration / 2)) / (beatDuration / 2));
                sample += Math.sin(2 * Math.PI * arpFreq * t) * arpEnv * 0.08;
            }
            
            // Hi-hat
            if (beat % 2 === 1) {
                const hihatEnv = Math.exp(-((t % (beatDuration / 2)) / (beatDuration / 2)) * 50);
                sample += (Math.random() * 2 - 1) * hihatEnv * 0.05;
            }
            
            data[i] = sample;
        }
        
        this.bgmBuffer = buffer;
    }
    
    playSound(soundName, volume = 1.0) {
        if (!this.enabled || !this.audioContext || !this.sounds[soundName]) return;
        
        try {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = this.sounds[soundName];
            gainNode.gain.value = volume;
            
            source.connect(gainNode);
            gainNode.connect(this.sfxGain);
            
            source.start();
        } catch (error) {
            console.warn('Failed to play sound:', soundName, error);
        }
    }
    
    startBGM() {
        if (!this.enabled || !this.audioContext || !this.bgmBuffer || this.bgmSource) return;
        
        try {
            this.bgmSource = this.audioContext.createBufferSource();
            this.bgmSource.buffer = this.bgmBuffer;
            this.bgmSource.loop = true;
            this.bgmSource.connect(this.bgmGain);
            this.bgmSource.start();
        } catch (error) {
            console.warn('Failed to start BGM:', error);
        }
    }
    
    stopBGM() {
        if (this.bgmSource) {
            try {
                this.bgmSource.stop();
            } catch (error) {
                // Source may already be stopped
            }
            this.bgmSource = null;
        }
    }
    
    setMasterVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }
    
    setBGMVolume(volume) {
        if (this.bgmGain) {
            this.bgmGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }
    
    setSFXVolume(volume) {
        if (this.sfxGain) {
            this.sfxGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }
}

// Global audio system instance
const audioSystem = new AudioSystem();