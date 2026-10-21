import type { FormikErrors } from 'formik';

import type { NoteFormValues } from '../../types/forms/item';
import { validateItemErrors } from './item';

export const validateNoteForm = (values: NoteFormValues): FormikErrors<NoteFormValues> => validateItemErrors(values);
