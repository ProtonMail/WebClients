import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { usePaymentStatus } from '@proton/account/paymentStatus/hooks';
import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import Loader from '@proton/components/components/loader/Loader';
import useApi from '@proton/components/hooks/useApi';
import useLoad from '@proton/components/hooks/useLoad';
import useVPNServersCount from '@proton/components/hooks/useVPNServersCount';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { useLoading } from '@proton/hooks';
import {
    type Currency,
    type Cycle,
    DEFAULT_CYCLE,
    FREE_PLAN,
    FREE_SUBSCRIPTION,
    type PlanIDs,
    getIsB2BAudienceFromPlan,
    getPlanFromPlanIDs,
    getPlanIDs,
    getPlansMap,
    getValidAudience,
    getValidCycle,
    hasPlanIDs,
    isValidPlanName,
} from '@proton/payments';
import { PaymentsContextProvider } from '@proton/payments/ui';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { Audience } from '@proton/shared/lib/interfaces';

import { openLinkInBrowser, upgradeButtonClick } from '../desktop/openExternalLink';
import { useHasInboxDesktopInAppPayments } from '../desktop/useHasInboxDesktopInAppPayments';
import PlanSelection from './subscription/PlanSelection';
import { useSubscriptionModal } from './subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from './subscription/constants';
import { getDefaultSelectedProductPlans } from './subscription/helpers';

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

type Props = {
    app: APP_NAMES;
};

const PlansSectionInner = ({ app }: Props) => {
    const [loading, withLoading] = useLoading();
    const [subscription = FREE_SUBSCRIPTION, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();
    const [plansResult, loadingPlans] = usePlans();
    const [paymentStatus, statusLoading] = usePaymentStatus();
    const plans = plansResult?.plans || [];
    const freePlan = plansResult?.freePlan || FREE_PLAN;
    const [vpnServers] = useVPNServersCount();
    const api = useApi();
    const { paymentsApi } = usePaymentsApi(api);
    const location = useLocation();
    const [preferredCurrency, loadingCurrency] = useAutomaticCurrency();
    const currentPlanIDs = getPlanIDs(subscription);
    const searchParams = getSearchParams(location.search);
    const [audience, setAudience] = useState(searchParams.audience || Audience.B2C);

    const [open] = useSubscriptionModal();
    const isLoading =
        loadingPlans ||
        loadingSubscription ||
        loadingOrganization ||
        statusLoading ||
        !paymentStatus ||
        loadingCurrency;
    const [selectedCurrency, setCurrency] = useState<Currency>();
    const currency = selectedCurrency || preferredCurrency;
    const plansMap = getPlansMap(plans, currency);

    const [selectedProductPlans, setSelectedProductPlans] = useState(() => {
        return getDefaultSelectedProductPlans({
            appName: app,
            plan: searchParams.plan,
        });
    });

    const hasInboxDesktopInAppPayments = useHasInboxDesktopInAppPayments();

    const [cycle, setCycle] = useState(searchParams.cycle ?? DEFAULT_CYCLE);
    const { CouponCode } = subscription;

    useLoad();

    const handleModal = async (newPlanIDs: PlanIDs, newCycle: Cycle, currency: Currency) => {
        if (!hasPlanIDs(newPlanIDs)) {
            throw new Error('Downgrade not supported');
        }

        const couponCode = CouponCode || undefined; // From current subscription; CouponCode can be null
        const { Coupon } = await paymentsApi.checkSubscription({
            Plans: newPlanIDs,
            Currency: currency,
            Cycle: newCycle,
            CouponCode: couponCode,
        });

        const plan = getPlanFromPlanIDs(plansMap, newPlanIDs);

        open({
            defaultSelectedProductPlans: selectedProductPlans,
            planIDs: newPlanIDs,
            coupon: Coupon?.Code,
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            cycle: newCycle,
            currency: plan?.Currency,
            defaultAudience: Object.keys(newPlanIDs).some((planID) => getIsB2BAudienceFromPlan(planID as any))
                ? Audience.B2B
                : Audience.B2C,
            metrics: {
                source: 'plans',
            },
        });
    };

    // Clicking the "Select Plan" button opens the browser on Electron or the modal on the web
    const handlePlanChange = (newPlanIDs: PlanIDs, newCycle: Cycle, currency: Currency) => {
        const newPlanName = Object.keys(newPlanIDs)[0];
        const isNewPlanCorrect = isValidPlanName(newPlanName);
        if (isElectronApp && !hasInboxDesktopInAppPayments && newPlanName && isNewPlanCorrect) {
            upgradeButtonClick(newCycle, newPlanName);
            return;
        }

        void withLoading(handleModal(newPlanIDs, newCycle, currency));
    };

    useEffect(() => {
        if (isLoading) {
            return;
        }
        const cycle = subscription.Cycle || DEFAULT_CYCLE;
        setCycle(cycle);
        setSelectedProductPlans(
            getDefaultSelectedProductPlans({
                appName: app,
                plan: searchParams.plan,
            })
        );
    }, [isLoading, subscription, app]);

    if (isLoading) {
        return <Loader />;
    }

    return (
        <>
            <PlanSelection
                app={app}
                mode="settings"
                audience={audience}
                onChangeAudience={setAudience}
                loading={loading}
                freePlan={freePlan}
                plans={plans}
                vpnServers={vpnServers}
                currency={currency}
                paymentStatus={paymentStatus}
                cycle={cycle}
                onChangeCycle={setCycle}
                planIDs={currentPlanIDs}
                hasFreePlan={false}
                hasPlanSelectionComparison={false}
                subscription={subscription}
                onChangePlanIDs={handlePlanChange}
                onChangeCurrency={setCurrency}
                selectedProductPlans={selectedProductPlans}
                onChangeSelectedProductPlans={setSelectedProductPlans}
                organization={organization}
                paymentsApi={paymentsApi}
            />
            {app !== APPS.PROTONWALLET && (
                <Button
                    color="norm"
                    shape="ghost"
                    className="flex mx-auto items-center mb-4"
                    onClick={() => {
                        if (isElectronApp && !hasInboxDesktopInAppPayments) {
                            openLinkInBrowser(getAppHref(`mail/upgrade`, APPS.PROTONACCOUNT));
                            return;
                        }
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
            )}
        </>
    );
};

const PlansSection = (props: Props) => {
    return (
        <PaymentsContextProvider>
            <PlansSectionInner {...props} />
        </PaymentsContextProvider>
    );
};

export default PlansSection;
