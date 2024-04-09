import { APPS } from '@proton/shared/lib/constants';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { addUpsellPath, getUpgradePath } from '@proton/shared/lib/helpers/upsell';

import { SUBSCRIPTION_STEPS, useConfig, useFlag, useSubscription, useSubscriptionModal, useUser } from '../..';
import getUpsellSubscriptionModalConfig from './getUpsellSubscriptionModalConfig';

// Return config properties to inject in the subscription modal
const useUpsellConfig = (upsellRef: string) => {
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [openSubscriptionModal] = useSubscriptionModal();
    const inboxUpsellFlowEnabled = useFlag('InboxUpsellFlow');
    const ABTestInboxUpsellStepEnabled = useFlag('ABTestInboxUpsellStep'); // If enabled, we show the plan selection step
    const { APP_NAME } = useConfig();
    // Make sure the new upsell flow is never enabled for the account app in case the modal is used in multiple places
    const isAccount = APP_NAME === APPS.PROTONACCOUNT;

    if (!isAccount && !isElectronMail && inboxUpsellFlowEnabled) {
        // The subscription modal will open in inbox app
        return {
            upgradePath: '',
            onUpgrade() {
                openSubscriptionModal(
                    getUpsellSubscriptionModalConfig(
                        upsellRef,
                        ABTestInboxUpsellStepEnabled ? SUBSCRIPTION_STEPS.PLAN_SELECTION : undefined
                    )
                );
            },
        };
    }

    // The user will be redirected to account app
    return {
        upgradePath: addUpsellPath(getUpgradePath({ user, subscription, app: APP_NAME }), upsellRef),
    };
};

export default useUpsellConfig;
