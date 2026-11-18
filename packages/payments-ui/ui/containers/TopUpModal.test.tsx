import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';

import { renderWithProviders } from '@proton/payments-hooks/testing/vitest/renderWithProviders';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { MOCK_PAYMENT_STATUS } from '@proton/payments/testing/vitest/api-endpoints';
import { APPS } from '@proton/shared/lib/constants';

import { ChargebeeIdealButton } from '../components/ChargebeeIdealButton';
import { ChargebeePaypalButton } from '../components/ChargebeePaypalButton';
import { TopUpModal } from './TopUpModal';

vi.mock('@proton/atoms/Portal/Portal');

let mockSelectedMethodValue: string | undefined;
const mockProcessPaymentToken = vi.fn();

vi.mock('../../client-extensions/usePaymentFacade', () => ({
    usePaymentFacade: ({ amount }: { amount: number }) => ({
        selectedMethodValue: mockSelectedMethodValue,
        selectedMethodType: mockSelectedMethodValue,
        selectedProcessor: { processPaymentToken: mockProcessPaymentToken, meta: { type: mockSelectedMethodValue } },
        amount,
        methods: { loading: false },
        chargebeePaypal: { type: 'chargebee-paypal' },
        chargebeeIdeal: { type: 'chargebee-ideal' },
        iframeHandles: { type: 'iframe-handles' },
        bitcoinChargebee: { bitcoinLoading: false, awaitingBitcoinPayment: false },
    }),
}));

vi.mock('@proton/account/subscription/hooks', () => ({
    useSubscription: () => [buildSubscription(), false],
}));

vi.mock('@proton/account/user/hooks', () => ({
    useUser: () => [{ Currency: 'EUR' }, false],
}));

vi.mock('@proton/payments-hooks/client-extensions/useAutomaticCurrency', () => ({
    useAutomaticCurrency: () => ['EUR'],
}));

vi.mock('../../containers/payments/PaymentWrapper', () => ({
    __esModule: true,
    default: () => null,
}));

vi.mock('@proton/components/containers/payments/PaymentInfo', () => ({
    __esModule: true,
    default: () => null,
}));

vi.mock('@proton/components/containers/payments/AmountRow', () => ({
    __esModule: true,
    default: ({ onChangeAmount }: { onChangeAmount: (amount: number) => void }) => (
        <button type="button" data-testid="set-low-amount" onClick={() => onChangeAmount(100)}>
            Set low amount
        </button>
    ),
}));

vi.mock('../components/ChargebeePaypalButton', () => ({
    ChargebeePaypalButton: vi.fn(() => <div data-testid="chargebee-paypal-button" />),
}));

vi.mock('../components/ChargebeeIdealButton', () => ({
    ChargebeeIdealButton: vi.fn(() => <div data-testid="chargebee-ideal-button" />),
}));

const renderTopUpModal = (props: Partial<Parameters<typeof TopUpModal>[0]> = {}) =>
    renderWithProviders(
        <TopUpModal
            open
            app={APPS.PROTONMAIL}
            paymentStatus={{ ...MOCK_PAYMENT_STATUS, CountryCode: 'NL' }}
            title="Add credits"
            renderDescription={() => null}
            sentryComponent="credits-modal"
            onTopUp={vi.fn()}
            {...props}
        />
    );

const submitForm = () => fireEvent.submit(document.querySelector('form') as HTMLFormElement);

const methodButtonTestIds = ['top-up-button', 'chargebee-paypal-button', 'chargebee-ideal-button'];

const expectOnlyButton = (testId: string) => {
    for (const id of methodButtonTestIds) {
        if (id === testId) {
            expect(screen.getByTestId(id)).toBeInTheDocument();
        } else {
            expect(screen.queryByTestId(id)).not.toBeInTheDocument();
        }
    }
};

describe('TopUpModal submit button', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSelectedMethodValue = undefined;
        mockProcessPaymentToken.mockReturnValue(new Promise(() => {}));
    });

    it.each([
        [PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL, ChargebeePaypalButton, 'chargebee-paypal-button', 'chargebeePaypal'],
        [PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL, ChargebeeIdealButton, 'chargebee-ideal-button', 'chargebeeIdeal'],
    ])('renders the dedicated button for %s', (method, component, testId, processorProp) => {
        mockSelectedMethodValue = method;

        renderTopUpModal();

        expectOnlyButton(testId);
        expect(Object.keys((component as Mock).mock.lastCall![0]).sort()).toEqual(
            [processorProp, 'iframeHandles'].sort()
        );
    });

    it.each([PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL, PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL])(
        'shows a disabled "Processing payment" button for %s while the payment is processed',
        async (method) => {
            mockSelectedMethodValue = method;

            renderTopUpModal();
            submitForm();

            const processing = await screen.findByText('Processing payment');
            expect(processing.closest('button')).toBeDisabled();
            expect(screen.queryByTestId('top-up-button')).not.toBeInTheDocument();
            expect(screen.queryByTestId('chargebee-paypal-button')).not.toBeInTheDocument();
            expect(screen.queryByTestId('chargebee-ideal-button')).not.toBeInTheDocument();
        }
    );

    it('renders a disabled top-up button instead of PayPal while the amount due is checked', () => {
        mockSelectedMethodValue = PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL;

        renderTopUpModal({ checkTopUp: () => new Promise(() => {}) });

        expectOnlyButton('top-up-button');
        expect(screen.getByTestId('top-up-button')).toBeDisabled();
    });

    it('keeps the iDEAL button while the amount due is checked', () => {
        mockSelectedMethodValue = PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL;

        renderTopUpModal({ checkTopUp: () => new Promise(() => {}) });

        expectOnlyButton('chargebee-ideal-button');
    });

    it('renders a disabled top-up button for Bitcoin', () => {
        mockSelectedMethodValue = PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN;

        renderTopUpModal();

        expectOnlyButton('top-up-button');
        expect(screen.getByTestId('top-up-button')).toBeDisabled();
        expect(screen.getByTestId('top-up-button')).not.toHaveAttribute('type', 'submit');
        expect(screen.getByTestId('top-up-button')).toHaveTextContent('Top up');
    });

    it('renders no button for Bitcoin below the Bitcoin minimum', async () => {
        mockSelectedMethodValue = PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN;

        renderTopUpModal();
        fireEvent.click(screen.getByTestId('set-low-amount'));

        await waitFor(() => expect(screen.queryByTestId('top-up-button')).not.toBeInTheDocument());
        expect(screen.queryByTestId('chargebee-paypal-button')).not.toBeInTheDocument();
    });

    it('keeps a disabled card top-up button below the minimum amount', async () => {
        mockSelectedMethodValue = PAYMENT_METHOD_TYPES.CHARGEBEE_CARD;

        renderTopUpModal();
        fireEvent.click(screen.getByTestId('set-low-amount'));
        await act(() => new Promise((resolve) => setTimeout(resolve, 700)));

        const button = screen.getByTestId('top-up-button');
        expect(button).toHaveAttribute('type', 'submit');
        expect(button).toBeDisabled();
    });

    it.each([
        PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
        PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
        PAYMENT_METHOD_TYPES.APPLE_PAY,
        PAYMENT_METHOD_TYPES.GOOGLE_PAY,
        PAYMENT_METHOD_TYPES.CASH,
        PAYMENT_METHOD_TYPES.TOKEN,
        'saved-payment-method-id',
        undefined,
    ])('renders the submit top-up button for %s', async (method) => {
        mockSelectedMethodValue = method;

        renderTopUpModal();

        expectOnlyButton('top-up-button');
        const button = screen.getByTestId('top-up-button');
        expect(button).toHaveAttribute('type', 'submit');
        expect(button).toBeEnabled();
        expect(button).toHaveTextContent('Top up');

        submitForm();

        await waitFor(() => expect(screen.getByTestId('top-up-button')).toBeDisabled());
        expect(screen.queryByText('Processing payment')).not.toBeInTheDocument();
    });

    it('renders the submit top-up button instead of PayPal when account credit covers the amount due', async () => {
        mockSelectedMethodValue = PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL;

        renderTopUpModal({
            checkTopUp: async (amount, currency) => ({
                Currency: currency,
                Amount: amount,
                AmountDue: 0,
                Credit: amount,
                TaxInclusive: 1,
                Taxes: [],
            }),
            onTopUpFromAccountCredit: vi.fn(),
        });

        expect(await screen.findByTestId('paid-by-account-credit-text')).toBeInTheDocument();
        expectOnlyButton('top-up-button');
        expect(screen.getByTestId('top-up-button')).toHaveAttribute('type', 'submit');
    });
});
