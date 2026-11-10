import { useCallback } from 'react';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { useEntitlementCatalog } from '@proton/account/entitlementCatalog/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import type { COUPON_CODES } from '@proton/payments/core/constants';
import { getSubscriptionForApp } from '@proton/payments/core/subscription/subscription-for-app';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';
import { getUpgradePath } from '@proton/payments/core/subscription/upsell';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { getPlanNameFromIDs } from '@proton/shared/lib/payments/plan/helpers';

import type { OpenCallbackProps } from '../payments/subscription/subscriptionModalTypes';
import { openLinkInBrowser } from './openExternalLink';
import { useHasInboxDesktopInAppPayments } from './useHasInboxDesktopInAppPayments';

export function useRedirectToAccountApp() {
    const { APP_NAME } = useConfig();
    const hasInboxDesktopInAppPayments = useHasInboxDesktopInAppPayments();
    const [user] = useUser();
    const [allSubscriptions] = useAllSubscriptions();
    const [entitlementCatalog] = useEntitlementCatalog();

    return useCallback(
        (params?: Omit<OpenCallbackProps, 'app'> & { app?: ProductParam }) => {
            if (isElectronApp && !hasInboxDesktopInAppPayments) {
                if (!params) {
                    openLinkInBrowser(getAppHref(`/${getSlugFromApp(APP_NAME)}/dashboard`, APPS.PROTONACCOUNT));
                    return true;
                }

                const selectedPlan = params.planIDs ? getPlanNameFromIDs(params.planIDs) : params.plan;
                const appName = Object.values(APPS).includes(params.app as APP_NAMES)
                    ? (params.app as APP_NAMES)
                    : undefined;
                const upsellPath = getUpgradePath(
                    {
                        user,
                        subscription: getSubscriptionForApp(
                            allSubscriptions ?? [],
                            entitlementCatalog,
                            appName ?? APP_NAME
                        ),
                        plan: selectedPlan,
                        app: appName,
                        audience: params.defaultAudience,
                        target: params.step === SUBSCRIPTION_STEPS.CHECKOUT ? 'checkout' : undefined,
                        coupon: (params.coupon as COUPON_CODES) ?? undefined,
                        cycle: params.cycle,
                        maximumCycle: params.maximumCycle,
                        minimumCycle: params.minimumCycle,
                        disablePlanSelection: params.disablePlanSelection,
                    },
                    params.upsellRef
                );

                const upsellPathWithApp = `/${getSlugFromApp(appName ?? APP_NAME)}` + `${upsellPath}`;
                openLinkInBrowser(getAppHref(upsellPathWithApp, APPS.PROTONACCOUNT));
                return true;
            }

            return false;
        },
        [APP_NAME, hasInboxDesktopInAppPayments, user, allSubscriptions, entitlementCatalog]
    );
}
