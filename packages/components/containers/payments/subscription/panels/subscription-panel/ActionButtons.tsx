import { c } from 'ttag';

import { Button } from '@proton/atoms';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import {
    getHasPassB2BPlan,
    getIsB2BAudienceFromSubscription,
    getIsCustomCycle,
    hasMaximumCycle,
    hasVPNPassBundle,
} from '@proton/shared/lib/helpers/subscription';
import type { Subscription, UserModel } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash';

import { useSubscriptionModal } from '../../SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../constants';

export const ActionButtons = ({
    user,
    subscription,
    app,
}: {
    user: UserModel;
    subscription?: Subscription;
    app: APP_NAMES;
}) => {
    const scheduledDowncycling = useFlag('ScheduledDowncycling');
    const [openSubscriptionModal] = useSubscriptionModal();
    const telemetryFlow = useDashboardPaymentFlow(app);

    /**
     * Since all the components here are used in the same context, we can use the same metrics source for all of them.
     */
    const metrics = {
        source: 'plans',
    } as const;

    const handleCustomizeSubscription = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            disablePlanSelection: true,
            metrics,
            telemetryFlow,
        });
    };
    const handleExplorePlans = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            metrics,
            telemetryFlow,
        });
    };
    const handleEditPayment = () =>
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            disablePlanSelection: true,
            metrics,
            telemetryFlow,
        });

    const hasPassB2B = getHasPassB2BPlan(subscription);

    const showCustomizePlan = user.isPaid && user.canPay && getIsB2BAudienceFromSubscription(subscription);

    const showEditBillingDetails =
        user.isPaid &&
        user.canPay &&
        (!hasMaximumCycle(subscription) || scheduledDowncycling) &&
        !hasPassB2B &&
        !getIsCustomCycle(subscription) &&
        !hasVPNPassBundle(subscription) &&
        !showCustomizePlan;

    const showExploreOtherPlans = user.canPay;

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
                    shape={user.isPaid ? 'ghost' : 'outline'}
                    color={user.isPaid ? 'norm' : 'weak'}
                    fullWidth
                    data-testid="explore-other-plan"
                >{c('Action').t`Explore other ${BRAND_NAME} plans`}</Button>
            ) : null}
        </>
    );
};
