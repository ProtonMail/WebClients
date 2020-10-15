import { useState, useEffect } from 'react';
import { getCookie, setCookie } from 'proton-shared/lib/helpers/cookies';

const useCookieState = (cookieValue: any, cookieName: string, expirationDate?: string, cookieDomain?: string) => {
    const [value, setValue] = useState(() => {
        const stickyValue = getCookie(cookieName, cookieValue);

        return stickyValue !== null && stickyValue !== undefined ? JSON.parse(stickyValue) : cookieValue;
    });

    useEffect(() => {
        setCookie(cookieName, JSON.stringify(cookieValue), expirationDate, cookieDomain);
    }, [cookieName, cookieValue, expirationDate, cookieDomain]);

    return [value, setValue];
};

export default useCookieState;
