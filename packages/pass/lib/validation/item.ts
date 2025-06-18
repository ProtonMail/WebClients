import type { FormikErrors } from 'formik';
import { c, msgid } from 'ttag';

import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '@proton/pass/constants';
import { validateExtraFields } from '@proton/pass/lib/validation/extra-field';
import type { BaseItemValues, Maybe } from '@proton/pass/types';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';

export const validateItemName = (name: string): Maybe<string> => {
    if (isEmptyString(name)) return c('Warning').t`Title is required`;

    /* safeguarding : these validation errors should
     * not `maxLength` trigger as we're leveraging the
     * default input attribute */
    if (name.length > MAX_ITEM_NAME_LENGTH) {
        const maxLength = MAX_ITEM_NAME_LENGTH;
        /* translator: maxLength is numeric value, example "Maximum length is 10 characters" */
        return c('Warning').ngettext(
            msgid`Maximum length is ${maxLength} character`,
            `Maximum length is ${maxLength} characters`,
            maxLength
        );
    }
};

export const validateItemErrors = <T extends BaseItemValues = BaseItemValues>(values: T): FormikErrors<T> => {
    const errors: FormikErrors<BaseItemValues> = {};

    const nameError = validateItemName(values.name);
    if (nameError) errors.name = nameError;

    if (values.note.length > MAX_ITEM_NOTE_LENGTH) {
        const maxLength = MAX_ITEM_NOTE_LENGTH;
        /* translator: maxLength is numeric value, example "Maximum length is 10 characters" */
        errors.note = c('Warning').ngettext(
            msgid`Maximum length is ${maxLength} character`,
            `Maximum length is ${maxLength} characters`,
            maxLength
        );
    }

    return { ...errors, ...validateExtraFields(values) } as FormikErrors<T>;
};
