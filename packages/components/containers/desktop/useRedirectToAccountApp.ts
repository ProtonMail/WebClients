import { useCallback } from 'react';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import type { COUPON_CODES } from '@proton/payments/index';
import { getPlanNameFromIDs } from '@proton/payments/index';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { addUpsellPath, getUpgradePath } from '@proton/shared/lib/helpers/upsell';

import type { SubscriptionContainerProps } from '../payments/subscription/SubscriptionContainer';
import { openLinkInBrowser } from './openExternalLink';
import { useHasInboxDesktopInAppPayments } from './useHasInboxDesktopInAppPayments';

export function useRedirectToAccountApp() {
    const hasInboxDesktopInAppPayments = useHasInboxDesktopInAppPayments();
    const [user] = useUser();
    const [subscription] = useSubscription();

    return useCallback(
        (params?: Partial<SubscriptionContainerProps>) => {
            if (isElectronApp && !hasInboxDesktopInAppPayments) {
                if (!params) {
                    openLinkInBrowser(getAppHref('/mail/dashboard', APPS.PROTONACCOUNT));
                    return true;
                }

                const selectedPlan = params.planIDs ? getPlanNameFromIDs(params.planIDs) : params.plan;
                const upsellPath = addUpsellPath(
                    getUpgradePath({
                        user,
                        plan: selectedPlan,
                        subscription,
                        app: params.app as APP_NAMES,
                        coupon: (params.coupon as COUPON_CODES) ?? undefined,
                        cycle: params.cycle,
                        maximumCycle: params.maximumCycle,
                        minimumCycle: params.minimumCycle,
                    }),
                    params.upsellRef
                );
                openLinkInBrowser(getAppHref(upsellPath, APPS.PROTONACCOUNT));
                return true;
            }

            return false;
        },
        [hasInboxDesktopInAppPayments, user, subscription]
    );
}
