import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS, CYCLE, PLANS } from '@proton/shared/lib/constants';
import { canInvokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { addUpsellPath, getUpgradePath } from '@proton/shared/lib/helpers/upsell';

export const freeTrialUpgradeClick = (upsellRef: string) => {
    if (canInvokeInboxDesktopIPC) {
        window.ipcInboxMessageBroker!.send(
            'openExternal',
            getAppHref(addUpsellPath(getUpgradePath({}), upsellRef), APPS.PROTONACCOUNT)
        );
    }
};

export const upgradeButtonClick = (cycle: CYCLE, plan?: PLANS) => {
    if (canInvokeInboxDesktopIPC) {
        window.ipcInboxMessageBroker!.send(
            'openExternal',
            getAppHref(`/dashboard?plan=${plan}&cycle=${cycle}&step=1`, APPS.PROTONACCOUNT)
        );
    }
};

export const openLinkInBrowser = (url: string) => {
    if (canInvokeInboxDesktopIPC) {
        window.ipcInboxMessageBroker!.send('openExternal', url);
    }
};

export function redirectToAccountApp() {
    if (isElectronApp) {
        openLinkInBrowser(getAppHref('/mail/dashbard', APPS.PROTONACCOUNT));
        return true;
    }

    return false;
}
