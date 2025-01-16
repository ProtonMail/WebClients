import { getParsedPathWithoutLocalIDBasename } from './pathnameHelper';

export const returnUrlKey = 'returnUrl';
export const returnUrlContextKey = 'returnUrlContext';
export const returnUrlTargetKey = 'returnUrlTarget';

export const getReturnUrlParameter = (searchParams: URLSearchParams) => {
    try {
        const value = searchParams.get(returnUrlKey) || '';
        if (!value) {
            return;
        }
        // Must be encoded to support params in itself
        const url = decodeURIComponent(value);
        // Must start with /
        if (!url.startsWith('/')) {
            return;
        }
        // Must strip the LocalID basename
        return `/${getParsedPathWithoutLocalIDBasename(url)}`;
    } catch {}
};

export type ReturnUrlContext = 'private' | 'public';

export const getReturnUrlContextParameter = (searchParams: URLSearchParams): ReturnUrlContext => {
    const context = searchParams.get(returnUrlContextKey) || '';
    return context === 'public' ? context : 'private';
};

export type ReturnUrlTarget = 'account' | 'app';

export const getReturnUrlTargetParameter = (searchParams: URLSearchParams): ReturnUrlTarget => {
    const target = searchParams.get(returnUrlTargetKey) || '';
    return target === 'account' ? target : 'app';
};

export interface ReturnUrlResult {
    url: string;
    context: ReturnUrlContext;
    target: ReturnUrlTarget;
    location: {
        pathname: string;
        search: string;
        hash: string;
    };
}

export const getReturnUrl = (searchParams: URLSearchParams): ReturnUrlResult | undefined => {
    const context = getReturnUrlContextParameter(searchParams);
    const url = getReturnUrlParameter(searchParams);
    const target = getReturnUrlTargetParameter(searchParams);

    if (!url) {
        return;
    }

    const parsedReturnUrl = new URL(url, window.location.origin);

    // Avoid infinite loops by the return url having a return url in itself - only for account
    if (target === 'account' && getReturnUrlParameter(parsedReturnUrl.searchParams)) {
        return;
    }

    return {
        url,
        context,
        target,
        location: {
            pathname: parsedReturnUrl.pathname,
            search: parsedReturnUrl.search,
            hash: parsedReturnUrl.hash,
        },
    };
};

export const appendReturnUrlParams = (
    searchParams: URLSearchParams,
    {
        url,
        target,
        context,
    }: {
        url: string;
        target?: ReturnUrlTarget;
        context?: ReturnUrlContext;
    }
) => {
    searchParams.append(returnUrlKey, url);
    if (context) {
        searchParams.append(returnUrlContextKey, context);
    }
    if (target) {
        searchParams.append(returnUrlTargetKey, target);
    }
};
