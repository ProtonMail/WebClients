import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import {
    getHasInboxDesktopInAppPayments,
    useHasInboxDesktopInAppPayments,
} from '@proton/components/containers/desktop/useHasInboxDesktopInAppPayments';
import {
    type OpenSubscriptionModalCallback,
    useSubscriptionModal,
} from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import type { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import useConfig from '@proton/components/hooks/useConfig';
import { type CYCLE } from '@proton/payments';
import type { ADDON_NAMES, PLANS } from '@proton/payments';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpgradePath } from '@proton/shared/lib/helpers/upsell';
import { formatURLForAjaxRequest } from '@proton/shared/lib/helpers/url';
import type { Subscription, UserModel } from '@proton/shared/lib/interfaces';
import { useFlag, type useGetFlag } from '@proton/unleash';
import noop from '@proton/utils/noop';

import getUpsellSubscriptionModalConfig from './getUpsellSubscriptionModalConfig';

interface Props {
    upsellRef?: string;
    step?: SUBSCRIPTION_STEPS;
    coupon?: string;
    cycle?: CYCLE;
    maximumCycle?: CYCLE;
    minimumCycle?: CYCLE;
    plan?: PLANS | ADDON_NAMES;
    onSubscribed?: () => void;
    /**
     * Can be used to prevent the modal from being opened in the drawer
     */
    preventInApp?: boolean;
}

export const appsWithInApp = new Set<APP_NAMES>([APPS.PROTONMAIL, APPS.PROTONACCOUNT, APPS.PROTONCALENDAR]);

export const getUpsellConfig = ({
    appName,
    coupon,
    cycle,
    getFlag,
    onSubscribed,
    openSubscriptionModal,
    plan,
    preventInApp = false,
    step,
    subscription,
    upsellRef,
    user,
}: Props & {
    appName: APP_NAMES;
    getFlag: ReturnType<typeof useGetFlag>;
    openSubscriptionModal: OpenSubscriptionModalCallback;
    subscription: Subscription;
    user: UserModel;
}): { upgradePath: string; onUpgrade?: () => void } => {
    const hasSubscriptionModal = openSubscriptionModal !== noop;
    const inboxUpsellFlowEnabled = getFlag('InboxUpsellFlow');
    const hasInboxDesktopInAppPayments = getHasInboxDesktopInAppPayments(getFlag);

    const hasInAppPayments = appsWithInApp.has(appName) || hasInboxDesktopInAppPayments;

    if (hasSubscriptionModal && hasInAppPayments && inboxUpsellFlowEnabled && upsellRef && !preventInApp) {
        const subscriptionCallBackProps = getUpsellSubscriptionModalConfig({ coupon, cycle, step, upsellRef, plan });

        // The subscription modal will open in inbox app
        return {
            upgradePath: '',
            onUpgrade() {
                // Generate a mocked request to track upsell activity
                const urlParameters = { ref: upsellRef, load: 'modalOpen' };
                const url = formatURLForAjaxRequest(window.location.href, urlParameters);
                fetch(url).catch(noop);

                // Open the subscription modal
                openSubscriptionModal({ ...subscriptionCallBackProps, onSubscribed });
            },
        };
    }

    // The user will be redirected to account app
    return { upgradePath: addUpsellPath(getUpgradePath({ user, subscription, app: appName }), upsellRef) };
};

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
    onSubscribed,
    preventInApp = false,
}: Props): { upgradePath: string; onUpgrade?: () => void } => {
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
            step,
            upsellRef,
            plan,
            maximumCycle,
            minimumCycle,
        });

        // The subscription modal will open in inbox app
        return {
            upgradePath: '',
            onUpgrade() {
                // Generate a mocked request to track upsell activity
                const urlParameters = { ref: upsellRef, load: 'modalOpen' };
                const url = formatURLForAjaxRequest(window.location.href, urlParameters);
                fetch(url).catch(noop);

                // Open the subscription modal
                openSubscriptionModal({ ...subscriptionCallBackProps, onSubscribed });
            },
        };
    }

    // The user will be redirected to account app
    return { upgradePath: addUpsellPath(getUpgradePath({ user, subscription, app: APP_NAME }), upsellRef) };
};

export default useUpsellConfig;
