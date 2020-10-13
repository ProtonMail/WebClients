import { c } from 'ttag';
import { MAX_NAME_LENGTH, MIN_SHARED_URL_PASSWORD_LENGTH } from '../constants';

// eslint-disable-next-line no-control-regex
const RESERVED_CHARACTERS = /[<>:"\\/|?*]|[\x00-\x1F]/;
const RESERVED_NAMES = [
    'CON',
    'PRN',
    'AUX',
    'NUL',
    'COM1',
    'COM2',
    'COM3',
    'COM4',
    'COM5',
    'COM6',
    'COM7',
    'COM8',
    'COM9',
    'LPT1',
    'LPT2',
    'LPT3',
    'LPT4',
    'LPT5',
    'LPT6',
    'LPT7',
    'LPT8',
    'LPT9',
];

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

const composeValidators = <T>(validators: ((value: T) => string | undefined)[]) => (value: T) => {
    for (const validator of validators) {
        const result = validator(value);
        if (result) {
            return result;
        }
    }
    return undefined;
};

const validateSpaceEnd = (str: string) => {
    return str.endsWith(' ') ? c('Validation Error').t`Name must not begin with a space` : undefined;
};

const validateSpaceStart = (str: string) => {
    return str.startsWith(' ') ? c('Validation Error').t`Name must not begin with a space` : undefined;
};

const validateDotEnd = (str: string) => {
    return str.endsWith('.') ? c('Validation Error').t`Name must not end with a period` : undefined;
};

const validateNameLength = (str: string) => {
    return str.length > MAX_NAME_LENGTH
        ? c('Validation Error').t`Name must be ${MAX_NAME_LENGTH} characters long at most`
        : undefined;
};

const validateReservedName = (str: string) => {
    return RESERVED_NAMES.includes(str.toUpperCase())
        ? c('Validation Error').t`Name must not be a system reserved name`
        : undefined;
};

const validateReservedCharacters = (str: string) => {
    return RESERVED_CHARACTERS.test(str)
        ? c('Validation Error').t`Name must not contain special characters: <>:"\\/|?*`
        : undefined;
};

const validateNameEmpty = (str: string) => {
    return !str ? c('Validation Error').t`Name must not be empty` : undefined;
};

export const validateLinkName = composeValidators([
    validateNameEmpty,
    validateReservedCharacters,
    validateReservedName,
    validateNameLength,
    validateDotEnd,
    validateSpaceStart,
    validateSpaceEnd,
]);

export const validateLinkNameField = composeValidators([
    validateNameEmpty,
    validateReservedCharacters,
    validateReservedName,
    validateNameLength,
    validateDotEnd,
]);

export const formatLinkName = (str: string) => str.trim();

const validatePasswordLength = (length: number) => (str: string) => {
    return str.length < length
        ? c('Validation Error').t`Password must be at least ${length} characters long`
        : undefined;
};

const validatePasswordStrength = (str: string) => {
    return !/[A-Z]/.test(str) && !/[a-z]/.test(str) && !/[1-9]/.test(str)
        ? c('Validation Error').t`Password must include a mix of lower-case, upper-case letters and numbers`
        : undefined;
};

export const validateSharedURLPassword = composeValidators([
    validatePasswordLength(MIN_SHARED_URL_PASSWORD_LENGTH),
    validatePasswordStrength,
]);
