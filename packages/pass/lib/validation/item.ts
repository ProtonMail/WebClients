import type { FormikErrors } from 'formik';
import { c } from 'ttag';

import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '@proton/pass/constants';
import type { BaseItemValues, Maybe } from '@proton/pass/types';
import { isEmptyString } from '@proton/pass/utils/string';

export const validateItemName = (name: string): Maybe<string> => {
    if (isEmptyString(name)) return c('Warning').t`Title is required`;

    /* safeguarding : these validation errors should
     * not `maxLength` trigger as we're leveraging the
     * default input attribute */
    if (name.length > MAX_ITEM_NAME_LENGTH) {
        const maxLength = MAX_ITEM_NAME_LENGTH;
        return c('Warning').t`Maximum length is ${maxLength} characters`;
    }
};

export const validateItemErrors = <T extends BaseItemValues = BaseItemValues>(values: T): FormikErrors<T> => {
    const errors: FormikErrors<BaseItemValues> = {};

    const nameError = validateItemName(values.name);
    if (nameError) errors.name = nameError;

    if (values.note.length > MAX_ITEM_NOTE_LENGTH) {
        const maxLength = MAX_ITEM_NOTE_LENGTH;
        errors.note = c('Warning').t`Maximum length is ${maxLength} characters`;
    }

    return errors as FormikErrors<T>;
};
