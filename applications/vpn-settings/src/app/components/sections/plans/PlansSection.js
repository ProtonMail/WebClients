import React, { useState, useEffect } from 'react';
import {
    Button,
    SubTitle,
    useApi,
    usePlans,
    Paragraph,
    Alert,
    Loader,
    useSubscription,
    ConfirmModal,
    useModals,
    SubscriptionModal,
    useLoading,
    useEventManager,
    useNotifications,
    useUser,
    useToggle
} from 'react-components';
import { c } from 'ttag';
import { DEFAULT_CURRENCY, DEFAULT_CYCLE } from 'proton-shared/lib/constants';
import { checkSubscription, deleteSubscription } from 'proton-shared/lib/api/payments';
import { mergePlansMap } from 'react-components/containers/payments/subscription/helpers';

import PlansTable from './PlansTable';

const PlansSection = () => {
    const api = useApi();
    const [{ isFree, isPaid }] = useUser();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const [loading, withLoading] = useLoading();
    const [currency, updateCurrency] = useState(DEFAULT_CURRENCY);
    const [cycle, updateCycle] = useState(DEFAULT_CYCLE);
    const { state: showPlans, toggle: togglePlans } = useToggle(isFree);
    const [plans, loadingPlans] = usePlans();
    const [subscription, loadingSubscription] = useSubscription();
    const { CouponCode } = subscription || {};

    const unsubscribe = async () => {
        if (isFree) {
            return createNotification({ type: 'error', text: c('Info').t`You already have a free account` });
        }
        await new Promise((resolve, reject) => {
            createModal(
                <ConfirmModal
                    title={c('Title').t`Confirm downgrade`}
                    onConfirm={resolve}
                    onClose={reject}
                    confirm={c('Action').t`Downgrade`}
                >
                    <Paragraph>{c('Info')
                        .t`This will downgrade your account to a free account. ProtonMail is free software that is supported by donations and paid accounts. Please consider making a donation so we can continue to offer the service for free.`}</Paragraph>
                    <Alert>{c('Info')
                        .t`Additional addresses, custom domains, and users must be removed/disabled before performing this action.`}</Alert>
                </ConfirmModal>
            );
        });
        await api(deleteSubscription());
        await call();
        createNotification({ text: c('Success').t`You have successfully unsubscribed` });
    };

    const handleSelectPlan = async (planName) => {
        if (!planName) {
            return unsubscribe();
        }

        const plansMap = mergePlansMap({ [planName]: 1 }, subscription);
        const couponCode = CouponCode ? CouponCode : undefined; // From current subscription; CouponCode can be null
        const PlanIDs = Object.entries(plansMap).reduce((acc, [planName, quantity]) => {
            if (quantity) {
                const { ID } = plans.find((plan) => plan.Name === planName);
                acc[ID] = quantity;
            }
            return acc;
        }, Object.create(null));

        const { Coupon } = await api(
            checkSubscription({
                PlanIDs,
                CouponCode: couponCode,
                Currency: currency,
                Cycle: cycle
            })
        );

        const coupon = Coupon ? Coupon.Code : undefined; // Coupon can equals null

        createModal(<SubscriptionModal cycle={cycle} currency={currency} coupon={coupon} plansMap={plansMap} />);
    };

    useEffect(() => {
        if (isFree) {
            const [{ Currency } = {}] = plans || [];
            updateCurrency(Currency);
        }
    }, [plans]);

    useEffect(() => {
        if (isPaid) {
            const { Currency, Cycle } = subscription || {};
            updateCurrency(Currency);
            updateCycle(Cycle);
        }
    }, [subscription]);

    if (loadingPlans || loadingSubscription) {
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
            <Button onClick={togglePlans}>{showPlans ? c('Action').t`Hide plans` : c('Action').t`Show plans`}</Button>
            {showPlans ? (
                <PlansTable
                    onSelect={(planName) => () => withLoading(handleSelectPlan(planName))}
                    loading={loading}
                    currency={currency}
                    cycle={cycle}
                    updateCurrency={updateCurrency}
                    updateCycle={updateCycle}
                    plans={plans}
                    subscription={subscription}
                />
            ) : null}
        </>
    );
};

export default PlansSection;
