import type { FormikErrors } from 'formik';

import type { NoteFormValues } from '../types';
import { validateItemErrors } from './validate-item';

export const validateNoteForm = (values: NoteFormValues): FormikErrors<NoteFormValues> => validateItemErrors(values);
