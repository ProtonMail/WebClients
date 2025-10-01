import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import useConfig from '@proton/components/hooks/useConfig';
import { type Currency, getPlanNameFromIDs } from '@proton/payments';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS, APPS_WITH_IN_APP_PAYMENTS } from '@proton/shared/lib/constants';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { formatURLForAjaxRequest } from '@proton/shared/lib/helpers/url';
import useFlag from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

import { openLinkInBrowser } from '../../desktop/openExternalLink';
import { useHasInboxDesktopInAppPayments } from '../../desktop/useHasInboxDesktopInAppPayments';
import { type OpenCallbackProps, useSubscriptionModal } from '../../payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../payments/subscription/constants';
import getOfferRedirectionParams from '../helpers/getOfferRedirectionParams';
import type { Deal, Offer } from '../interface';

const useSelectDeal = (callback?: () => void) => {
    const { APP_NAME } = useConfig();

    const goToSettingsLink = useSettingsLink();
    const inboxUpsellFlowEnabled = useFlag('InboxUpsellFlow');
    const hasInboxDesktopInAppPayments = useHasInboxDesktopInAppPayments();

    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();

    const handleOnSelectDeal = (offer: Offer, deal: Deal, currency: Currency) => {
        // Open the in-app purchase modal if available
        const hasInAppPayment = APPS_WITH_IN_APP_PAYMENTS.has(APP_NAME) || hasInboxDesktopInAppPayments;
        const plan = getPlanNameFromIDs(deal.planIDs);
        const hasSubscriptionModal = openSubscriptionModal !== noop;

        if (hasSubscriptionModal && hasInAppPayment && inboxUpsellFlowEnabled && !loadingSubscriptionModal && plan) {
            const subscriptionParams: OpenCallbackProps = {
                plan,
                coupon: deal.couponCode,
                cycle: deal.cycle,
                maximumCycle: deal.cycle,
                minimumCycle: deal.cycle,
                metrics: { source: 'upsells' },
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                upsellRef: deal.ref,
            };

            // Generate a mocked request to track upsell activity
            const urlParameters = { ref: deal.ref, load: 'modalOpen' };
            const url = formatURLForAjaxRequest(window.location.href, urlParameters);
            fetch(url).catch(noop);

            openSubscriptionModal(subscriptionParams);
            callback?.();
            return;
        }

        // Open the settings if the app doesn't support in-app payments
        const urlSearchParams = getOfferRedirectionParams({ offer, deal, currency });
        callback?.();

        const url = `/dashboard?${urlSearchParams.toString()}`;
        if (isElectronApp && !hasInboxDesktopInAppPayments) {
            openLinkInBrowser(getAppHref(url, APPS.PROTONACCOUNT));
            return;
        } else {
            goToSettingsLink(url);
        }
    };

    return handleOnSelectDeal;
};

export default useSelectDeal;
