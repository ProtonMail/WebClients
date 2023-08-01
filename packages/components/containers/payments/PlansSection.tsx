import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useLoading } from '@proton/hooks';
import { checkSubscription } from '@proton/shared/lib/api/payments';
import { APPS, APP_NAMES, DEFAULT_CYCLE, PLANS } from '@proton/shared/lib/constants';
import { toMap } from '@proton/shared/lib/helpers/object';
import { hasPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { getIsB2BPlan, getPlanIDs } from '@proton/shared/lib/helpers/subscription';
import {
    Audience,
    Currency,
    PlanIDs,
    PlansMap,
    Subscription,
    SubscriptionCheckResponse,
} from '@proton/shared/lib/interfaces';

import { Icon, Loader } from '../../components';
import {
    useApi,
    useFeature,
    useLoad,
    useOrganization,
    usePlans,
    useSubscription,
    useUser,
    useVPNServersCount,
} from '../../hooks';
import MozillaInfoPanel from '../account/MozillaInfoPanel';
import { FeatureCode } from '../index';
import PlanSelection from './subscription/PlanSelection';
import { useSubscriptionModal } from './subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from './subscription/constants';
import { getCurrency, getDefaultSelectedProductPlans } from './subscription/helpers';

const FREE_SUBSCRIPTION = {} as Subscription;

const getSearchParams = (search: string) => {
    const params = new URLSearchParams(search);
    return {
        audience: params.has('business') ? Audience.B2B : undefined,
    };
};

const PlansSection = ({ app }: { app: APP_NAMES }) => {
    const [loading, withLoading] = useLoading();
    const [subscription = FREE_SUBSCRIPTION, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();
    const [plans = [], loadingPlans] = usePlans();
    const plansMap = toMap(plans, 'Name') as PlansMap;
    const [vpnServers] = useVPNServersCount();
    const [user] = useUser();
    const api = useApi();
    const location = useLocation();
    const currentPlanIDs = getPlanIDs(subscription);
    const searchParams = getSearchParams(location.search);
    const [audience, setAudience] = useState(searchParams.audience || Audience.B2C);
    const [selectedProductPlans, setSelectedProductPlans] = useState(() => {
        return getDefaultSelectedProductPlans(app, getPlanIDs(subscription));
    });
    const calendarSharingEnabled = !!useFeature(FeatureCode.CalendarSharingEnabled).feature?.Value;
    const [open] = useSubscriptionModal();
    const isLoading = Boolean(loadingPlans || loadingSubscription || loadingOrganization);
    const [selectedCurrency, setCurrency] = useState<Currency>();
    const currency = selectedCurrency || getCurrency(user, subscription, plans);

    const [cycle, setCycle] = useState(DEFAULT_CYCLE);
    const { CouponCode } = subscription;

    useLoad();

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

        const step =
            newPlanIDs[PLANS.VPN_BUSINESS] || newPlanIDs[PLANS.VPN_PRO]
                ? SUBSCRIPTION_STEPS.CHECKOUT_WITH_CUSTOMIZATION
                : SUBSCRIPTION_STEPS.CUSTOMIZATION;

        open({
            defaultSelectedProductPlans: selectedProductPlans,
            planIDs: newPlanIDs,
            coupon: Coupon?.Code,
            step,
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
        setSelectedProductPlans(getDefaultSelectedProductPlans(app, getPlanIDs(subscription)));
    }, [isLoading, subscription, app]);

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
                filter={app === APPS.PROTONPASS ? [Audience.B2C] : undefined}
                mode="settings"
                audience={audience}
                onChangeAudience={setAudience}
                loading={loading}
                plans={plans}
                plansMap={plansMap}
                vpnServers={vpnServers}
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
                calendarSharingEnabled={calendarSharingEnabled}
            />
            <Button
                color="norm"
                shape="ghost"
                className="flex mx-auto flex-align-items-center mb-4"
                onClick={() => {
                    open({
                        step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
                        defaultAudience: audience,
                        defaultSelectedProductPlans: selectedProductPlans,
                    });
                }}
            >
                {c('Action').t`View plans details`}
                <Icon name="arrow-right" className="ml-2 on-rtl-mirror" />
            </Button>
        </>
    );
};

export default PlansSection;
