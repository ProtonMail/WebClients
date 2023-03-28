import { APPS } from '@proton/shared/lib/constants';

export enum SupportedActions {
    DeleteAccount = 'delete-account',
    SubscribeAccount = 'subscribe-account',
    VpnBlackFriday = 'vpn-black-friday',
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

export enum FullscreenOption {
    On,
    Off,
    Auto,
}

export const getFullscreenOption = (value: string | null | undefined) => {
    if (value === 'off' || value === 'false') {
        return FullscreenOption.Off;
    }
    if (value === 'auto') {
        return FullscreenOption.Auto;
    }
    return FullscreenOption.On;
};
