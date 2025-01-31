import { type CYCLE, type PLANS } from '@proton/payments';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { addUpsellPath, getUpgradePath } from '@proton/shared/lib/helpers/upsell';

export const freeTrialUpgradeClick = (upsellRef: string) => {
    void invokeInboxDesktopIPC({
        type: 'openExternal',
        payload: getAppHref(addUpsellPath(getUpgradePath({}), upsellRef), APPS.PROTONACCOUNT),
    });
};

export const upgradeButtonClick = (cycle: CYCLE, plan?: PLANS) => {
    void invokeInboxDesktopIPC({
        type: 'openExternal',
        payload: getAppHref(`/dashboard?plan=${plan}&cycle=${cycle}&step=1`, APPS.PROTONACCOUNT),
    });
};

export const openLinkInBrowser = (url: string) => {
    void invokeInboxDesktopIPC({ type: 'openExternal', payload: url });
};
