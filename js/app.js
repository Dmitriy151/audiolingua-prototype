// AudioLingua - Chapter-based Audiobook Generator
class AudioLinguaApp {
    static API_BASE = 'http://127.0.0.1:8000/api';
    static OUTPUT_BASE = 'http://127.0.0.1:8000/output';
    
    constructor() {
        this.currentStep = 'upload';
        this.currentChunk = 0;
        this.isPlaying = false;
        this.lessonData = null;
        this.lessonId = null;
        this.playbackSpeed = 1.0;
        this.isGenerating = false;
        this.chunkSize = 3;
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateStats();
    }
    
    bindEvents() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        const btnNext = document.getElementById('btn-next-settings');
        if (btnNext) {
            btnNext.addEventListener('click', () => {
                const text = document.getElementById('text-input')?.value?.trim();
                if (text) this.goToStep('settings');
                else alert('Введите текст перед продолжением');
            });
        }
        
        const btnBack = document.getElementById('btn-back-upload');
        if (btnBack) {
            btnBack.addEventListener('click', () => this.goToStep('upload'));
        }
        
        const btnGenerate = document.getElementById('btn-generate');
        if (btnGenerate) {
            btnGenerate.addEventListener('click', (e) => {
                e?.preventDefault();
                if (!this.isGenerating) this.startGeneration();
            });
        }
        
        const chunkInput = document.getElementById('chunk-size');
        if (chunkInput) {
            chunkInput.addEventListener('change', (e) => {
                this.chunkSize = parseInt(e.target.value) || 3;
                const preview = document.getElementById('chunk-preview');
                if (preview) preview.textContent = this.chunkSize;
                this.updateStats();
            });
        }
        
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setSpeed(e.target.textContent));
        });
        
        const btnPlay = document.getElementById('btn-play');
        if (btnPlay) btnPlay.addEventListener('click', () => this.togglePlay());
        
        const btnPrev = document.getElementById('btn-prev-chunk');
        if (btnPrev) btnPrev.addEventListener('click', () => this.prevChunk());
        
        const btnNextChunk = document.getElementById('btn-next-chunk');
        if (btnNextChunk) btnNextChunk.addEventListener('click', () => this.nextChunk());
        
        const btnSpeed = document.getElementById('btn-speed');
        if (btnSpeed) btnSpeed.addEventListener('click', () => this.toggleSpeed());
        
        const textDisplay = document.querySelector('.text-display');
        if (textDisplay) {
            textDisplay.addEventListener('click', (e) => {
                const block = e.target.closest('.chunk-block');
                if (block) this.jumpToChunk(parseInt(block.dataset.index));
            });
        }
        
        const btnExport = document.getElementById('btn-export');
        if (btnExport) btnExport.addEventListener('click', () => this.openExportModal());
        
        const modalClose = document.querySelector('.modal-close');
        if (modalClose) modalClose.addEventListener('click', () => this.closeExportModal());
        
        const btnDownload = document.getElementById('btn-download-chapter');
        if (btnDownload) btnDownload.addEventListener('click', () => this.downloadChapter());
        
        const btnNewLesson = document.getElementById('btn-new-lesson');
        if (btnNewLesson) btnNewLesson.addEventListener('click', () => this.resetToUpload());
        
        const navMerge = document.getElementById('nav-merge-book');
        if (navMerge) {
            navMerge.addEventListener('click', (e) => {
                e.preventDefault();
                this.openMergeBookModal();
            });
        }
        
        const btnMerge = document.getElementById('btn-merge-chapters');
        if (btnMerge) btnMerge.addEventListener('click', () => this.mergeBook());
        
        const textInput = document.getElementById('text-input');
        if (textInput) textInput.addEventListener('input', () => this.updateStats());
    }
    
    switchTab(tabName) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`tab-${tabName}`)?.classList.add('active');
    }
    
    goToStep(stepName) {
        document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(`step-${stepName}`);
        if (target) target.classList.add('active');
        this.currentStep = stepName;
    }
    
    updateStats() {
        const text = document.getElementById('text-input')?.value || '';
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = text.trim().split(/\s+/).filter(w => w.length > 0);
        const chunks = Math.ceil(sentences.length / this.chunkSize);
        
        const statsEl = document.querySelector('.text-stats');
        if (statsEl) {
            statsEl.innerHTML = `
                <span>📊 ${sentences.length} предл.</span>
                <span>️ ${words.length} слов</span>
                <span>📦 ~${chunks} сегментов</span>
                <span>⏱️ ~${Math.ceil(words.length / 130)} мин</span>
            `;
        }
    }
    
    async startGeneration() {
        if (this.isGenerating) return;
        this.isGenerating = true;
        
        const text = document.getElementById('text-input')?.value?.trim();
        if (!text) {
            alert('Введите текст главы!');
            this.isGenerating = false;
            return this.goToStep('upload');
        }
        
        document.body.classList.add('loading');
        this.goToStep('progress');
        
        const progressFill = document.getElementById('progress-fill');
        const progressStatus = document.getElementById('progress-status');
        
        if (progressFill) progressFill.style.width = '10%';
        if (progressStatus) progressStatus.textContent = '📡 Отправка на сервер...';
        
        try {
            if (progressFill) progressFill.style.width = '30%';
            
            const requestBody = {
                text: text,
                voice_en: document.getElementById('voice-en')?.value || 'nick',
                voice_ru: document.getElementById('voice-ru')?.value || 'alena',
                include_explanations: document.getElementById('chk-explanations')?.checked ?? true,
                chunk_size: this.chunkSize
            };
            
            const response = await fetch(`${AudioLinguaApp.API_BASE}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Server ${response.status}: ${errText}`);
            }
            
            const data = await response.json();
            this.lessonId = data.lesson_id;
            
            if (progressFill) progressFill.style.width = '50%';
            if (progressStatus) progressStatus.textContent = '⏳ Ожидание завершения записи...';
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (progressFill) progressFill.style.width = '70%';
            if (progressStatus) progressStatus.textContent = '🔄 Загрузка манифеста...';
            
            const manifestUrl = `${AudioLinguaApp.OUTPUT_BASE}/${this.lessonId}/manifest.json`;
            const manifestRes = await fetch(manifestUrl);
            
            if (!manifestRes.ok) {
                throw new Error(`Manifest not found (status ${manifestRes.status})`);
            }
            
            const manifest = await manifestRes.json();
            
            if (progressFill) progressFill.style.width = '90%';
            if (progressStatus) progressStatus.textContent = ' Подготовка плеера...';
            
            this.lessonData = manifest;
            this.renderPlayer(manifest, this.lessonId);
            
            const dlBtn = document.getElementById('btn-download-chapter');
            if (dlBtn) {
                dlBtn.href = `${AudioLinguaApp.OUTPUT_BASE}/${this.lessonId}/chapter.mp3`;
                dlBtn.download = `chapter_${this.lessonId.slice(0, 8)}.mp3`;
                dlBtn.style.display = 'inline-flex';
            }
            
            if (progressFill) progressFill.style.width = '100%';
            if (progressStatus) progressStatus.textContent = '✅ Готово!';
            
            await new Promise(resolve => setTimeout(resolve, 500));
            this.goToStep('player');
            
        } catch (error) {
            console.error('Generation failed:', error);
            alert('Ошибка генерации: ' + error.message);
            this.goToStep('settings');
        } finally {
            document.body.classList.remove('loading');
            this.isGenerating = false;
        }
    }
    
    renderPlayer(manifest, lessonId) {
        const container = document.querySelector('.text-display');
        if (!container || !manifest || !manifest.chunks) return;
        
        container.innerHTML = '';
        const chunks = manifest.chunks || [];
        
        chunks.forEach((chunk, index) => {
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
            
            let audioPath = chunk.audio;
            if (audioPath.startsWith('/output')) {
                audioPath = audioPath.substring('/output'.length);
            }
            const audioUrl = `${AudioLinguaApp.OUTPUT_BASE}${audioPath}`;
            
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
        });
        
        const titleEl = document.querySelector('#step-player h2');
        if (titleEl) {
            titleEl.textContent = manifest.title || `Глава #${lessonId?.slice(0, 8)}`;
        }
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    togglePlay() {
        const btn = document.getElementById('btn-play');
        this.isPlaying = !this.isPlaying;
        if (this.isPlaying) {
            btn.textContent = '⏸';
            this.playCurrentChunk();
        } else {
            btn.textContent = '▶';
            document.querySelectorAll('.chunk-block audio').forEach(audio => audio.pause());
        }
    }
    
    playCurrentChunk() {
        if (!this.isPlaying) return;
        const audios = document.querySelectorAll('.chunk-block audio');
        const currentAudio = audios[this.currentChunk];
        if (currentAudio) {
            currentAudio.playbackRate = this.playbackSpeed;
            currentAudio.play().catch(err => {
                console.warn('Autoplay blocked:', err);
                this.isPlaying = false;
                document.getElementById('btn-play').textContent = '▶';
            });
        }
    }
    
    nextChunk() {
        if (this.lessonData && this.currentChunk < (this.lessonData.chunks?.length || 0) - 1) {
            this.currentChunk++;
            this.highlightChunk(this.currentChunk);
            if (this.isPlaying) this.playCurrentChunk();
        }
    }
    
    prevChunk() {
        if (this.currentChunk > 0) {
            this.currentChunk--;
            this.highlightChunk(this.currentChunk);
            if (this.isPlaying) this.playCurrentChunk();
        }
    }
    
    jumpToChunk(index) {
        this.currentChunk = index;
        this.highlightChunk(index);
        if (this.isPlaying) this.playCurrentChunk();
    }
    
    highlightChunk(index) {
        document.querySelectorAll('.chunk-block').forEach((block, i) => {
            block.classList.toggle('active', i === index);
        });
        const active = document.querySelector(`.chunk-block[data-index="${index}"]`);
        if (active) active.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    setSpeed(speed) {
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent === speed);
        });
        this.playbackSpeed = parseFloat(speed);
        document.querySelectorAll('.chunk-block audio').forEach(audio => {
            audio.playbackRate = this.playbackSpeed;
        });
    }
    
    toggleSpeed() {
        const btn = document.getElementById('btn-speed');
        const speeds = ['0.8x', '1.0x', '1.2x'];
        const cur = speeds.indexOf(btn.textContent);
        const next = speeds[(cur + 1) % speeds.length];
        btn.textContent = next;
        this.setSpeed(next);
    }
    
    downloadChapter() {}
    openExportModal() { document.getElementById('modal-export')?.classList.add('active'); }
    closeExportModal() { document.getElementById('modal-export')?.classList.remove('active'); }
    
    openMergeBookModal() {
        this.populateChaptersList();
        document.getElementById('modal-merge-book')?.classList.add('active');
    }
    
    populateChaptersList() {
        const list = document.getElementById('chapters-list');
        if (!list) return;
        list.innerHTML = '<p style="color:var(--text-secondary)">Сначала создайте главы, затем выберите их для склейки</p>';
    }
    
    async mergeBook() {
        const bookTitle = document.getElementById('book-title')?.value?.trim() || 'audiobook';
        const selectedIds = Array.from(document.querySelectorAll('#chapters-list input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        
        if (selectedIds.length === 0) {
            alert('Выберите хотя бы одну главу');
            return;
        }
        
        try {
            const btn = document.getElementById('btn-merge-chapters');
            btn.disabled = true;
            btn.textContent = '🔗 Склейка...';
            
            const response = await fetch(`${AudioLinguaApp.API_BASE}/merge_book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lesson_ids: selectedIds, book_title: bookTitle })
            });
            
            if (!response.ok) throw new Error(`Server ${response.status}`);
            const data = await response.json();
            
            if (confirm(`✅ Книга "${bookTitle}" готова!\nСкачать?`)) {
                const link = document.createElement('a');
                link.href = `${AudioLinguaApp.OUTPUT_BASE}${data.book_url}`;
                link.download = `${bookTitle}.mp3`;
                link.click();
            }
            this.closeMergeBookModal();
        } catch (error) {
            console.error('Merge failed:', error);
            alert('Ошибка: ' + error.message);
        } finally {
            const btn = document.getElementById('btn-merge-chapters');
            btn.disabled = false;
            btn.textContent = ' Склеить выбранные главы';
        }
    }
    
    closeMergeBookModal() {
        document.getElementById('modal-merge-book')?.classList.remove('active');
    }
    
    resetToUpload() {
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
    window.app = new AudioLinguaApp();
});
// uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000