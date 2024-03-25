import { SeperatorOptions, digitChars, specialChars } from './constants';
import type { MemorablePasswordOptions } from './memorable';
import { generateMemorablePassword } from './memorable';
import WORD_LIST from './wordlist.json';

const WORDS = Object.values(WORD_LIST);

const wordsInList = (words: string[], options: MemorablePasswordOptions) =>
    words.every((word) => {
        let originalWord = word.toLowerCase();
        if (options.extraNumbers) originalWord = originalWord.slice(0, -1);
        return WORDS.includes(originalWord);
    });

const wordsMatchCapitalization = (words: string[], options: MemorablePasswordOptions) =>
    words.every((word) => (options.capitalize ? /[A-Z]/.test(word[0]) : true));

const wordsMatchExtraNumbers = (words: string[], options: MemorablePasswordOptions) =>
    words.every((word) => (options.extraNumbers ? /[0-9]/.test(word[word.length - 1]) : true));

describe('memorable password generator', () => {
    test('should throw if wordCount is 0', () => {
        expect(() =>
            generateMemorablePassword({
                wordCount: 0,
                seperator: SeperatorOptions.HYPHEN,
                capitalize: false,
                extraNumbers: false,
            })
        ).toThrow();
    });

    test('generate from wordlist with basic seperators', () => {
        const options: MemorablePasswordOptions[] = [
            { wordCount: 1, seperator: SeperatorOptions.HYPHEN, capitalize: false, extraNumbers: false },
            { wordCount: 4, seperator: SeperatorOptions.HYPHEN, capitalize: false, extraNumbers: false },
            { wordCount: 4, seperator: SeperatorOptions.COMMA, capitalize: true, extraNumbers: false },
            { wordCount: 4, seperator: SeperatorOptions.PERIOD, capitalize: false, extraNumbers: false },
            { wordCount: 4, seperator: SeperatorOptions.UNDERSCORE, capitalize: false, extraNumbers: false },
            { wordCount: 4, seperator: SeperatorOptions.SPACE, capitalize: false, extraNumbers: false },
            { wordCount: 5, seperator: SeperatorOptions.HYPHEN, capitalize: true, extraNumbers: false },
            { wordCount: 10, seperator: SeperatorOptions.SPACE, capitalize: false, extraNumbers: false },
            { wordCount: 15, seperator: SeperatorOptions.UNDERSCORE, capitalize: true, extraNumbers: false },
        ];

        options.forEach((options) => {
            const result = generateMemorablePassword(options);
            const words = result.split(options.seperator);
            expect(result).toBeDefined();
            expect(words.length).toEqual(options.wordCount);
            expect(wordsInList(words, options)).toBe(true);
            expect(wordsMatchCapitalization(words, options)).toBe(true);
            expect(wordsMatchExtraNumbers(words, options)).toBe(true);
        });
    });

    test('generate from wordlist with random number seperator', () => {
        const options: MemorablePasswordOptions[] = [
            { wordCount: 4, seperator: SeperatorOptions.NUMBER, capitalize: false, extraNumbers: false },
            { wordCount: 5, seperator: SeperatorOptions.NUMBER, capitalize: true, extraNumbers: false },
            { wordCount: 10, seperator: SeperatorOptions.NUMBER, capitalize: true, extraNumbers: false },
            { wordCount: 15, seperator: SeperatorOptions.NUMBER, capitalize: false, extraNumbers: false },
        ];

        options.forEach((options) => {
            const result = generateMemorablePassword(options);
            const words = result.split(new RegExp(digitChars.split('').join('|')));
            expect(result).toBeDefined();
            expect(words.length).toEqual(options.wordCount);
            expect(wordsInList(words, options)).toBe(true);
            expect(wordsMatchCapitalization(words, options)).toBe(true);
            expect(wordsMatchExtraNumbers(words, options)).toBe(true);
        });
    });

    test('generate from wordlist with random number or symbol seperator', () => {
        const options: MemorablePasswordOptions[] = [
            { wordCount: 4, seperator: SeperatorOptions.NUMBER_OR_SYMBOL, capitalize: false, extraNumbers: false },
            { wordCount: 5, seperator: SeperatorOptions.NUMBER_OR_SYMBOL, capitalize: true, extraNumbers: false },
            { wordCount: 10, seperator: SeperatorOptions.NUMBER_OR_SYMBOL, capitalize: true, extraNumbers: false },
            { wordCount: 15, seperator: SeperatorOptions.NUMBER_OR_SYMBOL, capitalize: false, extraNumbers: false },
        ];

        options.forEach((options) => {
            const result = generateMemorablePassword(options);
            const words = result.split(
                new RegExp(
                    digitChars
                        .concat(specialChars)
                        .split('')
                        .map((char) => (specialChars.includes(char) ? `\\${char}` : char))
                        .join('|')
                )
            );
            expect(result).toBeDefined();
            expect(words.length).toEqual(options.wordCount);
            expect(wordsInList(words, options)).toBe(true);
            expect(wordsMatchCapitalization(words, options)).toBe(true);
            expect(wordsMatchExtraNumbers(words, options)).toBe(true);
        });
    });

    test('should support interpolating extra numbers', () => {
        const options: MemorablePasswordOptions[] = [
            { wordCount: 1, seperator: SeperatorOptions.HYPHEN, capitalize: false, extraNumbers: true },
            { wordCount: 4, seperator: SeperatorOptions.HYPHEN, capitalize: false, extraNumbers: true },
            { wordCount: 4, seperator: SeperatorOptions.COMMA, capitalize: true, extraNumbers: true },
            { wordCount: 4, seperator: SeperatorOptions.PERIOD, capitalize: false, extraNumbers: true },
            { wordCount: 4, seperator: SeperatorOptions.UNDERSCORE, capitalize: false, extraNumbers: true },
            { wordCount: 4, seperator: SeperatorOptions.SPACE, capitalize: false, extraNumbers: true },
            { wordCount: 5, seperator: SeperatorOptions.HYPHEN, capitalize: true, extraNumbers: true },
            { wordCount: 10, seperator: SeperatorOptions.SPACE, capitalize: false, extraNumbers: true },
            { wordCount: 15, seperator: SeperatorOptions.UNDERSCORE, capitalize: true, extraNumbers: true },
        ];

        options.forEach((options) => {
            const result = generateMemorablePassword(options);
            const words = result.split(options.seperator);
            expect(result).toBeDefined();
            expect(words.length).toEqual(options.wordCount);
            expect(wordsInList(words, options)).toBe(true);
            expect(wordsMatchCapitalization(words, options)).toBe(true);
            expect(wordsMatchExtraNumbers(words, options)).toBe(true);
        });
    });
});
