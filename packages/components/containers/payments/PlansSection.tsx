import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { c } from 'ttag';

import { checkSubscription } from '@proton/shared/lib/api/payments';
import { DEFAULT_CURRENCY, DEFAULT_CYCLE } from '@proton/shared/lib/constants';
import { getPlanIDs } from '@proton/shared/lib/helpers/subscription';
import { Audience, Currency, PlanIDs, Subscription, SubscriptionCheckResponse } from '@proton/shared/lib/interfaces';
import { hasPlanIDs } from '@proton/shared/lib/helpers/planIDs';

import { Button, Icon, Loader } from '../../components';
import { useApi, useConfig, useLoading, usePlans, useSubscription } from '../../hooks';

import { getDefaultSelectedProductPlans } from './subscription/SubscriptionModal';
import MozillaInfoPanel from '../account/MozillaInfoPanel';
import { SUBSCRIPTION_STEPS } from './subscription/constants';
import PlanSelection from './subscription/PlanSelection';
import { useSubscriptionModal } from './subscription/SubscriptionModalProvider';

const FREE_SUBSCRIPTION = {} as Subscription;

const getSearchParams = (search: string) => {
    const params = new URLSearchParams(search);
    return {
        audience: params.has('business') ? Audience.B2B : undefined,
    };
};

const PlansSection = () => {
    const [loading, withLoading] = useLoading();
    const [subscription = FREE_SUBSCRIPTION, loadingSubscription] = useSubscription();
    const [plans = [], loadingPlans] = usePlans();
    const { APP_NAME } = useConfig();
    const api = useApi();
    const location = useLocation();
    const currentPlanIDs = getPlanIDs(subscription);
    const searchParams = getSearchParams(location.search);
    const [audience, setAudience] = useState(searchParams.audience || Audience.B2C);
    const [selectedProductPlans, setSelectedProductPlans] = useState(() => {
        return getDefaultSelectedProductPlans(APP_NAME, getPlanIDs(subscription));
    });
    const [open] = useSubscriptionModal();

    const [currency, setCurrency] = useState<Currency>(DEFAULT_CURRENCY);
    const [cycle, setCycle] = useState(DEFAULT_CYCLE);
    const { CouponCode } = subscription;

    const handleModal = async (newPlanIDs: PlanIDs) => {
        if (!hasPlanIDs(newPlanIDs)) {
            throw new Error('Downgrade not supported');
        }

        const couponCode = CouponCode || undefined; // From current subscription; CouponCode can be null
        const { Coupon } = await api<SubscriptionCheckResponse>(
            checkSubscription({
                Plans: newPlanIDs,
                Currency: currency,
                Cycle: cycle,
                CouponCode: couponCode,
            })
        );

        const coupon = Coupon ? Coupon.Code : undefined; // Coupon can equals null
        open({ planIDs: newPlanIDs, coupon, step: SUBSCRIPTION_STEPS.CUSTOMIZATION, cycle, currency });
    };

    useEffect(() => {
        if (loadingPlans || loadingSubscription) {
            return;
        }
        const [{ Currency } = { Currency: undefined }] = plans;
        setCurrency(subscription.Currency || Currency);
        setCycle(subscription.Cycle || DEFAULT_CYCLE);
        setSelectedProductPlans(getDefaultSelectedProductPlans(APP_NAME, getPlanIDs(subscription)));
    }, [loadingSubscription, loadingPlans]);

    // @ts-ignore
    if (subscription.isManagedByMozilla) {
        return <MozillaInfoPanel />;
    }

    if (loadingSubscription || loadingPlans) {
        return <Loader />;
    }

    return (
        <>
            <PlanSelection
                mode="settings"
                audience={audience}
                onChangeAudience={setAudience}
                loading={loading}
                plans={plans}
                currency={currency}
                cycle={cycle}
                planIDs={currentPlanIDs}
                hasFreePlan={false}
                hasPlanSelectionComparison={false}
                subscription={subscription}
                onChangePlanIDs={(planIDs) => {
                    void withLoading(handleModal(planIDs));
                }}
                onChangeCurrency={setCurrency}
                selectedProductPlans={selectedProductPlans}
                onChangeSelectedProductPlans={setSelectedProductPlans}
            />
            <Button
                color="norm"
                shape="ghost"
                className="flex center flex-align-items-center mb1"
                onClick={() => {
                    open({ step: SUBSCRIPTION_STEPS.PLAN_SELECTION, defaultAudience: audience });
                }}
            >
                {c('Action').t`View plans details`}
                <Icon name="arrow-right" className="ml0-5 on-rtl-mirror" />
            </Button>
        </>
    );
};

export default PlansSection;
