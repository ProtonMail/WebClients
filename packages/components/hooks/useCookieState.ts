import { useCallback, useState } from 'react';

import { SetCookieArguments, getCookie, setCookie } from '@proton/shared/lib/helpers/cookies';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';

interface Props extends Omit<SetCookieArguments, 'cookieValue'> {
    cookieValue?: string;
}

// By default a cookie state is available on all subdomains
const useCookieState = ({
    cookieName,
    expirationDate,
    path = '/',
    cookieDomain = `.${getSecondLevelDomain(window.location.hostname)}`,
}: Props): [string | undefined, (value: string | undefined) => void] => {
    const [value, setValue] = useState(() => getCookie(cookieName));

    const setCookieValue = useCallback(
        (value: string | undefined) => {
            setValue(value);
            setCookie({
                cookieName,
                cookieValue: value,
                expirationDate,
                path,
                cookieDomain,
            });
        },
        [setValue]
    );

    return [value, setCookieValue];
};

export default useCookieState;
