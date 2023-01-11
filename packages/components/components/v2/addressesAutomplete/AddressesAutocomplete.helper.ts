import isTruthy from '@proton/utils/isTruthy';

const SEPARATOR_REGEX = /[,;]/;

/**
 * Trim and remove surrounding chevrons
 */
export const clearValue = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
};

/**
 * Split input content by comma or semicolon
 */
export const splitBySeparator = (input: string) => {
    return input
        .split(SEPARATOR_REGEX)
        .map((value) => clearValue(value))
        .filter(isTruthy);
};
