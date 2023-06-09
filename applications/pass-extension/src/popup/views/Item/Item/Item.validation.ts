import type { FormikErrors } from 'formik';
import { c } from 'ttag';

import { isEmptyString } from '@proton/pass/utils/string';

export const MAX_ITEM_NAME_LENGTH = 200;
export const MAX_ITEM_NOTE_LENGTH = 25_000;

type BaseItemValues = { name: string; note: string };

export const validateItemErrors = <T extends BaseItemValues = BaseItemValues>(values: T): FormikErrors<T> => {
    const errors: FormikErrors<BaseItemValues> = {};

    if (isEmptyString(values.name)) {
        errors.name = c('Warning').t`Title is required`;
    }

    /* safeguarding : these validation errors should
     * not `maxLength` trigger as we're leveraging the
     * default input attribute */
    if (values.name.length > MAX_ITEM_NAME_LENGTH) {
        const maxLength = MAX_ITEM_NAME_LENGTH;
        errors.name = c('Warning').t`Maximum length is ${maxLength} characters`;
    }

    if (values.note.length > MAX_ITEM_NOTE_LENGTH) {
        const maxLength = MAX_ITEM_NOTE_LENGTH;
        errors.note = c('Warning').t`Maximum length is ${maxLength} characters`;
    }

    return errors as FormikErrors<T>;
};
