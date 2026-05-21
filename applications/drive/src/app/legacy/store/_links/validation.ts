import { c, msgid } from 'ttag';

import { MAX_NAME_LENGTH } from '@proton/shared/lib/drive/constants';

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

const validateNameLength = (str: string) => {
    return str.length > MAX_NAME_LENGTH
        ? c('Validation Error').ngettext(
              msgid`Name must be ${MAX_NAME_LENGTH} character long at most`,
              `Name must be ${MAX_NAME_LENGTH} characters long at most`,
              MAX_NAME_LENGTH
          )
        : undefined;
};

const validateNameEmpty = (str: string) => {
    return !str ? c('Validation Error').t`Name must not be empty` : undefined;
};

export const validateLinkName = composeValidators([validateNameEmpty, validateNameLength]);

export const validateLinkNameField = composeValidators([validateNameEmpty, validateNameLength]);
