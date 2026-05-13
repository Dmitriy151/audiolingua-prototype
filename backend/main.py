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

# 1. Загрузка настроек
load_dotenv()
API_KEY = os.getenv("YANDEX_API_KEY")
FOLDER_ID = os.getenv("YANDEX_FOLDER_ID")
OUTPUT_DIR = "output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

app = FastAPI(title="AudioLingua Backend")

# 2. Настройка CORS (чтобы фронтенд мог обращаться к бэкенду)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене замените на конкретный домен
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Раздача сгенерированных аудиофайлов
app.mount("/output", StaticFiles(directory=OUTPUT_DIR), name="output")

# 4. Модель запроса
class LessonRequest(BaseModel):
    text: str
    voice_en: str = "nick"
    voice_ru: str = "alena"
    speed: float = 1.0
    include_explanations: bool = True

# 5. Вспомогательные функции (Yandex API)
def yandex_translate(text: str) -> str:
    url = "https://translate.api.cloud.yandex.net/translate/v2/translate"
    headers = {"Authorization": f"Api-Key {API_KEY}", "Content-Type": "application/json"}
    payload = {"texts": [text], "targetLanguageCode": "ru", "folderId": FOLDER_ID}
    resp = requests.post(url, headers=headers, json=payload)
    resp.raise_for_status()
    return resp.json()["translations"][0]["text"]

def yandex_tts(text: str, voice: str, lang: str, filename: str) -> int:
    url = "https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize"
    headers = {"Authorization": f"Api-Key {API_KEY}"}
    data = {"text": text, "lang": lang, "voice": voice, "format": "mp3", "sampleRateHertz": "24000"}
    resp = requests.post(url, headers=headers, data=data)
    resp.raise_for_status()
    path = os.path.join(OUTPUT_DIR, filename)
    with open(path, "wb") as f:
        f.write(resp.content)
    # Примерная длительность в мс (для упрощения MVP)
    return len(text) * 60  # ~60мс на символ

def split_sentences(text: str) -> list:
    # Простое разбиение по точкам/восклицательным/вопросительным знакам
    return [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]

# 6. Эндпоинт генерации урока
@app.post("/api/generate")
def generate_lesson(req: LessonRequest):
    lesson_id = str(uuid.uuid4())
    lesson_dir = os.path.join(OUTPUT_DIR, lesson_id)
    os.makedirs(lesson_dir, exist_ok=True)
    
    sentences = split_sentences(req.text)
    manifest = {"id": lesson_id, "sentences": []}
    
    for i, orig in enumerate(sentences):
        # Перевод
        trans = yandex_translate(orig)
        
        # Пояснение (заглушка для MVP, позже подключим LLM)
        explanation = None
        if req.include_explanations:
            explanation = "💡 Обрати внимание на структуру предложения."
        
        # Озвучка EN
        en_file = f"en_{i}.mp3"
        yandex_tts(orig, req.voice_en, "en-US", os.path.join(lesson_id, en_file))
        
        # Озвучка RU
        ru_file = f"ru_{i}.mp3"
        yandex_tts(trans, req.voice_ru, "ru-RU", os.path.join(lesson_id, ru_file))
        
        manifest["sentences"].append({
            "id": i,
            "original": orig,
            "translation": trans,
            "explanation": explanation,
            "audio": {
                "en": f"/output/{lesson_id}/{en_file}",
                "ru": f"/output/{lesson_id}/{ru_file}"
            }
        })
    
    # Сохраняем манифест
    manifest_path = os.path.join(lesson_dir, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
        
    return {"lesson_id": lesson_id, "status": "ready"}

# 7. Эндпоинт получения данных урока
@app.get("/api/lesson/{lesson_id}")
def get_lesson(lesson_id: str):
    manifest_path = os.path.join(OUTPUT_DIR, lesson_id, "manifest.json")
    if not os.path.exists(manifest_path):
        raise HTTPException(status_code=404, detail="Урок не найден")
    with open(manifest_path, "r", encoding="utf-8") as f:
        return json.load(f)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)