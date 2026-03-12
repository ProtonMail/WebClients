import { useCallback } from 'react';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import type { COUPON_CODES } from '@proton/payments';
import { getPlanNameFromIDs } from '@proton/payments';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { addUpsellPath, getUpgradePath } from '@proton/shared/lib/helpers/upsell';

import type { SubscriptionContainerProps } from '../payments/subscription/SubscriptionContainer';
import { SUBSCRIPTION_STEPS } from '../payments/subscription/constants';
import { openLinkInBrowser } from './openExternalLink';
import { useHasInboxDesktopInAppPayments } from './useHasInboxDesktopInAppPayments';

export function useRedirectToAccountApp() {
    const { APP_NAME } = useConfig();
    const hasInboxDesktopInAppPayments = useHasInboxDesktopInAppPayments();
    const [user] = useUser();
    const [subscription] = useSubscription();

    return useCallback(
        (params?: Partial<SubscriptionContainerProps>) => {
            if (isElectronApp && !hasInboxDesktopInAppPayments) {
                if (!params) {
                    openLinkInBrowser(getAppHref(`/${getSlugFromApp(APP_NAME)}/dashboard`, APPS.PROTONACCOUNT));
                    return true;
                }

                const selectedPlan = params.planIDs ? getPlanNameFromIDs(params.planIDs) : params.plan;
                const appName = Object.values(APPS).includes(params.app as APP_NAMES)
                    ? (params.app as APP_NAMES)
                    : undefined;
                const upsellPath = addUpsellPath(
                    getUpgradePath({
                        user,
                        subscription,
                        plan: selectedPlan,
                        app: appName,
                        audience: params.defaultAudience,
                        target: params.step === SUBSCRIPTION_STEPS.CHECKOUT ? 'checkout' : undefined,
                        coupon: (params.coupon as COUPON_CODES) ?? undefined,
                        cycle: params.cycle,
                        maximumCycle: params.maximumCycle,
                        minimumCycle: params.minimumCycle,
                        disablePlanSelection: params.disablePlanSelection,
                    }),
                    params.upsellRef
                );

                const upsellPathWithApp = `/${getSlugFromApp(appName ?? APP_NAME)}` + `${upsellPath}`;
                openLinkInBrowser(getAppHref(upsellPathWithApp, APPS.PROTONACCOUNT));
                return true;
            }

            return false;
        },
        [APP_NAME, hasInboxDesktopInAppPayments, user, subscription]
    );
}
