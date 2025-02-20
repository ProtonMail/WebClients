import type { ReactNode } from 'react';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useHasInboxDesktopInAppPayments } from '@proton/components/containers/desktop/useHasInboxDesktopInAppPayments';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import type { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import useConfig from '@proton/components/hooks/useConfig';
import { type CYCLE } from '@proton/payments';
import type { ADDON_NAMES, PLANS } from '@proton/payments';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
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
    maximumCycle?: CYCLE;
    minimumCycle?: CYCLE;
    plan?: PLANS | ADDON_NAMES;
    onSubscribed?: () => void;
    submitText?: ReactNode;
    title?: ReactNode;
    footerText?: ReactNode;
    /**
     * Can be used to prevent the modal from being opened in the drawer
     */
    preventInApp?: boolean;
}

const appsWithInApp = new Set<APP_NAMES>([APPS.PROTONMAIL, APPS.PROTONACCOUNT, APPS.PROTONCALENDAR]);

/**
 * Return config properties to inject in the subscription modal
 */
const useUpsellConfig = ({
    upsellRef,
    step,
    coupon,
    cycle,
    maximumCycle,
    minimumCycle,
    plan,
    submitText,
    footerText,
    title,
    onSubscribed,
    preventInApp = false,
}: Props): Partial<UpsellModalProps> & Required<Pick<UpsellModalProps, 'upgradePath'>> => {
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [openSubscriptionModal] = useSubscriptionModal();
    const hasSubscriptionModal = openSubscriptionModal !== noop;
    const inboxUpsellFlowEnabled = useFlag('InboxUpsellFlow');
    const { APP_NAME } = useConfig();
    const hasInboxDesktopInAppPayments = useHasInboxDesktopInAppPayments();
    const hasInAppPayments = appsWithInApp.has(APP_NAME) || hasInboxDesktopInAppPayments;

    if (hasSubscriptionModal && hasInAppPayments && inboxUpsellFlowEnabled && upsellRef && !preventInApp) {
        const subscriptionCallBackProps = getUpsellSubscriptionModalConfig({
            coupon,
            cycle,
            maximumCycle,
            minimumCycle,
            step,
            upsellRef,
            plan,
        });

        // The subscription modal will open in inbox app
        return {
            upgradePath: '',
            // Add next fields only if they are defined.
            // We are spreading the returned object on UpsellModal which could erase props set manually on it
            ...(title && { title }),
            ...(submitText && { submitText }),
            ...(footerText && { footerText }),
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
        ...(title && { title }),
        ...(submitText && { submitText }),
        ...(footerText && { footerText }),
    };
};

export default useUpsellConfig;
