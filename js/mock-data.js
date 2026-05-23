// Моковые данные для демонстрации прототипа

const mockGenerationSteps = [
    { duration: 800, message: 'Сегментация текста' },
    { duration: 1200, message: 'Перевод предложений' },
    { duration: 1000, message: 'Генерация пояснений' },
    { duration: 1500, message: 'Синтез речи' }
];

const demoLesson = {
    id: 'demo-123',
    title: 'Урок #demo-123',
    sentences: [
        {
            id: 0,
            text: 'The rain poured down relentlessly.',
            translation: 'Дождь лил не переставая.',
            audio: {
                en: null,
                ru: null
            },
            explanation: '"Pour down" — идиома, означающая сильный, непрерывный ливень',
            timestamps: {
                en: { start: 0, end: 3.5 },
                exp: { start: 0, end: 3.5 }
            }
        },
        {
            id: 1,
            text: 'Sarah looked out the window and sighed.',
            translation: 'Сара выглянула в окно и вздохнула.',
            audio: {
                en: null,
                ru: null
            },
            explanation: '"Look out" — выглянуть, высунуться (из окна, машины)',
            timestamps: {
                en: { start: 3.5, end: 7.2 },
                exp: { start: 3.5, end: 7.2 }
            }
        },
        {
            id: 2,
            text: 'She had been waiting for this moment for years.',
            translation: 'Она ждала этого момента годами.',
            audio: {
                en: null,
                ru: null
            },
            explanation: 'Past Perfect Continuous — действие длилось в прошлом до другого момента',
            timestamps: {
                en: { start: 7.2, end: 11.8 },
                exp: { start: 7.2, end: 11.8 }
            }
        },
        {
            id: 3,
            text: 'Finally, she could start her new job in London.',
            translation: 'Наконец-то она могла приступить к своей новой работе в Лондоне.',
            audio: {
                en: null,
                ru: null
            },
            explanation: '"Finally" — наконец, в конце концов (после долгого ожидания)',
            timestamps: {
                en: { start: 11.8, end: 16.5 },
                exp: { start: 11.8, end: 16.5 }
            }
        }
    ],
    vocabulary: [
        { word: 'relentlessly', translation: 'неумолимо, без остановки' },
        { word: 'to sigh', translation: 'вздыхать' },
        { word: 'dream come true', translation: 'мечта, которая сбылась' }
    ]
};

// Делаем доступным глобально (вместо export)
window.mockGenerationSteps = mockGenerationSteps;
window.demoLesson = demoLesson;