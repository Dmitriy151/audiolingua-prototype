import os
import re
import uuid
import json
import urllib.parse
import subprocess
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv
import time 

# 1. Загрузка настроек
load_dotenv()
API_KEY = os.getenv("YANDEX_API_KEY")
FOLDER_ID = os.getenv("YANDEX_FOLDER_ID")
OUTPUT_DIR = "output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

app = FastAPI(title="AudioLingua Backend")

# 2. CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Статика
app.mount("/output", StaticFiles(directory=OUTPUT_DIR), name="output")

# 4. Модели запросов
class LessonRequest(BaseModel):
    text: str
    voice_en: str = "nick"
    voice_ru: str = "alena"
    speed: float = 1.0
    include_explanations: bool = True
    chunk_size: int = 3

class MergeRequest(BaseModel):
    lesson_ids: list[str]
    book_title: str = "audiobook"

# 5. Перевод через Yandex
def yandex_translate(text: str) -> str:
    url = "https://translate.api.cloud.yandex.net/translate/v2/translate"
    headers = {"Authorization": f"Api-Key {API_KEY}", "Content-Type": "application/json"}
    payload = {"texts": [text], "targetLanguageCode": "ru", "folderId": FOLDER_ID}
    resp = requests.post(url, headers=headers, json=payload, timeout=30)
    resp.raise_for_status()
    return resp.json()["translations"][0]["text"]

# 6. TTS через curl (обход проблем с кодировкой)
def yandex_tts(text: str, voice: str, lang: str, filename: str) -> str:
    output_path = os.path.abspath(os.path.join(OUTPUT_DIR, filename))
    output_dir = os.path.dirname(output_path)
    os.makedirs(output_dir, exist_ok=True)
    
    payload = urllib.parse.urlencode({
        "text": text, "lang": lang, "voice": voice,
        "format": "mp3", "sampleRateHertz": "48000", "folderId": FOLDER_ID
    })
    
    curl_cmd = (
        f'curl -s -o "{output_path}" '
        f'-H "Authorization: Api-Key {API_KEY}" '
        f'-H "Content-Type: application/x-www-form-urlencoded" '
        f'-d "{payload}" '
        f'"https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize"'
    )
    
    print(f"🔊 TTS: '{text[:30]}...' -> {filename}")
    os.system(f'cd /d "{output_dir}" && {curl_cmd}')
    
    if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
        print(f"✅ TTS saved: {filename} ({os.path.getsize(output_path)} bytes)")
        return output_path
    raise Exception(f"TTS failed for {filename}")

# 7. 🔹 ПРОСТАЯ СКЛЕЙКА MP3 через ffmpeg из PATH
def merge_audio_files(file_paths: list, output_path: str) -> None:
    """Склеивает MP3 через ffmpeg с ПРИНУДИТЕЛЬНЫМ перекодированием в MP3"""
    if not file_paths:
        return
    
    # Удаляем старый файл
    if os.path.exists(output_path):
        try:
            os.remove(output_path)
        except:
            pass
    
    # 🔹 Создаём список файлов для concat
    list_file = output_path + ".list.txt"
    with open(list_file, "w", encoding="utf-8") as f:
        for fp in file_paths:
            abs_path = os.path.abspath(fp).replace("\\", "/")
            f.write(f"file '{abs_path}'\n")
    
    # 🔹 ВАЖНО: Используем ПЕРЕКОДИРОВАНИЕ в MP3 вместо -c copy
    # Это конвертирует OPUS → MP3 на лету
    cmd = f'ffmpeg -y -f concat -safe 0 -i "{list_file}" -c:a libmp3lame -q:a 2 "{output_path}"'
    
    print(f"🔗 FFmpeg merge (с перекодированием): {len(file_paths)} files -> {os.path.basename(output_path)}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    
    # Удаляем временный файл
    if os.path.exists(list_file):
        os.remove(list_file)
    
    if result.returncode == 0 and os.path.exists(output_path) and os.path.getsize(output_path) > 0:
        print(f"✅ Merged with ffmpeg (MP3): {output_path} ({os.path.getsize(output_path)} bytes)")
    else:
        print(f"⚠️ FFmpeg error: {result.stderr[:300]}")
        # Fallback на бинарную склейку
        print(f"🔗 Binary merge fallback...")
        with open(output_path, "wb") as outfile:
            for fpath in file_paths:
                with open(fpath, "rb") as infile:
                    outfile.write(infile.read())
        print(f"✅ Binary merge complete: {output_path}")
# 8. Разбиение текста на предложения
def split_sentences(text: str) -> list:
    return [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]

# 9. Эндпоинт генерации главы
@app.post("/api/generate")
def generate_lesson(req: LessonRequest):
    lesson_id = str(uuid.uuid4())
    lesson_dir = os.path.join(OUTPUT_DIR, lesson_id)
    os.makedirs(lesson_dir, exist_ok=True)
    
    sentences = split_sentences(req.text)
    chunks = [sentences[i:i + req.chunk_size] for i in range(0, len(sentences), req.chunk_size)]
    
    manifest = {"id": lesson_id, "chunks": [], "title": f"Глава #{lesson_id[:8]}"}
    chunk_final_files = []
    
    for idx, chunk_sentences in enumerate(chunks):
        chunk_dir = os.path.join(lesson_dir, f"chunk_{idx}")
        os.makedirs(chunk_dir, exist_ok=True)
        
        # Английская часть чанка
        en_files = []
        for s in chunk_sentences:
            fname = f"en_{len(en_files)}.mp3"
            fpath = os.path.join(chunk_dir, fname)
            yandex_tts(s, req.voice_en, "en-US", os.path.join(lesson_id, f"chunk_{idx}/{fname}"))
            en_files.append(fpath)
        
        en_merged = os.path.join(chunk_dir, "en_chunk.mp3")
        merge_audio_files(en_files, en_merged)
        
        # Перевод + русская часть
        ru_parts = []
        explanations = []
        for s in chunk_sentences:
            trans = yandex_translate(s)
            ru_parts.append(trans)
            if req.include_explanations:
                explanations.append("💡 Обратите внимание на контекст и устойчивые выражения.")
        
        ru_files = []
        for s in ru_parts:
            fname = f"ru_{len(ru_files)}.mp3"
            fpath = os.path.join(chunk_dir, fname)
            yandex_tts(s, req.voice_ru, "ru-RU", os.path.join(lesson_id, f"chunk_{idx}/{fname}"))
            ru_files.append(fpath)
        
        ru_merged = os.path.join(chunk_dir, "ru_chunk.mp3")
        merge_audio_files(ru_files, ru_merged)
        
        # Финал чанка: EN → RU
        chunk_files = [en_merged, ru_merged]
        final_chunk = os.path.join(chunk_dir, "final.mp3")
        merge_audio_files(chunk_files, final_chunk)
        chunk_final_files.append(final_chunk)
        
        manifest["chunks"].append({
            "index": idx,
            "sentences": chunk_sentences,
            "translations": ru_parts,
            "explanations": explanations if req.include_explanations else [],
            "audio": f"/output/{lesson_id}/chunk_{idx}/final.mp3"
        })
    
    # Финальная склейка всей главы
    chapter_file = os.path.join(lesson_dir, "chapter.mp3")
    merge_audio_files(chunk_final_files, chapter_file)
    
    # Сохранение манифеста
    with open(os.path.join(lesson_dir, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    
    return {
        "lesson_id": lesson_id,
        "status": "ready",
        "chapter_url": f"/output/{lesson_id}/chapter.mp3",
        "chunks_count": len(chunks)
    }

# 10. Эндпоинт склейки книг
@app.post("/api/merge_book")
def merge_book(req: MergeRequest):
    book_dir = os.path.join(OUTPUT_DIR, "books")
    os.makedirs(book_dir, exist_ok=True)
    
    chapter_files = []
    for lid in req.lesson_ids:
        ch_path = os.path.join(OUTPUT_DIR, lid, "chapter.mp3")
        if os.path.exists(ch_path):
            chapter_files.append(ch_path)
        else:
            raise HTTPException(status_code=404, detail=f"Глава {lid} не найдена")
    
    book_file = os.path.join(book_dir, f"{req.book_title}.mp3")
    merge_audio_files(chapter_files, book_file)
    
    return {
        "book_url": f"/output/books/{req.book_title}.mp3",
        "chapters_merged": len(chapter_files)
    }

@app.get("/")
def root():
    return {"status": "ok", "message": "AudioLingua Backend is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)