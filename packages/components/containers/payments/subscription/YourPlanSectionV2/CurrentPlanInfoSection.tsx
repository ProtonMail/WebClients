import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import { Pill } from '@proton/atoms/Pill/Pill';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { TrialInfoModal } from '@proton/components/containers/referral/components/TrialInfo/TrialInfo';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import type { ADDON_NAMES } from '@proton/payments';
import {
    type Subscription,
    canModify,
    getAddons,
    getHasPassB2BPlan,
    getIsB2BAudienceFromSubscription,
    getSubscriptionPlanTitle,
    hasCustomCycle,
    hasFree,
    hasVPNPassBundle,
    isAutoRenewTrial,
    isManagedExternally,
    isTrial,
} from '@proton/payments';
import {
    isReferralTrial,
    isTrialRenewing,
    willTrialExpireInLessThan1Week,
} from '@proton/payments/core/subscription/helpers';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import type { Address, Organization, UserModel, VPNServersCountData } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash';
import isTruthy from '@proton/utils/isTruthy';

import { useSubscriptionModal } from '../SubscriptionModalProvider';
import { REACTIVATE_SOURCE } from '../cancellationFlow/useCancellationTelemetry';
import { SUBSCRIPTION_STEPS } from '../constants';
import { subscriptionExpires } from '../helpers';
import { getReactivateSubscriptionAction } from '../helpers/subscriptionExpires';
import { getSubscriptionPanelText } from '../helpers/subscriptionPanelHelpers';
import { BillingDateSection, FreeVPNFeatures, ServersSection, UsersSection } from './PlanFeatureSections';
import { PlanIcon } from './PlanIcon';
import PlanIconName from './PlanIconName';
import {
    getAddonDashboardTitle,
    getBillingCycleText,
    getPassLifetimeAddonDashboardTitle,
    getPlanTitlePlusMaybeBrand,
} from './helpers';
import { StorageSection } from './storage/StorageSection';

interface CurrentPlanInfoSectionProps {
    app: APP_NAMES;
    user: UserModel;
    subscription: Subscription;
    organization: Organization | undefined;
    serversCount: VPNServersCountData | undefined;
    addresses: Address[] | undefined;
    editBillingCycle?: boolean;
}

const AddonSection = ({
    subscription,
    user,
    maxMembers,
}: {
    user: UserModel;
    subscription: Subscription;
    maxMembers: number;
}) => {
    const addons = getAddons(subscription);

    const addonTitles = addons.map((addon) =>
        getAddonDashboardTitle(addon.Name as ADDON_NAMES, addon.Quantity, maxMembers)
    );
    const passLifeTimeAddon = getPassLifetimeAddonDashboardTitle(user);
    const mergedAddonTitles = [...addonTitles, passLifeTimeAddon].filter(isTruthy).join(', ');

    if (mergedAddonTitles.length > 0 && !hasFree(subscription)) {
        return (
            <Tooltip
                title={c('Tooltip').t`Added to your plan: ${mergedAddonTitles}`}
                className="max-w-custom color-weak text-ellipsis"
                style={{ '--max-w-custom': '25rem' }}
            >
                <div>+ {mergedAddonTitles}</div>
            </Tooltip>
        );
    }

    return null;
};

const TrialInfoBadge = ({ subscription }: { subscription: Subscription }) => {
    const [modalProps, setModal, renderModal] = useModalState();
    const isReferralExpansionEnabled = useFlag('ReferralExpansion');

    const pill = (
        <Pill className="text-semibold" backgroundColor="#C9EBFF" color="#023856" rounded="rounded-sm">{c('Info')
            .t`Free trial`}</Pill>
    );

    if (!isReferralExpansionEnabled || !isTrial(subscription)) {
        return null;
    }

    if (!isReferralTrial(subscription)) {
        return pill;
    }

    return (
        <>
            <button
                onClick={() => setModal(true)}
                type="button"
                className="relative interactive-pseudo-protrude rounded"
            >
                {pill}
            </button>
            {renderModal && <TrialInfoModal modalProps={modalProps} />}
        </>
    );
};

const PlanNameSection = ({
    app,
    user,
    subscription,
    maxMembers,
}: {
    app: APP_NAMES;
    user: UserModel;
    subscription: Subscription;
    maxMembers: number;
}) => {
    const isReferralExpansionEnabled = useFlag('ReferralExpansion');
    const { planTitle, planName } = getSubscriptionPlanTitle(user, subscription);

    const billingCycleElement = subscription.Cycle && !(isReferralExpansionEnabled && isTrial(subscription)) && (
        <>
            <span className="color-weak mx-1">·</span>
            <span className="color-weak">{getBillingCycleText(subscription.Cycle)}</span>
        </>
    );

    const topLine = (
        <>
            <span>{getPlanTitlePlusMaybeBrand(planTitle, planName)}</span>
            <span className="text-normal mr-2">{billingCycleElement}</span>
            <TrialInfoBadge subscription={subscription} />
        </>
    );

    return (
        <PlanIconName
            logo={<PlanIcon app={app} subscription={subscription} />}
            topLine={topLine}
            bottomLine={<AddonSection user={user} subscription={subscription} maxMembers={maxMembers} />}
        />
    );
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
    const { isFree, canPay, isMember } = user;
    const telemetryFlow = useDashboardPaymentFlow(app);
    const goToSettings = useSettingsLink();

    const { MaxMembers = 1 } = organization || {};

    const { userText } = getSubscriptionPanelText(user, organization, addresses);

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

    const handleExplorePlans = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            metrics: { source: 'upsells' },
            telemetryFlow,
        });
    };

    const handleEditPayment = (step = SUBSCRIPTION_STEPS.CHECKOUT) =>
        openSubscriptionModal({
            step,
            disablePlanSelection: true,
            metrics: {
                source: 'plans',
            },
            telemetryFlow,
        });

    const handleCancelSubscription = () => {
        goToSettings('/dashboard#cancel-subscription');
    };

    const reactivateLinkData = getReactivateSubscriptionAction(subscription, REACTIVATE_SOURCE.default);

    const reactivateLink =
        reactivateLinkData.type === 'internal' ? (
            <ButtonLike
                as={SettingsLink}
                data-testid="reactivate-link"
                key="reactivate-subscription-internal"
                path={reactivateLinkData.path}
            >{c('Link').t`Reactivate now`}</ButtonLike>
        ) : (
            <ButtonLike
                as={Href}
                data-testid="reactivate-link"
                key="reactivate-subscription-external"
                href={reactivateLinkData.href}
            >{c('Link').t`Reactivate now`}</ButtonLike>
        );

    const { subscriptionExpiresSoon } = subscriptionExpires(subscription);

    const cta = (() => {
        if (
            showEditBillingDetails &&
            !isAutoRenewTrial(subscription) &&
            willTrialExpireInLessThan1Week(subscription) &&
            subscriptionExpiresSoon
        ) {
            return (
                <Button onClick={() => handleEditPayment(SUBSCRIPTION_STEPS.CHECKOUT)} data-testid="subscribe">
                    {c('Action').t`Subscribe`}
                </Button>
            );
        }

        if (showEditBillingDetails && isAutoRenewTrial(subscription) && isTrialRenewing(subscription)) {
            return (
                <Button onClick={handleCancelSubscription} data-testid="edit-billing-details-trial-cancel-subscription">
                    {c('Action').t`Cancel subscription`}
                </Button>
            );
        }

        if (showEditBillingDetails && isAutoRenewTrial(subscription) && !isTrialRenewing(subscription)) {
            return reactivateLink;
        }

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

        if (isFree && ([APPS.PROTONMAIL, APPS.PROTONDRIVE, APPS.PROTONCALENDAR] as APP_NAMES[]).includes(app)) {
            return <Button onClick={handleExplorePlans}>{c('Action').t`Get more storage`}</Button>;
        }

        return null;
    })();

    return (
        <div
            className="flex flex-column gap-4 lg:gap-8 xl:gap-12 md:justify-space-between md:flex-wrap md:flex-row"
            data-testid="current-plan"
        >
            <PlanNameSection app={app} user={user} subscription={subscription} maxMembers={MaxMembers} />
            <div className="flex flex-column md:flex-row gap-4 lg:gap-8 xl:gap-12 xl:ml-auto">
                <UsersSection MaxMembers={MaxMembers} userText={userText} />
                <StorageSection app={app} organization={organization} subscription={subscription} user={user} />
                <BillingDateSection subscription={subscription} />
                <ServersSection app={app} organization={organization} />
                <FreeVPNFeatures app={app} serversCount={serversCount} isFreeUser={isFree} />
            </div>
            {cta && <div className="flex items-center w-full xl:w-auto">{cta}</div>}
        </div>
    );
};
