import isTruthy from '@proton/utils/isTruthy';

const SEPARATOR_REGEX = /[,;]/;
const BRACKETS_REGEX = /[<>]/g;

/**
 * Trim and remove brackets
 * @param value
 * @returns {string}
 */
export const clearValue = (value: string) => {
    return value.trim().replace(BRACKETS_REGEX, '');
};

/**
 * Split input content by comma or semicolon
 * @param input
 * @returns {string[]}
 */
export const splitBySeparator = (input: string) => {
    return input
        .split(SEPARATOR_REGEX)
        .map((value) => clearValue(value))
        .filter(isTruthy);
};
