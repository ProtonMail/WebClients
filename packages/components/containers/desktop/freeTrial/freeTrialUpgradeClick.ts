import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { canInvokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';

export const freeTrialUpgradeClick = () => {
    if (canInvokeInboxDesktopIPC) {
        window.ipcInboxMessageBroker!.send('openExternal', getAppHref('/mail/upgrade', APPS.PROTONACCOUNT));
    }
};
