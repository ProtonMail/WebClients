import { useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { c } from 'ttag';
import {
    SettingsPropsShared,
    YourPlanSection,
    EmailSubscriptionSection,
    CancelSubscriptionSection,
    PaymentMethodsSection,
    InvoicesSection,
    BillingSection,
    GiftCodeSection,
    CreditsSection,
    useUser,
    PlansSection,
    SubscriptionModal,
    useModals,
    usePlans,
    useSubscription,
    useOrganization,
    useLoad,
} from '@proton/components';
import { UserModel, Plan, PlanIDs } from '@proton/shared/lib/interfaces';
import { DEFAULT_CYCLE, PLAN_SERVICES, CYCLE, CURRENCIES, PERMISSIONS } from '@proton/shared/lib/constants';
import { toMap } from '@proton/shared/lib/helpers/object';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { getPlanIDs } from '@proton/shared/lib/helpers/subscription';
import { switchPlan } from '@proton/shared/lib/helpers/planIDs';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

const { UPGRADER, NOT_SUB_USER, PAID } = PERMISSIONS;

const hasSelectPlan = (user: UserModel) => user.isFree;
const hasYourPlan = (user: UserModel) => user.canPay;
const hasEmailSubscriptions = (user: UserModel) => !user.isMember;
const hasDowngradeAccount = (user: UserModel) => user.isPaid && user.canPay;
export const hasAccountDashboardPage = (user: UserModel) =>
    hasSelectPlan(user) || hasYourPlan(user) || hasEmailSubscriptions(user) || hasDowngradeAccount(user);

export const getDashboardPage = ({ user }: { user: UserModel }) => {
    return {
        text: c('Title').t`Dashboard`,
        to: '/dashboard',
        icon: 'grid',
        subsections: [
            hasSelectPlan(user) && {
                text: c('Title').t`Select plan`,
                id: 'select-plan',
            },
            hasYourPlan(user) && {
                text: user.isFree ? c('Title').t`Your current plan` : c('Title').t`Your plan`,
                id: 'your-plan',
            },
            {
                text: c('Title').t`Billing details`,
                id: 'billing',
                permissions: [PAID, UPGRADER, NOT_SUB_USER],
            },
            {
                text: c('Title').t`Payment methods`,
                id: 'payment-methods',
                permissions: [UPGRADER, NOT_SUB_USER],
            },
            {
                text: c('Title').t`Credits`,
                id: 'credits',
                permissions: [UPGRADER, NOT_SUB_USER],
            },
            {
                text: c('Title').t`Gift code`,
                id: 'gift-code',
                permissions: [UPGRADER, NOT_SUB_USER],
            },
            {
                text: c('Title').t`Invoices`,
                id: 'invoices',
                permissions: [UPGRADER, NOT_SUB_USER],
            },
            hasEmailSubscriptions(user) && {
                text: c('Title').t`Email subscriptions`,
                id: 'email-subscription',
            },
            hasDowngradeAccount(user) && {
                text: c('Title').t`Downgrade account`,
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
            {hasSelectPlan(user) && <PlansSection />}
            {hasYourPlan(user) && <YourPlanSection />}
            <BillingSection />
            <PaymentMethodsSection />
            <CreditsSection />
            <GiftCodeSection />
            <InvoicesSection />
            {hasEmailSubscriptions(user) && <EmailSubscriptionSection />}
            {hasDowngradeAccount(user) && <CancelSubscriptionSection />}
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default AccountDashboardSettings;
