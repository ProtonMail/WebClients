import { useState, useEffect } from 'react';
import { c } from 'ttag';

import { checkSubscription } from '@proton/shared/lib/api/payments';
import { DEFAULT_CURRENCY, DEFAULT_CYCLE, PLAN_SERVICES, APPS } from '@proton/shared/lib/constants';
import { getPlanIDs } from '@proton/shared/lib/helpers/subscription';
import {
    Currency,
    Organization,
    PlanIDs,
    Subscription,
    SubscriptionCheckResponse,
} from '@proton/shared/lib/interfaces';
import { hasPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';

import { Button, Loader } from '../../components';
import {
    useSubscription,
    useOrganization,
    usePlans,
    useApi,
    useModals,
    useConfig,
    useLoading,
    useVPNCountriesCount,
} from '../../hooks';

import SubscriptionModal from './subscription/SubscriptionModal';
import MozillaInfoPanel from '../account/MozillaInfoPanel';
import { SUBSCRIPTION_STEPS } from './subscription/constants';
import PlanSelection from './subscription/PlanSelection';

const FREE_SUBSCRIPTION = {} as Subscription;
const FREE_ORGANIZATION = {} as Organization;

const PlansSection = () => {
    const { APP_NAME } = useConfig();
    const { createModal } = useModals();
    const [loading, withLoading] = useLoading();
    const [vpnCountries] = useVPNCountriesCount();
    const [subscription = FREE_SUBSCRIPTION, loadingSubscription] = useSubscription();
    const [organization = FREE_ORGANIZATION, loadingOrganization] = useOrganization();
    const [plans = [], loadingPlans] = usePlans();
    const api = useApi();
    const app = getAppFromPathnameSafe(window.location.pathname);
    const isVPN = APP_NAME === APPS.PROTONVPN_SETTINGS || app === APPS.PROTONVPN_SETTINGS;

    const service = isVPN ? PLAN_SERVICES.VPN : PLAN_SERVICES.MAIL;
    const currentPlanIDs = getPlanIDs(subscription);

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
                PlanIDs: newPlanIDs,
                Currency: currency,
                Cycle: cycle,
                CouponCode: couponCode,
            })
        );

        const coupon = Coupon ? Coupon.Code : undefined; // Coupon can equals null

        createModal(
            <SubscriptionModal
                planIDs={newPlanIDs}
                coupon={coupon}
                currency={currency}
                cycle={cycle}
                step={SUBSCRIPTION_STEPS.CUSTOMIZATION}
            />
        );
    };

    useEffect(() => {
        if (loadingPlans || loadingSubscription) {
            return;
        }
        const [{ Currency } = { Currency: undefined }] = plans;
        setCurrency(subscription.Currency || Currency);
        setCycle(subscription.Cycle || DEFAULT_CYCLE);
    }, [loadingSubscription, loadingPlans]);

    // @ts-ignore
    if (subscription.isManagedByMozilla) {
        return <MozillaInfoPanel />;
    }

    if (loadingSubscription || loadingPlans || loadingOrganization) {
        return <Loader />;
    }

    return (
        <>
            <PlanSelection
                loading={loading}
                plans={plans}
                currency={currency}
                cycle={cycle}
                planIDs={currentPlanIDs}
                hasFreePlan={false}
                hasPlanSelectionComparison={false}
                organization={organization}
                subscription={subscription}
                vpnCountries={vpnCountries}
                service={service}
                onChangePlanIDs={(planIDs) => {
                    withLoading(handleModal(planIDs));
                }}
                onChangeCurrency={setCurrency}
                onChangeCycle={setCycle}
            />
            <p className="text-sm">{c('Info').t`* Customizable features`}</p>
            <Button
                color="norm"
                shape="ghost"
                className="flex center mb1"
                onClick={() => {
                    createModal(
                        <SubscriptionModal
                            planIDs={currentPlanIDs}
                            coupon={CouponCode}
                            currency={currency}
                            cycle={cycle}
                            step={SUBSCRIPTION_STEPS.PLAN_SELECTION}
                        />
                    );
                }}
            >
                {c('Action').t`Compare plans`}
            </Button>
        </>
    );
};

export default PlansSection;
