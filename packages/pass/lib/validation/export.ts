import type { FormikErrors } from 'formik';
import { c } from 'ttag';

import type { ExportFormValues } from '@proton/pass/lib/export/types';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';

export const validateExportForm = (values: ExportFormValues): FormikErrors<ExportFormValues> =>
    values.encrypted && isEmptyString(values.passphrase) ? { passphrase: c('Warning').t`Passphrase is required` } : {};
