import requests
import os
from dotenv import load_dotenv

# Загружаем переменные из .env
load_dotenv()

API_KEY = os.getenv('YANDEX_API_KEY')
FOLDER_ID_1 = os.getenv('YANDEX_FOLDER_ID')  # первый ID
FOLDER_ID_2 = os.getenv('YANDEX_FOLDER_ID_BACKUP')  # второй ID (если есть)

print(f"API Key starts with: {os.getenv('YANDEX_API_KEY')[:10]}")
print(f"Folder ID: {os.getenv('YANDEX_FOLDER_ID')}")

def test_translate(folder_id, folder_name="Folder 1"):
    """Тест перевода"""
    print(f"\n🔄 Тестирую перевод ({folder_name})...")
    
    url = "https://translate.api.cloud.yandex.net/translate/v2/translate"
    headers = {
        "Authorization": f"Api-Key {API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "texts": ["Hello, AudioLingua!"],
        "targetLanguageCode": "ru",
        "folderId": folder_id
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 200:
            translation = response.json()["translations"][0]["text"]
            print(f"✅ Успех! Перевод: '{translation}'")
            return True
        else:
            print(f"❌ Ошибка {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False

def test_tts(folder_id, folder_name="Folder 1"):
    """Тест синтеза речи"""
    print(f"\n🎤 Тестирую озвучку ({folder_name})...")
    
    url = "https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize"
    headers = {"Authorization": f"Api-Key {API_KEY}"}
    data = {
        "text": "Привет, AudioLingua!",
        "lang": "ru-RU",
        "voice": "alena",
        "format": "mp3",
        "folderId": folder_id
    }
    
    try:
        response = requests.post(url, headers=headers, data=data)
        if response.status_code == 200:
            with open("test_audio.mp3", "wb") as f:
                f.write(response.content)
            print(f"✅ Успех! Аудио сохранено в test_audio.mp3")
            return True
        else:
            print(f"❌ Ошибка {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False

# Запуск тестов
print("=" * 50)
print("🧪 Тестирование Yandex Cloud API")
print("=" * 50)

# Тест с первым Folder ID
if test_translate(FOLDER_ID_1, "default"):
    test_tts(FOLDER_ID_1, "default")
    print("\n✅ Первый Folder ID работает!")
    print(f"📝 Используйте: YANDEX_FOLDER_ID={FOLDER_ID_1}")
else:
    print("\n⚠️ Первый Folder ID не сработал, пробую второй...")
    if FOLDER_ID_2:
        if test_translate(FOLDER_ID_2, "cloud-k151ra"):
            test_tts(FOLDER_ID_2, "cloud-k151ra")
            print("\n✅ Второй Folder ID работает!")
            print(f"📝 Используйте: YANDEX_FOLDER_ID={FOLDER_ID_2}")
        else:
            print("\n❌ Ни один Folder ID не сработал. Проверьте API-ключ и роли.")
    else:
        print("\n❌ Первого Folder ID недостаточно. Проверьте настройки.")