import type { ReactNode } from 'react';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useGetPaymentsInit } from '@proton/account/paymentsInit/hooks';
import { InvoiceState, PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { Invoice } from '@proton/payments/core/interface';
import { CacheType } from '@proton/redux-utilities/interface';
import { APPS } from '@proton/shared/lib/constants';

import type { ModalProps } from '../../components/modalTwo/Modal';
import { renderWithProviders } from '../../testing/renderWithProviders';
import PayInvoiceModal, { type Props } from './PayInvoiceModal';

const getPaymentsInit = jest.fn().mockResolvedValue({
    hasPostedInvoices: false,
    postedInvoices: [],
});

jest.mock('@proton/account/paymentsInit/hooks', () => ({
    useGetPaymentsInit: jest.fn(),
}));

const payInvoice = jest.fn().mockResolvedValue(undefined);

type OnChargeable = (operations: { payInvoice: jest.Mock }) => Promise<void>;

let selectedMethodValue: string | undefined;
let amountDue: number;
let amountLoading: boolean;
/** Wallet processors call onChargeable themselves once the user authorizes in the Apple Pay / Google Pay sheet */
let authorizeWalletPayment: () => Promise<void>;

const chargebeeCardProcessPaymentToken = jest.fn((onChargeable: OnChargeable) => onChargeable({ payInvoice }));
const selectedProcessorProcessPaymentToken = jest.fn().mockResolvedValue(undefined);

jest.mock('@proton/payments-ui/client-extensions/usePaymentFacade', () => ({
    usePaymentFacade: ({ onChargeable }: { onChargeable: OnChargeable }) => {
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
            methods: { loading: false },
            chargebeePaypal: {},
            chargebeeIdeal: {},
            applePay: {},
            googlePay: {},
            iframeHandles: {},
        };
    },
}));

jest.mock('@proton/payments-ui/ui/components/ApplePayButton', () => ({
    ApplePayButton: () => (
        <button type="button" data-testid="apple-pay-button">
            Apple Pay
        </button>
    ),
}));

jest.mock('@proton/payments-ui/ui/components/GooglePayButton', () => ({
    GooglePayButton: () => (
        <button type="button" data-testid="google-pay-button">
            Google Pay
        </button>
    ),
}));

jest.mock('../payments/PaymentWrapper', () => ({
    __esModule: true,
    default: () => null,
}));

jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: jest.fn() }),
}));

jest.mock('../../hooks/useApiResult', () => ({
    __esModule: true,
    default: () => ({
        result: amountLoading
            ? undefined
            : { AmountDue: amountDue, Amount: amountDue, Currency: 'EUR', Credit: 0, Code: 1000 },
        loading: amountLoading,
    }),
}));

const call = jest.fn().mockResolvedValue(undefined);

jest.mock('../../hooks/useEventManager', () => ({
    __esModule: true,
    default: () => ({ call }),
}));

jest.mock('@proton/atoms/Portal/Portal', () => ({
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
        fetchInvoices: jest.fn(),
        app: APPS.PROTONMAIL,
        open: true,
        ...props,
    };

    renderWithProviders(<PayInvoiceModal {...modalProps} />);
};

describe('PayInvoiceModal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        selectedMethodValue = undefined;
        amountDue = 0;
        amountLoading = false;
        (useGetPaymentsInit as jest.Mock).mockReturnValue(getPaymentsInit);
    });

    it('should refresh payments init after paying an invoice', async () => {
        const fetchInvoices = jest.fn().mockResolvedValue(undefined);

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

    it.each([
        [PAYMENT_METHOD_TYPES.APPLE_PAY, 'apple-pay-button'],
        [PAYMENT_METHOD_TYPES.GOOGLE_PAY, 'google-pay-button'],
    ])('should show the %s button instead of the pay button', (method, buttonTestId) => {
        selectedMethodValue = method;
        amountDue = 1000;

        renderPayInvoiceModal();

        expect(screen.getByTestId(buttonTestId)).toBeInTheDocument();
        expect(screen.queryByTestId('pay-invoice-button')).not.toBeInTheDocument();
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
        const fetchInvoices = jest.fn().mockResolvedValue(undefined);
        const onClose = jest.fn();

        renderPayInvoiceModal({ fetchInvoices, onClose });

        await authorizeWalletPayment();

        expect(payInvoice).toHaveBeenCalledWith(baseInvoice.ID, 'v4');
        expect(fetchInvoices).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
