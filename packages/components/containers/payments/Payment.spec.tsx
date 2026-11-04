import type { ReactNode } from 'react';

import { render, screen, waitFor } from '@testing-library/react';

import { IcBrandPaypal } from '@proton/icons/icons/IcBrandPaypal';
import { IcBrandVisa } from '@proton/icons/icons/IcBrandVisa';
import { IcCreditCard } from '@proton/icons/icons/IcCreditCard';
import { IcMoneyBills } from '@proton/icons/icons/IcMoneyBills';
import type { ViewPaymentMethod } from '@proton/payments-ui/client-extensions/useMethods';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { SavedPaymentMethod } from '@proton/payments/core/interface';

import { applyHOCs } from '../../testing/hocs/helpers';
import { withApi } from '../../testing/hocs/with-api';
import { withCache } from '../../testing/with-cache';
import { withConfig } from '../../testing/with-config';
import { withNotifications } from '../../testing/with-notifications';
import { withReduxStore } from '../../testing/with-redux-store';
import { PaymentsNoApi, type Props } from './Payment';

const apiMock = jest.fn();
jest.mock('@proton/app-context/useApi', () => {
    return {
        __esModule: true,
        useApi: () => apiMock,
    };
});

// The Chargebee credit card form renders a third-party iframe and reads the chargebeeCard
// hook, neither of which is exercised here. Stub it so the surrounding Payment UI can render.
jest.mock('@proton/payments-ui/ui/components/ChargebeeWrapper', () => ({
    ...jest.requireActual('@proton/payments-ui/ui/components/ChargebeeWrapper'),
    ChargebeeCreditCardWrapper: ({ suffix }: { suffix: ReactNode }) => (
        <div data-testid="chargebee-credit-card-wrapper">{suffix}</div>
    ),
}));

// Same for the SEPA form: it renders a third-party iframe and reads the full directDebit hook.
jest.mock('@proton/payments-ui/ui/components/SepaDirectDebit', () => ({
    ...jest.requireActual('@proton/payments-ui/ui/components/SepaDirectDebit'),
    SepaDirectDebit: () => <div data-testid="sepa-direct-debit" />,
}));

let mockTaxFieldsMountCount = 0;
jest.mock('@proton/payments-ui/ui/billing-address/components/TaxFields', () => ({
    TaxFields: () => {
        const [mountId] = jest.requireActual('react').useState(() => ++mockTaxFieldsMountCount);
        return <div data-testid="tax-fields" data-mount-id={mountId} />;
    },
}));

jest.mock('@proton/payments-ui/payment-methods/bitcoin/BitcoinView', () => ({
    BitcoinView: () => <div data-testid="bitcoin" />,
}));

let paymentMethods: SavedPaymentMethod[];
let options;

let lastUsedMethod: ViewPaymentMethod;

let allMethods: ViewPaymentMethod[];

const WrappedPaymentsNoApi = applyHOCs(
    withApi(),
    withConfig(),
    withCache(),
    withNotifications(),
    withReduxStore()
)(PaymentsNoApi);

beforeEach(() => {
    jest.clearAllMocks();

    paymentMethods = [
        {
            ID: 'methodid1',
            Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
            Autopay: 1,
            Order: 497,
            Details: {
                Last4: '4242',
                Brand: 'Visa',
                ExpMonth: '01',
                ExpYear: '2025',
                Name: 'Arthur Morgan',
                Country: 'US',
                ZIP: '11111',
            },
        },
        {
            ID: 'methodid2',
            Type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
            Order: 498,
            Details: {
                BillingAgreementID: 'Billing1',
                PayerID: 'Payer1',
                Payer: 'buyer@example.com',
            },
        },
        {
            ID: 'methodid3',
            Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
            Autopay: 0,
            Order: 499,
            Details: {
                Last4: '3220',
                Brand: 'Visa',
                ExpMonth: '11',
                ExpYear: '2030',
                Name: 'Arthur Morgan',
                Country: 'US',
                ZIP: '1211',
            },
        },
    ];

    options = {
        usedMethods: [
            {
                icon: IcBrandVisa,
                text: 'Visa ending in 4242',
                // some plausible value
                value: 'methodid1',
                // disabled: false,
                // custom: true,
            },
            {
                icon: IcBrandPaypal,
                text: 'PayPal - someId',
                value: 'methodid2',
                // disabled: false,
                // custom: true,
            },
            {
                icon: IcBrandVisa,
                text: 'Visa ending in 3220',
                value: 'methodid3',
                // disabled: false,
                // custom: true,
            },
        ] as ViewPaymentMethod[],
        methods: [
            {
                icon: IcCreditCard,
                value: 'card',
                text: 'New credit/debit card',
            },
            {
                icon: IcMoneyBills,
                text: 'Cash',
                value: 'cash',
            },
        ] as ViewPaymentMethod[],
    };

    lastUsedMethod = options.usedMethods[options.usedMethods.length - 1];
    allMethods = [...options.usedMethods, ...options.methods];
});

describe('Payment', () => {
    beforeEach(() => {
        apiMock.mockReset();
    });

    it('should render', () => {
        const method = PAYMENT_METHOD_TYPES.CHARGEBEE_CARD;
        const savedMethod = paymentMethods.find(({ ID }) => method === ID);

        render(
            <WrappedPaymentsNoApi
                flow="subscription"
                onMethod={() => {}}
                method={method}
                amount={1000}
                isAuthenticated={true}
                lastUsedMethod={lastUsedMethod}
                allMethods={allMethods}
                savedMethod={savedMethod}
                loading={false}
                currency="USD"
                iframeHandles={
                    {
                        handles: {
                            initializeSavedCreditCard: jest.fn(),
                            getHeight: jest.fn().mockResolvedValue({ status: 'success', data: { height: 100 } }),
                        },
                        iframeRef: { current: null },
                    } as any
                }
                chargebeeCard={null as any}
                chargebeePaypal={null as any}
                chargebeeIdeal={{ accountHolderName: '' } as any}
                bitcoinChargebee={{} as any}
                user={undefined}
                directDebit={
                    {
                        customer: {} as any,
                        bankAccount: {} as any,
                    } as any
                }
                savedPaymentMethods={[]}
                showTaxCountry={true}
                paymentComponentLoaded={jest.fn()}
                selectedProcessor={undefined}
                processingPayment={false}
            />
        );
    });

    it('should not render <Alert3DS> if flow type is "signup"', async () => {
        const { container } = render(
            <WrappedPaymentsNoApi
                onMethod={() => {}}
                flow="signup"
                method={PAYMENT_METHOD_TYPES.CHARGEBEE_CARD}
                amount={1000}
                isAuthenticated={true}
                lastUsedMethod={lastUsedMethod}
                allMethods={allMethods}
                loading={false}
                currency="USD"
                iframeHandles={
                    {
                        handles: {
                            initializeSavedCreditCard: jest.fn(),
                            getHeight: jest.fn().mockResolvedValue({ status: 'success', data: { height: 100 } }),
                        },
                        iframeRef: { current: null },
                    } as any
                }
                chargebeeCard={null as any}
                chargebeePaypal={null as any}
                chargebeeIdeal={{ accountHolderName: '' } as any}
                bitcoinChargebee={{} as any}
                user={undefined}
                directDebit={
                    {
                        customer: {} as any,
                        bankAccount: {} as any,
                    } as any
                }
                savedPaymentMethods={[]}
                showTaxCountry={true}
                paymentComponentLoaded={jest.fn()}
                selectedProcessor={undefined}
                processingPayment={false}
            />
        );

        await waitFor(() => {
            expect(container).not.toHaveTextContent('We use 3-D Secure to protect your payments');
        });
    });

    it('should render <Alert3DS> if user selected a previously used credit card (customPaymentMethod)', async () => {
        apiMock.mockImplementation((query) => {
            if (query.url === 'payments/v4/methods') {
                return {
                    PaymentMethods: [
                        {
                            ID: 'my-custom-method-123',
                            Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
                        },
                    ],
                };
            }

            return {};
        });

        paymentMethods = [
            {
                ID: 'my-custom-method-123',
                Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
                Autopay: 1,
                Order: 497,
                Details: {
                    Last4: '4242',
                    Brand: 'Visa',
                    ExpMonth: '01',
                    ExpYear: '2025',
                    Name: 'Arthur Morgan',
                    Country: 'US',
                    ZIP: '11111',
                },
            },
        ];

        const savedMethod = paymentMethods[0];

        const { container } = render(
            <WrappedPaymentsNoApi
                onMethod={() => {}}
                flow="subscription"
                method="my-custom-method-123"
                amount={1000}
                isAuthenticated={true}
                lastUsedMethod={lastUsedMethod}
                allMethods={allMethods}
                savedMethod={savedMethod}
                loading={false}
                currency="USD"
                iframeHandles={
                    {
                        iframeRef: { current: null },
                        handles: {
                            initializeSavedCreditCard: jest.fn(),
                            getHeight: jest.fn().mockResolvedValue({ status: 'success', data: { height: 100 } }),
                        },
                        notifyIframeUnloaded: jest.fn(),
                        notifyIframeLoaded: jest.fn(),
                    } as any
                }
                chargebeeCard={null as any}
                chargebeePaypal={null as any}
                chargebeeIdeal={{ accountHolderName: '' } as any}
                bitcoinChargebee={{} as any}
                user={undefined}
                directDebit={
                    {
                        customer: {} as any,
                        bankAccount: {} as any,
                        reset: jest.fn(),
                    } as any
                }
                savedPaymentMethods={[]}
                showTaxCountry={true}
                paymentComponentLoaded={jest.fn()}
                selectedProcessor={undefined}
                processingPayment={false}
            />
        );

        await waitFor(() => {
            expect(container).toHaveTextContent('We use 3-D Secure to protect your payments');
        });
    });

    it('should not render <Alert3DS> if user selected a previously used method which is not a credit card', async () => {
        apiMock.mockImplementation((query) => {
            if (query.url === 'payments/v4/methods') {
                return {
                    PaymentMethods: [
                        {
                            ID: 'my-custom-method-123',
                            Type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
                        },
                    ],
                };
            }

            return {};
        });

        paymentMethods = [
            {
                ID: 'my-custom-method-123',
                Type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
                Order: 497,
                Details: {
                    BillingAgreementID: 'Billing1',
                    PayerID: 'Payer1',
                    Payer: '',
                },
            },
        ];

        const savedMethod = paymentMethods[0];

        const { container } = render(
            <WrappedPaymentsNoApi
                onMethod={() => {}}
                flow="subscription"
                method="my-custom-method-123"
                amount={1000}
                isAuthenticated={true}
                lastUsedMethod={lastUsedMethod}
                allMethods={allMethods}
                savedMethod={savedMethod}
                loading={false}
                currency="USD"
                iframeHandles={
                    {
                        iframeRef: { current: null },
                        handles: {
                            initializeSavedCreditCard: jest.fn(),
                        },
                    } as any
                }
                chargebeeCard={null as any}
                chargebeePaypal={null as any}
                chargebeeIdeal={{ accountHolderName: '' } as any}
                bitcoinChargebee={{} as any}
                user={undefined}
                directDebit={
                    {
                        customer: {} as any,
                        bankAccount: {} as any,
                    } as any
                }
                savedPaymentMethods={[]}
                showTaxCountry={true}
                paymentComponentLoaded={jest.fn()}
                selectedProcessor={undefined}
                processingPayment={false}
            />
        );

        await waitFor(() => {
            expect(container).not.toHaveTextContent('We use 3-D Secure to protect your payments');
        });
    });

    describe('PaymentMethodSelector disabled state', () => {
        const renderPayments = (overrides: { selectedProcessor?: any; processingPayment?: boolean } = {}) =>
            render(
                <WrappedPaymentsNoApi
                    flow="subscription"
                    onMethod={() => {}}
                    method={PAYMENT_METHOD_TYPES.CHARGEBEE_CARD}
                    amount={1000}
                    isAuthenticated={true}
                    lastUsedMethod={lastUsedMethod}
                    allMethods={allMethods}
                    loading={false}
                    currency="USD"
                    iframeHandles={
                        {
                            handles: {
                                initializeSavedCreditCard: jest.fn(),
                                getHeight: jest.fn().mockResolvedValue({ status: 'success', data: { height: 100 } }),
                            },
                            iframeRef: { current: null },
                        } as any
                    }
                    chargebeeCard={null as any}
                    chargebeePaypal={null as any}
                    chargebeeIdeal={{ accountHolderName: '' } as any}
                    bitcoinChargebee={{} as any}
                    user={undefined}
                    directDebit={
                        {
                            customer: {} as any,
                            bankAccount: {} as any,
                        } as any
                    }
                    savedPaymentMethods={[]}
                    showTaxCountry={true}
                    paymentComponentLoaded={jest.fn()}
                    selectedProcessor={overrides.selectedProcessor}
                    processingPayment={overrides.processingPayment ?? false}
                />
            );

        it('is enabled by default', () => {
            renderPayments();
            expect(screen.getByTestId('payment-method-methodid1')).not.toBeDisabled();
        });

        it('is disabled when processingPayment is true', () => {
            renderPayments({ processingPayment: true });
            expect(screen.getByTestId('payment-method-methodid1')).toBeDisabled();
        });

        it('is disabled when selectedProcessor.userInitiatedProcessing is true', () => {
            renderPayments({ selectedProcessor: { userInitiatedProcessing: true } as any });
            expect(screen.getByTestId('payment-method-methodid1')).toBeDisabled();
        });

        it('remains enabled when processor is processing but not user-initiated', () => {
            renderPayments({
                selectedProcessor: { userInitiatedProcessing: false, processingToken: true } as any,
            });
            expect(screen.getByTestId('payment-method-methodid1')).not.toBeDisabled();
        });
    });

    describe('new method forms', () => {
        const paymentsElement = (props: Partial<Props>) => (
            <WrappedPaymentsNoApi
                flow="subscription"
                onMethod={() => {}}
                amount={1000}
                isAuthenticated={true}
                lastUsedMethod={lastUsedMethod}
                allMethods={allMethods}
                loading={false}
                currency="EUR"
                iframeHandles={
                    {
                        iframeRef: { current: null },
                        handles: {
                            initializeSavedCreditCard: jest.fn(),
                            getHeight: jest.fn().mockResolvedValue({ status: 'success', data: { height: 100 } }),
                        },
                        notifyIframeUnloaded: jest.fn(),
                        notifyIframeLoaded: jest.fn(),
                    } as any
                }
                chargebeeCard={null as any}
                chargebeePaypal={null as any}
                chargebeeIdeal={{ accountHolderName: '' } as any}
                bitcoinChargebee={{} as any}
                user={undefined}
                directDebit={{ customer: {} as any, bankAccount: {} as any, reset: jest.fn() } as any}
                savedPaymentMethods={[]}
                showTaxCountry={true}
                paymentComponentLoaded={jest.fn()}
                selectedProcessor={undefined}
                processingPayment={false}
                {...props}
            />
        );
        const renderPayments = (props: Partial<Props>) => render(paymentsElement(props));

        it('remounts tax fields when switching between Apple Pay and Google Pay', () => {
            const { rerender } = renderPayments({ method: PAYMENT_METHOD_TYPES.APPLE_PAY });
            const applePayMountId = screen.getByTestId('tax-fields').dataset.mountId;

            rerender(paymentsElement({ method: PAYMENT_METHOD_TYPES.GOOGLE_PAY }));

            expect(screen.getByTestId('tax-fields').dataset.mountId).not.toBe(applePayMountId);
        });

        it.each([
            PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
            PAYMENT_METHOD_TYPES.APPLE_PAY,
            PAYMENT_METHOD_TYPES.GOOGLE_PAY,
            PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
            PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL,
            PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
            PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN,
        ])('renders tax fields for %s', (method) => {
            renderPayments({ method });
            expect(screen.getByTestId('tax-fields')).toBeInTheDocument();
        });

        it('renders the card form with the 3DS alert', () => {
            renderPayments({ method: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD });
            expect(screen.getByTestId('chargebee-credit-card-wrapper')).toBeInTheDocument();
            expect(screen.getByText('We use 3-D Secure to protect your payments')).toBeInTheDocument();
        });

        it('does not mount a new card form when a saved card is selected', () => {
            renderPayments({ method: paymentMethods[0].ID, savedMethod: paymentMethods[0] });
            expect(screen.queryByTestId('chargebee-credit-card-wrapper')).not.toBeInTheDocument();
            expect(screen.getByTestId('existing-credit-card')).toBeInTheDocument();
        });

        it('renders cash instructions without tax fields', () => {
            renderPayments({ method: PAYMENT_METHOD_TYPES.CASH });
            expect(screen.getByText('How to send a cash payment?')).toBeInTheDocument();
            expect(screen.queryByTestId('tax-fields')).not.toBeInTheDocument();
        });

        it('renders the SEPA form', () => {
            renderPayments({ method: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT });
            expect(screen.getByTestId('sepa-direct-debit')).toBeInTheDocument();
        });

        it('renders the iDEAL redirect notice', () => {
            renderPayments({ method: PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL });
            expect(screen.getByTestId('ideal-view')).toBeInTheDocument();
        });

        it('renders the PayPal view', () => {
            renderPayments({ method: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL });
            expect(screen.getByTestId('paypal-view')).toBeInTheDocument();
        });

        it('hides the PayPal view in single signup', () => {
            renderPayments({ method: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL, flow: 'signup-pass' });
            expect(screen.queryByTestId('paypal-view')).not.toBeInTheDocument();
        });

        it('renders the bitcoin form for an authenticated user', () => {
            renderPayments({ method: PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN });
            expect(screen.getByTestId('bitcoin-info-message')).toBeInTheDocument();
            expect(screen.getByTestId('bitcoin')).toBeInTheDocument();
        });

        it('renders a next-step note instead of the bitcoin form for an unauthenticated user', () => {
            renderPayments({ method: PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN, isAuthenticated: false });
            expect(
                screen.getByText('In the next step, you’ll be able to submit a deposit using a Bitcoin address.')
            ).toBeInTheDocument();
            expect(screen.queryByTestId('bitcoin')).not.toBeInTheDocument();
        });

        it('renders the billed-user warning instead of the bitcoin form for a billed user', () => {
            renderPayments({ method: PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN, user: { Billed: 1 } as any });
            expect(screen.getByText(/you will not be able to modify or cancel your subscription/)).toBeInTheDocument();
            expect(screen.queryByTestId('bitcoin')).not.toBeInTheDocument();
        });
    });
});
