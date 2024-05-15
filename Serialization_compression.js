// Сериализация массива в строку с разделителем ";"
function simpleSerialize(array) {
    /*
    Этот простейший метод сериализации принят за бейзлайн. Средняя длина элемента для случайных целых чисел
    в диапазоне (1, 300) составляет примерно 2.64 символа (рассчитана как 
    (9*1 + 90*2 + 201*3) / 300). Добавление разделителя между элементами увеличивает
    среднюю длину элемента до примерно 3.64 символа.
    */
    return array.join(';');
}

// Десериализация строки обратно в массив целых чисел
function simpleDeserialize(str) {
    return str.split(';').map(Number);
}

// Сериализация массива с использованием дельта-кодирования
function deltaSerialize(array) {
    /*
    Я решила использовать дельта-кодирование, потому что порядок элементов в массиве не важен,
    позволяя отсортировать массив. Для массивов, размер которых сопоставим с диапазоном случайных чисел,
    различия между числами после сортировки часто оказываются однозначными числами. По мере увеличения
    размера массива относительно диапазона случайных чисел, вероятность того, что дельта-кодирование
    приведет к тому, что все элементы будут однозначными числами, увеличивается.
    
    Вместо использования разделителей для каждого элемента в дельта-массиве, что почти удвоило бы
    среднюю длину элемента с ~1 символа до ~2, я решила закодировать строку так, чтобы элемент
    по умолчанию считался однозначным, если не указано иное. Двузначные элементы предваряются одной
    тильдой (~), а трехзначные элементы - двумя тильдами. Обрамление многосимвольных чисел специальными
    символами логически потребовало бы двух дополнительных символов для каждого многосимвольного числа,
    но моя реализация достигает этого с помощью только одного.
    
    Использование только дельта-кодирования, как правило, достаточно для достижения требуемого по задаче
    сжатия на 50% в среднем.
    */
    if (array.length === 0) return "";
    
    const sortedArray = array.slice().sort((a, b) => a - b);
    const deltas = [sortedArray[0]];
    for (let i = 1; i < sortedArray.length; i++) {
        deltas.push(sortedArray[i] - sortedArray[i - 1]);
    }
    
    let serialized = "";
    deltas.forEach(delta => {
        const deltaStr = delta.toString();
        serialized += '~'.repeat(deltaStr.length - 1) + deltaStr;
    });
    
    return serialized;
}

// Десериализация дельта-кодированной строки обратно в массив
function deltaDeserialize(s) {
    if (s.length === 0) return [];
    
    const numbers = [];
    let i = 0;
    while (i < s.length) {
        if (s[i] === '~') {
            let tildeCount = 1;
            while (i + 1 < s.length && s[i + 1] === '~') {
                tildeCount++;
                i++;
            }
            i++;
            const numberLength = tildeCount + 1;
            const currentNumber = s.slice(i, i + numberLength);
            numbers.push(parseInt(currentNumber, 10));
            i += numberLength;
        } else {
            numbers.push(parseInt(s[i], 10));
            i++;
        }
    }
    
    if (numbers.length > 0) {
        const originalValues = [numbers[0]];
        for (let i = 1; i < numbers.length; i++) {
            originalValues.push(originalValues[originalValues.length - 1] + numbers[i]);
        }
        return originalValues;
    }
    return numbers;
}

// Сжатие строки с использованием конвертации из BaseX в Base91
function baseXToBase91(inputString) {
    /*
    Я решила усложнить код, добавив эту нетривиальную функцию по нескольким причинам:
    Во-первых, это весело.
    Во-вторых, по условиям задачи требуется сжать данные максимально.
	И в третьих, позволяется использовать все печатные символы ASCII.
    
    Для большего сжатия можно интерпретировать строку как число в системе счисления X 
	и сконвертировать её в число в системе счисления Y с наибольшим основанием. 
	Причём чем сильнее разница между X и Y, тем более эффективное достигается сжатие. 
	Чаще всего, использование стандартной десятичной системы счислеиния для хранения строки 
	слишком расточительно (Например, для строки 20216022" достаточно Base4 с словарем "0216"). 
	Поэтому я решила определять X по количеству уникальных символов в строке. 
    
    Что касается целевой BaseY, я могла бы использовать популярную Base64, но ведь в ASCII больше печатных символов,
    а нам разрешено использовать их все! Поэтому я использовала максимум - Base91, исключила только ' " ~ 
	Динамически созданный словарь BaseX хранится в начале строки - он занимает совсем мало места по сравнению с достигнутым сжатием.
    */
    const base91Dict = " !#$%&()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}";
    const base91Base = BigInt(base91Dict.length);

    const uniqueChars = Array.from(new Set(inputString)).sort();
    if (uniqueChars.length === 1) {
        uniqueChars.unshift("~");  // Добавление второго символа, при наличии только одного уникального символа в словаре
    }
    const customBase = BigInt(uniqueChars.length);

    if (inputString[0] === uniqueChars[0]) {  // Проверка не начинается ли строка с нуля или его словарного аналога
        uniqueChars.push(uniqueChars.shift());  // Перемещает первый уникальный символ в конец, чтобы избежать потери ведущих нулей (например, строка 0015 преобразуется в число 15)
    }

    const charToValue = {};
    uniqueChars.forEach((char, idx) => {
        charToValue[char] = BigInt(idx);
    });

    let base10Value = BigInt(0);
    for (let i = inputString.length - 1; i >= 0; i--) {
        // Base10 используется в качестве промежуточного шага для упрощения процесса и предотвращения неочевидных ошибок
        base10Value += charToValue[inputString[i]] * customBase ** BigInt(inputString.length - 1 - i);  // Преобразование BaseX в Base10
    }

    let base91Value = [];
    while (base10Value > 0) {
        const remainder = base10Value % base91Base;
        base91Value.unshift(base91Dict[Number(remainder)]);  // Преобразование Base10 в Base91
        base10Value = base10Value / base91Base;
    }

    return uniqueChars.join('') + '~' + base91Value.join('');  // Добавление словаря BaseX в начало сконвертированной Base91 строки
}

// Декомпрессия строки, закодированной в Base91, обратно в исходную строку
function base91ToBaseX(formattedString) {
    /*
    Эта функция обратна процессу, выполненному в baseXToBase91.
    Она конвертирует Base91 строку обратно в BaseX, определив размер и словарь BaseX из префикса.
    */
    const base91Dict = " !#$%&()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}";
    const base91Base = BigInt(base91Dict.length);

    const splitIndex = formattedString.lastIndexOf('~');
    const dictionary = formattedString.slice(0, splitIndex);  // Извлечение словаря BaseX
    const base91Encoded = formattedString.slice(splitIndex + 1);

    let base10Value = BigInt(0);
    for (let i = base91Encoded.length - 1; i >= 0; i--) {
        // Снова использование Base10 в качестве промежуточного шага
        base10Value += BigInt(base91Dict.indexOf(base91Encoded[i])) * base91Base ** BigInt(base91Encoded.length - 1 - i);  // Преобразование Base91 в Base10
    }

    const customBase = BigInt(dictionary.length);
    const valueToChar = {};
    dictionary.split('').forEach((char, idx) => {
        valueToChar[BigInt(idx)] = char;
    });

    let originalChars = [];
    while (base10Value > 0) {
        const remainder = base10Value % customBase;
        originalChars.unshift(valueToChar[remainder]);  // Преобразование Base10 в BaseX с использованием словаря
        base10Value = base10Value / customBase;
    }

    return originalChars.join('');  // Возвращение декомпрессированной исходной строки
}

// Экспорт функций для использования в файле с тестами
module.exports = {
    simpleSerialize,
    simpleDeserialize,
    deltaSerialize,
    deltaDeserialize,
    baseXToBase91,
    base91ToBaseX
};