import { FormikErrors } from 'formik';
import { c } from 'ttag';

import { isEmptyString } from '@proton/pass/utils/string';

export type NoteFormValues = {
    name: string;
    note: string;
    shareId: string;
};

export const validateNoteForm = (values: NoteFormValues): FormikErrors<NoteFormValues> => {
    const errors: FormikErrors<NoteFormValues> = {};

    if (isEmptyString(values.name)) {
        errors.name = c('Warning').t`Title is required`;
    }

    return errors;
};
