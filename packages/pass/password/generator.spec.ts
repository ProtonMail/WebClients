import type { WordListOptions } from './generator';
import { SeperatorOptions, digits, digitsAndSymbols, generateFromWordList, specialChars } from './generator';
import WORD_LIST from './wordlist.json';

const WORDS = Object.values(WORD_LIST);

describe('password generators', () => {
    test('should throw if wordCount is 0', () => {
        expect(() => generateFromWordList({ wordCount: 0, seperator: SeperatorOptions.HYPHEN })).toThrow();
    });

    test('generate from wordlist with basic seperators', () => {
        const options: WordListOptions[] = [
            { wordCount: 1, seperator: SeperatorOptions.HYPHEN },
            { wordCount: 4, seperator: SeperatorOptions.HYPHEN },
            { wordCount: 4, seperator: SeperatorOptions.COMMA },
            { wordCount: 4, seperator: SeperatorOptions.PERIOD },
            { wordCount: 4, seperator: SeperatorOptions.UNDERSCORE },
            { wordCount: 4, seperator: SeperatorOptions.SPACE },
            { wordCount: 5, seperator: SeperatorOptions.HYPHEN },
            { wordCount: 10, seperator: SeperatorOptions.SPACE },
            { wordCount: 15, seperator: SeperatorOptions.UNDERSCORE },
        ];

        options.forEach(({ wordCount, seperator }) => {
            const result = generateFromWordList({ wordCount, seperator });
            const words = result.split(seperator);
            expect(result).toBeDefined();
            expect(words.length).toEqual(wordCount);
            expect(words.every((word) => WORDS.includes(word))).toBe(true);
        });
    });

    test('generate from wordlist with random number seperator', () => {
        const options: WordListOptions[] = [
            { wordCount: 4, seperator: SeperatorOptions.NUMBER },
            { wordCount: 5, seperator: SeperatorOptions.NUMBER },
            { wordCount: 10, seperator: SeperatorOptions.NUMBER },
            { wordCount: 15, seperator: SeperatorOptions.NUMBER },
        ];

        options.forEach(({ wordCount, seperator }) => {
            const result = generateFromWordList({ wordCount, seperator });
            const words = result.split(new RegExp(digits.split('').join('|')));
            expect(result).toBeDefined();
            expect(words.length).toEqual(wordCount);
            expect(words.every((word) => WORDS.includes(word))).toBe(true);
        });
    });

    test('generate from wordlist with random number or symbol seperator', () => {
        const options: WordListOptions[] = [
            { wordCount: 4, seperator: SeperatorOptions.NUMBER_OR_SYMBOL },
            { wordCount: 5, seperator: SeperatorOptions.NUMBER_OR_SYMBOL },
            { wordCount: 10, seperator: SeperatorOptions.NUMBER_OR_SYMBOL },
            { wordCount: 15, seperator: SeperatorOptions.NUMBER_OR_SYMBOL },
        ];

        options.forEach(({ wordCount, seperator }) => {
            const result = generateFromWordList({ wordCount, seperator });
            const words = result.split(
                new RegExp(
                    digitsAndSymbols
                        .split('')
                        .map((char) => (specialChars.includes(char) ? `\\${char}` : char))
                        .join('|')
                )
            );
            expect(result).toBeDefined();
            expect(words.length).toEqual(wordCount);
            expect(words.every((word) => WORDS.includes(word))).toBe(true);
        });
    });
});
