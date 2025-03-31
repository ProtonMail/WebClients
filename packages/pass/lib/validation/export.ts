import type { FormikErrors } from 'formik';
import { c } from 'ttag';

import { ExportFormat, type ExportRequestOptions } from '@proton/pass/lib/export/types';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';

export const validateExportForm = (values: ExportRequestOptions): FormikErrors<ExportRequestOptions> =>
    values.format === ExportFormat.PGP && isEmptyString(values.passphrase)
        ? { passphrase: c('Warning').t`Passphrase is required` }
        : {};
