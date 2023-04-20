import { useEffect, useState } from 'react';

export const alphabeticChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
export const digits = '0123456789';
export const specialChars = '!#$%&()*+.:;<=>?@[]^';

export enum CharType {
    Alphabetic,
    Digit,
    Special,
}

/**
 * Designers mixed the colors of different ui-${type}
 * sub-themes for the character colors..
 */
export const charTypeToClassName = {
    [CharType.Alphabetic]: '',
    [CharType.Digit]: 'ui-login pass-password-generator--char-digit',
    [CharType.Special]: 'ui-alias pass-password-generator--char-special',
};

export const getTypeFromChar = (char: string) => {
    if (alphabeticChars.includes(char)) {
        return CharType.Alphabetic;
    }

    if (digits.includes(char)) {
        return CharType.Digit;
    }

    return CharType.Special;
};

export const getCharsGroupedByColor = (password: string) => {
    if (password.length === 0) {
        return [];
    }

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

export const generatePassword = (options: { useSpecialChars: boolean; length: number }) => {
    const chars = Array.from(alphabeticChars + digits + (options.useSpecialChars ? specialChars : ''));
    const randomValues = window.crypto.getRandomValues(new Uint8Array(options.length));

    const passwordChars = Array.from(randomValues).map((n) => {
        const rangeBoundMaxIndex = n % chars.length;
        return chars[rangeBoundMaxIndex];
    });

    return passwordChars.join('');
};

const DEFAULT_PASSWORD_LENGTH = 16;

export const usePasswordGenerator = () => {
    const [useSpecialChars, setUseSpecialChars] = useState(true);
    const [numberOfChars, setNumberOfChars] = useState(DEFAULT_PASSWORD_LENGTH);
    const [password, setPassword] = useState(() => generatePassword({ useSpecialChars, length: numberOfChars }));

    const regeneratePassword = () => {
        setPassword(generatePassword({ useSpecialChars, length: numberOfChars }));
    };

    useEffect(regeneratePassword, [useSpecialChars, numberOfChars]);

    return {
        useSpecialChars,
        password,
        numberOfChars,
        setUseSpecialChars,
        setNumberOfChars,
        setPassword,
        regeneratePassword,
    };
};

export type UsePasswordGeneratorResult = ReturnType<typeof usePasswordGenerator>;
