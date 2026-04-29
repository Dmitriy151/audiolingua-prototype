// Моковые данные для демонстрации прототипа

export const demoLesson = {
    id: 1,
    title: "Новая жизнь в Лондоне",
    duration: 135, // seconds
    sentences: [
        {
            id: 1,
            original: "The rain poured down relentlessly.",
            translation: "Дождь лил не переставая.",
            explanation: "\"Pour down\" — идиома, означающая сильный, непрерывный ливень",
            vocab: [
                { word: "relentlessly", translation: "неумолимо, без остановки" },
                { word: "to pour down", translation: "лить (о дожде)" }
            ],
            timestamps: {
                en: { start: 0, end: 3.2 },
                ru: { start: 3.6, end: 6.1 },
                exp: { start: 6.5, end: 9.8 }
            }
        },
        {
            id: 2,
            original: "Sarah looked out the window and sighed.",
            translation: "Сара выглянула в окно и вздохнула.",
            explanation: "\"Look out\" — выглянуть, высунуться (из окна, машины)",
            vocab: [
                { word: "to look out", translation: "выглядывать" },
                { word: "to sigh", translation: "вздыхать" }
            ],
            timestamps: {
                en: { start: 10.2, end: 13.8 },
                ru: { start: 14.2, end: 17.5 },
                exp: { start: 17.9, end: 21.0 }
            }
        },
        {
            id: 3,
            original: "She had been waiting for this moment for years.",
            translation: "Она ждала этого момента годами.",
            explanation: "Past Perfect Continuous — действие длилось в прошлом до другого момента",
            vocab: [
                { word: "to wait for", translation: "ждать" },
                { word: "moment", translation: "момент" }
            ],
            timestamps: {
                en: { start: 21.4, end: 25.6 },
                ru: { start: 26.0, end: 29.2 },
                exp: { start: 29.6, end: 34.5 }
            }
        },
        {
            id: 4,
            original: "Finally, she could start her new job in London.",
            translation: "Наконец, она могла начать свою новую работу в Лондоне.",
            explanation: "\"Finally\" — наконец, в конце концов (после долгого ожидания)",
            vocab: [
                { word: "finally", translation: "наконец" },
                { word: "to start", translation: "начинать" },
                { word: "job", translation: "работа" }
            ],
            timestamps: {
                en: { start: 34.9, end: 39.1 },
                ru: { start: 39.5, end: 43.8 },
                exp: { start: 44.2, end: 48.0 }
            }
        },
        {
            id: 5,
            original: "It was a dream come true, but also terrifying.",
            translation: "Это была мечта, которая сбылась, но также и пугающая.",
            explanation: "\"Dream come true\" — устойчивое выражение: сбывшаяся мечта",
            vocab: [
                { word: "dream come true", translation: "сбывшаяся мечта" },
                { word: "terrifying", translation: "пугающий, ужасающий" }
            ],
            timestamps: {
                en: { start: 48.4, end: 52.8 },
                ru: { start: 53.2, end: 58.5 },
                exp: { start: 58.9, end: 63.2 }
            }
        }
    ],
    allVocab: [
        { word: "relentlessly", translation: "неумолимо, без остановки" },
        { word: "to sigh", translation: "вздыхать" },
        { word: "dream come true", translation: "мечта, которая сбылась" },
        { word: "terrifying", translation: "пугающий" },
        { word: "finally", translation: "наконец" }
    ]
};

export const mockGenerationSteps = [
    { id: 1, name: "Сегментация текста", duration: 500 },
    { id: 2, name: "Перевод предложений", duration: 1500 },
    { id: 3, name: "Генерация пояснений", duration: 2000 },
    { id: 4, name: "Синтез речи", duration: 3000 }
];