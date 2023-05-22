import type { FormikErrors } from 'formik';

import { validateItemErrors } from '../Item/Item.validation';

export type NoteFormValues = {
    name: string;
    note: string;
    shareId: string;
};

export const validateNoteForm = (values: NoteFormValues): FormikErrors<NoteFormValues> => validateItemErrors(values);
