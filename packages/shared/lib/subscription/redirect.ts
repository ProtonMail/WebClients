import { COUPON_CODES } from '@proton/shared/lib/constants';

export const getRedirect = (redirect: string | null | undefined) => {
    return redirect && /^(\/$|\/[^/]|proton(vpn|mail|drive)?:\/\/)/.test(redirect) ? redirect : undefined;
};

export const setLiteRedirect = (urlSearchParams: URLSearchParams) => {
    const redirect = getRedirect(urlSearchParams.get('redirect'));
    const coupon = urlSearchParams.get('coupon');
    if (redirect && coupon === COUPON_CODES.VPN_BLACK_FRIDAY_2022) {
        sessionStorage.setItem('redirect', redirect);
    }
};

export const getLiteRedirect = () => {
    const value = sessionStorage.getItem('redirect');
    sessionStorage.removeItem('redirect');
    return value;
};
