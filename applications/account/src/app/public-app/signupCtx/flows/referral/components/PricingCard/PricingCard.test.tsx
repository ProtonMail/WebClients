import { screen, within } from '@testing-library/react';

import { renderWithProviders } from '@proton/components/testing/vitest/renderWithProviders';
import { getCheckoutUi, getOptimisticCheckResult } from '@proton/payments/core/checkout';
import { CYCLE, PLANS } from '@proton/payments/core/constants';
import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import type { PlanToCheck } from '@proton/payments/core/subscription/plan-to-check';
import { SelectedPlan } from '@proton/payments/core/subscription/selected-plan';
import { PLANS_MAP } from '@proton/payments/testing/data-plans';

import { PricingCard } from './PricingCard';

vi.mock('../../helpers/useIsVPNPlanWithoutTrialVariant', () => ({ useIsVPNPlanWithoutTrialVariant: () => true }));
vi.mock('../../helpers/useShouldStartTrial', () => ({ useShouldStartTrial: () => false }));
vi.mock('@proton/account/eligibleTrials/hooks', () => ({
    useEligibleTrials: () => ({ eligibleTrials: { creditCardRequiredPlans: [PLANS.BUNDLE] } }),
}));
vi.mock('@proton/account/referralInfo/hooks', () => ({ useReferralInfo: () => [undefined, false] }));

const planIDs = { [PLANS.BUNDLE]: 1 };
const checkResult = {
    ...getOptimisticCheckResult({ planIDs, plansMap: PLANS_MAP as any, cycle: CYCLE.YEARLY, currency: 'CHF' }),
    optimistic: false,
    Taxes: [{ Name: 'VAT', Rate: 8.1, Amount: 898 }],
} as SubscriptionEstimation;

const payments = {
    selectedPlan: new SelectedPlan(planIDs, PLANS_MAP as any, CYCLE.YEARLY, 'CHF'),
    checkResult,
    plansMap: PLANS_MAP,
    loadingTotal: false,
    getCoupon: () => undefined,
    getPriceOrFallback: (planToCheck: PlanToCheck) => ({
        checkResult,
        checkoutUi: getCheckoutUi({ planIDs: planToCheck.planIDs, plansMap: PLANS_MAP as any, checkResult }),
        loading: false,
    }),
    selectCycle: vi.fn(),
};

vi.mock('@proton/payments-ui/ui/context/PaymentContextOptimistic', () => ({
    usePaymentOptimistic: () => payments,
}));

describe('Referral PricingCard without a trial', () => {
    afterEach(() => {
        payments.loadingTotal = false;
    });

    it('shows the total and the tax, with nothing below the total', () => {
        renderWithProviders(<PricingCard step="payment" />);

        expect(screen.getByTestId('total')).toHaveTextContent('CHF');
        expect(screen.getByTestId('taxAmount')).toBeInTheDocument();
        expect(screen.queryByTestId('skeleton-loader')).not.toBeInTheDocument();
    });

    it('shows placeholders for the total and the tax while they may still change, and none for the missing trial copy', () => {
        payments.loadingTotal = true;
        renderWithProviders(<PricingCard step="payment" />);

        expect(screen.queryByTestId('total')).not.toBeInTheDocument();
        expect(within(screen.getByText('Total').parentElement!).getByTestId('skeleton-loader')).toBeInTheDocument();
        expect(within(screen.getByTestId('tax')).getByTestId('skeleton-loader')).toBeInTheDocument();
        // None for the trial copy this variant doesn't show
        expect(screen.getAllByTestId('skeleton-loader')).toHaveLength(2);
    });
});
