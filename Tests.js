// Импорт необходимых функций из файла serialization_compression.js
const {
    simpleSerialize,
    simpleDeserialize,
    deltaSerialize,
    deltaDeserialize,
    baseXToBase91,
    base91ToBaseX
} = require('./Serialization_compression');

// Генерация массива случайных целых чисел в указанном диапазоне
function generateRandomArray(numElements, valueRange = [1, 300]) {
	const [min, max] = valueRange;
    const array = [];
    for (let i = 0; i < numElements; i++) {
        const randomValue = Math.floor(Math.random() * (max - min + 1)) + min;
        array.push(randomValue);
    }
    return array;
}

// Генерация последовательного массива
function generateSequentialArray(start, end) {
    const array = [];
    for (let i = start; i <= end; i++) {
        array.push(i);
    }
    return array;
}

// Проверка, что десериализованный массив идентичен изначальному
function validateArrays(original, deserialized) {
    if (original.length !== deserialized.length) return false;
    const originalCount = original.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
    }, {});
    const deserializedCount = deserialized.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
    }, {});
    return JSON.stringify(originalCount) === JSON.stringify(deserializedCount);
}

// Определение массивов для тестов в соответствии с требованиями задачи
const testCases = {
    "Случайные 50": generateRandomArray(50),
    "Случайные 100": generateRandomArray(100),
    "Случайные 500": generateRandomArray(500),
    "Случайные 1000": generateRandomArray(1000),

    "Случайные 50 однозначные": generateRandomArray(50, [1, 9]),
    "Случайные 100 однозначные": generateRandomArray(100, [1, 9]),
    "Случайные 500 однозначные": generateRandomArray(500, [1, 9]),
    "Случайные 1000 однозначные": generateRandomArray(1000, [1, 9]),

    "Случайные 50 двузначные": generateRandomArray(50, [10, 99]),
    "Случайные 100 двузначные": generateRandomArray(100, [10, 99]),
    "Случайные 500 двузначные": generateRandomArray(500, [10, 99]),
    "Случайные 1000 двузначные": generateRandomArray(1000, [10, 99]),

    "Случайные 50 трехзначные": generateRandomArray(50, [100, 300]),
    "Случайные 100 трехзначные": generateRandomArray(100, [100, 300]),
    "Случайные 500 трехзначные": generateRandomArray(500, [100, 300]),
    "Случайные 1000 трехзначные": generateRandomArray(1000, [100, 300]),

    "Все однозначные последовательно": Array.from({length: 9}, (_, i) => i + 1),
    "Все двузначные последовательно": Array.from({length: 90}, (_, i) => i + 10),
    "Все трехзначные последовательно": Array.from({length: 201}, (_, i) => i + 100),
    
    "Каждого числа по три": Array.from({length: 300}, (_, i) => i + 1).flatMap(i => [i, i, i])
};

// Тестирование процесса сжатия и декомпрессии
function testCompression(array) {
    const original = simpleSerialize(array);  // Базовая сериализация (бейзлайн)
    const serializedDelta = deltaSerialize(array);  // Дельта-кодирование
    const compressedBase91 = baseXToBase91(serializedDelta);  // Сжатие BaseX -> Base91
    const decompressedBase91 = base91ToBaseX(compressedBase91);  // Декомпрессия Base91 -> BaseX
    const deserializedArray = deltaDeserialize(decompressedBase91);  // Десериализация дельта-кодированной строки
    
    const originalLength = original.length;
    const compressedLength = compressedBase91.length;
    const compressionRatio = originalLength / compressedLength;  // Расчет коэффициента сжатия
    
    const isValid = validateArrays(array, deserializedArray);  // Проверка, что десериализованный массив идентичен исходному
    
    return {
        original,
        serializedDelta,
        compressed: compressedBase91,
        originalLength,
        compressedLength,
        compressionRatio,
        validity: isValid
    };
}

// Прогон тестов на каждом массиве
Object.entries(testCases).forEach(([testName, array]) => {
    const result = testCompression(array);
    console.log(`Тестовый пример: ${testName}
Базовая сериализация: ${result.original}
Первый шаг, дельта-сериализация: ${result.serializedDelta}
Второй шаг, Base91 сжатие: ${result.compressed}
Размер строки после базовой сериализации: ${result.originalLength}
Размер строки после Base91 сжатия: ${result.compressedLength}
Коэффициент сжатия: ${result.compressionRatio.toFixed(2)}
Компрессия-декомпрессия прошла: ${result.validity ? 'Корректно' : 'Некорректно'}
${'-'.repeat(30)}`);
});