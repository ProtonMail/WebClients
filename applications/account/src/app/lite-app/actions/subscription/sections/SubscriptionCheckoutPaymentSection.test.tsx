import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { usePayments } from '@proton/payments-hooks/ui/context/paymentsContext';
import { CYCLE, PLANS } from '@proton/payments/core/constants';
import { GUARD_ERROR_CODES, type GuardError } from '@proton/payments/core/subscription/guard';
import type { Subscription, SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import type { MultiSubscriptionContext } from '@proton/payments/core/subscription/multi-subscription-context';
import {
    buildLumoSubscription,
    buildMultiSubscriptionContext,
    buildMultiSubscriptionContextFromSubscription,
} from '@proton/payments/testing/buildMultiSubscriptionContext';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import SubscriptionCheckoutPaymentSection from './SubscriptionCheckoutPaymentSection';

vi.mock('@proton/account/appName', () => ({ useAppName: () => 'proton-account' }));
vi.mock('@proton/account/user/hooks', () => ({ useUser: () => [{ isFree: false }] }));
vi.mock('@proton/app-context/useConfig', () => ({ useConfig: () => ({ APP_NAME: 'proton-account' }) }));
vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: vi.fn() }),
}));
vi.mock('@proton/payments-ui/ui/billing-address/hooks/useBillingAddress', () => ({
    useBillingAddress: () => ({ taxCountry: undefined, vatNumber: undefined }),
}));
vi.mock('@proton/payments-ui/ui/components/RenewalNotice', () => ({
    getCheckoutRenewNoticeTextFromCheckResult: ({ subscription }: { subscription?: Subscription }) =>
        `renew notice for ${subscription?.ID ?? 'no subscription'}`,
}));
vi.mock('@proton/payments-hooks/ui/context/paymentsContext', () => ({ usePayments: vi.fn() }));
vi.mock('@proton/payments-ui/containers/payments/subscription/confirm-button/SubscriptionConfirmButton', () => ({
    SubscriptionConfirmButton: ({ disabled }: { disabled: boolean }) => (
        <button type="submit" data-testid="confirm" disabled={disabled}>
            Confirm
        </button>
    ),
}));
vi.mock('./payment-section/PaymentMethodForm', () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('./payment-section/PaymentMethodSelector', () => ({ __esModule: true, default: () => null }));

const paymentFacade = {
    amount: 1200,
    selectedMethodValue: undefined,
    methods: { allMethods: [], savedMethods: [], selectMethod: vi.fn() },
    bitcoinChargebee: { bitcoinLoading: false },
} as any;

type PaymentsValue = ReturnType<typeof usePayments>;

const mockPayments = (GuardResult?: GuardError[] | null) =>
    vi.mocked(usePayments).mockReturnValue({
        subscription: buildSubscription({ planName: PLANS.BUNDLE, cycle: CYCLE.YEARLY, currency: 'USD' }),
        checkoutUi: { planIDs: { [PLANS.VPN2024]: 1 }, cycle: CYCLE.YEARLY, planName: PLANS.VPN2024, currency: 'USD' },
        billingAddress: {},
        selectFullBillingAddress: vi.fn(),
        plansMap: {},
        checkResult: { AmountDue: 1200, Coupon: null, requestData: {}, GuardResult },
        telemetryContext: 'subscription-modification',
        loading: false,
        setVatNumber: vi.fn(),
        coupon: '',
        selectCurrency: vi.fn(),
        couponConfig: undefined,
        multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(
            buildSubscription({ planName: PLANS.BUNDLE, cycle: CYCLE.YEARLY, currency: 'USD' })
        ),
    } as unknown as PaymentsValue);

const blocked: GuardError[] = [
    { Code: GUARD_ERROR_CODES.TOO_LITTLE_SPACE, Message: 'Your plan doesn’t include enough storage.' },
];

const section = () => (
    <SubscriptionCheckoutPaymentSection
        paymentFacade={paymentFacade}
        subscribing={false}
        onClose={vi.fn()}
        renderVisionaryDowngradeWarningText={false}
    />
);

describe('SubscriptionCheckoutPaymentSection guards', () => {
    it('shows the guard reason right before the confirm button and disables it', () => {
        mockPayments(blocked);
        render(section());

        const banner = screen.getByText(/doesn’t include enough storage/i);
        const confirm = screen.getByTestId('confirm');

        expect(confirm).toBeDisabled();
        expect(banner.compareDocumentPosition(confirm) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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

            expect(screen.queryByText(/doesn’t include enough storage/i)).not.toBeInTheDocument();
            expect(screen.getByTestId('confirm')).toBeEnabled();
        }
    );

    it('follows the payments context: clears when a later check passes and appears when a later check blocks', () => {
        mockPayments(blocked);
        const { rerender } = render(section());
        expect(screen.getByTestId('confirm')).toBeDisabled();

        mockPayments([]);
        rerender(section());
        expect(screen.queryByText(/doesn’t include enough storage/i)).not.toBeInTheDocument();
        expect(screen.getByTestId('confirm')).toBeEnabled();

        mockPayments(blocked);
        rerender(section());
        expect(screen.getByText(/doesn’t include enough storage/i)).toBeInTheDocument();
        expect(screen.getByTestId('confirm')).toBeDisabled();
    });

    it('does not claim the purchase is allowed', () => {
        mockPayments([]);
        render(section());

        expect(screen.queryByText(/allowed|eligible|available/i)).not.toBeInTheDocument();
    });
});

/**
 * Regression for P2-2741: the Codes sent on subscribe are built by getCodes from
 * @proton/payments/core. Asserted through the submit of the lite checkout so the move cannot change them.
 */
describe('SubscriptionCheckoutPaymentSection subscription codes', () => {
    const submitWith = ({
        coupon,
        Coupon,
        Gift,
    }: {
        coupon: string;
        Coupon: { Code: string } | null;
        Gift?: number;
    }) => {
        const payments = mockPayments([]);
        const value = payments.getMockImplementation()!();
        payments.mockReturnValue({
            ...value,
            coupon,
            checkResult: { ...value.checkResult, Coupon: Coupon as SubscriptionEstimation['Coupon'], Gift },
        });

        const setSubscriptionData = vi.fn();
        const processPaymentToken = vi.fn(async () => {});
        render(
            <SubscriptionCheckoutPaymentSection
                paymentFacade={{
                    ...paymentFacade,
                    paymentContext: { setSubscriptionData },
                    selectedProcessor: { processPaymentToken },
                }}
                subscribing={false}
                onClose={vi.fn()}
                renderVisionaryDowngradeWarningText={false}
            />
        );
        fireEvent.click(screen.getByTestId('confirm'));
        return { setSubscriptionData, processPaymentToken };
    };

    it('sends the coupon applied by the check', async () => {
        const { setSubscriptionData, processPaymentToken } = submitWith({
            coupon: 'TYPED',
            Coupon: { Code: 'APPLIED' },
        });

        await waitFor(() => expect(processPaymentToken).toHaveBeenCalled());
        expect(setSubscriptionData).toHaveBeenCalledWith(expect.objectContaining({ Codes: ['APPLIED'] }));
    });

    it('sends the user entered gift code together with the applied coupon', async () => {
        const { setSubscriptionData } = submitWith({ coupon: 'GIFT', Coupon: { Code: 'APPLIED' }, Gift: 500 });

        await waitFor(() =>
            expect(setSubscriptionData).toHaveBeenCalledWith(expect.objectContaining({ Codes: ['GIFT', 'APPLIED'] }))
        );
    });

    it('sends no codes when there is no coupon', async () => {
        const { setSubscriptionData } = submitWith({ coupon: '', Coupon: null });

        await waitFor(() => expect(setSubscriptionData).toHaveBeenCalledWith(expect.objectContaining({ Codes: [] })));
    });
});

describe('SubscriptionCheckoutPaymentSection renew notice', () => {
    const webMailPlus = buildSubscription(
        { planName: PLANS.MAIL, cycle: CYCLE.YEARLY, currency: 'CHF' },
        { ID: 'mail-plus', PeriodEnd: 1825000000 }
    );
    const webLumoPlus = buildLumoSubscription(PLANS.LUMO, {
        ID: 'lumo-plus',
        Cycle: CYCLE.MONTHLY,
        Currency: 'CHF',
        PeriodEnd: 1796000000,
    });

    const renderFor = ({
        subscription,
        multiSubscriptionContext,
        planName,
        cycle = CYCLE.YEARLY,
    }: {
        subscription: Subscription;
        multiSubscriptionContext: MultiSubscriptionContext;
        planName: PLANS;
        cycle?: CYCLE;
    }) => {
        const value = mockPayments([]).getMockImplementation()!();
        vi.mocked(usePayments).mockReturnValue({
            ...value,
            subscription,
            multiSubscriptionContext,
            checkoutUi: { planIDs: { [planName]: 1 }, cycle, planName, currency: 'CHF' },
        } as PaymentsValue);
        render(section());
        return screen.getByTestId('checkout:renew-notice');
    };

    it('takes the renewal from the Lumo Plus subscription a Lumo Plus purchase changes', () => {
        const renewNotice = renderFor({
            subscription: { ...webMailPlus, SecondarySubscriptions: [webLumoPlus] },
            multiSubscriptionContext: buildMultiSubscriptionContext([webMailPlus, webLumoPlus]),
            planName: PLANS.LUMO,
        });

        expect(renewNotice).toHaveTextContent('renew notice for lumo-plus');
    });

    it('takes the renewal from the Mail Plus subscription a Mail Plus purchase changes', () => {
        const renewNotice = renderFor({
            subscription: { ...webMailPlus, SecondarySubscriptions: [webLumoPlus] },
            multiSubscriptionContext: buildMultiSubscriptionContext([webMailPlus, webLumoPlus]),
            planName: PLANS.MAIL,
            cycle: CYCLE.TWO_YEARS,
        });

        expect(renewNotice).toHaveTextContent('renew notice for mail-plus');
    });

    it('renews like a user without a subscription when the purchase starts a new subscription', () => {
        const renewNotice = renderFor({
            subscription: webLumoPlus,
            multiSubscriptionContext: buildMultiSubscriptionContext([webLumoPlus]),
            planName: PLANS.MAIL,
        });

        expect(renewNotice).toHaveTextContent('renew notice for no subscription');
    });

    it('keeps the renewal of the only subscription', () => {
        const renewNotice = renderFor({
            subscription: webMailPlus,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(webMailPlus),
            planName: PLANS.LUMO,
        });

        expect(renewNotice).toHaveTextContent('renew notice for mail-plus');
    });
});
