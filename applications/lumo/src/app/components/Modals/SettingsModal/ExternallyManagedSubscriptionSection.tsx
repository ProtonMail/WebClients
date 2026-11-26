import { useId } from 'react';

import { Dot } from 'lucide-react';
import { c } from 'ttag';

import { Card } from '@proton/atoms/Card/Card';
import { getBillingCycleText } from '@proton/components/containers/payments/subscription/YourPlanSectionV2/helpers';
import { CYCLE } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import type { LumoTierPlan } from '@proton/payments/core/subscription/lumo-purchase-rules';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { SubscriptionPlatform } from '@proton/shared/lib/payments/subscription/constants';

import { getLumoPlanDetails } from '../../../features/plan/components/utils';
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
          /** A Lumo seat managed by a business or other organization. */
          managedBy: 'organization';
          /** The business subscription's name when a single source can be identified. */
          planName?: string;
      }
    | {
          /** A Lumo seat managed by a Family or Duo admin. */
          managedBy: 'family';
          /** The name of the Proton Family or Duo plan. */
          planName: string;
      };

const getSubscriptionDetails = (props: ExternallyManagedSubscriptionSectionProps) => {
    if (props.managedBy !== 'native') {
        const { planName, managedBy } = props;
        // translator: Subscription card title. ${LUMO_SHORT_APP_NAME} is the product name. When shown, ${planName} is the Proton plan that provides the user's Lumo seat.
        const title = planName
            ? c('collider_2025: Title').t`${LUMO_SHORT_APP_NAME}, included in ${planName}`
            : c('collider_2025: Title').t`${LUMO_SHORT_APP_NAME}, included in your business plan`;
        if (managedBy === 'family') {
            return {
                title,
                // translator: Status under a subscription title for a Proton Family or Proton Duo member.
                summary: c('collider_2025: Info').t`Part of your family's plan`,
                // translator: The family admin is the person who manages the shared Proton Family or Proton Duo plan.
                description: c('collider_2025: Info').t`To change your plan, please ask your family admin.`,
            };
        }
        return {
            title,
            // translator: Status for a Lumo seat provided and managed by a business or other organization.
            summary: c('collider_2025: Info').t`Managed by your organization`,
            // translator: The organization admin manages the user's Lumo seat on the organization's subscription.
            description: c('collider_2025: Info').t`To change your plan, contact your organization's admin.`,
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

export const ExternallyManagedSubscriptionSection = (props: ExternallyManagedSubscriptionSectionProps) => {
    const headingId = useId();
    const subscriptionHeadingId = `${headingId}-subscription`;
    const benefitsHeadingId = `${headingId}-benefits`;
    const { title, summary, description, features } = getSubscriptionDetails(props);

    return (
        <>
            {/* Current plan name and details */}
            <section aria-labelledby={subscriptionHeadingId} className="flex flex-column gap-2">
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
                    className="flex flex-column gap-1.5 p-5 text-break"
                >
                    <p className="m-0 lumo-title-large lumo-color-glyph-brand-text">{title}</p>
                    <p className="m-0">{summary}</p>
                    <p className="m-0 lumo-body-small lumo-color-glyph-mid">{description}</p>
                </Card>
            </section>

            {/* Current plan features */}
            {features?.length ? (
                <section aria-labelledby={benefitsHeadingId} className="flex flex-column gap-2">
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
