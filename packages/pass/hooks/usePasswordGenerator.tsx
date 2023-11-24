import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { DEFAULT_PASSWORD_LENGTH, alphabeticChars, digitChars } from '@proton/pass/lib/password/constants';
import type { GeneratePasswordOptions } from '@proton/pass/lib/password/generator';
import { generatePassword } from '@proton/pass/lib/password/generator';
import { SeperatorOptions } from '@proton/pass/lib/password/memorable';
import { passwordOptionsEdit } from '@proton/pass/store/actions/creators/password';
import type { MaybeNull } from '@proton/pass/types';
import { merge } from '@proton/pass/utils/object/merge';
import debounce from '@proton/utils/debounce';

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

export const DEFAULT_MEMORABLE_PW_OPTIONS: GeneratePasswordOptions = {
    type: 'memorable',
    options: {
        wordCount: 4,
        seperator: SeperatorOptions.HYPHEN,
        capitalize: true,
        extraNumbers: true,
    },
};

export const DEFAULT_RANDOM_PW_OPTIONS: GeneratePasswordOptions = {
    type: 'random',
    options: {
        length: DEFAULT_PASSWORD_LENGTH,
        useDigits: true,
        useSpecialChars: true,
        useUppercase: true,
    },
};

export const usePasswordGenerator = (initial: MaybeNull<GeneratePasswordOptions>) => {
    const dispatch = useDispatch();

    const [passwordOptions, setOptions] = useState<GeneratePasswordOptions>(initial ?? DEFAULT_MEMORABLE_PW_OPTIONS);
    const [password, setPassword] = useState(() => generatePassword(passwordOptions));
    const regeneratePassword = () => setPassword(generatePassword(passwordOptions));

    const savePasswordOptions = useCallback(
        /** debounce the pw options dispatch in order to avoid swarming the
         * store with updates when using the length slider */
        debounce((opts: GeneratePasswordOptions) => dispatch(passwordOptionsEdit(opts)), 250),
        []
    );

    const setPasswordOptions = <T extends GeneratePasswordOptions['type']>(
        type: T,
        update?: Partial<Extract<GeneratePasswordOptions, { type: T }>['options']>
    ) => {
        setOptions((options) => {
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
    useEffect(() => regeneratePassword(), Object.values(passwordOptions.options));

    return {
        password,
        passwordOptions,
        setPassword,
        setPasswordOptions,
        regeneratePassword,
    };
};

export type UsePasswordGeneratorResult = ReturnType<typeof usePasswordGenerator>;
