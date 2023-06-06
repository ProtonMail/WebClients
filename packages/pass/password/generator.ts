import WORD_LIST from './wordlist.json';

export const alphabeticChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
export const digits = '0123456789';
export const specialChars = '!#$%&()*+.:;<=>?@[]^';
export const digitsAndSymbols = digits.concat(specialChars);

export enum SeperatorOptions {
    HYPHEN = '-',
    SPACE = ' ',
    PERIOD = '.',
    COMMA = ',',
    UNDERSCORE = '_',
    NUMBER = 'NUMBER',
    NUMBER_OR_SYMBOL = 'NUMBER_OR_SYMBOL',
}

export type WordListOptions = {
    wordCount: number;
    seperator: SeperatorOptions;
};

const getRandomCharacter = (characters: string) => {
    const seed = Array.from(crypto.getRandomValues(new Uint8Array(1)));
    const idx = seed.map((val) => val % characters.length)[0];
    return characters[idx];
};

const getSeperator = (seperator: SeperatorOptions): string => {
    switch (seperator) {
        case SeperatorOptions.HYPHEN:
            return '-';
        case SeperatorOptions.SPACE:
            return ' ';
        case SeperatorOptions.PERIOD:
            return '.';
        case SeperatorOptions.COMMA:
            return ',';
        case SeperatorOptions.UNDERSCORE:
            return '_';
        case SeperatorOptions.NUMBER:
            return getRandomCharacter(digits);
        case SeperatorOptions.NUMBER_OR_SYMBOL:
            return getRandomCharacter(digitsAndSymbols);
    }
};

export const generateFromWordList = (options: WordListOptions): string => {
    if (options.wordCount <= 0) throw new Error('invalid options');

    const getRandomWord = () => {
        const wordId = Array.from(crypto.getRandomValues(new Uint8Array(5)))
            .map((num) => (num % 6) + 1)
            .join('') as keyof typeof WORD_LIST;

        return WORD_LIST[wordId];
    };

    return Array.from({ length: options.wordCount }, () => getRandomWord()).reduce<string>(
        (password, word, idx) => (idx === 0 ? word : `${password}${getSeperator(options.seperator)}${word}`),
        ''
    );
};
