import type { FormikErrors } from 'formik';
import type { EntryDTO } from 'proton-authenticator/lib/entries/items';
import { c } from 'ttag';

import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';

export const validateItemForm = ({ name, secret }: EntryDTO): FormikErrors<EntryDTO> => {
    const errors: FormikErrors<EntryDTO> = {};
    if (isEmptyString(name)) errors.name = c('Validation').t`Title cannot be empty`;
    if (isEmptyString(secret)) errors.secret = c('Validation').t`Secret cannot be empty`;
    return errors;
};
