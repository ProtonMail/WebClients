import { fireEvent, render, screen } from '@testing-library/react';

import { CYCLE, PAYMENT_METHOD_TYPES, PLANS } from '@proton/payments/core/constants';
import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { SubscriptionMode } from '@proton/shared/lib/payments/subscription/constants';

import { type Props, SubscriptionSubmitButton } from './SubscriptionSubmitButton';

vi.mock('../../../../ui/components/PayButton', () => ({
    PayButton: ({
        children,
        taxCountry: _taxCountry,
        vatNumber: _vatNumber,
        paymentFacade: _paymentFacade,
        product: _product,
        telemetryContext: _telemetryContext,
        ...props
    }: any) => (
        <button type="button" {...props}>
            {children}
        </button>
    ),
}));

vi.mock('@proton/components/containers/payments/subscription/InAppPurchaseModal', () => ({
    getSubscriptionManagerName: vi.fn(() => 'App Store'),
}));

vi.mock('@proton/components/containers/payments/subscription/VisionaryDowngradeWarningModal', () => ({
    getVisionaryDowngradeWarningTextElement: vi.fn(() => 'warning'),
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
        onSubmit: vi.fn(),
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

    it('should show "Switch to Pass Basic" when switching to Pass basic', () => {
        renderButton({
            checkResult: {
                ...baseCheckResult,
                AmountDue: 0,
                requestData: { ...baseCheckResult.requestData, Plans: { [PLANS.PASS_BASIC]: 1 } },
            },
        });

        expect(screen.getByText('Switch to Pass Basic')).toBeInTheDocument();
    });

    it.each([
        [PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN, /^Awaiting transaction$/, true, 0],
        [PAYMENT_METHOD_TYPES.CASH, /^Done$/, false, 1],
        [PAYMENT_METHOD_TYPES.CHARGEBEE_CARD, /^Pay .* now$/, false, 0],
        [PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL, /^Pay .* now$/, false, 0],
        [PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL, /^Pay .* now$/, false, 0],
        [PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT, /^Pay .* now$/, false, 0],
        [PAYMENT_METHOD_TYPES.APPLE_PAY, /^Pay .* now$/, false, 0],
        [PAYMENT_METHOD_TYPES.GOOGLE_PAY, /^Pay .* now$/, false, 0],
        [PAYMENT_METHOD_TYPES.TOKEN, /^Pay .* now$/, false, 0],
        ['saved-payment-method-id', /^Pay .* now$/, false, 0],
        [undefined, /^Pay .* now$/, false, 0],
    ])('should render the pay button for %s as %s', (method, text, disabled, onDoneCalls) => {
        const onDone = vi.fn();

        renderButton({
            currency: 'EUR',
            checkResult: { ...baseCheckResult, AmountDue: 4990, Currency: 'EUR' },
            paymentFacade: { selectedMethodValue: method } as any,
            onDone,
        });

        const button = screen.getByTestId('confirm');
        expect(button).toHaveTextContent(text);
        if (disabled) {
            expect(button).toBeDisabled();
        } else {
            expect(button).toBeEnabled();
        }

        fireEvent.click(button);

        expect(onDone).toHaveBeenCalledTimes(onDoneCalls);
    });
});
