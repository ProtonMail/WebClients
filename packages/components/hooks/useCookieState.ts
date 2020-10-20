import React, { useState, useEffect } from 'react';
import { checkCookie, setCookie } from 'proton-shared/lib/helpers/cookies';

const COOKIE_VALUE = '1';

const useCookieState = (
    cookieName: string,
    expirationDate?: string,
    cookieDomain?: string
): [boolean, React.Dispatch<React.SetStateAction<boolean>>] => {
    const [value, setValue] = useState(() => !!checkCookie(cookieName, COOKIE_VALUE));

    useEffect(() => {
        if (value) {
            setCookie(cookieName, COOKIE_VALUE, expirationDate, cookieDomain);
        }
    }, [value]);

    return [value, setValue];
};

export default useCookieState;
