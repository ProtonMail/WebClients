import type { WasmWordSeparator } from '@protontech/pass-rust-core/worker';

import type { PassCoreProxy } from '@proton/pass/lib/core/types';

import { type GeneratePasswordConfig, SeperatorOptions } from './types';

const SEPERATOR_MAP: Record<SeperatorOptions, WasmWordSeparator> = {
    [SeperatorOptions.HYPHEN]: 'Hyphens',
    [SeperatorOptions.SPACE]: 'Spaces',
    [SeperatorOptions.PERIOD]: 'Periods',
    [SeperatorOptions.COMMA]: 'Commas',
    [SeperatorOptions.UNDERSCORE]: 'Underscores',
    [SeperatorOptions.NUMBER]: 'Numbers',
    [SeperatorOptions.NUMBER_OR_SYMBOL]: 'NumbersAndSymbols',
};

export const generatePassword =
    (core: PassCoreProxy) =>
    (config: GeneratePasswordConfig): Promise<string> => {
        switch (config.type) {
            case 'random':
                return core.generate_password({
                    length: config.options.length,
                    numbers: config.options.useDigits,
                    uppercase_letters: config.options.useUppercase,
                    symbols: config.options.useSpecialChars,
                });
            case 'memorable':
                return core.generate_random_passphrase({
                    separator: SEPERATOR_MAP[config.options.seperator],
                    capitalise: config.options.capitalize,
                    include_numbers: config.options.extraNumbers,
                    count: config.options.wordCount,
                });
        }
    };
