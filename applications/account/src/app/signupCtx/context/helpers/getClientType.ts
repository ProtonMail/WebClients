import { getIsPassApp, getIsVPNApp } from '@proton/shared/lib/authentication/apps';
import { type APP_NAMES, CLIENT_TYPES } from '@proton/shared/lib/constants';

export const getClientType = (toApp: APP_NAMES | 'generic' | undefined) => {
    if (toApp === 'generic') {
        return CLIENT_TYPES.MAIL;
    }
    if (getIsVPNApp(toApp)) {
        return CLIENT_TYPES.VPN;
    }
    if (getIsPassApp(toApp)) {
        return CLIENT_TYPES.PASS;
    }
    return CLIENT_TYPES.MAIL;
};
