import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useSubscriptionModalRaw } from '@proton/components/containers/payments/subscription/subscriptionModalContext';
import {
    type MaybeFreeSubscription,
    getHasPassB2BPlan,
    getIsB2BAudienceFromSubscription,
    hasCustomCycle,
    hasPassBasic,
    hasVPNPassBundle,
    isAutoRenewTrial,
    isManagedExternally,
    isTrial,
} from '@proton/payments/core/subscription/helpers';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces/User';

export const ActionButtons = ({ user, subscription }: { user: UserModel; subscription: MaybeFreeSubscription }) => {
    const openSubscriptionModal = useSubscriptionModalRaw();

    const handleCustomizeSubscription = () => {
        void openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            disablePlanSelection: true,
        });
    };
    const handleExplorePlans = () => {
        void openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
        });
    };
    const handleEditPayment = () =>
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            disablePlanSelection: true,
        });

    const hasPassB2B = getHasPassB2BPlan(subscription);

    const showCustomizePlan = user.isPaid && user.canPay && getIsB2BAudienceFromSubscription(subscription);

    const showStartSubscription = isTrial(subscription) && !isAutoRenewTrial(subscription);

    const showEditBillingDetails =
        user.isPaid &&
        user.canPay &&
        !hasPassB2B &&
        !hasCustomCycle(subscription) &&
        !hasVPNPassBundle(subscription) &&
        !showCustomizePlan &&
        !showStartSubscription &&
        !isManagedExternally(subscription);

    const showExploreOtherPlans = user.canPay;

    const explorePlansButtonVariant = (() => {
        if (hasPassBasic(subscription)) {
            return { shape: 'solid', color: 'norm' } as const;
        }
        if (user.isPaid) {
            return { shape: 'ghost', color: 'norm' } as const;
        }
        return { shape: 'outline', color: 'weak' } as const;
    })();

    return (
        <>
            {
                // translator: Edit billing cycle is a button when you want to edit the billing details of your current plan, in the dashboard.
                showEditBillingDetails ? (
                    <Button
                        onClick={handleEditPayment}
                        className="mb-2"
                        size="large"
                        color="weak"
                        fullWidth
                        data-testid="edit-billing-details"
                    >{c('Action').t`Edit billing cycle`}</Button>
                ) : null
            }
            {showStartSubscription ? (
                <Button
                    onClick={handleCustomizeSubscription}
                    className="mb-2"
                    color="weak"
                    size="large"
                    shape="outline"
                    data-testid="start-subscription"
                    fullWidth
                >{c('Action').t`Start subscription`}</Button>
            ) : null}
            {showCustomizePlan ? (
                <Button
                    onClick={handleCustomizeSubscription}
                    className="mb-2"
                    color="weak"
                    size="large"
                    shape="outline"
                    data-testid="customize-plan"
                    fullWidth
                >{c('Action').t`Customize plan`}</Button>
            ) : null}
            {showExploreOtherPlans ? (
                <Button
                    onClick={handleExplorePlans}
                    size="large"
                    shape={explorePlansButtonVariant.shape}
                    color={explorePlansButtonVariant.color}
                    fullWidth
                    data-testid="explore-other-plan"
                >{c('Action').t`Explore other ${BRAND_NAME} plans`}</Button>
            ) : null}
        </>
    );
};
