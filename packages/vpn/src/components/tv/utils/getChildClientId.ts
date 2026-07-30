import { VPN_TV_CLIENT_IDS, VPN_TV_PATHS_MAP } from '@proton/shared/lib/constants';

export const getChildClientId = () => {
    if (VPN_TV_PATHS_MAP.vega.includes(location.pathname)) {
        return VPN_TV_CLIENT_IDS.VEGA;
    }

    if (VPN_TV_PATHS_MAP.apple.includes(location.pathname)) {
        return VPN_TV_CLIENT_IDS.APPLE;
    }

    const clientId = new URLSearchParams(location.search).get('clientId');

    if (clientId && Object.values(VPN_TV_CLIENT_IDS).includes(clientId)) {
        return clientId;
    }

    return VPN_TV_CLIENT_IDS.ANDROID;
};
