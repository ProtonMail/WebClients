import { APPS, APP_NAMES } from '../constants';

export const getPublicUserProtonAddressApps = (): APP_NAMES[] => {
    return [APPS.PROTONPASS, APPS.PROTONVPN_SETTINGS, APPS.PROTONDRIVE];
};

export const getSSOVPNOnlyAccountApps = (): APP_NAMES[] => {
    return [APPS.PROTONVPN_SETTINGS];
};
