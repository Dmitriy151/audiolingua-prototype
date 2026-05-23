import os
import re
import uuid
import json
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv
import urllib.parse

# 🔐 1. Загрузка настроек
load_dotenv()
API_KEY = os.getenv("YANDEX_API_KEY")
FOLDER_ID = os.getenv("YANDEX_FOLDER_ID")
OUTPUT_DIR = "output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 🚀 2. Создание приложения FastAPI
app = FastAPI(title="AudioLingua Backend")

# 🔗 3. Настройка CORS (чтобы фронтенд мог обращаться к бэкенду)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене замените на конкретный домен
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 📁 4. Раздача сгенерированных аудиофайлов
app.mount("/output", StaticFiles(directory=OUTPUT_DIR), name="output")

# 📋 5. Модель запроса
class LessonRequest(BaseModel):
    text: str
    voice_en: str = "nick"
    voice_ru: str = "alena"
    include_explanations: bool = True

#  6. Перевод через Yandex Translate
def yandex_translate(text: str) -> str:
    """Переводит текст на русский язык"""
    url = "https://translate.api.cloud.yandex.net/translate/v2/translate"
    headers = {
        "Authorization": f"Api-Key {API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "texts": [text],
        "targetLanguageCode": "ru",
        "folderId": FOLDER_ID
    }
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=30)
        resp.raise_for_status()
        result = resp.json()
        return result["translations"][0]["text"]
    except Exception as e:
        print(f"❌ Translation error: {e}")
        return text  # Возвращаем оригинал при ошибке

# 🔊 7. TTS через Yandex SpeechKit
def yandex_tts(text: str, voice: str, lang: str, filename: str) -> int:
    """
    Универсальный синтез речи через curl.
    Работает с любым языком.
    """
    output_path = os.path.abspath(os.path.join(OUTPUT_DIR, filename))
    output_dir = os.path.dirname(output_path)
    os.makedirs(output_dir, exist_ok=True)
    
    # URL-encoding для безопасной передачи
    payload = urllib.parse.urlencode({
        "text": text,
        "lang": lang,
        "voice": voice,
        "format": "mp3",
        "sampleRateHertz": "48000",
        "folderId": FOLDER_ID
    })
    
    curl_cmd = (
        f'curl -s -o "{output_path}" '
        f'-H "Authorization: Api-Key {API_KEY}" '
        f'-H "Content-Type: application/x-www-form-urlencoded" '
        f'-d "{payload}" '
        f'"https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize"'
    )
    
    print(f"🔊 TTS: '{text[:30]}...' -> {filename}")
    
    exit_code = os.system(f'cd /d "{output_dir}" && {curl_cmd}')
    
    if os.path.exists(output_path):
        file_size = os.path.getsize(output_path)
        if file_size > 0:
            print(f"✅ TTS saved: {filename} ({file_size} bytes)")
            return len(text) * 60
        else:
            print(f"❌ Empty file: {output_path}")
            raise Exception("Generated file is empty")
    else:
        print(f"❌ File not created: {output_path}")
        raise Exception("File not created")

# ✂️ 8. Разбиение текста на предложения
def split_sentences(text: str) -> list:
    """Разбивает текст на предложения"""
    return [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]

# 🎯 9. Endpoint генерации урока
@app.post("/api/generate")
def generate_lesson(req: LessonRequest):
    """Генерирует аудиоурок с переводом"""
    lesson_id = str(uuid.uuid4())
    lesson_dir = os.path.join(OUTPUT_DIR, lesson_id)
    os.makedirs(lesson_dir, exist_ok=True)
    
    sentences = split_sentences(req.text)
    
    # Структура manifest для фронтенда
    manifest = {
        "id": lesson_id,
        "title": f"Урок #{lesson_id[:8]}",
        "translation": "",  # Общий перевод (опционально)
        "vocabulary": [],   # Словарь (опционально)
        "en": [],  # Список EN аудиофайлов
        "ru": []   # Список RU аудиофайлов
    }
    
    for i, orig in enumerate(sentences):
        try:
            # Перевод
            trans = yandex_translate(orig)
            manifest["translation"] = trans  # Для простоты берем последний перевод
            
            # Озвучка EN
            en_file = f"en_{i}.mp3"
            yandex_tts(orig, req.voice_en, "en-US", os.path.join(lesson_id, en_file))
            manifest["en"].append(en_file)
            
            # Озвучка RU
            ru_file = f"ru_{i}.mp3"
            yandex_tts(trans, req.voice_ru, "ru-RU", os.path.join(lesson_id, ru_file))
            manifest["ru"].append(ru_file)
            
        except Exception as e:
            print(f"❌ Error processing sentence {i}: {e}")
            continue
    
    # Сохраняем manifest
    manifest_path = os.path.join(lesson_dir, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Lesson {lesson_id} generated successfully!")
    return {"lesson_id": lesson_id, "status": "ready"}

# 📥 10. Endpoint получения данных урока
@app.get("/api/lesson/{lesson_id}")
def get_lesson(lesson_id: str):
    """Возвращает manifest урока"""
    manifest_path = os.path.join(OUTPUT_DIR, lesson_id, "manifest.json")
    if not os.path.exists(manifest_path):
        raise HTTPException(status_code=404, detail="Урок не найден")
    
    with open(manifest_path, "r", encoding="utf-8") as f:
        return json.load(f)

# 🏠 11. Health check
@app.get("/")
def root():
    return {"status": "ok", "message": "AudioLingua Backend is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)