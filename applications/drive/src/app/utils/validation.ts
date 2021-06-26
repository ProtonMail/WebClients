import { c } from 'ttag';
import { MAX_NAME_LENGTH } from '../constants';
import { GLOBAL_FORBIDDEN_CHARACTERS } from './link';

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

const composeValidators =
    <T>(validators: ((value: T) => string | undefined)[]) =>
    (value: T) => {
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
    return RegExp(GLOBAL_FORBIDDEN_CHARACTERS, 'u').test(str)
        ? c('Validation Error').t`Name cannot include invisible characters, / or \\.`
        : undefined;
};

const validateNameEmpty = (str: string) => {
    return !str ? c('Validation Error').t`Name must not be empty` : undefined;
};

export const validateLinkName = composeValidators([
    validateNameEmpty,
    validateNameLength,
    validateSpaceStart,
    validateSpaceEnd,
    validateInvalidName,
    validateInvalidCharacters,
]);

export const validateLinkNameField = composeValidators([
    validateNameEmpty,
    validateNameLength,
    validateInvalidName,
    validateInvalidCharacters,
]);
