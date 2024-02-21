import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { useLoading } from '@proton/hooks';
import { APPS, APP_NAMES, DEFAULT_CYCLE, FREE_SUBSCRIPTION, PLANS } from '@proton/shared/lib/constants';
import { toMap } from '@proton/shared/lib/helpers/object';
import { hasPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import {
    getIsB2BAudienceFromPlan,
    getPlanIDs,
    getValidAudience,
    getValidCycle,
} from '@proton/shared/lib/helpers/subscription';
import { Audience, Currency, PlanIDs, PlansMap } from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';

import { Icon, Loader } from '../../components';
import { useApi, useLoad, useOrganization, usePlans, useSubscription, useUser, useVPNServersCount } from '../../hooks';
import MozillaInfoPanel from '../account/MozillaInfoPanel';
import PlanSelection from './subscription/PlanSelection';
import { useSubscriptionModal } from './subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from './subscription/constants';
import { getCurrency, getDefaultSelectedProductPlans } from './subscription/helpers';

const getSearchParams = (search: string) => {
    const params = new URLSearchParams(search);
    const maybeCycle = Number(params.get('cycle'));
    const cycle = getValidCycle(maybeCycle);
    const maybeAudience = params.get('audience');
    const audience = getValidAudience(maybeAudience);
    return {
        audience,
        plan: params.get('plan') || undefined,
        cycle,
    };
};

const PlansSection = ({ app }: { app: APP_NAMES }) => {
    const [loading, withLoading] = useLoading();
    const [subscription = FREE_SUBSCRIPTION, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();
    const [plansResult, loadingPlans] = usePlans();
    const plans = plansResult?.plans || [];
    const freePlan = plansResult?.freePlan || FREE_PLAN;
    const plansMap = toMap(plans, 'Name') as PlansMap;
    const [vpnServers] = useVPNServersCount();
    const [user] = useUser();
    const api = useApi();
    const { paymentsApi } = usePaymentsApi(api);
    const location = useLocation();
    const currentPlanIDs = getPlanIDs(subscription);
    const searchParams = getSearchParams(location.search);
    const [audience, setAudience] = useState(searchParams.audience || Audience.B2C);
    const [selectedProductPlans, setSelectedProductPlans] = useState(() => {
        return getDefaultSelectedProductPlans({
            appName: app,
            plan: searchParams.plan,
            planIDs: getPlanIDs(subscription),
            plansMap,
        });
    });
    const [open] = useSubscriptionModal();
    const isLoading = Boolean(loadingPlans || loadingSubscription || loadingOrganization);
    const [selectedCurrency, setCurrency] = useState<Currency>();
    const currency = selectedCurrency || getCurrency(user, subscription, plans);

    const [cycle, setCycle] = useState(searchParams.cycle ?? DEFAULT_CYCLE);
    const { CouponCode } = subscription;

    useLoad();

    const handleModal = async (newPlanIDs: PlanIDs) => {
        if (!hasPlanIDs(newPlanIDs)) {
            throw new Error('Downgrade not supported');
        }

        const couponCode = CouponCode || undefined; // From current subscription; CouponCode can be null
        const { Coupon } = await paymentsApi.checkWithAutomaticVersion({
            Plans: newPlanIDs,
            Currency: currency,
            Cycle: cycle,
            CouponCode: couponCode,
        });

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
            defaultAudience: Object.keys(newPlanIDs).some((planID) => getIsB2BAudienceFromPlan(planID as any))
                ? Audience.B2B
                : Audience.B2C,
            metrics: {
                source: 'plans',
            },
        });
    };

    useEffect(() => {
        if (isLoading) {
            return;
        }
        setCycle(subscription.Cycle || DEFAULT_CYCLE);
        setSelectedProductPlans(
            getDefaultSelectedProductPlans({
                appName: app,
                planIDs: getPlanIDs(subscription),
                plan: searchParams.plan,
                plansMap,
            })
        );
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
                app={app}
                filter={app === APPS.PROTONPASS ? [Audience.B2C] : undefined}
                mode="settings"
                audience={audience}
                onChangeAudience={setAudience}
                loading={loading}
                freePlan={freePlan}
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
            />
            <Button
                color="norm"
                shape="ghost"
                className="flex mx-auto items-center mb-4"
                onClick={() => {
                    open({
                        step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
                        defaultAudience: audience,
                        defaultSelectedProductPlans: selectedProductPlans,
                        metrics: {
                            source: 'plans',
                        },
                    });
                }}
            >
                {c('Action').t`View plans details`}
                <Icon name="arrow-right" className="ml-2 rtl:mirror" />
            </Button>
        </>
    );
};

export default PlansSection;
