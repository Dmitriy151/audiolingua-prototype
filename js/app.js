// AudioLingua Prototype - Main Application Logic

class AudioLinguaApp {
    constructor() {
        this.currentStep = 'upload';
        this.currentSentence = 0;
        this.isPlaying = false;
        this.lessonData = null;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateStats();
    }
    
    bindEvents() {
        // Tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Navigation
        document.getElementById('btn-next-settings').addEventListener('click', () => this.goToStep('settings'));
        document.getElementById('btn-back-upload').addEventListener('click', () => this.goToStep('upload'));
        document.getElementById('btn-generate').addEventListener('click', () => this.startGeneration());
        
        // Speed buttons
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setSpeed(e.target.textContent));
        });
        
        // Player controls
        document.getElementById('btn-play').addEventListener('click', () => this.togglePlay());
        document.getElementById('btn-prev-sentence').addEventListener('click', () => this.prevSentence());
        document.getElementById('btn-next-sentence').addEventListener('click', () => this.nextSentence());
        document.getElementById('btn-speed').addEventListener('click', () => this.toggleSpeed());
        
        // Sentence blocks
        document.querySelectorAll('.sentence-block').forEach((block, index) => {
            block.addEventListener('click', () => this.jumpToSentence(index));
        });
        
        // Export modal
        document.getElementById('btn-export').addEventListener('click', () => this.openExportModal());
        document.querySelector('.modal-close').addEventListener('click', () => this.closeExportModal());
        document.getElementById('btn-download').addEventListener('click', () => this.downloadFiles());
        
        // New lesson
        document.getElementById('btn-new-lesson').addEventListener('click', () => this.resetToUpload());
        
        // Text input stats
        document.getElementById('text-input').addEventListener('input', () => this.updateStats());
    }
    
    switchTab(tabName) {
        // Update tabs
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update content
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`tab-${tabName}`).classList.add('active');
    }
    
    goToStep(stepName) {
        document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
        document.getElementById(`step-${stepName}`).classList.add('active');
        this.currentStep = stepName;
    }
    
    updateStats() {
        const text = document.getElementById('text-input').value;
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = text.trim().split(/\s+/).filter(w => w.length > 0);
        
        document.querySelector('.text-stats').innerHTML = `
            <span>📊 ${sentences.length} ${this.declension(sentences.length, 'предложение', 'предложения', 'предложений')}</span>
            <span>✍️ ${words.length} ${this.declension(words.length, 'слово', 'слова', 'слов')}</span>
            <span>⏱️ ~${Math.ceil(words.length / 130)} мин</span>
        `;
    }
    
    declension(n, one, two, five) {
        n = Math.abs(n) % 100;
        const n1 = n % 10;
        if (n > 10 && n < 20) return five;
        if (n1 > 1 && n1 < 5) return two;
        if (n1 === 1) return one;
        return five;
    }
    
    async startGeneration() {
        this.goToStep('progress');
        
        const steps = mockGenerationSteps;
        const progressFill = document.getElementById('progress-fill');
        
        for (let i = 0; i < steps.length; i++) {
            // Update active step
            document.querySelectorAll('.progress-step').forEach((step, idx) => {
                step.classList.remove('active');
                if (idx <= i) {
                    step.classList.add('active');
                    step.textContent = '✓ ' + step.textContent.replace(/^[✓→]\s*/, '');
                }
            });
            
            // Update progress bar
            const progress = ((i + 1) / steps.length) * 100;
            progressFill.style.width = progress + '%';
            
            // Wait for simulation
            await this.sleep(steps[i].duration);
        }
        
        // Show player after generation
        setTimeout(() => {
            this.showPlayer();
        }, 500);
    }
    
    showPlayer() {
        this.goToStep('player');
        this.lessonData = demoLesson;
        this.currentSentence = 0;
        this.highlightSentence(0);
    }
    
    togglePlay() {
        const btn = document.getElementById('btn-play');
        this.isPlaying = !this.isPlaying;
        
        if (this.isPlaying) {
            btn.textContent = '⏸';
            this.playCurrentSentence();
        } else {
            btn.textContent = '▶';
        }
    }
    
    playCurrentSentence() {
        if (!this.isPlaying) return;
        
        const sentence = this.lessonData.sentences[this.currentSentence];
        
        // Simulate audio playback with timeouts
        this.simulateAudioPlayback(sentence, () => {
            if (this.isPlaying && this.currentSentence < this.lessonData.sentences.length - 1) {
                this.nextSentence();
                setTimeout(() => this.playCurrentSentence(), 500);
            } else {
                this.isPlaying = false;
                document.getElementById('btn-play').textContent = '▶';
            }
        });
    }
    
    simulateAudioPlayback(sentence, callback) {
        // In real app, this would play actual audio
        // For prototype, we just simulate timing
        const totalTime = (sentence.timestamps.exp.end - sentence.timestamps.en.start) * 1000;
        setTimeout(callback, totalTime);
    }
    
    nextSentence() {
        if (this.currentSentence < this.lessonData.sentences.length - 1) {
            this.currentSentence++;
            this.highlightSentence(this.currentSentence);
        }
    }
    
    prevSentence() {
        if (this.currentSentence > 0) {
            this.currentSentence--;
            this.highlightSentence(this.currentSentence);
        }
    }
    
    jumpToSentence(index) {
        this.currentSentence = index;
        this.highlightSentence(index);
    }
    
    highlightSentence(index) {
        document.querySelectorAll('.sentence-block').forEach((block, i) => {
            block.classList.toggle('active', i === index);
        });
        
        // Scroll into view
        const activeBlock = document.querySelector(`.sentence-block[data-index="${index}"]`);
        if (activeBlock) {
            activeBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    setSpeed(speed) {
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent === speed);
        });
    }
    
    toggleSpeed() {
        const btn = document.getElementById('btn-speed');
        const speeds = ['0.8x', '1.0x', '1.2x'];
        const current = speeds.indexOf(btn.textContent);
        const next = speeds[(current + 1) % speeds.length];
        btn.textContent = next;
    }
    
    openExportModal() {
        document.getElementById('modal-export').classList.add('active');
    }
    
    closeExportModal() {
        document.getElementById('modal-export').classList.remove('active');
    }
    
    downloadFiles() {
        // Simulate download
        alert('📥 Файлы загружаются...\n\nВ реальной версии здесь будет скачивание:\n• audio.mp3\n• subtitles.srt\n• vocabulary.pdf');
        this.closeExportModal();
    }
    
    resetToUpload() {
        this.isPlaying = false;
        this.currentSentence = 0;
        this.goToStep('upload');
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AudioLinguaApp();
});