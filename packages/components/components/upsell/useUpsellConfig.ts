import { SUBSCRIPTION_STEPS, useFlag, useSubscriptionModal } from '@proton/components/containers';
import { useHasInboxDesktopInAppPayments } from '@proton/components/containers/desktop/useHasInboxDesktopInAppPayments';
import { useConfig, useSubscription, useUser } from '@proton/components/hooks';
import { APPS, UPSELL_ONE_DOLLAR_PROMO_PATHS } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpgradePath } from '@proton/shared/lib/helpers/upsell';
import { formatURLForAjaxRequest } from '@proton/shared/lib/helpers/url';
import noop from '@proton/utils/noop';

import getUpsellSubscriptionModalConfig from './getUpsellSubscriptionModalConfig';

interface Props {
    upsellRef?: string;
    step?: SUBSCRIPTION_STEPS;
    onSubscribed?: () => void;
}

// Return config properties to inject in the subscription modal
const useUpsellConfig = ({ upsellRef, step, onSubscribed }: Props) => {
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [openSubscriptionModal] = useSubscriptionModal();
    const hasSubscriptionModal = openSubscriptionModal !== noop;
    const inboxUpsellFlowEnabled = useFlag('InboxUpsellFlow');
    const ABTestInboxUpsellStepEnabled = useFlag('ABTestInboxUpsellStep'); // If enabled, we show the plan selection step
    const { APP_NAME } = useConfig();
    const hasInboxDesktopInAppPayments = useHasInboxDesktopInAppPayments();
    const hasInAppPayments = APP_NAME === APPS.PROTONMAIL || hasInboxDesktopInAppPayments;

    if (hasSubscriptionModal && hasInAppPayments && inboxUpsellFlowEnabled && upsellRef) {
        const isOneDollarPromo = UPSELL_ONE_DOLLAR_PROMO_PATHS.some((promoPath) => upsellRef?.includes(promoPath));
        const selectedStep = isOneDollarPromo ? SUBSCRIPTION_STEPS.CHECKOUT : step;

        const modalStep =
            selectedStep || ABTestInboxUpsellStepEnabled
                ? SUBSCRIPTION_STEPS.PLAN_SELECTION
                : SUBSCRIPTION_STEPS.CHECKOUT;
        const subscriptionCallBackProps = getUpsellSubscriptionModalConfig(upsellRef, modalStep);

        // The subscription modal will open in inbox app
        return {
            upgradePath: '',
            onUpgrade() {
                // Generate a mocked request to track upsell activity
                const urlParameters = { ref: upsellRef, load: 'modalOpen' };
                const url = formatURLForAjaxRequest(window.location.href, urlParameters);
                fetch(url).catch(noop);

                // Open the subscription modal
                openSubscriptionModal({
                    ...subscriptionCallBackProps,
                    onSubscribed,
                });
            },
        };
    }

    // The user will be redirected to account app
    return {
        upgradePath: addUpsellPath(getUpgradePath({ user, subscription, app: APP_NAME }), upsellRef),
    };
};

export default useUpsellConfig;
