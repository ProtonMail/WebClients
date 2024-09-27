import type { ReactNode } from 'react';

import { useHasInboxDesktopInAppPayments } from '@proton/components/containers/desktop/useHasInboxDesktopInAppPayments';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import type { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { useConfig, useSubscription, useUser } from '@proton/components/hooks';
import type { CYCLE } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpgradePath } from '@proton/shared/lib/helpers/upsell';
import { formatURLForAjaxRequest } from '@proton/shared/lib/helpers/url';
import { useFlag } from '@proton/unleash';
import noop from '@proton/utils/noop';

import getUpsellSubscriptionModalConfig from './getUpsellSubscriptionModalConfig';
import { type UpsellModalProps } from './modal/UpsellModal';

interface Props {
    upsellRef?: string;
    step?: SUBSCRIPTION_STEPS;
    coupon?: string;
    cycle?: CYCLE;
    planIDs?: { [key: string]: number };
    onSubscribed?: () => void;
    submitText?: ReactNode;
    title?: ReactNode;
}

// Return config properties to inject in the subscription modal
const useUpsellConfig = ({
    upsellRef,
    step,
    coupon,
    cycle,
    planIDs,
    submitText,
    title,
    onSubscribed,
}: Props): Partial<UpsellModalProps> & Required<Pick<UpsellModalProps, 'upgradePath'>> => {
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [openSubscriptionModal] = useSubscriptionModal();
    const hasSubscriptionModal = openSubscriptionModal !== noop;
    const inboxUpsellFlowEnabled = useFlag('InboxUpsellFlow');
    const { APP_NAME } = useConfig();
    const hasInboxDesktopInAppPayments = useHasInboxDesktopInAppPayments();
    const hasInAppPayments = APP_NAME === APPS.PROTONMAIL || hasInboxDesktopInAppPayments;

    if (hasSubscriptionModal && hasInAppPayments && inboxUpsellFlowEnabled && upsellRef) {
        const subscriptionCallBackProps = getUpsellSubscriptionModalConfig({
            coupon,
            cycle,
            step,
            upsellRef,
            planIDs,
        });

        // The subscription modal will open in inbox app
        return {
            upgradePath: '',
            // Add next fields only if they are defined.
            // We are spreading the returned object on UpsellModal which could erase props set manually on it
            ...(title && { title }),
            ...(submitText && { submitText }),
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
