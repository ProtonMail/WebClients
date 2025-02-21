import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { getHasInboxDesktopInAppPayments } from '@proton/components/containers/desktop/useHasInboxDesktopInAppPayments';
import {
    type OpenCallbackProps,
    type OpenSubscriptionModalCallback,
    useSubscriptionModal,
} from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import useConfig from '@proton/components/hooks/useConfig';
import { CYCLE } from '@proton/payments';
import type { ADDON_NAMES, PLANS } from '@proton/payments';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpgradePath } from '@proton/shared/lib/helpers/upsell';
import { formatURLForAjaxRequest } from '@proton/shared/lib/helpers/url';
import type { Subscription, UserModel } from '@proton/shared/lib/interfaces';
import { useGetFlag } from '@proton/unleash';
import noop from '@proton/utils/noop';

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
    maximumCycle,
    minimumCycle,
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
    subscription: Subscription | undefined;
    user: UserModel;
}): { upgradePath: string; onUpgrade?: () => void } => {
    const hasSubscriptionModal = openSubscriptionModal !== noop;
    const inboxUpsellFlowEnabled = getFlag('InboxUpsellFlow');
    const hasInboxDesktopInAppPayments = getHasInboxDesktopInAppPayments(getFlag);

    const hasInAppPayments = appsWithInApp.has(appName) || hasInboxDesktopInAppPayments;

    if (hasSubscriptionModal && hasInAppPayments && inboxUpsellFlowEnabled && upsellRef && !preventInApp) {
        const subscriptionCallBackProps: OpenCallbackProps = {
            coupon,
            cycle: cycle || CYCLE.YEARLY,
            maximumCycle,
            minimumCycle,
            disablePlanSelection: step === SUBSCRIPTION_STEPS.CHECKOUT,
            metrics: {
                source: 'upsells',
            },
            mode: 'upsell-modal', // hide the Free plan
            step: step || SUBSCRIPTION_STEPS.CHECKOUT,
            upsellRef: upsellRef,
        };

        if (plan) {
            subscriptionCallBackProps.planIDs = { [plan]: 1 };
        }

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
    const { APP_NAME: appName } = useConfig();
    const getFlag = useGetFlag();

    return getUpsellConfig({
        appName,
        getFlag,
        openSubscriptionModal,
        subscription,
        user,
        upsellRef,
        step,
        coupon,
        cycle,
        plan,
        onSubscribed,
        preventInApp,
        maximumCycle,
        minimumCycle,
    });
};

export default useUpsellConfig;
