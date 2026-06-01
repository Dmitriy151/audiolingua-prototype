// AudioLingua Prototype - Main Application Logic
class AudioLinguaApp {
    constructor() {
        console.log('📦 Создание экземпляра AudioLinguaApp');
        this.currentStep = 'upload';
        this.currentSentence = 0;
        this.isPlaying = false;
        this.lessonData = null;
        this.init();
    }

    init() {
        console.log('🔧 Инициализация приложения');
        this.bindEvents();
        this.updateStats();
    }

    bindEvents() {
        console.log('📡 Привязка событий');
        
        // Tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Navigation
        const btnNext = document.getElementById('btn-next-settings');
        const btnBack = document.getElementById('btn-back-upload');
        const btnGenerate = document.getElementById('btn-generate');
        
        console.log('🔘 Кнопки навигации:', { btnNext, btnBack, btnGenerate });
        
        if (btnNext) btnNext.addEventListener('click', () => this.goToStep('settings'));
        if (btnBack) btnBack.addEventListener('click', () => this.goToStep('upload'));
        if (btnGenerate) btnGenerate.addEventListener('click', () => this.startGeneration());
        
        // Speed buttons
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setSpeed(e.target.textContent));
        });
        
        // Player controls
        const btnPlay = document.getElementById('btn-play');
        const btnPrev = document.getElementById('btn-prev-sentence');
        const btnNextSent = document.getElementById('btn-next-sentence');
        const btnSpeed = document.getElementById('btn-speed');
        
        console.log('🎮 Кнопки плеера:', { btnPlay, btnPrev, btnNextSent, btnSpeed });
        
        if (btnPlay) btnPlay.addEventListener('click', () => this.togglePlay());
        if (btnPrev) btnPrev.addEventListener('click', () => this.prevSentence());
        if (btnNextSent) btnNextSent.addEventListener('click', () => this.nextSentence());
        if (btnSpeed) btnSpeed.addEventListener('click', () => this.toggleSpeed());
        
        // Sentence blocks
        document.querySelectorAll('.sentence-block').forEach((block, index) => {
            block.addEventListener('click', () => this.jumpToSentence(index));
        });
        
        // Export modal
        const btnExport = document.getElementById('btn-export');
        const modalClose = document.querySelector('.modal-close');
        const btnDownload = document.getElementById('btn-download');
        
        if (btnExport) btnExport.addEventListener('click', () => this.openExportModal());
        if (modalClose) modalClose.addEventListener('click', () => this.closeExportModal());
        if (btnDownload) btnDownload.addEventListener('click', () => this.downloadFiles());
        
        // New lesson
        const btnNewLesson = document.getElementById('btn-new-lesson');
        if (btnNewLesson) btnNewLesson.addEventListener('click', () => this.resetToUpload());
        
        // Text input stats
        const textInput = document.getElementById('text-input');
        if (textInput) textInput.addEventListener('input', () => this.updateStats());
        
        console.log('✅ Все события привязаны');
    }

    switchTab(tabName) {
        console.log('🔄 Переключение вкладки:', tabName);
        // Update tabs
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update content
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`tab-${tabName}`).classList.add('active');
    }

    goToStep(stepName) {
        console.log(`🔄 Переход к шагу: ${stepName}`);
        document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
        const stepElement = document.getElementById(`step-${stepName}`);
        if (stepElement) {
            stepElement.classList.add('active');
            console.log(`✅ Шаг активирован: ${stepName}`);
        }
        this.currentStep = stepName;
    }

    updateStats() {
        console.log('📊 Обновление статистики текста');
        const text = document.getElementById('text-input')?.value || '';
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = text.trim().split(/\s+/).filter(w => w.length > 0);
        
        const statsElement = document.querySelector('.text-stats');
        if (statsElement) {
            statsElement.innerHTML = `
                <span>📊 ${sentences.length} ${this.declension(sentences.length, 'предложение', 'предложения', 'предложений')}</span>
                <span>✍️ ${words.length} ${this.declension(words.length, 'слово', 'слова', 'слов')}</span>
                <span>⏱️ ~${Math.ceil(words.length / 130)} мин</span>
            `;
            console.log(`✅ Статистика: ${sentences.length} предл., ${words.length} слов`);
        }
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
        console.log('⚡ Запуск генерации урока');
        const text = document.getElementById('text-input')?.value || '';
        console.log('📝 Текст урока:', text.substring(0, 50) + '...');
        
        this.goToStep('progress');
        
        const steps = mockGenerationSteps;
        const progressFill = document.getElementById('progress-fill');
        
        for (let i = 0; i < steps.length; i++) {
            console.log(`📊 Шаг ${i + 1} из ${steps.length}`);
            
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
            if (progressFill) progressFill.style.width = progress + '%';
            
            // Wait for simulation
            await this.sleep(steps[i].duration);
        }
        
        console.log('✅ Генерация завершена, показываем плеер');
        
        // Show player after generation
        setTimeout(() => {
            this.showPlayer();
        }, 500);
    }

    showPlayer() {
        console.log('🎧 Показ плеера');
        this.goToStep('player');
        this.lessonData = demoLesson;
        this.currentSentence = 0;
        this.highlightSentence(0);
    }

    togglePlay() {
        console.log('▶️ Переключение воспроизведения');
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
        console.log('⚡ Установка скорости:', speed);
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent === speed);
        });
    }

    toggleSpeed() {
        console.log('🔄 Переключение скорости');
        const btn = document.getElementById('btn-speed');
        const speeds = ['0.8x', '1.0x', '1.2x'];
        const current = speeds.indexOf(btn.textContent);
        const next = speeds[(current + 1) % speeds.length];
        btn.textContent = next;
    }

    openExportModal() {
        console.log('📥 Открытие модального окна экспорта');
        document.getElementById('modal-export').classList.add('active');
    }

    closeExportModal() {
        console.log('❌ Закрытие модального окна экспорта');
        document.getElementById('modal-export').classList.remove('active');
    }

    downloadFiles() {
        // Simulate download
        alert('📥 Файлы загружаются...\n\nВ реальной версии здесь будет скачивание:\n• audio.mp3\n• subtitles.srt\n• vocabulary.pdf');
        this.closeExportModal();
    }

    resetToUpload() {
        console.log('🔄 Сброс к начальному экрану');
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
    console.log('📄 DOM загружен, создаём приложение');
    window.app = new AudioLinguaApp();
});