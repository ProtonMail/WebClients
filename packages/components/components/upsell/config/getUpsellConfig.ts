import { getHasInboxDesktopInAppPayments } from '@proton/components/containers/desktop/useHasInboxDesktopInAppPayments';
import {
    type OpenCallbackProps,
    type OpenSubscriptionModalCallback,
} from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { CYCLE } from '@proton/payments';
import type { COUPON_CODES, Plan, PlanIDs, Subscription } from '@proton/payments';
import { APPS_WITH_IN_APP_PAYMENTS, type APP_NAMES } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpgradePath } from '@proton/shared/lib/helpers/upsell';
import { formatURLForAjaxRequest } from '@proton/shared/lib/helpers/url';
import type { UserModel } from '@proton/shared/lib/interfaces';
import type useGetFlag from '@proton/unleash/useGetFlag';
import noop from '@proton/utils/noop';

export interface GetUpsellConfigProps {
    upsellRef?: string;
    /**
     * @default SUBSCRIPTION_STEPS.CHECKOUT
     */
    step?: SUBSCRIPTION_STEPS;
    coupon?: COUPON_CODES;
    /**
     * @default CYCLE.YEARLY
     */
    cycle?: CYCLE;
    /**
     * @default CYCLE.YEARLY
     */
    maximumCycle?: CYCLE;
    minimumCycle?: CYCLE;
    plan?: Plan['Name'];
    onSubscribed?: () => void;
    /**
     * Can be used to prevent the modal from being opened in the drawer
     * @default false
     */
    preventInApp?: boolean;
}

export const getUpsellConfig = ({
    appName,
    configOverride,
    coupon,
    cycle = CYCLE.YEARLY,
    maximumCycle,
    minimumCycle,
    getFlag,
    onSubscribed,
    openSubscriptionModal,
    planIDs,
    preventInApp = false,
    step = SUBSCRIPTION_STEPS.CHECKOUT,
    subscription,
    upsellRef,
    user,
}: Omit<GetUpsellConfigProps, 'plan'> & {
    appName: APP_NAMES;
    planIDs?: PlanIDs;
    getFlag: ReturnType<typeof useGetFlag>;
    openSubscriptionModal: OpenSubscriptionModalCallback;
    subscription: Subscription | undefined;
    user: UserModel;
    /** Override final config before opening subscription modal */
    configOverride?: (config: OpenCallbackProps) => void;
}): { upgradePath: string; onUpgrade?: () => void } => {
    const hasSubscriptionModal = openSubscriptionModal !== noop;
    const inboxUpsellFlowEnabled = getFlag('InboxUpsellFlow');
    const hasInboxDesktopInAppPayments = getHasInboxDesktopInAppPayments(getFlag);

    const hasInAppPayments = APPS_WITH_IN_APP_PAYMENTS.has(appName) || hasInboxDesktopInAppPayments;

    if (hasSubscriptionModal && hasInAppPayments && inboxUpsellFlowEnabled && upsellRef && !preventInApp) {
        const subscriptionCallBackProps: OpenCallbackProps = {
            coupon,
            cycle,
            disablePlanSelection: step === SUBSCRIPTION_STEPS.CHECKOUT,
            maximumCycle,
            minimumCycle,
            metrics: { source: 'upsells' },
            mode: 'upsell-modal', // hide the Free plan
            step,
            upsellRef,
        };

        if (planIDs) {
            subscriptionCallBackProps.planIDs = planIDs;
        }

        configOverride?.(subscriptionCallBackProps);

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
