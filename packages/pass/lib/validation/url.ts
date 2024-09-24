import type { FormikErrors } from 'formik';
import { c } from 'ttag';

import type { UrlGroupValues } from '@proton/pass/types';
import { duplicates } from '@proton/pass/utils/array/duplicate';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import { sanitizeURL } from '@proton/pass/utils/url/sanitize';

/* validates the active URL input field */
export const validateUrl = <V extends UrlGroupValues>({ url, urls }: V) => {
    if (!isEmptyString(url)) {
        const { valid: validURL, url: safeUrl } = sanitizeURL(url);
        const urlExists = urls.map(({ url }) => url).includes(safeUrl);

        if (!validURL) return { url: c('Validation').t`Url is invalid` };
        if (urlExists) return { url: c('Validation').t`Url already exists` };
    }

    return {};
};

/* validates the actual URLs list */
export const validateUrls = <V extends UrlGroupValues>({ urls }: V) => {
    const duplicatesCount = duplicates(urls.map((item) => item.url));

    const urlsErrors = urls.map(({ url }) => {
        const isEmpty = isEmptyString(url);
        const { valid: validURL, url: safeUrl } = sanitizeURL(url);

        if (isEmpty) return { url: c('Validation').t`URL cannot be empty` };
        if (!validURL) return { url: c('Validation').t`URL is invalid` };
        if ((duplicatesCount.get(safeUrl) ?? 0) > 1) return { url: c('Validation').t`Duplicated URL` };

        return {};
    });

    return (urlsErrors.some(({ url }) => url !== undefined) ? { urls: urlsErrors } : {}) as FormikErrors<V>;
};
