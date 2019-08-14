import React, { useState, useEffect } from 'react';
import {
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
    useUser
} from 'react-components';
import { c } from 'ttag';
import { APPS } from 'proton-shared/lib/constants';
import { checkSubscription, deleteSubscription } from 'proton-shared/lib/api/payments';
import { mergePlansMap } from 'react-components/containers/payments/subscription/helpers';

import PlansTable from './PlansTable';

const { PROTONVPN_SETTINGS } = APPS;

const PlansSection = () => {
    const api = useApi();
    const [{ isFree }] = useUser();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const [loading, withLoading] = useLoading();
    const [currency, updateCurrency] = useState();
    const [cycle, updateCycle] = useState();
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
        console.log(plansMap);
        debugger;
        const couponCode = CouponCode ? CouponCode : undefined; // From current subscription; CouponCode can be null
        const PlanIDs = Object.entries(plansMap).reduce((acc, [planName, quantity]) => {
            if (quantity) {
                const { ID } = plans.find((plan) => plan.Name === planName);
                acc[ID] = quantity;
            }
            return acc;
        }, Object.create(null));

        const { Coupon: coupon } = await api(
            checkSubscription({
                PlanIDs,
                CouponCode: couponCode,
                Currency: currency,
                Cycle: cycle
            })
        );

        createModal(
            <SubscriptionModal
                currentApp={PROTONVPN_SETTINGS}
                cycle={cycle}
                currency={currency}
                coupon={coupon}
                plansMap={plansMap}
            />
        );
    };

    useEffect(() => {
        if (subscription) {
            updateCurrency(subscription.Currency);
            updateCycle(subscription.Cycle);
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
        </>
    );
};

export default PlansSection;
