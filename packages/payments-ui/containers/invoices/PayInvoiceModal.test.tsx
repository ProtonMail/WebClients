import type { ReactNode } from 'react';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { useGetPaymentsInit } from '@proton/account/paymentsInit/hooks';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import { renderWithProviders } from '@proton/components/testing/vitest/renderWithProviders';
import { InvoiceState, PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { Invoice } from '@proton/payments/core/interface';
import { CacheType } from '@proton/redux-utilities/interface';
import { APPS } from '@proton/shared/lib/constants';

import { getIdealAuthorizationText } from '../../payment-methods/ideal/IdealAuthorizationText';
import { ApplePayButton } from '../../ui/components/ApplePayButton';
import { ChargebeeIdealButton } from '../../ui/components/ChargebeeIdealButton';
import { WALLET_BUTTON_WIDTH } from '../../ui/components/ChargebeeIframe';
import { ChargebeePaypalButton } from '../../ui/components/ChargebeePaypalButton';
import { GooglePayButton } from '../../ui/components/GooglePayButton';
import PayInvoiceModal, { type Props } from './PayInvoiceModal';

const getPaymentsInit = vi.fn().mockResolvedValue({
    hasPostedInvoices: false,
    postedInvoices: [],
});

vi.mock('@proton/account/paymentsInit/hooks', () => ({
    useGetPaymentsInit: vi.fn(),
}));

const payInvoice = vi.fn().mockResolvedValue(undefined);

type OnChargeable = (operations: { payInvoice: Mock }) => Promise<void>;

let selectedMethodValue: string | undefined;
let amountDue: number;
let amountLoading: boolean;
/** Wallet processors call onChargeable themselves once the user authorizes in the Apple Pay / Google Pay sheet */
let authorizeWalletPayment: () => Promise<void>;

const chargebeeCardProcessPaymentToken = vi.fn((onChargeable: OnChargeable) => onChargeable({ payInvoice }));
const selectedProcessorProcessPaymentToken = vi.fn().mockResolvedValue(undefined);

vi.mock('../../client-extensions/usePaymentFacade', () => ({
    usePaymentFacade: ({ onChargeable, amount }: { onChargeable: OnChargeable; amount: number }) => {
        authorizeWalletPayment = () => onChargeable({ payInvoice });

        return {
            chargebeeCard: {
                processPaymentToken: () => chargebeeCardProcessPaymentToken(onChargeable),
                meta: { type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD },
            },
            selectedProcessor: selectedMethodValue
                ? { processPaymentToken: selectedProcessorProcessPaymentToken, meta: { type: selectedMethodValue } }
                : undefined,
            selectedMethodValue,
            amount,
            methods: { loading: false },
            chargebeePaypal: {},
            chargebeeIdeal: {},
            applePay: {},
            googlePay: {},
            iframeHandles: {},
        };
    },
}));

vi.mock('../../ui/components/ApplePayButton', () => ({
    ApplePayButton: vi.fn(() => (
        <button type="button" data-testid="apple-pay-button">
            Apple Pay
        </button>
    )),
}));

vi.mock('../../ui/components/ChargebeeIdealButton', () => ({
    ChargebeeIdealButton: vi.fn(() => (
        <button type="button" data-testid="chargebee-ideal-button">
            iDEAL
        </button>
    )),
}));

vi.mock('../../ui/components/ChargebeePaypalButton', () => ({
    ChargebeePaypalButton: vi.fn(() => (
        <button type="button" data-testid="chargebee-paypal-button">
            PayPal
        </button>
    )),
}));

vi.mock('../../ui/components/GooglePayButton', () => ({
    GooglePayButton: vi.fn(() => (
        <button type="button" data-testid="google-pay-button">
            Google Pay
        </button>
    )),
}));

vi.mock('../payments/PaymentWrapper', () => ({
    __esModule: true,
    default: () => null,
}));

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: vi.fn() }),
}));

vi.mock('@proton/components/hooks/useApiResult', () => ({
    __esModule: true,
    default: () => ({
        result: amountLoading
            ? undefined
            : { AmountDue: amountDue, Amount: amountDue, Currency: 'EUR', Credit: 0, Code: 1000 },
        loading: amountLoading,
    }),
}));

const call = vi.fn().mockResolvedValue(undefined);

vi.mock('@proton/components/hooks/useEventManager', () => ({
    __esModule: true,
    default: () => ({ call }),
}));

vi.mock('@proton/atoms/Portal/Portal', () => ({
    Portal: ({ children }: { children: ReactNode }) => children,
}));

const baseInvoice: Invoice = {
    ID: 'invoice-1',
    Type: 1,
    State: InvoiceState.Posted,
    Currency: 'EUR',
    AmountDue: 0,
    AmountCharged: 0,
    CreateTime: 0,
    ModifyTime: 0,
    AttemptTime: 0,
    Attempts: 0,
    IsExternal: false,
};

const renderPayInvoiceModal = (props: Partial<Props> = {}) => {
    const modalProps: Props & Pick<ModalProps, 'open'> = {
        invoice: baseInvoice,
        fetchInvoices: vi.fn(),
        app: APPS.PROTONMAIL,
        open: true,
        ...props,
    };

    renderWithProviders(<PayInvoiceModal {...modalProps} />);
};

describe('PayInvoiceModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        selectedMethodValue = undefined;
        amountDue = 0;
        amountLoading = false;
        (useGetPaymentsInit as Mock).mockReturnValue(getPaymentsInit);
    });

    it('should refresh payments init after paying an invoice', async () => {
        const fetchInvoices = vi.fn().mockResolvedValue(undefined);

        const props: Props & Pick<ModalProps, 'open'> = {
            invoice: baseInvoice,
            fetchInvoices,
            app: APPS.PROTONMAIL,
            open: true,
        };

        renderWithProviders(<PayInvoiceModal {...props} />);

        await userEvent.click(screen.getByTestId('pay-invoice-button'));

        await waitFor(() => {
            expect(payInvoice).toHaveBeenCalledWith(baseInvoice.ID, 'v4');
            expect(call).toHaveBeenCalled();
            expect(fetchInvoices).toHaveBeenCalled();
            expect(getPaymentsInit).toHaveBeenCalledWith({ cache: CacheType.None });
        });
    });

    it('should close the modal even if a refresh after paying fails', async () => {
        call.mockRejectedValueOnce(new Error('events failed'));
        const onClose = vi.fn();

        renderPayInvoiceModal({ onClose });

        await userEvent.click(screen.getByTestId('pay-invoice-button'));

        await waitFor(() => {
            expect(onClose).toHaveBeenCalledTimes(1);
        });
        expect(payInvoice).toHaveBeenCalledWith(baseInvoice.ID, 'v4');
    });

    it.each([
        [PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL, ChargebeePaypalButton, 'chargebee-paypal-button', undefined, undefined],
        [PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL, ChargebeeIdealButton, 'chargebee-ideal-button', undefined, undefined],
        [PAYMENT_METHOD_TYPES.APPLE_PAY, ApplePayButton, 'apple-pay-button', WALLET_BUTTON_WIDTH, false],
        [PAYMENT_METHOD_TYPES.GOOGLE_PAY, GooglePayButton, 'google-pay-button', WALLET_BUTTON_WIDTH, false],
    ])('should show the %s button instead of the pay button', (method, component, buttonTestId, width, loading) => {
        selectedMethodValue = method;
        amountDue = 1000;

        renderPayInvoiceModal();

        expect(screen.getByTestId(buttonTestId)).toBeInTheDocument();
        expect(screen.queryByTestId('pay-invoice-button')).not.toBeInTheDocument();
        const props = (component as Mock).mock.lastCall![0];
        expect(props.width).toBe(width);
        expect(props.loading).toBe(loading);
    });

    it.each([
        PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
        PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
        PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN,
        PAYMENT_METHOD_TYPES.CASH,
        PAYMENT_METHOD_TYPES.TOKEN,
        'saved-payment-method-id',
        undefined,
    ])('should show the pay button for a non-zero invoice when %s is selected', (method) => {
        selectedMethodValue = method;
        amountDue = 1000;

        renderPayInvoiceModal();

        const button = screen.getByTestId('pay-invoice-button');
        expect(button).toHaveAttribute('type', 'submit');
        expect(button).toHaveTextContent('Pay');
        expect(button).toBeEnabled();
        expect(screen.queryByTestId('chargebee-paypal-button')).not.toBeInTheDocument();
        expect(screen.queryByTestId('chargebee-ideal-button')).not.toBeInTheDocument();
        expect(screen.queryByTestId('apple-pay-button')).not.toBeInTheDocument();
        expect(screen.queryByTestId('google-pay-button')).not.toBeInTheDocument();
    });

    it.each([
        PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
        PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
        PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL,
        PAYMENT_METHOD_TYPES.APPLE_PAY,
        PAYMENT_METHOD_TYPES.GOOGLE_PAY,
        'saved-payment-method-id',
    ])('should pay a zero-amount invoice with the card processor when %s is selected', async (method) => {
        selectedMethodValue = method;

        renderPayInvoiceModal();

        await userEvent.click(screen.getByTestId('pay-invoice-button'));

        await waitFor(() => {
            expect(payInvoice).toHaveBeenCalledWith(baseInvoice.ID, 'v4');
        });
        expect(chargebeeCardProcessPaymentToken).toHaveBeenCalledTimes(1);
        expect(selectedProcessorProcessPaymentToken).not.toHaveBeenCalled();
    });

    it.each([PAYMENT_METHOD_TYPES.CHARGEBEE_CARD, 'saved-payment-method-id'])(
        'should pay a non-zero invoice with the selected processor when %s is selected',
        async (method) => {
            selectedMethodValue = method;
            amountDue = 1000;

            renderPayInvoiceModal();

            await userEvent.click(screen.getByTestId('pay-invoice-button'));

            await waitFor(() => {
                expect(selectedProcessorProcessPaymentToken).toHaveBeenCalledTimes(1);
            });
            expect(chargebeeCardProcessPaymentToken).not.toHaveBeenCalled();
        }
    );

    it.each([
        [PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL, 1000, true],
        [PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL, 0, false],
        [PAYMENT_METHOD_TYPES.CHARGEBEE_CARD, 1000, false],
    ])('renders the iDEAL authorization note for %s with amount due %s: %s', (method, amount, shown) => {
        selectedMethodValue = method;
        amountDue = amount;

        renderPayInvoiceModal();

        expect(!!screen.queryByText(getIdealAuthorizationText())).toBe(shown);
    });

    it('should not pay a non-zero invoice when no payment method is selected', async () => {
        amountDue = 1000;

        renderPayInvoiceModal();

        await userEvent.click(screen.getByTestId('pay-invoice-button'));

        expect(chargebeeCardProcessPaymentToken).not.toHaveBeenCalled();
        expect(payInvoice).not.toHaveBeenCalled();
    });

    it('should show a disabled pay button instead of the wallet button while the amount is loading', () => {
        selectedMethodValue = PAYMENT_METHOD_TYPES.APPLE_PAY;
        amountLoading = true;

        renderPayInvoiceModal();

        expect(screen.queryByTestId('apple-pay-button')).not.toBeInTheDocument();
        expect(screen.getByTestId('pay-invoice-button')).toBeDisabled();
    });

    it('should pay the invoice and close once a wallet payment is authorized', async () => {
        selectedMethodValue = PAYMENT_METHOD_TYPES.APPLE_PAY;
        amountDue = 1000;
        const fetchInvoices = vi.fn().mockResolvedValue(undefined);
        const onClose = vi.fn();

        renderPayInvoiceModal({ fetchInvoices, onClose });

        await authorizeWalletPayment();

        expect(payInvoice).toHaveBeenCalledWith(baseInvoice.ID, 'v4');
        expect(fetchInvoices).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
