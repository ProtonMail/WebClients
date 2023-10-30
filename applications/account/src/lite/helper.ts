import { APPS } from '@proton/shared/lib/constants';

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
    const action = searchParams.get('action') || undefined;

    const dark = action === SupportedActions.SubscribeAccount || action === SupportedActions.SubscribeAccountLink;

    return dark;
};

export default getIsDarkLayout;
