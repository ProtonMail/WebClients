import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import {
    SubTitle,
    Alert,
    DowngradeModal,
    MozillaInfoPanel,
    useSubscription,
    Loader,
    usePlans,
    useApi,
    useUser,
    useModals,
    useEventManager,
    useNotifications
} from 'react-components';

import { checkSubscription, deleteSubscription } from 'proton-shared/lib/api/payments';
import { DEFAULT_CURRENCY, DEFAULT_CYCLE } from 'proton-shared/lib/constants';
import { getPlans, isBundleEligible } from 'proton-shared/lib/helpers/subscription';

import SubscriptionModal from './subscription/SubscriptionModal';
import { mergePlansMap, getCheckParams } from './subscription/helpers';
import PlansTable from './PlansTable';

const PlansSection = () => {
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const [user] = useUser();
    const { isFree } = user;
    const [subscription = {}, loadingSubscription] = useSubscription();
    const [plans = [], loadingPlans] = usePlans();
    const api = useApi();

    const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
    const [cycle, setCycle] = useState(DEFAULT_CYCLE);
    const bundleEligible = isBundleEligible(subscription);
    const { CouponCode, Plans = [] } = subscription;
    const names = getPlans(subscription)
        .map(({ Title }) => Title)
        .join(c('Separator, spacing is important').t` and `);

    const handleUnsubscribe = async () => {
        await api(deleteSubscription());
        await call();
        createNotification({ text: c('Success').t`You have successfully unsubscribed` });
    };

    const handleOpenModal = () => {
        if (isFree) {
            return createNotification({ type: 'error', text: c('Info').t`You already have a free account` });
        }
        createModal(<DowngradeModal onConfirm={handleUnsubscribe} />);
    };

    const handleModal = (newPlansMap, step) => async () => {
        if (!newPlansMap) {
            handleOpenModal();
            return;
        }

        const plansMap = mergePlansMap(newPlansMap, subscription);
        const couponCode = CouponCode ? CouponCode : undefined; // From current subscription; CouponCode can be null
        const { Coupon } = await api(
            checkSubscription(getCheckParams({ plans, plansMap, currency, cycle, coupon: couponCode }))
        );
        const coupon = Coupon ? Coupon.Code : undefined; // Coupon can equals null

        createModal(
            <SubscriptionModal
                subscription={subscription}
                plansMap={plansMap}
                coupon={coupon}
                currency={currency}
                cycle={cycle}
                step={step}
            />
        );
    };

    useEffect(() => {
        if (loadingPlans || loadingSubscription) {
            return;
        }
        const [{ Currency, Cycle } = {}] = plans;
        setCurrency(subscription.Currency || Currency);
        setCycle(subscription.Cycle || Cycle);
    }, [loadingSubscription, loadingPlans]);

    if (subscription.isManagedByMozilla) {
        return (
            <>
                <SubTitle>{c('Title').t`Plans`}</SubTitle>
                <MozillaInfoPanel />
            </>
        );
    }

    if (loadingSubscription || loadingPlans) {
        return (
            <>
                <SubTitle>{c('Title').t`Plans`}</SubTitle>
                <Loader />
            </>
        );
    }

    return (
        <>
            <SubTitle>{c('Title').t`Plans`}</SubTitle>
            <Alert learnMore="https://protonmail.com/support/knowledge-base/paid-plans/">
                {bundleEligible ? (
                    <div>{c('Info')
                        .t`Get 20% bundle discount when you purchase ProtonMail and ProtonVPN together.`}</div>
                ) : null}
                {Plans.length ? <div>{c('Info').t`You are currently subscribed to ${names}.`}</div> : null}
            </Alert>
            <PlansTable
                currency={currency}
                cycle={cycle}
                updateCurrency={setCurrency}
                updateCycle={setCycle}
                onSelect={handleModal}
                user={user}
                subscription={subscription}
                plans={plans}
            />
            <p className="small">* {c('Info concerning plan features').t`denotes customizable features`}</p>
        </>
    );
};

export default PlansSection;
