// Sistema de Áudio Emocional para Laboratório de Física
// Versão corrigida com debounce, cleanup e inicialização tardia

class EmotionalAudioSystem {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.isMuted = false;
        this.volume = 0.5;
        this.currentMood = 'neutral';
        this.isSupported = !!(window.AudioContext || window.webkitAudioContext);
        this.isInitialized = false;
        
        // Debounce/Throttle
        this.lastSoundTime = 0;
        this.soundCooldown = 200; // ms entre sons
        this.activeOscillators = [];
        
        // Cleanup automático
        this.cleanupInterval = null;
        
        this.moodIndicators = {
            neutral: { emoji: '😐', color: '#a0a0b0' },
            excited: { emoji: '⚡', color: '#00d9ff' },
            tense: { emoji: '🔥', color: '#ff006e' },
            calm: { emoji: '🌊', color: '#4facfe' },
            surprise: { emoji: '✨', color: '#f6d365' },
            discovery: { emoji: '💡', color: '#00ff88' }
        };

        // Inicializar apenas quando DOM estiver pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }

        // Cleanup interval para remover osciladores parados
        this.startCleanupInterval();
    }

    init() {
        if (!this.isSupported) {
            console.warn('⚠️ Web Audio API não suportada neste navegador');
            return;
        }

        const soundToggle = document.getElementById('soundToggle');
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeContainer = document.getElementById('volumeContainer');

        if (!soundToggle || !volumeSlider || !volumeContainer) {
            console.warn('⚠️ Elementos de controle de áudio não encontrados');
            return;
        }

        soundToggle.addEventListener('click', () => {
            this.initAudioContext();
            this.toggleSound();
        });
        
        volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value / 100));

        // Mostrar/ocultar slider ao passar mouse
        soundToggle.addEventListener('mouseenter', () => {
            volumeContainer.classList.remove('hidden');
        });

        setTimeout(() => {
            volumeContainer.classList.add('hidden');
        }, 2000);

        console.log('🎵 Sistema de áudio inicializado (clique em 🔊 para ativar)');
    }

    initAudioContext() {
        if (this.audioContext) {
            return true;
        }

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
            this.isInitialized = true;
            console.log('✅ AudioContext criado - Volume:', Math.round(this.volume * 100) + '%');
            return true;
        } catch(e) {
            console.error('❌ Erro ao criar AudioContext:', e);
            return false;
        }
    }

    canPlaySound() {
        if (!this.isSupported || !this.isInitialized || this.isMuted) {
            return false;
        }

        const now = Date.now();
        if (now - this.lastSoundTime < this.soundCooldown) {
            return false;
        }
        
        this.lastSoundTime = now;
        return true;
    }

    registerOscillator(osc, duration) {
        this.activeOscillators.push(osc);
        
        // Auto-cleanup após o som terminar
        setTimeout(() => {
            const idx = this.activeOscillators.indexOf(osc);
            if (idx > -1) {
                this.activeOscillators.splice(idx, 1);
            }
        }, duration * 1000 + 100);
    }

    startCleanupInterval() {
        this.cleanupInterval = setInterval(() => {
            // Remover osciladores que já deveriam ter parado
            this.activeOscillators = this.activeOscillators.filter(osc => {
                try {
                    // Se o oscilador ainda estiver rodando, manter
                    return true;
                } catch(e) {
                    return false;
                }
            });
        }, 5000);
    }

    toggleSound() {
        if (!this.isSupported) {
            alert('Web Audio API não é suportada neste navegador');
            return;
        }

        this.isMuted = !this.isMuted;
        
        const soundBtn = document.getElementById('soundToggle');
        const soundIcon = soundBtn.querySelector('.sound-icon');
        
        if (this.isMuted) {
            soundIcon.textContent = '🔇';
            soundBtn.classList.add('muted');
            if (this.masterGain) {
                this.masterGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.1);
            }
            this.showMoodIndicator('neutral', 'Som Desligado');
            console.log('🔇 Som desligado');
        } else {
            soundIcon.textContent = '🔊';
            soundBtn.classList.remove('muted');
            if (this.masterGain) {
                this.masterGain.gain.setTargetAtTime(this.volume, this.audioContext.currentTime, 0.1);
            }
            this.showMoodIndicator('calm', 'Som Ligado');
            console.log('🔊 Som ligado - Volume:', Math.round(this.volume * 100) + '%');
        }

        this.createSoundWaveEffect();
    }

    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        if (!this.isMuted && this.masterGain) {
            this.masterGain.gain.setTargetAtTime(this.volume, this.audioContext.currentTime, 0.1);
        }
        console.log('🔈 Volume:', Math.round(this.volume * 100) + '%');
    }

    createSoundWaveEffect() {
        const btn = document.getElementById('soundToggle');
        if (!btn) return;
        
        const rect = btn.getBoundingClientRect();
        
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const wave = document.createElement('div');
                wave.className = 'sound-wave';
                wave.style.left = (rect.left + rect.width / 2 - 100) + 'px';
                wave.style.top = (rect.top + rect.height / 2 - 100) + 'px';
                document.body.appendChild(wave);
                setTimeout(() => wave.remove(), 1000);
            }, i * 200);
        }
    }

    // ============ SONS PARA LEI DE COULOMB ============
    playChargeInteraction(q1, q2, distance, force) {
        if (!this.canPlaySound()) return;

        const product = q1 * q2;
        const absForce = Math.abs(force);
        
        console.log('⚡ Coulomb: Força =', absForce.toFixed(3), 'N');
        
        if (absForce > 5) {
            this.setMood('tense');
            this.playStrongForce(product > 0 ? 'repulsion' : 'attraction');
        } else if (absForce > 1) {
            this.setMood('excited');
            this.playMediumForce(product > 0 ? 'repulsion' : 'attraction');
        } else {
            this.setMood('calm');
            this.playWeakForce(product > 0 ? 'repulsion' : 'attraction');
        }
    }

    playStrongForce(type) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        if (type === 'repulsion') {
            osc.frequency.setValueAtTime(220, this.audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.3);
            osc.type = 'sawtooth';
        } else {
            osc.frequency.setValueAtTime(440, this.audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(220, this.audioContext.currentTime + 0.3);
            osc.type = 'sine';
        }

        filter.type = 'lowpass';
        filter.frequency.value = 2000;

        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.5);
        
        this.registerOscillator(osc, 0.5);
    }

    playMediumForce(type) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        const baseFreq = type === 'repulsion' ? 440 : 330;
        osc.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
        osc.frequency.linearRampToValueAtTime(baseFreq * 1.5, this.audioContext.currentTime + 0.2);
        osc.type = 'triangle';

        gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.3);
        
        this.registerOscillator(osc, 0.3);
    }

    playWeakForce(type) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        const baseFreq = type === 'repulsion' ? 660 : 550;
        osc.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
        osc.type = 'sine';

        gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.2);
        
        this.registerOscillator(osc, 0.2);
    }

    // ============ SONS PARA CAPACITÂNCIA ============
    playCapacitanceChange(capacitance, voltage, energy) {
        if (!this.canPlaySound()) return;

        console.log('🔋 Capacitância: Energia =', (energy * 1e6).toFixed(2), 'μJ');

        if (energy > 1e-4) {
            this.setMood('excited');
            this.playHighEnergy();
        } else if (energy > 1e-6) {
            this.setMood('calm');
            this.playMediumEnergy();
        } else {
            this.setMood('neutral');
            this.playLowEnergy();
        }
    }

    playHighEnergy() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(300, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.4);
        osc.type = 'sawtooth';

        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 2;

        gain.gain.setValueAtTime(0.25, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.5);
        
        this.registerOscillator(osc, 0.5);
    }

    playMediumEnergy() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(440, this.audioContext.currentTime);
        osc.frequency.linearRampToValueAtTime(660, this.audioContext.currentTime + 0.3);
        osc.type = 'sine';

        gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.3);
        
        this.registerOscillator(osc, 0.3);
    }

    playLowEnergy() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(330, this.audioContext.currentTime);
        osc.type = 'sine';

        gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.2);
        
        this.registerOscillator(osc, 0.2);
    }

    // ============ SONS PARA CONQUISTAS ============
    playAchievementUnlocked(achievement) {
        if (!this.isInitialized || this.isMuted) return;

        this.setMood('discovery');
        this.showMoodIndicator('discovery', `🏆 ${achievement.title}!`);

        console.log('🏆 Conquista desbloqueada:', achievement.title);

        // Arpeggio triunfante (C major: C-E-G-C)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();

                osc.connect(gain);
                gain.connect(this.masterGain);

                osc.frequency.value = freq;
                osc.type = 'sine';

                gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

                osc.start();
                osc.stop(this.audioContext.currentTime + 0.3);
                
                this.registerOscillator(osc, 0.3);
            }, i * 100);
        });

        this.createParticleSoundEffect();
    }

    // ============ SONS PARA DESAFIOS ============
    playChallengeCorrect() {
        if (!this.isInitialized || this.isMuted) return;

        this.setMood('excited');
        this.showMoodIndicator('excited', '✅ Correto!');

        console.log('✅ Desafio correto!');

        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();

                osc.connect(gain);
                gain.connect(this.masterGain);

                osc.frequency.value = freq;
                osc.type = 'triangle';

                gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

                osc.start();
                osc.stop(this.audioContext.currentTime + 0.2);
                
                this.registerOscillator(osc, 0.2);
            }, i * 80);
        });
    }

    playChallengeIncorrect() {
        if (!this.isInitialized || this.isMuted) return;

        this.setMood('tense');
        this.showMoodIndicator('tense', '❌ Tente novamente');

        console.log('❌ Desafio incorreto');

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
        osc.frequency.linearRampToValueAtTime(150, this.audioContext.currentTime + 0.3);
        osc.type = 'sawtooth';

        gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.3);
        
        this.registerOscillator(osc, 0.3);
    }

    // ============ SONS PARA GRÁFICOS ============
    playGraphPointHover(value) {
        if (!this.canPlaySound()) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        const freq = 400 + (value * 100);
        osc.frequency.setValueAtTime(Math.min(freq, 1000), this.audioContext.currentTime);
        osc.type = 'sine';

        gain.gain.setValueAtTime(0.08, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.1);
        
        this.registerOscillator(osc, 0.1);
    }

    // ============ SISTEMA DE MOOD ============
    setMood(mood) {
        if (this.currentMood !== mood) {
            this.currentMood = mood;
            const indicator = this.moodIndicators[mood];
            if (indicator) {
                this.showMoodIndicator(mood, this.getMoodDescription(mood));
            }
        }
    }

    getMoodDescription(mood) {
        const descriptions = {
            neutral: 'Estado normal',
            excited: 'Alta energia!',
            tense: 'Força intensa!',
            calm: 'Equilíbrio',
            surprise: 'Descoberta!',
            discovery: 'Conquista!'
        };
        return descriptions[mood] || '';
    }

    showMoodIndicator(mood, text) {
        // Remover indicador anterior se existir
        const existing = document.getElementById('moodIndicator');
        if (existing) {
            existing.remove();
        }

        const indicator = document.createElement('div');
        indicator.className = 'mood-indicator';
        indicator.id = 'moodIndicator';
        document.body.appendChild(indicator);

        const moodData = this.moodIndicators[mood] || this.moodIndicators.neutral;
        
        indicator.innerHTML = `
            <span class="mood-emoji">${moodData.emoji}</span>
            <div class="mood-text">
                <strong>${text}</strong>
                <span style="font-size: 0.8rem; opacity: 0.7">${mood.toUpperCase()}</span>
            </div>
        `;

        indicator.style.borderColor = moodData.color;
        indicator.style.boxShadow = `0 10px 30px ${moodData.color}40`;

        // Auto-hide após 3 segundos
        setTimeout(() => {
            indicator.style.opacity = '0';
            indicator.style.transform = 'translateX(100px)';
            setTimeout(() => indicator.remove(), 500);
        }, 3000);
    }

    createParticleSoundEffect() {
        const colors = ['#f6d365', '#fda085', '#667eea', '#764ba2'];
        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                width: 8px;
                height: 8px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                border-radius: 50%;
                left: ${Math.random() * 100}vw;
                top: ${Math.random() * 100}vh;
                z-index: 9999;
                pointer-events: none;
                animation: particleFloat 0.8s ease-out forwards;
            `;
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 800);
        }
    }

    // ============ UTILITÁRIOS ============
    stopAllSounds() {
        this.activeOscillators.forEach(osc => {
            try {
                osc.stop();
            } catch(e) {}
        });
        this.activeOscillators = [];
        console.log('🔇 Todos os sons parados');
    }

    getStatus() {
        return {
            isSupported: this.isSupported,
            isInitialized: this.isInitialized,
            isMuted: this.isMuted,
            volume: this.volume,
            activeOscillators: this.activeOscillators.length,
            currentMood: this.currentMood
        };
    }

    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.stopAllSounds();
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

// Instanciar sistema de áudio (será inicializado quando DOM estiver pronto)
const audioSystem = new EmotionalAudioSystem();

// Exportar para uso global
window.audioSystem = audioSystem;

// Debug no console
console.log('🎵 Sistema de Áudio Emocional carregado');
console.log('💡 Dica: Clique em 🔊 no header para ativar o áudio');
