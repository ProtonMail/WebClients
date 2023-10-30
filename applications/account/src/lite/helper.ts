import { APPS, COUPON_CODES } from '@proton/shared/lib/constants';

export enum SupportedActions {
    DeleteAccount = 'delete-account',
    SubscribeAccount = 'subscribe-account',
    SubscribeAccountLink = 'subscribe-account-link',
}

export const getApp = (appQueryParam: string | null, redirect: string | undefined) => {
    if (appQueryParam === 'vpn') {
        return APPS.PROTONVPN_SETTINGS;
    }
    if (appQueryParam === 'mail') {
        return APPS.PROTONMAIL;
    }
    if (appQueryParam === 'drive') {
        return APPS.PROTONDRIVE;
    }
    if (redirect) {
        if (redirect.includes('vpn')) {
            return APPS.PROTONVPN_SETTINGS;
        }
        if (redirect.includes('mail')) {
            return APPS.PROTONMAIL;
        }
        if (redirect.includes('drive')) {
            return APPS.PROTONDRIVE;
        }
    }
    return APPS.PROTONVPN_SETTINGS;
};

const getIsDarkLayout = (searchParams: URLSearchParams) => {
    const coupon = searchParams.get('coupon') || undefined;

    const dark = coupon?.toLocaleUpperCase() === COUPON_CODES.BLACK_FRIDAY_2023;

    return dark;
};

export default getIsDarkLayout;
