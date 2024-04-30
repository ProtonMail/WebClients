import { deleteCookie, getCookie, setCookie } from '@proton/shared/lib/helpers/cookies';

export const sanitizeBetaSetting = (beta: boolean = false): boolean => {
    const current = getCookie('Tag');
    if (beta) return current === 'alpha' || current == 'beta';
    return Boolean(current && current !== 'default');
};

export const setVersionTag = (beta: boolean = false, forceAlpha: boolean = false) => {
    if (beta) {
        setCookie({
            cookieName: 'Tag',
            cookieValue: forceAlpha ? 'alpha' : 'beta',
            expirationDate: 'max',
            path: '/',
        });
    } else deleteCookie('Tag');
};
