import { SUBSCRIPTION_STEPS, useFlag, useSubscriptionModal } from '@proton/components/containers';
import { useConfig, useSubscription, useUser } from '@proton/components/hooks';
import { APPS } from '@proton/shared/lib/constants';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { addUpsellPath, getUpgradePath } from '@proton/shared/lib/helpers/upsell';

import getUpsellSubscriptionModalConfig from './getUpsellSubscriptionModalConfig';

// Return config properties to inject in the subscription modal
const useUpsellConfig = (upsellRef?: string, step?: SUBSCRIPTION_STEPS, onSubscribed?: () => void) => {
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [openSubscriptionModal] = useSubscriptionModal();
    const inboxUpsellFlowEnabled = useFlag('InboxUpsellFlow');
    const ABTestInboxUpsellStepEnabled = useFlag('ABTestInboxUpsellStep'); // If enabled, we show the plan selection step
    const { APP_NAME } = useConfig();
    // Only the mail app offers the ability to pay within the app
    const isMail = APP_NAME === APPS.PROTONMAIL;

    if (isMail && !isElectronMail && inboxUpsellFlowEnabled && upsellRef) {
        const modalStep =
            step || ABTestInboxUpsellStepEnabled ? SUBSCRIPTION_STEPS.PLAN_SELECTION : SUBSCRIPTION_STEPS.CHECKOUT;
        const subscriptionCallBackProps = getUpsellSubscriptionModalConfig(upsellRef, modalStep);

        // The subscription modal will open in inbox app
        return {
            upgradePath: '',
            onUpgrade() {
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
