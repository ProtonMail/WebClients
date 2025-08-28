import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import {
    type Subscription,
    canModify,
    getHasPassB2BPlan,
    getIsB2BAudienceFromSubscription,
    getSubscriptionPlanTitle,
    hasCustomCycle,
    hasVPNPassBundle,
    isManagedExternally,
} from '@proton/payments';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { Address, Organization, UserModel, VPNServersCountData } from '@proton/shared/lib/interfaces';
import { getSpace } from '@proton/shared/lib/user/storage';

import { useSubscriptionModal } from '../SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../constants';
import { getSubscriptionPanelText } from '../helpers/subscriptionPanelHelpers';
import {
    BillingDateSection,
    FreeVPNFeatures,
    ServersSection,
    StorageSection,
    UsersSection,
} from './PlanFeatureSections';
import { PlanIcon } from './PlanIcon';
import PlanIconName from './PlanIconName';
import { getBillingCycleText, getPlanTitlePlusMaybeBrand } from './helpers';

interface CurrentPlanInfoSectionProps {
    app: APP_NAMES;
    user: UserModel;
    subscription: Subscription;
    organization: Organization | undefined;
    serversCount: VPNServersCountData | undefined;
    addresses: Address[] | undefined;
    editBillingCycle?: boolean;
}

const PlanNameSection = ({
    app,
    user,
    subscription,
}: {
    app: APP_NAMES;
    user: UserModel;
    subscription: Subscription;
}) => {
    const { planTitle, planName } = getSubscriptionPlanTitle(user, subscription);

    const billingCycleElement = subscription.Cycle && (
        <>
            <span className="color-weak mx-1">·</span>
            <span className="color-weak">{getBillingCycleText(subscription.Cycle)}</span>
        </>
    );

    const topLine = (
        <>
            <span>{getPlanTitlePlusMaybeBrand(planTitle, planName)}</span>
            <span className="text-normal">{billingCycleElement}</span>
        </>
    );

    return <PlanIconName logo={<PlanIcon app={app} subscription={subscription} />} topLine={topLine} />;
};
export const CurrentPlanInfoSection = ({
    app,
    user,
    subscription,
    organization,
    serversCount,
    addresses,
    editBillingCycle = false,
}: CurrentPlanInfoSectionProps) => {
    const [openSubscriptionModal] = useSubscriptionModal();
    const space = getSpace(user);
    const { isFree, canPay, isMember } = user;
    const telemetryFlow = useDashboardPaymentFlow(app);

    const { UsedSpace = space.usedSpace, MaxSpace = space.maxSpace, MaxMembers = 1 } = organization || {};

    const { userText } = getSubscriptionPanelText(user, organization, addresses, subscription);

    const showCustomizePlan = user.isPaid && user.canPay && getIsB2BAudienceFromSubscription(subscription);

    const showManageSubscriptionButton = canPay && !isMember && !isFree;

    const showEditBillingDetails =
        user.isPaid &&
        user.canPay &&
        !getHasPassB2BPlan(subscription) &&
        !hasCustomCycle(subscription) &&
        !hasVPNPassBundle(subscription) &&
        !showCustomizePlan &&
        editBillingCycle &&
        !isManagedExternally(subscription);

    const showExploreOtherPlans = user.isPaid && user.canPay && canModify(subscription);

    const handleEditPayment = (step = SUBSCRIPTION_STEPS.CHECKOUT) =>
        openSubscriptionModal({
            step,
            disablePlanSelection: true,
            metrics: {
                source: 'plans',
            },
            telemetryFlow,
        });

    const cta = (() => {
        if (showEditBillingDetails && editBillingCycle) {
            return (
                <Button onClick={() => handleEditPayment()} data-testid="edit-billing-details">{c('Action')
                    .t`Edit billing cycle`}</Button>
            );
        }

        if (showManageSubscriptionButton && !editBillingCycle) {
            return (
                <ButtonLike as={SettingsLink} shape="outline" path="/subscription">
                    {c('Action').t`Manage subscription`}
                </ButtonLike>
            );
        }

        if (showExploreOtherPlans) {
            return (
                <Button
                    onClick={() => handleEditPayment(SUBSCRIPTION_STEPS.PLAN_SELECTION)}
                    data-testid="explore-other-plans"
                >
                    {c('Action').t`Explore other plans`}
                </Button>
            );
        }

        return null;
    })();

    return (
        <div className="flex flex-column gap-4 lg:gap-8 xl:gap-12 md:justify-space-between md:flex-wrap md:flex-row">
            <PlanNameSection app={app} user={user} subscription={subscription} />
            <div className="flex flex-column md:flex-row gap-4 lg:gap-8 xl:gap-12 xl:ml-auto">
                <UsersSection MaxMembers={MaxMembers} userText={userText} />
                <StorageSection user={user} usedSpace={UsedSpace} maxSpace={MaxSpace} />
                <BillingDateSection subscription={subscription} />
                <ServersSection subscription={subscription} />
                <FreeVPNFeatures serversCount={serversCount} isFreeUser={isFree} />
            </div>
            {cta && <div className="flex items-center w-full xl:w-auto">{cta}</div>}
        </div>
    );
};
