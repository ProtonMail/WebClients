import { ProductParam } from '@proton/shared/lib/apps/product';
import { APPS } from '@proton/shared/lib/constants';

export enum SupportedActions {
    DeleteAccount = 'delete-account',
    SubscribeAccount = 'subscribe-account',
    SubscribeAccountLink = 'subscribe-account-link',
}

export const getApp = (appQueryParam: string | null, redirect: string | undefined): ProductParam => {
    if (appQueryParam === 'generic' || appQueryParam === 'business') {
        return appQueryParam;
    }
    if (appQueryParam === 'vpn') {
        return APPS.PROTONVPN_SETTINGS;
    }
    if (appQueryParam === 'mail') {
        return APPS.PROTONMAIL;
    }
    if (appQueryParam === 'drive') {
        return APPS.PROTONDRIVE;
    }
    if (appQueryParam === 'pass') {
        return APPS.PROTONPASS;
    }
    if (appQueryParam === 'calendar') {
        return APPS.PROTONCALENDAR;
    }
    if (redirect) {
        if (redirect.includes('vpn')) {
            return APPS.PROTONVPN_SETTINGS;
        }
        if (redirect.includes('mail')) {
            return APPS.PROTONMAIL;
        }
        if (redirect.includes('calendar')) {
            return APPS.PROTONCALENDAR;
        }
        if (redirect.includes('drive')) {
            return APPS.PROTONDRIVE;
        }
        if (redirect.includes('pass')) {
            return APPS.PROTONPASS;
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
