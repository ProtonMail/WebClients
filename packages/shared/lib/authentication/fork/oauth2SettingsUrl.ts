import { getAppHref } from '../../apps/helper';
import { APPS } from '../../constants';

export const getOAuthSettingsUrl = (localID: number) => {
    return new URL(getAppHref(`/lite?u=${localID}&action=vpn-lite&app=vpn&type=upgrade`, APPS.PROTONACCOUNT));
};
