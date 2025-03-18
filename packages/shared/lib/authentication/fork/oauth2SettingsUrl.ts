import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';

export const getOAuthSettingsUrl = (localID: number) => {
    return new URL(getAppHref(`/lite?u=${localID}&action=vpn-lite&app=vpn&type=upgrade`, APPS.PROTONACCOUNT));
};
