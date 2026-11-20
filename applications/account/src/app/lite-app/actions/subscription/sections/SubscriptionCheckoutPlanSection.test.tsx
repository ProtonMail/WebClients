import { render, screen } from '@testing-library/react';
import { addMonths, fromUnixTime } from 'date-fns';

import { getReadableTime } from '@proton/components/components/time/Time';
import { usePayments } from '@proton/payments-hooks/ui/context/paymentsContext';
import { getOptimisticCheckResult } from '@proton/payments/core/checkout';
import { CYCLE, PLANS } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import type { MultiSubscriptionContext } from '@proton/payments/core/subscription/multi-subscription-context';
import {
    buildLumoSubscription,
    buildMultiSubscriptionContext,
    buildMultiSubscriptionContextFromSubscription,
} from '@proton/payments/testing/buildMultiSubscriptionContext';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getTestPlansMap } from '@proton/payments/testing/data-plans';
import { SubscriptionMode } from '@proton/shared/lib/payments/subscription/constants';

import SubscriptionCheckoutPlanSection from './SubscriptionCheckoutPlanSection';

vi.mock('@proton/app-context/useConfig', () => ({ useConfig: () => ({ APP_NAME: 'proton-account-lite' }) }));
vi.mock('@proton/account/user/hooks', () => ({ useUser: () => [{ Email: 'user@example.com' }] }));
vi.mock('@proton/account/organization/hooks', () => ({ useOrganization: () => [undefined] }));
vi.mock('@proton/payments-hooks/ui/context/paymentsContext', () => ({ usePayments: vi.fn() }));
vi.mock('./plan-section/SubscriptionCheckoutPlanMoreInformation', () => ({ __esModule: true, default: () => null }));

window.IntersectionObserver = class {
    observe = vi.fn();

    disconnect = vi.fn();
} as unknown as typeof IntersectionObserver;

type PaymentsValue = ReturnType<typeof usePayments>;

const mailPlusPeriodEnd = 1825000000;
const lumoPlusPeriodEnd = 1796000000;

const webMailPlus = buildSubscription(
    { planName: PLANS.MAIL, cycle: CYCLE.YEARLY, currency: 'CHF' },
    { ID: 'mail-plus', PeriodEnd: mailPlusPeriodEnd }
);
const webLumoPlus = buildLumoSubscription(PLANS.LUMO, {
    ID: 'lumo-plus',
    Cycle: CYCLE.MONTHLY,
    Currency: 'CHF',
    PeriodEnd: lumoPlusPeriodEnd,
});

const getRenewalDateAfter = (periodEnd: number, cycle: CYCLE) =>
    getReadableTime({ value: +addMonths(fromUnixTime(periodEnd), cycle) / 1000, format: 'PPP' });

const renderPlanSection = ({
    subscription,
    multiSubscriptionContext,
    planName,
    subscriptionMode,
}: {
    subscription: Subscription;
    multiSubscriptionContext: MultiSubscriptionContext;
    planName: PLANS;
    subscriptionMode: SubscriptionMode;
}) => {
    const plansMap = getTestPlansMap('CHF');
    const planIDs = { [planName]: 1 };
    const checkResult = getOptimisticCheckResult({ cycle: CYCLE.YEARLY, planIDs, plansMap, currency: 'CHF' });
    checkResult.SubscriptionMode = subscriptionMode;
    checkResult.optimistic = false;

    vi.mocked(usePayments).mockReturnValue({
        subscription,
        multiSubscriptionContext,
        checkoutUi: { planIDs, cycle: CYCLE.YEARLY, planName, currency: 'CHF' },
        checkResult,
        plansMap,
        couponConfig: undefined,
        getShouldPassTrial: () => false,
        loading: false,
        coupon: undefined,
        selectCoupon: vi.fn(),
        selectCurrency: vi.fn(),
    } as unknown as PaymentsValue);

    render(
        <SubscriptionCheckoutPlanSection
            onChangePlan={vi.fn()}
            shouldDisableCurrencySelection
            availableCurrencies={['CHF']}
            hasSavedPaymentMethods
            disablePlanSelection
            paymentInitialized
        />
    );

    return screen.queryByTestId('lite:checkout:renewal-date');
};

describe('SubscriptionCheckoutPlanSection next billing date', () => {
    it('starts after the Lumo Plus subscription a Lumo Plus purchase changes', () => {
        const renewalDate = renderPlanSection({
            subscription: { ...webMailPlus, SecondarySubscriptions: [webLumoPlus] },
            multiSubscriptionContext: buildMultiSubscriptionContext([webMailPlus, webLumoPlus]),
            planName: PLANS.LUMO,
            subscriptionMode: SubscriptionMode.ScheduledChargedImmediately,
        });

        expect(renewalDate).toHaveTextContent(getRenewalDateAfter(lumoPlusPeriodEnd, CYCLE.YEARLY));
        expect(renewalDate).not.toHaveTextContent(getRenewalDateAfter(mailPlusPeriodEnd, CYCLE.YEARLY));
    });

    it('keeps the end of the Lumo Plus term when that subscription already has an upcoming term', () => {
        const lumoPlusWithUpcomingTerm: Subscription = {
            ...webLumoPlus,
            UpcomingSubscription: buildLumoSubscription(PLANS.LUMO, {
                Cycle: CYCLE.YEARLY,
                Currency: 'CHF',
                PeriodStart: lumoPlusPeriodEnd,
                PeriodEnd: 1827536000,
            }),
        };

        const renewalDate = renderPlanSection({
            subscription: { ...webMailPlus, SecondarySubscriptions: [lumoPlusWithUpcomingTerm] },
            multiSubscriptionContext: buildMultiSubscriptionContext([webMailPlus, lumoPlusWithUpcomingTerm]),
            planName: PLANS.LUMO,
            subscriptionMode: SubscriptionMode.ScheduledChargedImmediately,
        });

        expect(renewalDate).toHaveTextContent(getRenewalDateAfter(lumoPlusPeriodEnd, CYCLE.YEARLY));
    });

    it('starts after the only subscription, as before', () => {
        const renewalDate = renderPlanSection({
            subscription: webMailPlus,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(webMailPlus),
            planName: PLANS.MAIL,
            subscriptionMode: SubscriptionMode.ScheduledChargedImmediately,
        });

        expect(renewalDate).toHaveTextContent(getRenewalDateAfter(mailPlusPeriodEnd, CYCLE.YEARLY));
    });

    it('bills from today when the purchase starts a new subscription next to the others', () => {
        const renewalDate = renderPlanSection({
            subscription: webLumoPlus,
            multiSubscriptionContext: buildMultiSubscriptionContext([webLumoPlus]),
            planName: PLANS.MAIL,
            subscriptionMode: SubscriptionMode.ScheduledChargedImmediately,
        });

        expect(renewalDate).toHaveTextContent(getRenewalDateAfter(Date.now() / 1000, CYCLE.YEARLY));
    });
});

describe('SubscriptionCheckoutPlanSection trial', () => {
    it('shows when the trial of the Lumo Plus subscription a Lumo Plus purchase changes ends', () => {
        const lumoPlusTrial = { ...webLumoPlus, IsTrial: true };

        renderPlanSection({
            subscription: { ...webMailPlus, SecondarySubscriptions: [lumoPlusTrial] },
            multiSubscriptionContext: buildMultiSubscriptionContext([webMailPlus, lumoPlusTrial]),
            planName: PLANS.LUMO,
            subscriptionMode: SubscriptionMode.ScheduledChargedLater,
        });

        expect(screen.getByText(/Total due on/)).toHaveTextContent(getReadableTime({ value: lumoPlusPeriodEnd }));
    });
});
