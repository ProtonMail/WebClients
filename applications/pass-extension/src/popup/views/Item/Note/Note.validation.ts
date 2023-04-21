import { FormikErrors } from 'formik';
import { c } from 'ttag';

import { isEmptyString } from '@proton/pass/utils/string';

export type NoteFormValues = {
    name: string;
    note: string;
    shareId: string;
};

export const MAX_NOTE_CONTENT_LENGTH = 5000;
export const MAX_NOTE_TITLE_LENGTH = 200;

export const validateNoteForm = (values: NoteFormValues): FormikErrors<NoteFormValues> => {
    const errors: FormikErrors<NoteFormValues> = {};

    if (isEmptyString(values.name)) {
        errors.name = c('Warning').t`Title is required`;
    }

    /* safeguarding : these validation errors should
     * not `maxLength` trigger as we're leveraging the
     * default input attribute */
    if (values.name.length > MAX_NOTE_TITLE_LENGTH) {
        const maxLength = MAX_NOTE_TITLE_LENGTH;
        errors.name = c('Warning').t`Maximum length is ${maxLength} characters`;
    }

    if (values.note.length > MAX_NOTE_CONTENT_LENGTH) {
        const maxLength = MAX_NOTE_CONTENT_LENGTH;
        errors.note = c('Warning').t`Maximum length is ${maxLength} characters`;
    }

    return errors;
};
