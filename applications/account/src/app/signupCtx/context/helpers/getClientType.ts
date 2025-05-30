import { getIsPassApp, getIsVPNApp } from '@proton/shared/lib/authentication/apps';
import { type APP_NAMES, CLIENT_TYPES } from '@proton/shared/lib/constants';

export const getClientType = (toApp: APP_NAMES | undefined) => {
    if (getIsVPNApp(toApp)) {
        return CLIENT_TYPES.VPN;
    }
    if (getIsPassApp(toApp)) {
        return CLIENT_TYPES.PASS;
    }
    return CLIENT_TYPES.MAIL;
};
