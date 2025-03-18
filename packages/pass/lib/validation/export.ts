import type { FormikErrors } from 'formik';
import { c } from 'ttag';

import { type ExportFormValues, ExportFormat } from '@proton/pass/lib/export/types';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';

export const validateExportForm = (values: ExportFormValues): FormikErrors<ExportFormValues> =>
    values.format === ExportFormat.EPEX && isEmptyString(values.passphrase)
        ? { passphrase: c('Warning').t`Passphrase is required` }
        : {};
