import type { FormikErrors } from 'formik';
import { c } from 'ttag';

import type { DomainFormValues } from '@proton/pass/types/forms';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import { validateDomain } from '@proton/shared/lib/helpers/email';

export const validateAliasDomain = ({ domain }: DomainFormValues): FormikErrors<DomainFormValues> => {
    if (isEmptyString(domain)) return { domain: c('Warning').t`Domain cannot be empty` };

    if (!validateDomain(domain)) return { domain: c('Validation').t`Domain URL is invalid` };

    return {};
};
