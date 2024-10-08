import { useCallback, useEffect, useState } from 'react';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import {
    DEFAULT_MEMORABLE_PW_OPTIONS,
    DEFAULT_RANDOM_PW_OPTIONS,
    alphabeticChars,
    digitChars,
} from '@proton/pass/lib/password/constants';
import { generatePassword } from '@proton/pass/lib/password/generator';
import type { GeneratePasswordConfig, GeneratePasswordMode } from '@proton/pass/lib/password/types';
import type { MaybeNull } from '@proton/pass/types';
import { merge } from '@proton/pass/utils/object/merge';
import debounce from '@proton/utils/debounce';
import noop from '@proton/utils/noop';

export enum CharType {
    Alphabetic,
    Digit,
    Special,
}

/* Designers mixed the colors of different ui-${type}
 * sub-themes for the character colors.. */
export const charTypeToClassName = {
    [CharType.Alphabetic]: '',
    [CharType.Digit]: 'ui-violet pass-password-generator--char-digit',
    [CharType.Special]: 'ui-teal pass-password-generator--char-special',
};

export const getTypeFromChar = (char: string) => {
    if (alphabeticChars.includes(char)) return CharType.Alphabetic;
    if (digitChars.includes(char)) return CharType.Digit;

    return CharType.Special;
};

export const getCharsGroupedByColor = (password: string) => {
    if (password.length === 0) return [];

    const [head, ...chars] = Array.from(password);
    const startType = getTypeFromChar(head);

    return chars
        .reduce(
            (state, currentChar) => {
                const currentElement = state[state.length - 1];
                const previousType = currentElement.color;
                const currentType = getTypeFromChar(currentChar);

                return previousType !== currentType
                    ? [...state, { color: currentType, content: currentChar }]
                    : [...state.slice(0, -1), { color: previousType, content: currentElement.content + currentChar }];
            },
            [{ color: startType, content: head }]
        )
        .map(({ color, content }, index) => (
            <span className={charTypeToClassName[color]} key={index}>
                {content}
            </span>
        ));
};

type UsePasswordGeneratorOptions = {
    initial: MaybeNull<GeneratePasswordConfig>;
    onConfigChange: (options: GeneratePasswordConfig) => void;
};

export const usePasswordGenerator = ({ initial, onConfigChange }: UsePasswordGeneratorOptions) => {
    const { core } = usePassCore();
    const [config, setConfig] = useState<GeneratePasswordConfig>(initial ?? DEFAULT_MEMORABLE_PW_OPTIONS);
    const generator = useCallback(generatePassword(core), [core]);
    const [password, setPassword] = useState('');

    const regeneratePassword = useCallback(() => {
        generator(config).then(setPassword).catch(noop);
    }, [generator, config]);

    useEffect(regeneratePassword, []);

    /** debounce the pw options dispatch in order to avoid swarming the
     * store with updates when using the length slider */
    const savePasswordOptions = useCallback(debounce(onConfigChange, 250), []);

    const setPasswordOptions = <T extends GeneratePasswordConfig['type']>(
        type: T,
        update?: Partial<Extract<GeneratePasswordConfig, { type: T }>['options']>
    ) => {
        setConfig((options) => {
            const newOptions = (() => {
                if (update) return merge(options, { options: update });
                if (type === 'memorable') return DEFAULT_MEMORABLE_PW_OPTIONS;
                if (type === 'random') return DEFAULT_RANDOM_PW_OPTIONS;
                return options;
            })();

            savePasswordOptions(newOptions);
            return newOptions;
        });
    };

    /* regenerate the password on each options change */
    useEffect(() => regeneratePassword(), Object.values(config.options));

    return {
        config,
        password,
        setPassword,
        setPasswordOptions,
        regeneratePassword,
    };
};

export type UsePasswordGeneratorResult<T extends GeneratePasswordMode = GeneratePasswordMode> = Omit<
    ReturnType<typeof usePasswordGenerator>,
    'config'
> & { config: GeneratePasswordConfig<T> };

export const isUsingRandomPassword = (
    result: UsePasswordGeneratorResult
): result is UsePasswordGeneratorResult<'random'> => result.config.type === 'random';

export const isUsingMemorablePassword = (
    result: UsePasswordGeneratorResult
): result is UsePasswordGeneratorResult<'memorable'> => result.config.type === 'memorable';
