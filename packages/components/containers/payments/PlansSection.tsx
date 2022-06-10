import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { c } from 'ttag';

import { checkSubscription } from '@proton/shared/lib/api/payments';
import { DEFAULT_CYCLE } from '@proton/shared/lib/constants';
import { getIsB2BPlan, getPlanIDs } from '@proton/shared/lib/helpers/subscription';
import { Audience, Currency, PlanIDs, Subscription, SubscriptionCheckResponse } from '@proton/shared/lib/interfaces';
import { hasPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';

import { Button, Icon, Loader } from '../../components';
import { useApi, useConfig, useLoading, useOrganization, usePlans, useSubscription, useUser } from '../../hooks';

import { getDefaultSelectedProductPlans } from './subscription/SubscriptionModal';
import MozillaInfoPanel from '../account/MozillaInfoPanel';
import { SUBSCRIPTION_STEPS } from './subscription/constants';
import PlanSelection from './subscription/PlanSelection';
import { useSubscriptionModal } from './subscription/SubscriptionModalProvider';
import { getCurrency } from './subscription/helpers';

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
    const [organization, loadingOrganization] = useOrganization();
    const [plans = [], loadingPlans] = usePlans();
    const [user] = useUser();
    const { APP_NAME } = useConfig();
    const api = useApi();
    const location = useLocation();
    const appFromPathname = getAppFromPathnameSafe(location.pathname);
    const currentPlanIDs = getPlanIDs(subscription);
    const searchParams = getSearchParams(location.search);
    const [audience, setAudience] = useState(searchParams.audience || Audience.B2C);
    const settingsApp = appFromPathname || APP_NAME;
    const [selectedProductPlans, setSelectedProductPlans] = useState(() => {
        return getDefaultSelectedProductPlans(settingsApp, getPlanIDs(subscription));
    });
    const [open] = useSubscriptionModal();
    const isLoading = Boolean(loadingPlans || loadingSubscription || loadingOrganization);
    const [selectedCurrency, setCurrency] = useState<Currency>();
    const currency = selectedCurrency || getCurrency(user, subscription, plans);

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

        open({
            planIDs: newPlanIDs,
            coupon: Coupon?.Code,
            step: SUBSCRIPTION_STEPS.CUSTOMIZATION,
            cycle,
            currency,
            defaultAudience: Object.keys(newPlanIDs).some((planID) => getIsB2BPlan(planID as any))
                ? Audience.B2B
                : Audience.B2C,
        });
    };

    useEffect(() => {
        if (isLoading) {
            return;
        }
        setCycle(subscription.Cycle || DEFAULT_CYCLE);
        setSelectedProductPlans(getDefaultSelectedProductPlans(settingsApp, getPlanIDs(subscription)));
    }, [isLoading, subscription, settingsApp]);

    // @ts-ignore
    if (subscription.isManagedByMozilla) {
        return <MozillaInfoPanel />;
    }

    if (isLoading) {
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
                onChangeCycle={setCycle}
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
                organization={organization}
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
