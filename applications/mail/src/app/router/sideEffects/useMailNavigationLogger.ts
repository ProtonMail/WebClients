import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import { logger } from '@proton/logger';
import { changeSearchParams, getSearchParams } from '@proton/shared/lib/helpers/url';
import type { SearchParameters } from '@proton/shared/lib/mail/search';

// We want to readact all search params to avoid logging user-typed content.
// Knowing a search param is present will be enough for debugging purpose.
const IS_SENSITIVE_SEARCH_PARAM: Record<keyof SearchParameters, boolean> = {
    address: true,
    from: true,
    to: true,
    keyword: true,
    begin: true,
    end: true,
    wildcard: true,
};
const SENSITIVE_SEARCH_PARAMS = Object.keys(IS_SENSITIVE_SEARCH_PARAM);

const redactSensitiveParams = (pathname: string, hash: string) => {
    const params = getSearchParams(hash);
    const redactedParams = Object.fromEntries(
        SENSITIVE_SEARCH_PARAMS.filter((key) => params[key] !== undefined).map((key) => [key, 'redacted'])
    );
    return changeSearchParams(pathname, hash, redactedParams);
};

export const useMailNavigationLogger = () => {
    const history = useHistory();

    useEffect(() => {
        const unlisten = history.listen((location) => {
            logger.log('User navigate to', redactSensitiveParams(location.pathname, location.hash));
        });
        return unlisten;
    }, [history]);
};
