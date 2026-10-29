import { c } from 'ttag';

import { Banner } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import {
    getReactivateSubscriptionAction,
    getSubscriptionExpiresDaysLeft,
    getSubscriptionExpiresText,
} from '@proton/components/containers/payments/subscription/helpers/subscriptionExpires';
import { getEntitlementsPerSubscription } from '@proton/payments/core/entitlements/entitlement-grants';
import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import { hasGrantedEntitlement } from '@proton/payments/core/entitlements/helpers';
import { getSoonestEndingSubscription, subscriptionExpires } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { SECOND } from '@proton/shared/lib/constants';
import isBetween from '@proton/utils/isBetween';

import { useAllSubscriptions } from '../../../allSubscriptions/hooks';
import { useEntitlementCatalog } from '../../../entitlementCatalog/hooks';
import { usePreviousSubscription } from '../../../previousSubscription/hooks';
import { useOutgoingController } from '../../shared/OutgoingDelegatedAccessProvider';

const subscriptionDaysLeftBeforeWarning = 7;

const OutgoingSubscriptionExpiredBanner = () => {
    const {
        notify,
        outgoingDelegatedAccess: {
            emergencyContacts: { hasUpsell },
        },
    } = useOutgoingController();
    const [{ hasHadSubscription, previousSubscription }] = usePreviousSubscription();
    if (!hasHadSubscription) {
        return null;
    }

    const showSubscriptionExpired =
        /* Checking hasUpsell true for the case when a user downgrades their subscription but they still have emergency
        access through pass lifetime */
        hasUpsell && isBetween(previousSubscription.cancelTime * SECOND, 1, Date.now());

    if (!showSubscriptionExpired) {
        return null;
    }

    return (
        <div className="mb-6">
            <Banner
                variant="danger"
                action={
                    <Button
                        onClick={() => {
                            notify({ type: 'upsell' });
                        }}
                    >{c('emergency_access').t`Upgrade`}</Button>
                }
            >
                <span className="color-danger text-bold">{c('emergency_access').t`Subscription expired`}.</span>{' '}
                {c('emergency_access').t`Renew to get emergency access again.`}
            </Banner>
        </div>
    );
};

const useSubscriptionEndingEmergencyAccess = (): Subscription | undefined => {
    const [subscriptions = []] = useAllSubscriptions();
    const [entitlementCatalog] = useEntitlementCatalog();

    const grantingSubscriptions = subscriptions.filter((subscription) =>
        hasGrantedEntitlement(
            getEntitlementsPerSubscription(entitlementCatalog, subscription),
            EntitlementName.MaxEmergencyAccessContacts
        )
    );

    const isEnding = (subscription: Subscription) => subscriptionExpires(subscription).subscriptionExpiresSoon;

    if (!grantingSubscriptions.every(isEnding)) {
        return undefined;
    }

    return getSoonestEndingSubscription(grantingSubscriptions, isEnding);
};

const OutgoingSubscriptionExpiresBanner = () => {
    const subscription = useSubscriptionEndingEmergencyAccess();

    if (!subscription) {
        return null;
    }

    const { subscriptionExpiresSoon, planName, expirationDate } = subscriptionExpires(subscription);
    if (!subscriptionExpiresSoon) {
        return null;
    }

    const subscriptionDaysLeft = getSubscriptionExpiresDaysLeft(expirationDate, new Date());
    const subscriptionExpiresText = getSubscriptionExpiresText(planName, subscriptionDaysLeft);

    if (!isBetween(subscriptionDaysLeft, 0, subscriptionDaysLeftBeforeWarning)) {
        return null;
    }

    const reactivateSubscriptionAction = getReactivateSubscriptionAction(subscription);

    return (
        <div className="mb-6">
            <Banner
                variant="danger-outline"
                action={
                    reactivateSubscriptionAction.type === 'external' ? (
                        <ButtonLike as={Href} href={reactivateSubscriptionAction.href} target="_blank">
                            {c('emergency_access').t`Enable auto-renew`}
                        </ButtonLike>
                    ) : (
                        <ButtonLike as={SettingsLink} path={reactivateSubscriptionAction.path}>
                            {c('emergency_access').t`Enable auto-renew`}
                        </ButtonLike>
                    )
                }
            >
                <span className="color-danger text-bold">{subscriptionExpiresText}</span>{' '}
                {c('emergency_access').t`Don't lose emergency access. Enable auto-renew today.`}
            </Banner>
        </div>
    );
};

const OutgoingEmergencyContactBanners = () => {
    const {
        outgoingDelegatedAccess: {
            emergencyContacts: { items },
        },
    } = useOutgoingController();

    const hasOutgoingEmergencyContacts = items.length > 0;
    if (!hasOutgoingEmergencyContacts) {
        return;
    }

    return (
        <>
            <OutgoingSubscriptionExpiresBanner />
            <OutgoingSubscriptionExpiredBanner />
        </>
    );
};

export default OutgoingEmergencyContactBanners;
