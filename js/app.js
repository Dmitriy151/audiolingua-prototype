// AudioLingua Prototype - Main Application Logic
// Интеграция с реальным бэкендом

class AudioLinguaApp {
    // 🔗 API endpoints
    static API_BASE = 'http://127.0.0.1:8000/api';
    static OUTPUT_BASE = 'http://127.0.0.1:8000/output';
    
    constructor() {
        this.currentStep = 'upload';
        this.currentSentence = 0;
        this.isPlaying = false;
        this.lessonData = null;
        this.lessonId = null;
        
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
        const btnNextSettings = document.getElementById('btn-next-settings');
        if (btnNextSettings) {
            btnNextSettings.addEventListener('click', () => this.goToStep('settings'));
        }
        
        const btnBack = document.getElementById('btn-back-upload');
        if (btnBack) {
            btnBack.addEventListener('click', () => this.goToStep('upload'));
        }
        
        const btnGenerate = document.getElementById('btn-generate');
        if (btnGenerate) {
            btnGenerate.addEventListener('click', () => this.startGeneration());
        }
        
        // Speed buttons
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setSpeed(e.target.textContent));
        });
        
        // Player controls
        const btnPlay = document.getElementById('btn-play');
        if (btnPlay) {
            btnPlay.addEventListener('click', () => this.togglePlay());
        }
        
        const btnPrev = document.getElementById('btn-prev-sentence');
        if (btnPrev) {
            btnPrev.addEventListener('click', () => this.prevSentence());
        }
        
        const btnNextSentence = document.getElementById('btn-next-sentence');
        if (btnNextSentence) {
            btnNextSentence.addEventListener('click', () => this.nextSentence());
        }
        
        const btnSpeed = document.getElementById('btn-speed');
        if (btnSpeed) {
            btnSpeed.addEventListener('click', () => this.toggleSpeed());
        }
        
        // Sentence blocks (делегирование событий)
        const textDisplay = document.querySelector('.text-display');
        if (textDisplay) {
            textDisplay.addEventListener('click', (e) => {
                const block = e.target.closest('.sentence-block');
                if (block) {
                    const index = parseInt(block.dataset.index);
                    this.jumpToSentence(index);
                }
            });
        }
        
        // Export modal
        const btnExport = document.getElementById('btn-export');
        if (btnExport) {
            btnExport.addEventListener('click', () => this.openExportModal());
        }
        
        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeExportModal());
        }
        
        const btnDownload = document.getElementById('btn-download');
        if (btnDownload) {
            btnDownload.addEventListener('click', () => this.downloadFiles());
        }
        
        // New lesson
        const btnNewLesson = document.getElementById('btn-new-lesson');
        if (btnNewLesson) {
            btnNewLesson.addEventListener('click', () => this.resetToUpload());
        }
        
        // Text input stats
        const textInput = document.getElementById('text-input');
        if (textInput) {
            textInput.addEventListener('input', () => this.updateStats());
        }
    }
    
    switchTab(tabName) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) activeTab.classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        const activeContent = document.getElementById(`tab-${tabName}`);
        if (activeContent) activeContent.classList.add('active');
    }
    
    goToStep(stepName) {
        document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
        const targetStep = document.getElementById(`step-${stepName}`);
        if (targetStep) {
            targetStep.classList.add('active');
            this.currentStep = stepName;
        }
    }
    
    updateStats() {
        const textInput = document.getElementById('text-input');
        if (!textInput) return;
        
        const text = textInput.value;
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = text.trim().split(/\s+/).filter(w => w.length > 0);
        
        const statsElement = document.querySelector('.text-stats');
        if (statsElement) {
            statsElement.innerHTML = `
                <span>📊 ${sentences.length} ${this.declension(sentences.length, 'предложение', 'предложения', 'предложений')}</span>
                <span>✍️ ${words.length} ${this.declension(words.length, 'слово', 'слова', 'слов')}</span>
                <span>⏱️ ~${Math.ceil(words.length / 130)} мин</span>
            `;
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
    
    // 🔗 РЕАЛЬНАЯ ГЕНЕРАЦИЯ (вместо моков)
    async startGeneration() {
        const textInput = document.getElementById('text-input');
        const text = textInput ? textInput.value.trim() : '';
        
        if (!text) {
            alert('Введите текст урока');
            return this.goToStep('upload');
        }
        
        this.goToStep('progress');
        
        try {
            // 📡 Запрос к реальному бэкенду
            console.log('📡 Отправка запроса на генерацию...');
            
            const response = await fetch(`${AudioLinguaApp.API_BASE}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text,
                    voice_en: 'nick',
                    voice_ru: 'alena',
                    include_explanations: true
                })
            });
            
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Server ${response.status}: ${errText}`);
            }
            
            const data = await response.json();
            this.lessonId = data.lesson_id;
            
            console.log('✅ Урок создан:', this.lessonId);
            
            // 📥 Загружаем manifest с сервера
            const manifestRes = await fetch(`${AudioLinguaApp.OUTPUT_BASE}/${this.lessonId}/manifest.json`);
            if (!manifestRes.ok) throw new Error('Manifest not found');
            const manifest = await manifestRes.json();
            
            console.log('📋 Manifest загружен:', manifest);
            
            // 🔄 Преобразуем manifest в формат для плеера
            this.lessonData = this.transformManifestToLessonData(manifest, text);
            
            // 🎯 Показываем плеер
            this.showPlayer();
            
        } catch (error) {
            console.error('❌ Generation failed:', error);
            alert(`Ошибка генерации: ${error.message}`);
            this.goToStep('settings');
        }
    }
    
    // 🔹 Преобразует manifest в структуру для плеера
    transformManifestToLessonData(manifest, originalText) {
        const sentences = originalText.split(/(?<=[.!?])\s+/).filter(s => s.trim());
        
        return {
            id: manifest.id,
            title: manifest.title || `Урок #${manifest.id.slice(0, 8)}`,
            sentences: sentences.map((text, index) => ({
                id: index,
                text: text,
                translation: manifest.translation || '',
                audio: {
                    en: manifest.en?.[index] ? `${AudioLinguaApp.OUTPUT_BASE}/${manifest.id}/${manifest.en[index]}` : null,
                    ru: manifest.ru?.[index] ? `${AudioLinguaApp.OUTPUT_BASE}/${manifest.id}/${manifest.ru[index]}` : null
                },
                timestamps: {
                    en: { start: 0, end: 5 },
                    exp: { start: 0, end: 5 }
                }
            })),
            vocabulary: manifest.vocabulary || []
        };
    }
    
    showPlayer() {
        this.goToStep('player');
        this.currentSentence = 0;
        
        // 🎨 Рендерим карточки с реальными аудио
        this.renderLessonPlayer();
        
        // 🎧 Инициализируем аудио-плееры
        this.initRealAudioPlayers();
    }
    
    // 🔹 Рендер карточек с аудио
    renderLessonPlayer() {
        const container = document.querySelector('.text-display');
        if (!container || !this.lessonData) return;
        
        container.innerHTML = this.lessonData.sentences.map((sentence, index) => `
            <div class="sentence-block ${index === 0 ? 'active' : ''}" data-index="${index}">
                <div class="sentence-original">${this.escapeHtml(sentence.text)}</div>
                <div class="sentence-translation">${this.escapeHtml(sentence.translation)}</div>
                
                ${sentence.audio.en ? `
                    <div class="audio-row">
                        <span class="lang-badge">🇬🇧 EN</span>
                        <audio controls src="${sentence.audio.en}"></audio>
                    </div>` : ''}
                
                ${sentence.audio.ru ? `
                    <div class="audio-row">
                        <span class="lang-badge">🇷 RU</span>
                        <audio controls src="${sentence.audio.ru}"></audio>
                    </div>` : ''}
            </div>
        `).join('');
        
        // Обновляем заголовок урока
        const titleElement = document.querySelector('#step-player h2');
        if (titleElement && this.lessonData.title) {
            titleElement.textContent = this.lessonData.title;
        }
    }
    
    // 🔹 Инициализация аудио-плееров
    initRealAudioPlayers() {
        const audios = document.querySelectorAll('.sentence-block audio');
        
        audios.forEach((audio, index) => {
            audio.addEventListener('ended', () => {
                if (this.isPlaying && index < audios.length - 1) {
                    this.nextSentence();
                    setTimeout(() => {
                        const nextAudio = audios[index + 1];
                        if (nextAudio) nextAudio.play();
                    }, 500);
                } else if (index === audios.length - 1) {
                    this.isPlaying = false;
                    const btnPlay = document.getElementById('btn-play');
                    if (btnPlay) btnPlay.textContent = '▶';
                }
            });
        });
    }
    
    togglePlay() {
        const btn = document.getElementById('btn-play');
        if (!btn) return;
        
        this.isPlaying = !this.isPlaying;
        
        if (this.isPlaying) {
            btn.textContent = '⏸';
            this.playCurrentSentence();
        } else {
            btn.textContent = '▶';
            // Пауза всех аудио
            document.querySelectorAll('.sentence-block audio').forEach(audio => {
                audio.pause();
            });
        }
    }
    
    playCurrentSentence() {
        if (!this.isPlaying) return;
        
        const audios = document.querySelectorAll('.sentence-block audio');
        // Ищем активное аудио для текущего предложения (берем русское как основное)
        const currentIndex = this.currentSentence * 2 + 1; // RU обычно второй
        const currentAudio = audios[currentIndex] || audios[this.currentSentence * 2];
        
        if (currentAudio) {
            currentAudio.play().catch(err => {
                console.warn('Autoplay blocked:', err);
                this.isPlaying = false;
                const btnPlay = document.getElementById('btn-play');
                if (btnPlay) btnPlay.textContent = '▶';
            });
        }
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
        if (!btn) return;
        
        const speeds = ['0.8x', '1.0x', '1.2x'];
        const current = speeds.indexOf(btn.textContent);
        const next = speeds[(current + 1) % speeds.length];
        btn.textContent = next;
    }
    
    openExportModal() {
        const modal = document.getElementById('modal-export');
        if (modal) modal.classList.add('active');
    }
    
    closeExportModal() {
        const modal = document.getElementById('modal-export');
        if (modal) modal.classList.remove('active');
    }
    
    downloadFiles() {
        alert('📥 Файлы загружаются...\n\nВ реальной версии здесь будет скачивание:\n• audio.mp3\n• subtitles.srt\n• vocabulary.pdf');
        this.closeExportModal();
    }
    
    resetToUpload() {
        this.isPlaying = false;
        this.currentSentence = 0;
        this.lessonData = null;
        this.lessonId = null;
        this.goToStep('upload');
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AudioLinguaApp();
});