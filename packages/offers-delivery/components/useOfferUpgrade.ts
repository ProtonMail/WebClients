import { useCallback } from 'react';

import { useConfig } from '@proton/app-context/useConfig';
import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import { openLinkInBrowser } from '@proton/components/containers/desktop/openExternalLink';
import { useHasInboxDesktopInAppPayments } from '@proton/components/containers/desktop/useHasInboxDesktopInAppPayments';
import { useOptionalSubscriptionModal } from '@proton/components/containers/payments/subscription/subscriptionModalContext';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import {
    APPS,
    APPS_WITH_IN_APP_PAYMENTS,
    SHARED_UPSELL_PATHS,
    type UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { isElectronApp, isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/ref';

import type { CtaUpgradeParams } from '../interface';

/** Where a `GoToUpsell` CTA takes the user in any host app: the in-app
 * subscription modal where the app supports it, the account dashboard otherwise.
 * `component` is the surface the CTA lives on, so its fallback upsell ref stays distinct. */
export const useOfferUpgrade = (component: UPSELL_COMPONENT) => {
    const { APP_NAME } = useConfig();
    const goToSettingsLink = useSettingsLink();
    const hasInboxDesktopInAppPayments = useHasInboxDesktopInAppPayments();
    const [openSubscriptionModal, loadingSubscriptionModal] = useOptionalSubscriptionModal();

    return useCallback(
        (cta: CtaUpgradeParams | null) => {
            const hasInAppPayment =
                APPS_WITH_IN_APP_PAYMENTS.has(APP_NAME) && (!isElectronMail || hasInboxDesktopInAppPayments);

            if (openSubscriptionModal && hasInAppPayment) {
                if (loadingSubscriptionModal) {
                    return;
                }

                void openSubscriptionModal({
                    mode: 'upsell-modal',
                    step: cta?.plan ? SUBSCRIPTION_STEPS.CHECKOUT : SUBSCRIPTION_STEPS.PLAN_SELECTION,
                    plan: cta?.plan,
                    cycle: cta?.cycle,
                    coupon: cta?.coupon,
                    disableCycleSelector: cta?.disableCycleSelector,
                    disablePlanSelection: cta?.disablePlanSelector,
                    upsellRef:
                        cta?.trackingReference ??
                        getUpsellRefFromApp({
                            app: APP_NAME,
                            feature: SHARED_UPSELL_PATHS.OFFERS_DELIVERY,
                            component,
                        }),
                });
                return;
            }

            /* No in-app payments. On desktop an internal redirect is a dead end, so
             * hand the dashboard to the system browser instead. */
            if (isElectronApp && !hasInboxDesktopInAppPayments) {
                openLinkInBrowser(getAppHref(`/${getSlugFromApp(APP_NAME)}/dashboard`, APPS.PROTONACCOUNT));
                return;
            }

            goToSettingsLink('/dashboard');
        },
        [
            APP_NAME,
            component,
            goToSettingsLink,
            hasInboxDesktopInAppPayments,
            openSubscriptionModal,
            loadingSubscriptionModal,
        ]
    );
};
