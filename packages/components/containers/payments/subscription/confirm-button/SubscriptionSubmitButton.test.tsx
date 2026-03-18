import { render, screen } from '@testing-library/react';

import type { SubscriptionEstimation } from '@proton/payments';
import { CYCLE, PAYMENT_METHOD_TYPES, SubscriptionMode } from '@proton/payments';
import { buildSubscription } from '@proton/testing/builders';

import { type Props, SubscriptionSubmitButton } from './SubscriptionSubmitButton';

jest.mock('@proton/payments/ui', () => ({
    PayButton: ({ children, ...props }: any) => (
        <button type="button" {...props}>
            {children}
        </button>
    ),
}));

jest.mock('../InAppPurchaseModal', () => ({
    getSubscriptionManagerName: jest.fn(() => 'App Store'),
}));

jest.mock('../VisionaryDowngradeWarningModal', () => ({
    getVisionaryDowngradeWarningTextElement: jest.fn(() => 'warning'),
}));

const baseCheckResult: SubscriptionEstimation = {
    Amount: 4990,
    AmountDue: 4990,
    Coupon: null,
    Currency: 'CHF',
    Cycle: CYCLE.YEARLY,
    PeriodEnd: Math.floor(Date.now() / 1000 + 365 * 24 * 60 * 60),
    SubscriptionMode: SubscriptionMode.Regular,
    BaseRenewAmount: null,
    RenewCycle: null,
    requestData: {
        Plans: {},
        Currency: 'CHF',
        Cycle: CYCLE.YEARLY,
    },
};

function renderButton(overrides: Partial<Props> = {}) {
    const defaultProps: Props = {
        currency: 'CHF',
        checkResult: baseCheckResult,
        paymentForbiddenReason: { forbidden: false },
        subscription: buildSubscription(),
        taxCountry: {} as any,
        vatNumber: undefined,
        paymentFacade: { selectedMethodValue: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD } as any,
        showVisionaryWarning: false,
        onSubmit: jest.fn(),
        app: 'proton-mail',
        ...overrides,
    };

    return render(<SubscriptionSubmitButton {...defaultProps} />);
}

describe('SubscriptionSubmitButton', () => {
    it('should show "Close" when paymentForbiddenReason is forbidden (already-subscribed)', () => {
        renderButton({
            paymentForbiddenReason: { forbidden: true, reason: 'already-subscribed' },
            checkResult: { ...baseCheckResult, AmountDue: 0 },
        });

        expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('should show "Close" even when AmountDue > 0 if paymentForbiddenReason is forbidden', () => {
        renderButton({
            paymentForbiddenReason: { forbidden: true, reason: 'already-subscribed' },
            checkResult: { ...baseCheckResult, AmountDue: 4990 },
        });

        expect(screen.getByText('Close')).toBeInTheDocument();
        expect(screen.queryByText(/Pay/)).not.toBeInTheDocument();
    });

    it('should show "Pay X now" when not forbidden and AmountDue > 0', () => {
        renderButton({
            paymentForbiddenReason: { forbidden: false },
            checkResult: { ...baseCheckResult, AmountDue: 4990 },
        });

        expect(screen.getByText(/Pay .* now/)).toBeInTheDocument();
    });

    it('should show "Confirm" when not forbidden and AmountDue = 0', () => {
        renderButton({
            paymentForbiddenReason: { forbidden: false },
            checkResult: { ...baseCheckResult, AmountDue: 0 },
        });

        expect(screen.getByText('Confirm')).toBeInTheDocument();
    });
});
