import type { CYCLE, PLANS } from '@proton/payments/core/constants';
import { getSubscriptionSearchParamsString } from '@proton/payments/core/subscription/search-params';
import { getUpgradePath } from '@proton/payments/core/subscription/upsell';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';

export const freeTrialUpgradeClick = (upsellRef: string) => {
    void invokeInboxDesktopIPC({
        type: 'openExternal',
        payload: getAppHref(getUpgradePath({}, upsellRef), APPS.PROTONACCOUNT),
    });
};

export const upgradeButtonClick = (cycle: CYCLE, plan?: PLANS) => {
    const searchParams = getSubscriptionSearchParamsString({
        plan,
        cycle,
        // no canonical
        step: 1,
    });
    void invokeInboxDesktopIPC({
        type: 'openExternal',
        payload: getAppHref(`/dashboard?${searchParams}`, APPS.PROTONACCOUNT),
    });
};

export const openLinkInBrowser = (url: string) => {
    void invokeInboxDesktopIPC({ type: 'openExternal', payload: url });
};
