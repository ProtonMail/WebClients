import type { FormikErrors } from 'formik';
import { c } from 'ttag';

import { isAutofillModeDataOfTypeUrl } from '@proton/pass/lib/urls/utils/autofill';
import { sanitizeURL } from '@proton/pass/lib/urls/utils/sanitize';
import type { UrlGroupValues } from '@proton/pass/types';
import { AutofillMode } from '@proton/pass/types/protobuf';
import { duplicates } from '@proton/pass/utils/array/duplicate';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';

/* validates the active URL input field */
export const validateUrl = <V extends UrlGroupValues>({ url, urls }: V) => {
    if (!isEmptyString(url)) {
        const { valid: validURL, url: safeUrl } = sanitizeURL(url);
        const urlExists = urls.some(({ url: u, mode }) => u === safeUrl && mode === AutofillMode.Default);

        if (!validURL) return { url: c('Validation').t`URL is invalid` };
        if (urlExists) return { url: c('Validation').t`URL already exists` };
    }

    return {};
};

/* validates the actual URLs list */
export const validateUrls = <V extends UrlGroupValues>({ urls }: V) => {
    const duplicatesCount = duplicates(urls.map(({ url, mode }) => `${sanitizeURL(url).url ?? url}:${mode}`));

    const urlsErrors = urls.map(({ url, mode }) => {
        const isEmpty = isEmptyString(url);
        const { valid: validURL, url: safeUrl } = sanitizeURL(url);

        if (isEmpty) return { url: c('Validation').t`URL cannot be empty` };
        if (isAutofillModeDataOfTypeUrl(mode) && !validURL) return { url: c('Validation').t`URL is invalid` };
        if ((duplicatesCount.get(`${safeUrl ?? ''}:${mode}`) ?? 0) > 1) {
            return { url: c('Validation').t`Duplicated URL` };
        }

        return {};
    });

    return (urlsErrors.some(({ url }) => url !== undefined) ? { urls: urlsErrors } : {}) as FormikErrors<V>;
};
