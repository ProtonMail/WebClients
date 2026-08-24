import type { FormikErrors } from 'formik';
import { c } from 'ttag';

import { isEmptyString } from '../../utils/string/is-empty-string';
import { ExportFormat, type ExportRequestOptions } from '../export/types';

export const validateExportForm = (values: ExportRequestOptions): FormikErrors<ExportRequestOptions> =>
    values.format === ExportFormat.PGP && isEmptyString(values.passphrase)
        ? { passphrase: c('Warning').t`Passphrase is required` }
        : {};
