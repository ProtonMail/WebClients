import { c } from 'ttag';

import capitalize from '@proton/utils/capitalize';

import { SeperatorOptions, digitChars, specialChars } from './constants';
import WORD_LIST from './wordlist.json';

export type MemorablePasswordOptions = {
    wordCount: number;
    seperator: SeperatorOptions;
    capitalize: boolean;
    extraNumbers: boolean;
};

export const getSeperatorTranslation = (seperator: SeperatorOptions) =>
    ({
        [SeperatorOptions.HYPHEN]: c('Option').t`Hyphens`,
        [SeperatorOptions.SPACE]: c('Option').t`Spaces`,
        [SeperatorOptions.PERIOD]: c('Option').t`Periods`,
        [SeperatorOptions.COMMA]: c('Option').t`Commas`,
        [SeperatorOptions.UNDERSCORE]: c('Option').t`Underscores`,
        [SeperatorOptions.NUMBER]: c('Option').t`Numbers`,
        [SeperatorOptions.NUMBER_OR_SYMBOL]: c('Option').t`Numbers and Symbols`,
    })[seperator];

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
            return getRandomCharacter(digitChars);
        case SeperatorOptions.NUMBER_OR_SYMBOL:
            return getRandomCharacter(digitChars.concat(specialChars));
    }
};

export const generateMemorablePassword = (options: MemorablePasswordOptions): string => {
    if (options.wordCount <= 0) throw new Error('invalid options');

    const getRandomWord = () => {
        const wordId = Array.from(crypto.getRandomValues(new Uint8Array(5)))
            .map((num) => (num % 6) + 1)
            .join('') as keyof typeof WORD_LIST;

        return WORD_LIST[wordId];
    };

    return Array.from({ length: options.wordCount }, () => {
        let word = getRandomWord();
        if (options.capitalize) word = capitalize(word)!;
        if (options.extraNumbers) word = `${word}${getRandomCharacter(digitChars)}`;
        return word;
    }).reduce<string>(
        (password, word, idx) => (idx === 0 ? word : `${password}${getSeperator(options.seperator)}${word}`),
        ''
    );
};
