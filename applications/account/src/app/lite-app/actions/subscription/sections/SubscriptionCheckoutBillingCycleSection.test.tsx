import { render, screen, waitFor } from '@testing-library/react';

import { usePayments } from '@proton/payments-hooks/ui/context/paymentsContext';
import { getOptimisticCheckResult } from '@proton/payments/core/checkout';
import { ADDON_NAMES, CYCLE, PLANS } from '@proton/payments/core/constants';
import type { PlanIDs } from '@proton/payments/core/interface';
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

import SubscriptionCheckoutBillingCycleSection from './SubscriptionCheckoutBillingCycleSection';

vi.mock('@proton/account/appName', () => ({ useAppName: () => 'proton-account' }));
vi.mock('@proton/payments-hooks/ui/context/paymentsContext', () => ({ usePayments: vi.fn() }));
vi.mock('@proton/payments-ui/containers/payments/subscription/cycle-selector/SubscriptionCycleSelector', () => ({
    __esModule: true,
    default: ({ allowedCycles }: { allowedCycles: CYCLE[] }) => (
        <div data-testid="allowed-cycles">{allowedCycles.join(',')}</div>
    ),
}));

type PaymentsValue = ReturnType<typeof usePayments>;

const webLumoPlus = buildLumoSubscription(PLANS.LUMO, { ID: 'lumo-plus', Cycle: CYCLE.MONTHLY, Currency: 'CHF' });
const twoYearDrivePlus = buildSubscription(
    { planName: PLANS.DRIVE, cycle: CYCLE.TWO_YEARS, currency: 'CHF' },
    { ID: 'drive-plus' }
);
const webMailPlus = buildSubscription(
    { planName: PLANS.MAIL, cycle: CYCLE.YEARLY, currency: 'CHF' },
    { ID: 'mail-plus' }
);

const renderBillingCycleSection = ({
    subscription,
    multiSubscriptionContext,
    planIDs,
    coupon,
}: {
    subscription: Subscription;
    multiSubscriptionContext: MultiSubscriptionContext;
    planIDs: PlanIDs;
    coupon?: string;
}) => {
    const plansMap = getTestPlansMap('CHF');
    const checkResult = getOptimisticCheckResult({ cycle: CYCLE.YEARLY, planIDs, plansMap, currency: 'CHF' });
    checkResult.SubscriptionMode = SubscriptionMode.Regular;
    checkResult.optimistic = false;
    const checkMultiplePlans = vi.fn(async () => []);

    vi.mocked(usePayments).mockReturnValue({
        subscription,
        multiSubscriptionContext,
        checkoutUi: { planIDs, cycle: CYCLE.YEARLY, currency: 'CHF' },
        checkResult,
        plansMap,
        selectCycle: vi.fn(),
        selectedPlan: { name: Object.keys(planIDs)[0] },
        checkMultiplePlans,
        loading: false,
        coupon,
        couponConfig: undefined,
    } as unknown as PaymentsValue);

    render(<SubscriptionCheckoutBillingCycleSection />);

    return { allowedCycles: screen.getByTestId('allowed-cycles'), checkMultiplePlans };
};

describe('SubscriptionCheckoutBillingCycleSection allowed cycles', () => {
    it('offers the two-year cycle of the Drive Plus subscription a Drive Plus purchase changes', () => {
        const { allowedCycles } = renderBillingCycleSection({
            subscription: { ...webLumoPlus, SecondarySubscriptions: [twoYearDrivePlus] },
            multiSubscriptionContext: buildMultiSubscriptionContext([webLumoPlus, twoYearDrivePlus]),
            planIDs: { [PLANS.DRIVE]: 1 },
        });

        expect(allowedCycles).toHaveTextContent('24,12,1');
    });

    it('offers the two-year cycle of the only Drive Plus subscription, as before', () => {
        const { allowedCycles } = renderBillingCycleSection({
            subscription: twoYearDrivePlus,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(twoYearDrivePlus),
            planIDs: { [PLANS.DRIVE]: 1 },
        });

        expect(allowedCycles).toHaveTextContent('24,12,1');
    });

    it('caps Drive Plus at one year when the purchase starts a new subscription', () => {
        const { allowedCycles } = renderBillingCycleSection({
            subscription: webLumoPlus,
            multiSubscriptionContext: buildMultiSubscriptionContext([webLumoPlus]),
            planIDs: { [PLANS.DRIVE]: 1 },
        });

        expect(allowedCycles).toHaveTextContent('12,1');
        expect(allowedCycles).not.toHaveTextContent('24');
    });
});

describe('SubscriptionCheckoutBillingCycleSection prices of the other cycles', () => {
    const mailPlusWithMeet = { [PLANS.MAIL]: 1, [ADDON_NAMES.MEET_MAIL]: 1 };

    it('skips them when the purchase adds add-ons to the Mail Plus subscription it changes', async () => {
        const { checkMultiplePlans } = renderBillingCycleSection({
            subscription: { ...webLumoPlus, SecondarySubscriptions: [webMailPlus] },
            multiSubscriptionContext: buildMultiSubscriptionContext([webLumoPlus, webMailPlus]),
            planIDs: mailPlusWithMeet,
            coupon: 'PROMO',
        });

        await waitFor(() => expect(screen.getByTestId('allowed-cycles')).toBeInTheDocument());
        expect(checkMultiplePlans).not.toHaveBeenCalled();
    });

    it('skips them when the purchase adds add-ons to the only Mail Plus subscription, as before', async () => {
        const { checkMultiplePlans } = renderBillingCycleSection({
            subscription: webMailPlus,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(webMailPlus),
            planIDs: mailPlusWithMeet,
            coupon: 'PROMO',
        });

        await waitFor(() => expect(screen.getByTestId('allowed-cycles')).toBeInTheDocument());
        expect(checkMultiplePlans).not.toHaveBeenCalled();
    });

    it('checks them with the coupon when the purchase starts a new subscription', async () => {
        const { checkMultiplePlans } = renderBillingCycleSection({
            subscription: webLumoPlus,
            multiSubscriptionContext: buildMultiSubscriptionContext([webLumoPlus]),
            planIDs: mailPlusWithMeet,
            coupon: 'PROMO',
        });

        await waitFor(() =>
            expect(checkMultiplePlans).toHaveBeenCalledWith([
                expect.objectContaining({ planIDs: mailPlusWithMeet, cycle: CYCLE.TWO_YEARS, coupon: 'PROMO' }),
                expect.objectContaining({ planIDs: mailPlusWithMeet, cycle: CYCLE.MONTHLY, coupon: 'PROMO' }),
            ])
        );
    });
});
