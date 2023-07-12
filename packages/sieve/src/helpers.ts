import { EscapeVariableType, LABEL_KEYS, LABEL_KEY_TYPE } from './interface';

type ReturnValue = { Value: String; Type: String };

/**
 * Builds a value label object.
 */
export const buildLabelValueObject = (value: LABEL_KEY_TYPE) => ({
    value,
    label: LABEL_KEYS[value],
});

/**
 * Escapes the sieve specific characters. (aka *, ? and \)
 */
export const escapeCharacters = (text: string) => text.replace(/([*?])/g, '\\$1').replace(/\\/g, '\\\\');

/**
 * Unescape the sieve specific characters (*, ? and \)
 */
export const unescapeCharacters = (text: string) => text.replace(/\\\\/g, '\\').replace(/\\([?*])/g, '$1');

/**
 * Escapes sieve variables
 */
export const escapeVariables = (text: string): EscapeVariableType => {
    const regex = /\$({[\w._]+})/g;
    if (!text.match(regex)) {
        return text;
    }

    return {
        Value: text.replace(regex, '${dollar}$1'),
        Type: 'VariableString',
    };
};

/**
 * Unescape sieve variables
 */
export const unescapeVariables = (text: string | ReturnValue) => {
    if (typeof text === 'string') {
        return text;
    }
    const { Value: value, Type: type } = text;
    if (type !== 'VariableString' || value.match(/\${(?!dollar)[\w._]+}/)) {
        return;
    }

    const regex = /\${dollar}({[\w._]+})/g;

    return text.Value.replace(regex, '$$$1');
};

/**
 * Remove duplicates in array.
 */
export const unique = <T>(arr: T[]) => [...new Set(arr)];

/**
 * Find last value that pass the given callback
 */
export const findLatest = <T>(arr: T[], callback: (item: T) => {}) => {
    let i = arr.length;
    while (i--) {
        if (callback(arr[i])) {
            return arr[i];
        }
    }
};
