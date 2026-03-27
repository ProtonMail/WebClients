import { VPN_TV_CLIENT_IDS, VPN_TV_PATHS_MAP } from '@proton/shared/lib/constants';

export const getChildClientId = () => {
    if (VPN_TV_PATHS_MAP.apple.includes(location.pathname)) {
        return VPN_TV_CLIENT_IDS.APPLE;
    }
    return VPN_TV_CLIENT_IDS.ANDROID;
};
