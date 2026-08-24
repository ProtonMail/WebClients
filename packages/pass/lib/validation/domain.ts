import type { FormikErrors } from 'formik';
import { c } from 'ttag';

import { validateDomain } from '@proton/shared/lib/helpers/email';

import type { DomainFormValues } from '../../types/forms';
import { isEmptyString } from '../../utils/string/is-empty-string';

export const validateAliasDomain = ({ domain }: DomainFormValues): FormikErrors<DomainFormValues> => {
    if (isEmptyString(domain)) return { domain: c('Warning').t`Domain cannot be empty` };

    if (!validateDomain(domain)) return { domain: c('Validation').t`Domain URL is invalid` };

    return {};
};
