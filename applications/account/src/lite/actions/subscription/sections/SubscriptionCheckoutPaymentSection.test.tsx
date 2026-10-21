import { render, screen } from '@testing-library/react';

import { usePayments } from '@proton/payments-ui/ui/context/PaymentContext';
import { CYCLE, PLANS } from '@proton/payments/core/constants';
import { GUARD_ERROR_CODES, type GuardError } from '@proton/payments/core/subscription/guard';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import SubscriptionCheckoutPaymentSection from './SubscriptionCheckoutPaymentSection';

jest.mock('@proton/account/appName', () => ({ useAppName: () => 'proton-account' }));
jest.mock('@proton/account/user/hooks', () => ({ useUser: () => [{ isFree: false }] }));
jest.mock('@proton/app-context/useConfig', () => ({ useConfig: () => ({ APP_NAME: 'proton-account' }) }));
jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: jest.fn() }),
}));
jest.mock('@proton/payments-ui/ui/billing-address/hooks/useBillingAddress', () => ({
    useBillingAddress: () => ({ taxCountry: undefined, vatNumber: undefined }),
}));
jest.mock('@proton/payments-ui/ui/components/RenewalNotice', () => ({
    getCheckoutRenewNoticeTextFromCheckResult: () => 'renew notice',
}));
jest.mock('@proton/payments-ui/ui/context/PaymentContext', () => ({ usePayments: jest.fn() }));
jest.mock('@proton/components/containers/payments/subscription/confirm-button/SubscriptionConfirmButton', () => ({
    SubscriptionConfirmButton: ({ disabled }: { disabled: boolean }) => (
        <button type="submit" data-testid="confirm" disabled={disabled}>
            Confirm
        </button>
    ),
}));
jest.mock('./payment-section/PaymentMethodForm', () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('./payment-section/PaymentMethodSelector', () => ({ __esModule: true, default: () => null }));

const paymentFacade = {
    amount: 1200,
    selectedMethodValue: undefined,
    currencyOverride: { updateCurrencyOverride: jest.fn() },
    methods: { allMethods: [], savedMethods: [], selectMethod: jest.fn() },
    bitcoinChargebee: { bitcoinLoading: false },
} as any;

type PaymentsValue = ReturnType<typeof usePayments>;

const mockPayments = (GuardResult?: GuardError[] | null) =>
    jest.mocked(usePayments).mockReturnValue({
        subscription: buildSubscription({ planName: PLANS.BUNDLE, cycle: CYCLE.YEARLY, currency: 'USD' }),
        checkoutUi: { planIDs: { [PLANS.VPN2024]: 1 }, cycle: CYCLE.YEARLY, planName: PLANS.VPN2024, currency: 'USD' },
        billingAddress: {},
        selectFullBillingAddress: jest.fn(),
        plansMap: {},
        checkResult: { AmountDue: 1200, Coupon: null, requestData: {}, GuardResult },
        telemetryContext: 'subscription-modification',
        loading: false,
        setVatNumber: jest.fn(),
        coupon: '',
        selectCurrency: jest.fn(),
        couponConfig: undefined,
    } as unknown as PaymentsValue);

const blocked: GuardError[] = [{ Code: GUARD_ERROR_CODES.TOO_LITTLE_SPACE, Message: 'raw backend message' }];

const section = () => (
    <SubscriptionCheckoutPaymentSection
        paymentFacade={paymentFacade}
        subscribing={false}
        onClose={jest.fn()}
        renderVisionaryDowngradeWarningText={false}
    />
);

describe('SubscriptionCheckoutPaymentSection guards', () => {
    it('shows the guard reason right before the confirm button and disables it', () => {
        mockPayments(blocked);
        render(section());

        const banner = screen.getByText(/enough storage for your account/i);
        const confirm = screen.getByTestId('confirm');

        expect(confirm).toBeDisabled();
        expect(banner.compareDocumentPosition(confirm) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(screen.queryByText('raw backend message')).not.toBeInTheDocument();
        expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(0);
    });

    it('keeps the payment form and renew notice visible while blocked', () => {
        mockPayments(blocked);
        render(section());

        expect(screen.getByText('Payment details')).toBeInTheDocument();
        expect(screen.getByTestId('checkout:renew-notice')).toBeInTheDocument();
    });

    it.each([[undefined], [null], [[]]])(
        'shows no banner and keeps the confirm button enabled for GuardResult %p',
        (GuardResult) => {
            mockPayments(GuardResult);
            render(section());

            expect(screen.queryByText(/enough storage for your account/i)).not.toBeInTheDocument();
            expect(screen.getByTestId('confirm')).toBeEnabled();
        }
    );

    it('follows the payments context: clears when a later check passes and appears when a later check blocks', () => {
        mockPayments(blocked);
        const { rerender } = render(section());
        expect(screen.getByTestId('confirm')).toBeDisabled();

        mockPayments([]);
        rerender(section());
        expect(screen.queryByText(/enough storage for your account/i)).not.toBeInTheDocument();
        expect(screen.getByTestId('confirm')).toBeEnabled();

        mockPayments(blocked);
        rerender(section());
        expect(screen.getByText(/enough storage for your account/i)).toBeInTheDocument();
        expect(screen.getByTestId('confirm')).toBeDisabled();
    });

    it('does not claim the purchase is allowed', () => {
        mockPayments([]);
        render(section());

        expect(screen.queryByText(/allowed|eligible|available/i)).not.toBeInTheDocument();
    });
});
