import { useId } from 'react';
import { Link } from 'react-router-dom';

import { Dot } from 'lucide-react';
import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Card } from '@proton/atoms/Card/Card';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import { getBillingCycleText } from '@proton/components/containers/payments/subscription/YourPlanSectionV2/helpers';
import { CYCLE, PLAN_NAMES, PLANS } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import type { LumoTierPlan } from '@proton/payments/core/subscription/lumo-purchase-rules';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { SubscriptionPlatform } from '@proton/shared/lib/payments/subscription/constants';

import { getLumoPlanDetails } from '../../../features/plan/components/utils';
import { LumoIcon } from '../../LumoIcon/LumoIcon';
import MobileManageSubscriptionButton from './MobileManageSubscriptionButton';

const getSubscriptionManagerName = (platform: SubscriptionPlatform) => {
    switch (platform) {
        case SubscriptionPlatform.iOS:
            // translator: Use the official localized name for Apple's app marketplace.
            return c('collider_2025: Store name').t`Apple App Store`;
        case SubscriptionPlatform.Android:
            // translator: Use the official localized name for Google's app marketplace.
            return c('collider_2025: Store name').t`Google Play`;
        default:
            return '';
    }
};

const getCycleLabel = (cycle: Subscription['Cycle']) => {
    if (cycle === CYCLE.MONTHLY) {
        // translator: Billing frequency in the subscription summary. The subscription is billed once a month.
        return c('collider_2025: Label').t`Monthly`;
    }
    if (cycle === CYCLE.YEARLY) {
        // translator: Billing frequency in the subscription summary. The subscription is billed once a year.
        return c('collider_2025: Label').t`Yearly`;
    }
    return getBillingCycleText(cycle);
};

type ExternallyManagedSubscriptionSectionProps =
    | {
          managedBy: 'native';
          /** The store purchase that supplies the billing cycle and provider. */
          subscription: Subscription;
          /** The standalone Lumo tier purchased through the store. */
          tier: LumoTierPlan;
      }
    | {
          /** A Lumo seat or potential add-on managed by a business or other organization. */
          managedBy: 'organization';
          /** Branded name of the base business subscription, if available. */
          planName?: string;
          /** How the organization provides Lumo and whether the user has an assigned seat. */
          lumo: 'included' | 'professional' | 'addon' | 'unassigned' | 'unavailable';
          /** Whether the user may manage the organization's billing. */
          canManageBilling: boolean;
          /** Account dashboard path for an eligible admin to add Lumo Professional. */
          addLumoPath?: string;
          /** Whether to link the billing admin to the organization's API usage page. */
          showApiCreditsLink: boolean;
          /** Closes account settings when the user navigates to their API usage. */
          onOpenApi?: () => void;
      }
    | {
          /** A member whose subscription is managed by a Family or Duo admin. */
          managedBy: 'family';
          /** The name of the Proton Family or Duo plan. */
          planName: string;
          /** Whether the member has an assigned Lumo license. */
          hasLumoSeat: boolean;
      };

type OrganizationSubscription = Extract<ExternallyManagedSubscriptionSectionProps, { managedBy: 'organization' }>;

interface SubscriptionDetails {
    title: string;
    summary: string;
    description?: string;
    features?: ReturnType<typeof getLumoPlanDetails>['features'];
}

const getIncludedPlanTitle = (planName?: string) => {
    if (planName) {
        // translator: Subscription card title. ${LUMO_SHORT_APP_NAME} is the product name. ${planName} is the Proton plan that includes Lumo access.
        return c('collider_2025: Title').t`${LUMO_SHORT_APP_NAME}, included in ${planName}`;
    }
    // translator: Subscription card title for a Lumo license supplied by a business. ${LUMO_SHORT_APP_NAME} is the product name.
    return c('collider_2025: Title').t`${LUMO_SHORT_APP_NAME}, included in your business plan`;
};

const getFreePlanTitle = () => {
    // translator: Subscription card title for the free plan. ${LUMO_SHORT_APP_NAME} is the product name.
    return c('collider_2025: Title').t`${LUMO_SHORT_APP_NAME} Free`;
};

const getOrganizationDetails = ({
    planName,
    lumo,
    canManageBilling,
    showApiCreditsLink,
    addLumoPath,
}: OrganizationSubscription): SubscriptionDetails => {
    if (lumo === 'unassigned') {
        return {
            title: getFreePlanTitle(),
            // translator: Status shown to a member whose organization has Lumo licenses but has not assigned one to them. ${LUMO_SHORT_APP_NAME} is the product name.
            summary: c('collider_2025: Info').t`Your organization already has ${LUMO_SHORT_APP_NAME}`,
            // translator: Instruction for an organization member without a license. A seat is an individual Lumo license assigned by an admin.
            description: c('collider_2025: Info').t`Ask your organization's admin to assign you a seat.`,
        };
    }

    if (lumo === 'unavailable') {
        let summary;
        if (planName) {
            // translator: Subscription status. ${planName} is the organization's current Proton plan name. ${LUMO_SHORT_APP_NAME} is the product name.
            summary = c('collider_2025: Info').t`${planName} doesn't include ${LUMO_SHORT_APP_NAME}`;
        } else {
            // translator: Subscription status explaining why the user has free access. ${LUMO_SHORT_APP_NAME} is the product name.
            summary = c('collider_2025: Info').t`Your organization's plan doesn't include ${LUMO_SHORT_APP_NAME}`;
        }
        let description;
        if (canManageBilling && addLumoPath) {
            // translator: Instruction for a billing admin to add Lumo to the organization's subscription. ${PLAN_NAMES[PLANS.LUMO_BUSINESS]} is the paid plan name, Lumo Professional.
            description = c('collider_2025: Info').t`Add ${PLAN_NAMES[PLANS.LUMO_BUSINESS]} for your organization.`;
        } else if (!canManageBilling) {
            // translator: Instruction for an organization member without paid Lumo access. ${LUMO_SHORT_APP_NAME} is the product name. ${PLAN_NAMES[PLANS.LUMO_BUSINESS]} is the paid plan name, Lumo Professional.
            description = c('collider_2025: Info')
                .t`To get ${LUMO_SHORT_APP_NAME}, ask your organization's admin to add ${PLAN_NAMES[PLANS.LUMO_BUSINESS]}.`;
        }
        return {
            title: getFreePlanTitle(),
            summary,
            description,
        };
    }

    const title = lumo === 'included' ? getIncludedPlanTitle(planName) : PLAN_NAMES[PLANS.LUMO_BUSINESS];
    if (!canManageBilling) {
        return {
            title,
            // translator: Status for a Lumo seat provided and managed by a business or other organization.
            summary: c('collider_2025: Info').t`Managed by your organization`,
            // translator: The organization admin manages the user's Lumo seat on the organization's subscription.
            description: c('collider_2025: Info').t`To change your plan, contact your organization's admin.`,
        };
    }

    // translator: Billing admin status. The add-on is Lumo access purchased as an extra on the organization's existing subscription.
    const addonSummary = c('collider_2025: Info').t`You manage this add-on for your organization`;
    // translator: Billing admin status. The plan is the organization's subscription that includes Lumo access.
    const planSummary = c('collider_2025: Info').t`You manage this plan for your organization`;
    // translator: Guidance for a billing admin. API credits are prepaid units for usage of the Lumo API.
    const creditsDescription = c('collider_2025: Info').t`Need more usage? Add API credits.`;
    return {
        title,
        summary: lumo === 'addon' ? addonSummary : planSummary,
        description: showApiCreditsLink ? creditsDescription : undefined,
    };
};

const getSubscriptionDetails = (props: ExternallyManagedSubscriptionSectionProps): SubscriptionDetails => {
    if (props.managedBy === 'organization') {
        return getOrganizationDetails(props);
    }
    if (props.managedBy === 'family') {
        const { planName, hasLumoSeat } = props;
        if (!hasLumoSeat) {
            return {
                title: getFreePlanTitle(),
                // translator: Subscription status shown to a member with free Lumo access. ${planName} is Proton Family or Proton Duo. ${LUMO_SHORT_APP_NAME} is the product name.
                summary: c('collider_2025: Info').t`${planName} doesn't include a ${LUMO_SHORT_APP_NAME} plan`,
                // translator: Instruction for a Proton Family or Duo member to ask the person who manages their subscription for paid Lumo access. ${LUMO_SHORT_APP_NAME} is the product name.
                description: c('collider_2025: Info')
                    .t`To get a ${LUMO_SHORT_APP_NAME} plan, please ask your family admin.`,
            };
        }
        return {
            title: getIncludedPlanTitle(planName),
            // translator: Status under a subscription title for a Proton Family or Proton Duo member.
            summary: c('collider_2025: Info').t`Part of your family's plan`,
            // translator: The family admin is the person who manages the shared Proton Family or Proton Duo plan.
            description: c('collider_2025: Info').t`To change your plan, please ask your family admin.`,
        };
    }

    const { subscription, tier } = props;
    const storeName = getSubscriptionManagerName(subscription.External);
    const billingCycle = getCycleLabel(subscription.Cycle);
    const { title, features } = getLumoPlanDetails(tier);
    // translator: Subscription metadata. ${billingCycle} is a billing interval such as Monthly. ${storeName} is Apple App Store or Google Play.
    const summary = c('collider_2025: Label').t`${billingCycle} · ${storeName}`;
    // translator: ${storeName} is Apple App Store or Google Play. The user can change or cancel this subscription in that store.
    const description = c('collider_2025: Info').t`Bought on ${storeName}. Manage or cancel it there.`;
    return { title, summary, description, features };
};

const OrganizationActions = ({
    lumo,
    canManageBilling,
    addLumoPath,
    showApiCreditsLink,
    onOpenApi,
}: OrganizationSubscription) => {
    if (!canManageBilling || lumo === 'unassigned') {
        return null;
    }
    const isAdding = lumo === 'unavailable';
    const path = isAdding ? addLumoPath : '/dashboard';
    if (!path) {
        return null;
    }

    // translator: Button that opens checkout to add ${PLAN_NAMES[PLANS.LUMO_BUSINESS]} (the paid plan name, Lumo Professional) to an organization's subscription.
    const addLumoLabel = c('collider_2025: Action').t`Add ${PLAN_NAMES[PLANS.LUMO_BUSINESS]}`;
    // translator: Button that opens Proton Account, where billing admins can manage their organization's subscription.
    const manageSubscriptionLabel = c('collider_2025: Action').t`Manage subscription`;
    return (
        <div className="flex flex-wrap gap-2 mt-2">
            <ButtonLike
                as={SettingsLink}
                path={path}
                target="_blank"
                rel="noopener noreferrer"
                shape="outline"
                className="inline-flex items-center gap-2"
            >
                <LumoIcon name="ExternalLink" size={16} className="shrink-0" aria-hidden="true" />
                {isAdding ? addLumoLabel : manageSubscriptionLabel}
            </ButtonLike>
            {!isAdding && showApiCreditsLink && (
                <ButtonLike
                    as={Link}
                    to="/docs/api#api-usage"
                    // ButtonLike adds role="button" for onClick; Link renders an anchor.
                    // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
                    role="link"
                    shape="outline"
                    onClick={onOpenApi}
                >
                    {
                        // translator: Button that opens the organization's Lumo API usage page. API credits are prepaid units for API usage.
                        c('collider_2025: Action').t`Add API credits`
                    }
                </ButtonLike>
            )}
        </div>
    );
};

export const ExternallyManagedSubscriptionSection = (props: ExternallyManagedSubscriptionSectionProps) => {
    const headingId = useId();
    const subscriptionHeadingId = `${headingId}-subscription`;
    const benefitsHeadingId = `${headingId}-benefits`;
    const { title, summary, description, features } = getSubscriptionDetails(props);

    return (
        <>
            {/* Current plan name and details */}
            <section aria-labelledby={subscriptionHeadingId} className="flex flex-column flex-nowrap shrink-0 gap-2">
                <h3 id={subscriptionHeadingId} className="m-0 lumo-title-small">
                    {
                        // translator: Account Settings heading above the user's subscription details.
                        c('collider_2025: Title').t`Subscription`
                    }
                </h3>
                <Card
                    background={false}
                    padded={false}
                    rounded="xl"
                    className="flex flex-column flex-nowrap gap-1.5 p-5 text-break"
                >
                    <p className="m-0 lumo-title-large">{title}</p>
                    <p className="m-0 lumo-body-medium">{summary}</p>
                    {description && <p className="m-0 lumo-body-medium lumo-color-glyph-mid">{description}</p>}
                    {props.managedBy === 'organization' && <OrganizationActions {...props} />}
                </Card>
            </section>

            {/* Current plan features */}
            {features?.length ? (
                <section
                    aria-labelledby={benefitsHeadingId}
                    className="flex flex-column flex-nowrap shrink-0 gap-2 mt-4"
                >
                    <h3 id={benefitsHeadingId} className="m-0 lumo-title-small">
                        {
                            // translator: Account Settings heading above the features included in the current Lumo subscription.
                            c('collider_2025: Title').t`Included in your plan`
                        }
                    </h3>
                    <Card background={false} padded={false} rounded="xl" className="p-5">
                        {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- Safari drops list semantics when list markers are hidden. */}
                        <ul role="list" className="unstyled flex flex-column gap-3 m-0 text-break">
                            {features.map(({ id, text }) => (
                                <li key={id} className="flex flex-nowrap items-start gap-2.5">
                                    <Dot size={16} strokeWidth={6} className="shrink-0 mt-0.5" aria-hidden="true" />
                                    <span>{text}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </section>
            ) : null}

            {props.managedBy === 'native' && <MobileManageSubscriptionButton platform={props.subscription.External} />}
        </>
    );
};
