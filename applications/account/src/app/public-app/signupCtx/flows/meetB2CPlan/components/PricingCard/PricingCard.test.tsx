import { screen, within } from '@testing-library/react';

import { renderWithProviders } from '@proton/components/testing/vitest/renderWithProviders';
import { CYCLE, PLANS } from '@proton/payments/core/constants';
import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import { SelectedPlan } from '@proton/payments/core/subscription/selected-plan';
import { PLANS_MAP } from '@proton/payments/testing/data-plans';

import { PricingCard } from './PricingCard';

const planIDs = { [PLANS.MEET]: 1 };
const checkResult = {
    Amount: 9588,
    AmountDue: 10365,
    CouponDiscount: 0,
    Currency: 'CHF',
    Cycle: CYCLE.YEARLY,
    Coupon: null,
    Taxes: [{ Name: 'VAT', Rate: 8.1, Amount: 777 }],
    requestData: { Plans: planIDs, Currency: 'CHF', Cycle: CYCLE.YEARLY },
} as unknown as SubscriptionEstimation;

const payments = {
    options: { planIDs, cycle: CYCLE.YEARLY, currency: 'CHF', checkResult },
    plansMap: PLANS_MAP,
    selectedPlan: new SelectedPlan(planIDs, PLANS_MAP as any, CYCLE.YEARLY, 'CHF'),
    loadingTotal: false,
    selectCycle: vi.fn(),
};

vi.mock('@proton/payments-ui/ui/context/PaymentContextOptimistic', () => ({
    usePaymentOptimistic: () => payments,
}));

describe('Meet PricingCard', () => {
    afterEach(() => {
        payments.loadingTotal = false;
    });

    it('shows the tax amount', () => {
        renderWithProviders(<PricingCard step="payment" />);

        expect(screen.getByTestId('taxAmount')).toHaveTextContent('7.77');
    });

    it('shows a placeholder instead of the tax amount while the total may still change', () => {
        payments.loadingTotal = true;
        renderWithProviders(<PricingCard step="payment" />);

        expect(screen.queryByTestId('taxAmount')).not.toBeInTheDocument();
        expect(within(screen.getByTestId('tax')).getByTestId('skeleton-loader')).toBeInTheDocument();
    });
});
