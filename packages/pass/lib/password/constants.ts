import type { GeneratePasswordConfig } from './generator';

/* We've removed the characters `i, o, l, I ,O ,L`  to minimize
 * the chance of confusion. For symbols we'd like to avoid those
 * that prevent selecting the password when double clicking on
 * top of the password. */
export const uppercaseChars = 'ABCDEFGHJKMNPQRSTUVWXYZ';
export const lowercaseChars = 'abcdefghjkmnpqrstuvwxyz';
export const alphabeticChars = uppercaseChars + lowercaseChars + 'iolIOL';
export const digitChars = '0123456789';
export const specialChars = '!#$%&()*+.:;<=>?@[]^';

export const DEFAULT_PASSWORD_LENGTH = 20;

export enum SeperatorOptions {
    HYPHEN = '-',
    SPACE = ' ',
    PERIOD = '.',
    COMMA = ',',
    UNDERSCORE = '_',
    NUMBER = 'NUMBER',
    NUMBER_OR_SYMBOL = 'NUMBER_OR_SYMBOL',
}

export const DEFAULT_MEMORABLE_PW_OPTIONS: GeneratePasswordConfig<'memorable'> = {
    type: 'memorable',
    options: {
        wordCount: 5,
        seperator: SeperatorOptions.HYPHEN,
        capitalize: true,
        extraNumbers: true,
    },
};

export const DEFAULT_RANDOM_PW_OPTIONS: GeneratePasswordConfig<'random'> = {
    type: 'random',
    options: {
        length: DEFAULT_PASSWORD_LENGTH,
        useDigits: true,
        useSpecialChars: true,
        useUppercase: true,
    },
};
