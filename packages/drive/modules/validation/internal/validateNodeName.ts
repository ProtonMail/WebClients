import { c, msgid } from 'ttag';

import { MAX_NAME_LENGTH } from '@proton/shared/lib/drive/constants';

type Validator<T> = (value: T) => string | undefined;

function composeValidators<T>(validators: Validator<T>[]): Validator<T> {
    return (value) => {
        for (const validator of validators) {
            const result = validator(value);
            if (result) {
                return result;
            }
        }
        return undefined;
    };
}

function validateNameLength(str: string) {
    return str.length > MAX_NAME_LENGTH
        ? c('Validation Error').ngettext(
              msgid`Name must be ${MAX_NAME_LENGTH} character long at most`,
              `Name must be ${MAX_NAME_LENGTH} characters long at most`,
              MAX_NAME_LENGTH
          )
        : undefined;
}

function validateNameEmpty(str: string) {
    return !str ? c('Validation Error').t`Name must not be empty` : undefined;
}

function validateNoDisallowedCharacters(str: string) {
    return str.includes('/') ? c('Validation Error').t`Name must not contain slashes (/)` : undefined;
}

export const validateNodeName = composeValidators([
    validateNameEmpty,
    validateNameLength,
    validateNoDisallowedCharacters,
]);
