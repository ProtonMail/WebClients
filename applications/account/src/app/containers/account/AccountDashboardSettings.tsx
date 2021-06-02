import React, { useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { c } from 'ttag';
import {
    SettingsPropsShared,
    YourPlanSection,
    EmailSubscriptionSection,
    LanguageAndTimeSection,
    CancelSubscriptionSection,
    useUser,
    PlansSection,
    SubscriptionModal,
    useModals,
    usePlans,
    useSubscription,
    useOrganization,
    useLoad,
} from 'react-components';
import { UserModel, Plan, PlanIDs } from 'proton-shared/lib/interfaces';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { DEFAULT_CYCLE, PLAN_SERVICES, CYCLE, CURRENCIES } from 'proton-shared/lib/constants';
import { toMap } from 'proton-shared/lib/helpers/object';
import { SUBSCRIPTION_STEPS } from 'react-components/containers/payments/subscription/constants';
import { getPlanIDs } from 'proton-shared/lib/helpers/subscription';
import { switchPlan } from 'proton-shared/lib/helpers/planIDs';
import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

export const getDashboardPage = ({ user }: { user: UserModel }) => {
    const { isFree, isPaid, isMember, canPay } = user;

    return {
        text: c('Title').t`Dashboard`,
        to: '/dashboard',
        icon: 'apps',
        subsections: [
            isFree && {
                text: c('Title').t`Select plan`,
                id: 'select-plan',
            },
            canPay && {
                text: isFree ? c('Title').t`Your current plan` : c('Title').t`Your plan`,
                id: 'your-plan',
            },
            {
                text: c('Title').t`Language & time`,
                id: 'language-and-time',
            },
            !isMember && {
                text: c('Title').t`Email subscriptions`,
                id: 'email-subscription',
            },
            isPaid &&
                canPay && {
                    text: c('Title').t`Cancel subscription`,
                    id: 'cancel-subscription',
                },
        ].filter(isTruthy),
    };
};

interface PlansMap {
    [planName: string]: Plan;
}

const AccountDashboardSettings = ({ location, setActiveSection }: SettingsPropsShared) => {
    const [user] = useUser();

    const { isFree, isPaid, isMember, canPay } = user;

    const { createModal } = useModals();
    const [plans, loadingPlans] = usePlans();
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();
    const onceRef = useRef(false);
    const history = useHistory();
    useLoad();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const planName = searchParams.get('plan');
        if (!plans || !planName || loadingPlans || loadingSubscription || loadingOrganization || onceRef.current) {
            return;
        }

        searchParams.delete('plan');
        history.replace({
            search: searchParams.toString(),
        });
        onceRef.current = true;

        const coupon = searchParams.get('coupon');
        const cycleParam = parseInt(searchParams.get('cycle') as any, 10);
        const currencyParam = searchParams.get('currency') as any;
        const defaultCycle =
            cycleParam && [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS].includes(cycleParam)
                ? cycleParam
                : DEFAULT_CYCLE;
        const defaultCurrency = currencyParam && CURRENCIES.includes(currencyParam) ? currencyParam : plans[0].Currency;
        const { Cycle = defaultCycle, Currency = defaultCurrency } = subscription;
        const plansMap = toMap(plans, 'Name') as PlansMap;
        if (user.isFree) {
            const planIDs = planName.split('_').reduce<PlanIDs>((acc, name) => {
                acc[plansMap[name].ID] = 1;
                return acc;
            }, {});
            if (!Object.keys(planIDs).length) {
                return;
            }
            createModal(
                <SubscriptionModal
                    planIDs={planIDs}
                    currency={defaultCurrency}
                    cycle={defaultCycle}
                    coupon={coupon}
                    step={SUBSCRIPTION_STEPS.CHECKOUT}
                />
            );
            return;
        }
        const plan = plansMap[planName];
        if (!plan) {
            return;
        }
        const planIDs = switchPlan({
            planIDs: getPlanIDs(subscription),
            plans,
            planID: plan.ID,
            service: PLAN_SERVICES.VPN,
            organization,
        });
        createModal(
            <SubscriptionModal
                planIDs={planIDs}
                currency={Currency}
                cycle={Cycle}
                step={SUBSCRIPTION_STEPS.CUSTOMIZATION}
            />
        );
    }, [loadingPlans, loadingSubscription, loadingOrganization]);

    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getDashboardPage({ user })}
            setActiveSection={setActiveSection}
        >
            {Boolean(isFree) && <PlansSection />}
            {Boolean(canPay) && <YourPlanSection />}
            <LanguageAndTimeSection />
            {!isMember && <EmailSubscriptionSection />}
            {isPaid && canPay && <CancelSubscriptionSection />}
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default AccountDashboardSettings;
