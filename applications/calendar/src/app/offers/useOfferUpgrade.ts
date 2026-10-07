import { useCallback } from 'react';

import { useConfig } from '@proton/app-context/useConfig';
import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import { openLinkInBrowser } from '@proton/components/containers/desktop/openExternalLink';
import { useHasInboxDesktopInAppPayments } from '@proton/components/containers/desktop/useHasInboxDesktopInAppPayments';
import { useOptionalSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { APPS, APPS_WITH_IN_APP_PAYMENTS } from '@proton/shared/lib/constants';
import { isElectronApp, isElectronMail } from '@proton/shared/lib/helpers/desktop';

/** Where a `GoToUpsell` CTA takes a Calendar user. `useActiveOffer` requires this
 * per call site, so every offer surface in this app shares one implementation
 * rather than re-deriving the destination and drifting apart.
 *
 * `upsellRef` is per surface, so payments telemetry can tell them apart. */
export const useOfferUpgrade = (upsellRef: string) => {
    const { APP_NAME } = useConfig();
    const goToSettingsLink = useSettingsLink();
    const hasInboxDesktopInAppPayments = useHasInboxDesktopInAppPayments();
    const [openSubscriptionModal, loadingSubscriptionModal] = useOptionalSubscriptionModal();

    return useCallback(() => {
        const hasInAppPayment =
            APPS_WITH_IN_APP_PAYMENTS.has(APP_NAME) && (!isElectronMail || hasInboxDesktopInAppPayments);

        if (openSubscriptionModal && hasInAppPayment) {
            if (loadingSubscriptionModal) {
                return;
            }

            void openSubscriptionModal({
                mode: 'upsell-modal',
                step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
                upsellRef,
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
    }, [
        APP_NAME,
        goToSettingsLink,
        hasInboxDesktopInAppPayments,
        openSubscriptionModal,
        loadingSubscriptionModal,
        upsellRef,
    ]);
};
