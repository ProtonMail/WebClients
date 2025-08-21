import { c } from 'ttag';

import { usePreviousSubscription } from '@proton/account/previousSubscription/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { Banner, Button, ButtonLike, Href } from '@proton/atoms';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import { subscriptionExpires } from '@proton/components/containers/payments/subscription/helpers';
import {
    getReactivateSubscriptionAction,
    getSubscriptionExpiresDaysLeft,
    getSubscriptionExpiresText,
} from '@proton/components/containers/payments/subscription/helpers/subscriptionExpires';
import { SECOND } from '@proton/shared/lib/constants';
import isBetween from '@proton/utils/isBetween';

import { useOutgoingController } from './OutgoingController';

const subscriptionDaysLeftBeforeWarning = 7;

const OutgoingSubscriptionExpiredBanner = () => {
    const { notify } = useOutgoingController();
    const [previousSubscription] = usePreviousSubscription();
    if (!previousSubscription) {
        return null;
    }

    const showSubscriptionExpired =
        previousSubscription &&
        previousSubscription.hasHadSubscription &&
        isBetween(previousSubscription.previousSubscriptionEndTime * SECOND, 1, Date.now());

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

const OutgoingSubscriptionExpiresBanner = () => {
    const [subscription] = useSubscription();
    const { subscriptionExpiresSoon, planName, expirationDate } = subscriptionExpires(subscription);
    if (!subscriptionExpiresSoon || !subscription) {
        return null;
    }

    const subscriptionDaysLeft = getSubscriptionExpiresDaysLeft(expirationDate, new Date());
    const subscriptionExpiresText = getSubscriptionExpiresText(planName, subscriptionDaysLeft);

    const showSubscriptionExpiring =
        subscription &&
        isBetween(subscriptionDaysLeft, 0, subscriptionDaysLeftBeforeWarning) &&
        subscriptionExpiresSoon;

    if (!showSubscriptionExpiring) {
        return;
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

const OutgoingEmergencyAccessBanners = () => {
    const { items } = useOutgoingController();

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

export default OutgoingEmergencyAccessBanners;
