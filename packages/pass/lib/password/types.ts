export enum SeperatorOptions {
    HYPHEN = '-',
    SPACE = ' ',
    PERIOD = '.',
    COMMA = ',',
    UNDERSCORE = '_',
    NUMBER = 'NUMBER',
    NUMBER_OR_SYMBOL = 'NUMBER_OR_SYMBOL',
}

export type PasswordAutosuggestOptions = {
    config: GeneratePasswordConfig;
    copy: boolean;
};

export type MemorablePasswordOptions = {
    wordCount: number;
    seperator: SeperatorOptions;
    capitalize: boolean;
    extraNumbers: boolean;
};

export type RandomPasswordOptions = {
    length: number;
    useSpecialChars: boolean;
    useDigits: boolean;
    useUppercase: boolean;
};

export type GeneratePasswordMode = 'random' | 'memorable';

export type GeneratePasswordConfig<T extends GeneratePasswordMode = GeneratePasswordMode> = Extract<
    { type: 'random'; options: RandomPasswordOptions } | { type: 'memorable'; options: MemorablePasswordOptions },
    { type: T }
>;
