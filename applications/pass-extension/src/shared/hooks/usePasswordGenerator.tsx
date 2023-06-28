import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import type { GeneratePasswordOptions } from '@proton/pass/password';
import { DEFAULT_PASSWORD_LENGTH, alphabeticChars, digitChars, generatePassword } from '@proton/pass/password';
import { SeperatorOptions } from '@proton/pass/password/memorable';
import { popupPasswordOptionsSave } from '@proton/pass/store/actions/creators/popup';
import { merge } from '@proton/pass/utils/object';
import debounce from '@proton/utils/debounce';

import { usePopupContext } from '../../popup/hooks/usePopupContext';

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

export const usePasswordGenerator = () => {
    const dispatch = useDispatch();
    const { initial } = usePopupContext().state;
    const [passwordOptions, setOptions] = useState<GeneratePasswordOptions>(
        initial.passwordOptions ?? DEFAULT_MEMORABLE_PW_OPTIONS
    );
    const [password, setPassword] = useState(() => generatePassword(passwordOptions));

    const regeneratePassword = () => setPassword(generatePassword(passwordOptions));

    const setPasswordOptions = <T extends GeneratePasswordOptions['type']>(
        type: T,
        update?: Partial<Extract<GeneratePasswordOptions, { type: T }>['options']>
    ) =>
        setOptions((options) => {
            if (update) return merge(options, { options: update });
            if (type === 'memorable') return DEFAULT_MEMORABLE_PW_OPTIONS;
            if (type === 'random') return DEFAULT_RANDOM_PW_OPTIONS;
            return options;
        });

    const options = Object.values(passwordOptions.options);
    const savePasswordOptions = useCallback(
        debounce((opts: GeneratePasswordOptions) => dispatch(popupPasswordOptionsSave(opts)), 250),
        []
    );

    useEffect(() => {
        regeneratePassword();
        savePasswordOptions(passwordOptions);
    }, [...options]);

    return {
        password,
        passwordOptions,
        setPassword,
        setPasswordOptions,
        regeneratePassword,
    };
};

export type UsePasswordGeneratorResult = ReturnType<typeof usePasswordGenerator>;
