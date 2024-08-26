import { getParsedPathWithoutLocalIDBasename } from '../createAuthenticationStore';

const returnUrlKey = 'returnUrl';

export const getReturnUrlParameter = (searchParams: URLSearchParams) => {
    try {
        // Must be encoded to support params in itself
        const url = decodeURIComponent(searchParams.get(returnUrlKey) || '');
        // Must start with /
        if (!url.startsWith('/')) {
            return;
        }
        // Must strip the LocalID basename
        return `/${getParsedPathWithoutLocalIDBasename(url)}`;
    } catch {}
};

const returnUrlContextKey = 'returnUrlContext';
export type ReturnUrlContext = 'private' | 'public';

export const getReturnUrlContextParameter = (searchParams: URLSearchParams): ReturnUrlContext => {
    const context = searchParams.get(returnUrlContextKey) || '';
    return context === 'public' ? context : 'private';
};

export const getReturnUrl = (searchParams: URLSearchParams) => {
    const context = getReturnUrlContextParameter(searchParams);
    const returnUrl = getReturnUrlParameter(searchParams);

    if (!returnUrl) {
        return;
    }

    const parsedReturnUrl = new URL(returnUrl, window.location.origin);

    return {
        context,
        returnUrl,
        pathname: parsedReturnUrl.pathname,
        search: parsedReturnUrl.search,
        searchParams: parsedReturnUrl.searchParams,
        hash: parsedReturnUrl.hash,
    };
};
