import { FEATURE_FLAGS } from 'proton-shared/lib/constants';
import { c } from 'ttag';
import { MAX_NAME_LENGTH, MIN_SHARED_URL_PASSWORD_LENGTH } from '../constants';
import { WINDOWS_FORBIDDEN_CHARACTERS, WINDOWS_RESERVED_NAMES } from './link';

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
    return str.endsWith(' ') ? c('Validation Error').t`Name must not end with a space` : undefined;
};

const validateSpaceStart = (str: string) => {
    return str.startsWith(' ') ? c('Validation Error').t`Name must not begin with a space` : undefined;
};

const validateNameLength = (str: string) => {
    return str.length > MAX_NAME_LENGTH
        ? c('Validation Error').t`Name must be ${MAX_NAME_LENGTH} characters long at most`
        : undefined;
};

const validateInvalidName = (str: string) => {
    return ['.', '..'].includes(str) ? c('Validation Error').t`"${str}" is not a valid name` : undefined;
};

const validateInvalidCharacters = (str: string) => {
    return /\/|\\/.test(str) ? c('Validation Error').t`Name cannot include / and \\` : undefined;
};

const validateNameEmpty = (str: string) => {
    return !str ? c('Validation Error').t`Name must not be empty` : undefined;
};

const validateDotEnd = (str: string) => {
    return str.endsWith('.') ? c('Validation Error').t`Name must not end with a period` : undefined;
};

const validateReservedName = (str: string) => {
    return WINDOWS_RESERVED_NAMES.includes(str.toUpperCase())
        ? c('Validation Error').t`Name must not be a system reserved name`
        : undefined;
};

const validateReservedCharacters = (str: string) => {
    return WINDOWS_FORBIDDEN_CHARACTERS.test(str)
        ? c('Validation Error').t`Name must not contain special characters: <>:"\\/|?*`
        : undefined;
};

export const validateLinkName = FEATURE_FLAGS.includes('nonrestrictive-naming')
    ? composeValidators([
          validateNameEmpty,
          validateNameLength,
          validateSpaceStart,
          validateSpaceEnd,
          validateInvalidName,
          validateInvalidCharacters,
      ])
    : composeValidators([
          validateNameEmpty,
          validateReservedCharacters,
          validateReservedName,
          validateNameLength,
          validateDotEnd,
          validateSpaceStart,
          validateSpaceEnd,
      ]);

export const validateLinkNameField = FEATURE_FLAGS.includes('nonrestrictive-naming')
    ? composeValidators([validateNameEmpty, validateNameLength, validateInvalidName, validateInvalidCharacters])
    : composeValidators([
          validateNameEmpty,
          validateReservedCharacters,
          validateReservedName,
          validateNameLength,
          validateDotEnd,
      ]);

const validatePasswordLength = (length: number) => (str: string) => {
    return str.length < length
        ? c('Validation Error').t`Password must be at least ${length} characters long`
        : undefined;
};

const validatePasswordStrength = (str: string) => {
    return !/[A-Z]/.test(str) || !/[a-z]/.test(str) || !/[1-9]/.test(str)
        ? c('Validation Error').t`Password must include a mix of lower-case, upper-case letters and numbers`
        : undefined;
};

export const validateSharedURLPassword = composeValidators([
    validatePasswordLength(MIN_SHARED_URL_PASSWORD_LENGTH),
    validatePasswordStrength,
]);
