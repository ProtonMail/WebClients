import { InvalidForkConsumeError } from '@proton/shared/lib/authentication/error';
import { ExtraSessionForkSearchParameters } from '@proton/shared/lib/authentication/fork/constants';
import { getPathFromLocation } from '@proton/shared/lib/helpers/url';

import { getSafePath } from '../createAuthenticationStore';

const key = 'returnUrl';

export const getReturnUrlParameter = (searchParams: URLSearchParams) => {
    try {
        // Must be encoded to support params in itself
        const url = decodeURIComponent(searchParams.get(key) || '');
        if (!url.startsWith('/')) {
            return;
        }
        return `/${getSafePath(url)}`;
    } catch {}
};

export const getParsedPath = (value: string) => {
    try {
        if (!value) {
            throw new InvalidForkConsumeError('Missing url');
        }
        const url = new URL(value, window.location.origin);
        // Drop the continue or email query parameter to clean the URL
        [key, ExtraSessionForkSearchParameters.Email].forEach((param) => {
            if (url.searchParams.has(param)) {
                url.searchParams.delete(param);
            }
        });
        return getPathFromLocation(url);
    } catch {
        return '/';
    }
};
