import type { FormikErrors } from 'formik';

import type { NoteFormValues } from '@proton/pass/types';

import { validateItemErrors } from './item';

export const validateNoteForm = (values: NoteFormValues): FormikErrors<NoteFormValues> => validateItemErrors(values);
