// AudioLingua - Chapter-based Audiobook Generator
// 🔍 Версия с полным логированием для отладки
class AudioLinguaApp {
    static API_BASE = 'http://127.0.0.1:8000/api';
    static OUTPUT_BASE = 'http://127.0.0.1:8000/output';
    
    constructor() {
        console.log('[APP] 🎬 Конструктор AudioLinguaApp');
        this.currentStep = 'upload';
        this.currentChunk = 0;
        this.isPlaying = false;
        this.lessonData = null;
        this.lessonId = null;
        this.playbackSpeed = 1.0;
        this.isGenerating = false;
        this.chunkSize = 3;
        console.log('[APP] ✅ Экземпляр создан, вызываю init()');
        this.init();
    }
    
    init() {
        console.log('[APP] 🔧 init(): начинаю инициализацию');
        this.bindEvents();
        this.updateStats();
        console.log('[APP] ✅ init(): завершено');
    }
    
    bindEvents() {
        console.log('[EVENTS] 🔗 bindEvents(): начинаю привязку обработчиков');
        
        // Tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                console.log('[EVENTS] 👆 Клик по вкладке:', e.target.dataset.tab);
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // Navigation
        const btnNext = document.getElementById('btn-next-settings');
        console.log('[EVENTS] btn-next-settings:', btnNext ? '✅ найден' : '❌ НЕ НАЙДЕН');
        if (btnNext) {
            btnNext.addEventListener('click', () => {
                console.log('[NAV] ➡️ Клик: Далее: Настройки');
                const text = document.getElementById('text-input')?.value?.trim();
                if (text) {
                    console.log('[NAV] Текст есть, перехожу к settings');
                    this.goToStep('settings');
                } else {
                    console.log('[NAV] ⚠️ Текст пустой, показываю alert');
                    alert('Введите текст перед продолжением');
                }
            });
        }
        
        const btnBack = document.getElementById('btn-back-upload');
        console.log('[EVENTS] btn-back-upload:', btnBack ? '✅ найден' : '❌ НЕ НАЙДЕН');
        if (btnBack) {
            btnBack.addEventListener('click', () => {
                console.log('[NAV] ⬅️ Клик: Назад');
                this.goToStep('upload');
            });
        }
        
        const btnGenerate = document.getElementById('btn-generate');
        console.log('[EVENTS] btn-generate:', btnGenerate ? '✅ найден' : '❌ НЕ НАЙДЕН');
        if (btnGenerate) {
            btnGenerate.addEventListener('click', (e) => {
                console.log('[GENERATE] 🚀 Клик: Сгенерировать главу');
                e?.preventDefault?.();
                if (!this.isGenerating) {
                    console.log('[GENERATE] Запускаю startGeneration()');
                    this.startGeneration();
                } else {
                    console.log('[GENERATE] ⚠️ Уже генерируется, игнорирую клик');
                }
            });
        }
        
        // Chunk size
        const chunkInput = document.getElementById('chunk-size');
        console.log('[EVENTS] chunk-size:', chunkInput ? '✅ найден' : '❌ НЕ НАЙДЕН');
        if (chunkInput) {
            chunkInput.addEventListener('change', (e) => {
                this.chunkSize = parseInt(e.target.value) || 3;
                const preview = document.getElementById('chunk-preview');
                if (preview) preview.textContent = this.chunkSize;
                console.log('[SETTINGS] 📏 chunk_size изменён на:', this.chunkSize);
                this.updateStats();
            });
        }
        
        // Speed buttons
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                console.log('[SPEED] ⚡ Клик по кнопке скорости:', e.target.textContent);
                this.setSpeed(e.target.textContent);
            });
        });
        
        // Player controls
        const btnPlay = document.getElementById('btn-play');
        console.log('[EVENTS] btn-play:', btnPlay ? '✅ найден' : '❌ НЕ НАЙДЕН');
        if (btnPlay) {
            btnPlay.addEventListener('click', () => {
                console.log('[PLAYER] ▶️ Клик: Play/Pause, isPlaying:', this.isPlaying);
                this.togglePlay();
            });
        }
        
        const btnPrev = document.getElementById('btn-prev-chunk');
        console.log('[EVENTS] btn-prev-chunk:', btnPrev ? '✅ найден' : '❌ НЕ НАЙДЕН');
        if (btnPrev) {
            btnPrev.addEventListener('click', () => {
                console.log('[PLAYER] ⏮ Клик: Предыдущий сегмент');
                this.prevChunk();
            });
        }
        
        const btnNextChunk = document.getElementById('btn-next-chunk');
        console.log('[EVENTS] btn-next-chunk:', btnNextChunk ? '✅ найден' : '❌ НЕ НАЙДЕН');
        if (btnNextChunk) {
            btnNextChunk.addEventListener('click', () => {
                console.log('[PLAYER] ⏭ Клик: Следующий сегмент');
                this.nextChunk();
            });
        }
        
        const btnSpeed = document.getElementById('btn-speed');
        console.log('[EVENTS] btn-speed:', btnSpeed ? '✅ найден' : '❌ НЕ НАЙДЕН');
        if (btnSpeed) {
            btnSpeed.addEventListener('click', () => {
                console.log('[PLAYER] 🔄 Клик: Переключение скорости');
                this.toggleSpeed();
            });
        }
        
        // Chunk blocks delegation
        const textDisplay = document.querySelector('.text-display');
        console.log('[EVENTS] .text-display:', textDisplay ? '✅ найден' : '❌ НЕ НАЙДЕН');
        if (textDisplay) {
            textDisplay.addEventListener('click', (e) => {
                const block = e.target.closest('.chunk-block');
                if (block) {
                    const index = parseInt(block.dataset.index);
                    console.log('[PLAYER] 👆 Клик по сегменту #', index);
                    this.jumpToChunk(index);
                }
            });
        }
        
        // Export & download
        const btnExport = document.getElementById('btn-export');
        if (btnExport) {
            btnExport.addEventListener('click', () => {
                console.log('[EXPORT] 📤 Клик: Открыть модальное окно');
                this.openExportModal();
            });
        }
        
        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                console.log('[EXPORT] ❌ Клик: Закрыть модальное окно');
                this.closeExportModal();
            });
        }
        
        const btnDownload = document.getElementById('btn-download-chapter');
        console.log('[EVENTS] btn-download-chapter:', btnDownload ? '✅ найден' : '❌ НЕ НАЙДЕН');
        if (btnDownload) {
            btnDownload.addEventListener('click', () => {
                console.log('[DOWNLOAD] 📥 Клик: Скачать главу');
                this.downloadChapter();
            });
        }
        
        const btnNewLesson = document.getElementById('btn-new-lesson');
        if (btnNewLesson) {
            btnNewLesson.addEventListener('click', () => {
                console.log('[NAV] 🆕 Клик: Новая глава');
                this.resetToUpload();
            });
        }
        
        // Book merge modal
        const navMerge = document.getElementById('nav-merge-book');
        console.log('[EVENTS] nav-merge-book:', navMerge ? '✅ найден' : '❌ НЕ НАЙДЕН');
        if (navMerge) {
            navMerge.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('[MERGE] 📚 Клик: Склеить книгу');
                this.openMergeBookModal();
            });
        }
        
        const btnMerge = document.getElementById('btn-merge-chapters');
        console.log('[EVENTS] btn-merge-chapters:', btnMerge ? '✅ найден' : '❌ НЕ НАЙДЕН');
        if (btnMerge) {
            btnMerge.addEventListener('click', () => {
                console.log('[MERGE] 🔗 Клик: Начать склейку');
                this.mergeBook();
            });
        }
        
        // Text input stats
        const textInput = document.getElementById('text-input');
        if (textInput) {
            textInput.addEventListener('input', () => {
                this.updateStats();
            });
        }
        
        console.log('[EVENTS] ✅ bindEvents(): завершено');
    }
    
    switchTab(tabName) {
        console.log('[TAB] 🔄 switchTab:', tabName);
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`tab-${tabName}`)?.classList.add('active');
    }
    
    goToStep(stepName) {
        console.log('[STEP] 🔄 goToStep:', stepName, '(текущий:', this.currentStep + ')');
        document.querySelectorAll('.step').forEach(s => {
            s.classList.remove('active');
            console.log('[STEP] Убрал active с:', s.id);
        });
        const target = document.getElementById(`step-${stepName}`);
        if (target) {
            target.classList.add('active');
            console.log('[STEP] ✅ Добавил active к:', target.id);
        } else {
            console.error('[STEP] ❌ Элемент не найден: step-' + stepName);
        }
        this.currentStep = stepName;
    }
    
    updateStats() {
        console.log('[STATS] 📊 updateStats()');
        const text = document.getElementById('text-input')?.value || '';
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = text.trim().split(/\s+/).filter(w => w.length > 0);
        const chunkSize = this.chunkSize || 3;
        const chunks = Math.ceil(sentences.length / chunkSize);
        const statsEl = document.querySelector('.text-stats');
        if (statsEl) {
            statsEl.innerHTML = `
                <span>📊 ${sentences.length} предл.</span>
                <span>✍️ ${words.length} слов</span>
                <span>📦 ~${chunks} сегментов</span>
                <span>⏱️ ~${Math.ceil(words.length / 130)} мин</span>
            `;
            console.log('[STATS] ✅ Обновил статистику:', { sentences: sentences.length, words: words.length, chunks });
        } else {
            console.warn('[STATS] ⚠️ .text-stats не найден');
        }
    }
    
    // 🔥 ГЕНЕРАЦИЯ С ПОЛНЫМ ЛОГИРОВАНИЕМ
    async startGeneration() {
        console.log('[GENERATE] 🚀 === startGeneration() ===');
        if (this.isGenerating) {
            console.log('[GENERATE] ⚠️ Уже генерируется, выход');
            return;
        }
        this.isGenerating = true;
        
        const text = document.getElementById('text-input')?.value?.trim();
        console.log('[GENERATE] 📝 Текст:', text ? text.substring(0, 100) + '...' : '❌ ПУСТОЙ');
        
        if (!text) {
            console.log('[GENERATE] ⚠️ Текст пустой, показываю alert');
            alert('Введите текст главы!');
            this.isGenerating = false;
            return this.goToStep('upload');
        }
        
        console.log('[GENERATE] Добавляю body.loading');
        document.body.classList.add('loading');
        this.goToStep('progress');
        
        const progressFill = document.getElementById('progress-fill');
        const progressStatus = document.getElementById('progress-status');
        console.log('[GENERATE] progress-fill:', progressFill ? '✅ найден' : '❌ НЕ НАЙДЕН');
        console.log('[GENERATE] progress-status:', progressStatus ? '✅ найден' : '❌ НЕ НАЙДЕН');
        
        if (progressFill) progressFill.style.width = '10%';
        if (progressStatus) progressStatus.textContent = '📡 Отправка на сервер...';
        
        try {
            console.log('[API] 📡 Отправляю POST /api/generate');
            progressFill.style.width = '30%';
            
            const requestBody = {
                text: text,
                voice_en: 'nick',
                voice_ru: 'alena',
                include_explanations: true,
                chunk_size: this.chunkSize
            };
            console.log('[API] 📦 Request body:', JSON.stringify(requestBody, null, 2));
            
            const response = await fetch(`${AudioLinguaApp.API_BASE}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            
            console.log('[API] 📨 Response status:', response.status, response.statusText);
            
            if (!response.ok) {
                const errText = await response.text();
                console.error('[API] ❌ Ошибка сервера:', errText);
                throw new Error(`Server ${response.status}: ${errText}`);
            }
            
            const data = await response.json();
            console.log('[API] ✅ Response data:', data);
            this.lessonId = data.lesson_id;
            
            console.log('[MANIFEST] 📥 Загружаю manifest.json для:', this.lessonId);
            progressFill.style.width = '70%';
            if (progressStatus) progressStatus.textContent = '🔄 Генерация аудио...';
            
            const manifestUrl = `${AudioLinguaApp.OUTPUT_BASE}/${this.lessonId}/manifest.json`;
            console.log('[MANIFEST] 🔗 URL:', manifestUrl);
            
            const manifestRes = await fetch(manifestUrl);
            console.log('[MANIFEST] 📨 Response status:', manifestRes.status);
            
            if (!manifestRes.ok) throw new Error('Manifest not found');
            
            const manifest = await manifestRes.json();
            console.log('[MANIFEST] ✅ Manifest loaded:', JSON.stringify(manifest, null, 2));
            
            console.log('[RENDER] 🎨 Начинаю renderPlayer()');
            progressFill.style.width = '90%';
            if (progressStatus) progressStatus.textContent = '📥 Подготовка плеера...';
            
            this.lessonData = manifest;
            this.renderPlayer(manifest, this.lessonId);
            
            const dlBtn = document.getElementById('btn-download-chapter');
            console.log('[DOWNLOAD] 🔗 btn-download-chapter:', dlBtn ? '✅ найден' : '❌ НЕ НАЙДЕН');
            if (dlBtn) {
                dlBtn.href = `${AudioLinguaApp.OUTPUT_BASE}/${this.lessonId}/chapter.mp3`;
                dlBtn.download = `chapter_${this.lessonId.slice(0,8)}.mp3`;
                dlBtn.style.display = 'inline-flex';
                console.log('[DOWNLOAD] ✅ Настроил ссылку:', dlBtn.href);
            }
            
            progressFill.style.width = '100%';
            if (progressStatus) progressStatus.textContent = '✅ Готово!';
            
            console.log('[STEP] ⏳ Задерживаюсь 500мс, затем goToStep(player)');
            setTimeout(() => {
                console.log('[STEP] 🎯 Выполняю goToStep(player)');
                this.goToStep('player');
                console.log('[STEP] ✅ Текущий шаг:', this.currentStep);
            }, 500);
            
        } catch (error) {
            console.error('[GENERATE] ❌ FATAL ERROR:', error);
            console.error('[GENERATE] 📜 Stack:', error.stack);
            alert('Ошибка генерации: ' + error.message);
            this.goToStep('settings');
        } finally {
            console.log('[GENERATE] 🏁 finally: убираю body.loading, isGenerating=false');
            document.body.classList.remove('loading');
            this.isGenerating = false;
        }
    }
    
    renderPlayer(manifest, lessonId) {
        console.log('[RENDER] 🎨 === renderPlayer() ===', { lessonId, chunks: manifest.chunks?.length });
        
        const container = document.querySelector('.text-display');
        console.log('[RENDER] .text-display:', container ? '✅ найден' : '❌ НЕ НАЙДЕН');
        
        if (!container) {
            console.error('[RENDER] ❌ Контейнер не найден!');
            return;
        }
        if (!manifest) {
            console.error('[RENDER] ❌ manifest пустой!');
            return;
        }
        
        container.innerHTML = '';
        console.log('[RENDER] 🧹 Очищен контейнер');
        
        const chunks = manifest.chunks || [];
        console.log('[RENDER] 📦 Количество чанков:', chunks.length);
        
        chunks.forEach((chunk, index) => {
            console.log('[RENDER] 🎨 Рендерю чанк #', index);
            const div = document.createElement('div');
            div.className = `chunk-block ${index === 0 ? 'active' : ''}`;
            div.dataset.index = index;
            
            const sentencesHtml = (chunk.sentences || []).map((s, i) => `
                <div class="sentence-pair">
                    <div class="sentence-original">${this.escapeHtml(s)}</div>
                    <div class="sentence-translation">${this.escapeHtml(chunk.translations?.[i] || '')}</div>
                </div>
            `).join('');
            
            const explanationHtml = (chunk.explanations?.length) 
                ? `<div class="chunk-explanation">💡 ${chunk.explanations.join(' ')}</div>` 
                : '';
            
            const audioUrl = `${AudioLinguaApp.OUTPUT_BASE}${chunk.audio}`;
            console.log('[RENDER] 🔗 Audio URL для чанка #', index, ':', audioUrl);
            
            div.innerHTML = `
                <div class="chunk-header">
                    <span class="chunk-badge">Сегмент #${index + 1}</span>
                    <span class="chunk-sentences">${(chunk.sentences || []).length} предл.</span>
                </div>
                <div class="chunk-content">${sentencesHtml}${explanationHtml}</div>
                <div class="chunk-audio">
                    <audio controls src="${audioUrl}" preload="none" data-chunk="${index}"></audio>
                </div>
            `;
            container.appendChild(div);
            console.log('[RENDER] ✅ Добавил чанк #', index, 'в DOM');
        });
        
        const titleEl = document.querySelector('#step-player h2');
        if (titleEl) {
            titleEl.textContent = manifest.title || `Глава #${lessonId?.slice(0, 8)}`;
            console.log('[RENDER] ✅ Обновил заголовок:', titleEl.textContent);
        }
        
        console.log('[RENDER] ✅ renderPlayer() завершено');
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    togglePlay() {
        console.log('[PLAY] ▶️ togglePlay(), текущее состояние:', this.isPlaying);
        const btn = document.getElementById('btn-play');
        this.isPlaying = !this.isPlaying;
        if (this.isPlaying) {
            btn.textContent = '⏸';
            console.log('[PLAY] ▶️ Запускаю playCurrentChunk()');
            this.playCurrentChunk();
        } else {
            btn.textContent = '▶';
            console.log('[PLAY] ⏸ Пауза всех аудио');
            document.querySelectorAll('.chunk-block audio').forEach(audio => audio.pause());
        }
    }
    
    playCurrentChunk() {
        console.log('[PLAY] 🎵 playCurrentChunk(), currentChunk:', this.currentChunk);
        if (!this.isPlaying) return;
        const audios = document.querySelectorAll('.chunk-block audio');
        const currentAudio = audios[this.currentChunk];
        console.log('[PLAY] 🔊 currentAudio:', currentAudio ? '✅ найден' : '❌ НЕ НАЙДЕН');
        if (currentAudio) {
            currentAudio.playbackRate = this.playbackSpeed;
            currentAudio.play().catch(err => {
                console.warn('[PLAY] ⚠️ Autoplay blocked:', err);
                this.isPlaying = false;
                document.getElementById('btn-play').textContent = '▶';
            });
        }
    }
    
    nextChunk() {
        console.log('[NAV] ⏭ nextChunk(), текущий:', this.currentChunk);
        if (this.lessonData && this.currentChunk < (this.lessonData.chunks?.length || 0) - 1) {
            this.currentChunk++;
            console.log('[NAV] ✅ Перешёл к чанку #', this.currentChunk);
            this.highlightChunk(this.currentChunk);
            if (this.isPlaying) this.playCurrentChunk();
        } else {
            console.log('[NAV] ⚠️ Уже на последнем чанке');
        }
    }
    
    prevChunk() {
        console.log('[NAV] ⏮ prevChunk(), текущий:', this.currentChunk);
        if (this.currentChunk > 0) {
            this.currentChunk--;
            console.log('[NAV] ✅ Перешёл к чанку #', this.currentChunk);
            this.highlightChunk(this.currentChunk);
            if (this.isPlaying) this.playCurrentChunk();
        } else {
            console.log('[NAV] ⚠️ Уже на первом чанке');
        }
    }
    
    jumpToChunk(index) {
        console.log('[NAV] 🎯 jumpToChunk(', index, ')');
        this.currentChunk = index;
        this.highlightChunk(index);
        if (this.isPlaying) this.playCurrentChunk();
    }
    
    highlightChunk(index) {
        console.log('[UI] 🎨 highlightChunk(', index, ')');
        document.querySelectorAll('.chunk-block').forEach((block, i) => {
            block.classList.toggle('active', i === index);
        });
        const active = document.querySelector(`.chunk-block[data-index="${index}"]`);
        if (active) {
            active.scrollIntoView({ behavior: 'smooth', block: 'center' });
            console.log('[UI] ✅ Прокрутил к активному чанку');
        }
    }
    
    setSpeed(speed) {
        console.log('[SPEED] ⚡ setSpeed(', speed, ')');
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent === speed);
        });
        this.playbackSpeed = parseFloat(speed);
        document.querySelectorAll('.chunk-block audio').forEach(audio => {
            audio.playbackRate = this.playbackSpeed;
        });
    }
    
    toggleSpeed() {
        console.log('[SPEED] 🔄 toggleSpeed()');
        const btn = document.getElementById('btn-speed');
        const speeds = ['0.8x', '1.0x', '1.2x'];
        const cur = speeds.indexOf(btn.textContent);
        const next = speeds[(cur + 1) % speeds.length];
        btn.textContent = next;
        this.setSpeed(next);
    }
    
    downloadChapter() {
        console.log('[DOWNLOAD] 📥 downloadChapter()');
    }
    
    openExportModal() {
        console.log('[MODAL] 📤 openExportModal()');
        document.getElementById('modal-export')?.classList.add('active');
    }
    
    closeExportModal() {
        console.log('[MODAL] ❌ closeExportModal()');
        document.getElementById('modal-export')?.classList.remove('active');
    }
    
    openMergeBookModal() {
        console.log('[MERGE] 📚 openMergeBookModal()');
        this.populateChaptersList();
        document.getElementById('modal-merge-book')?.classList.add('active');
    }
    
    populateChaptersList() {
        console.log('[MERGE] 📋 populateChaptersList()');
        const list = document.getElementById('chapters-list');
        if (!list) return;
        list.innerHTML = '<p style="color:var(--text-secondary)">Сначала создайте главы, затем выберите их для склейки</p>';
    }
    
    async mergeBook() {
        console.log('[MERGE] 🔗 === mergeBook() ===');
        const bookTitle = document.getElementById('book-title')?.value?.trim() || 'audiobook';
        const selectedIds = Array.from(document.querySelectorAll('#chapters-list input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        console.log('[MERGE] 📦 selectedIds:', selectedIds, 'bookTitle:', bookTitle);
        
        if (selectedIds.length === 0) {
            console.log('[MERGE] ⚠️ Ничего не выбрано');
            alert('Выберите хотя бы одну главу');
            return;
        }
        
        try {
            const btn = document.getElementById('btn-merge-chapters');
            btn.disabled = true;
            btn.textContent = '🔗 Склейка...';
            
            console.log('[MERGE] 📡 Отправляю POST /api/merge_book');
            const response = await fetch(`${AudioLinguaApp.API_BASE}/merge_book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lesson_ids: selectedIds, book_title: bookTitle })
            });
            
            console.log('[MERGE] 📨 Response status:', response.status);
            if (!response.ok) throw new Error(`Server ${response.status}`);
            
            const data = await response.json();
            console.log('[MERGE] ✅ Response:', data);
            
            if (confirm(`✅ Книга "${bookTitle}" готова!\nСкачать?`)) {
                const link = document.createElement('a');
                link.href = `${AudioLinguaApp.OUTPUT_BASE}${data.book_url}`;
                link.download = `${bookTitle}.mp3`;
                link.click();
            }
            this.closeMergeBookModal();
        } catch (error) {
            console.error('[MERGE] ❌ Error:', error);
            alert('Ошибка: ' + error.message);
        } finally {
            const btn = document.getElementById('btn-merge-chapters');
            btn.disabled = false;
            btn.textContent = '🔗 Склеить выбранные главы';
        }
    }
    
    closeMergeBookModal() {
        console.log('[MERGE] ❌ closeMergeBookModal()');
        document.getElementById('modal-merge-book')?.classList.remove('active');
    }
    
    resetToUpload() {
        console.log('[RESET] 🔄 resetToUpload()');
        this.isPlaying = false;
        this.currentChunk = 0;
        this.lessonData = null;
        this.lessonId = null;
        const dlBtn = document.getElementById('btn-download-chapter');
        if (dlBtn) dlBtn.style.display = 'none';
        this.goToStep('upload');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('[DOM] 📄 === DOMContentLoaded ===');
    console.log('[DOM] window.app до:', window.app);
    window.app = new AudioLinguaApp();
    console.log('[DOM] ✅ window.app после:', window.app);
});