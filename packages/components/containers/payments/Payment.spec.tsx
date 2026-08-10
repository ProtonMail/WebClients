import { render, screen, waitFor } from '@testing-library/react';

import type { ViewPaymentMethod } from '@proton/components/payments/client-extensions';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { SavedPaymentMethod } from '@proton/payments/core/interface';
import { applyHOCs } from '@proton/testing/lib/context/hocs/helpers';
import { withApi } from '@proton/testing/lib/context/hocs/with-api';
import { withCache } from '@proton/testing/lib/context/hocs/with-cache';
import { withConfig } from '@proton/testing/lib/context/hocs/with-config';
import { withNotifications } from '@proton/testing/lib/context/hocs/with-notifications';
import { withReduxStore } from '@proton/testing/lib/context/hocs/with-redux-store';

import { PaymentsNoApi } from './Payment';

const apiMock = jest.fn();
jest.mock('../../hooks/useApi', () => {
    return {
        __esModule: true,
        default: () => apiMock,
    };
});

// The Chargebee credit card form renders a third-party iframe and reads the chargebeeCard
// hook, neither of which is exercised here. Stub it so the surrounding Payment UI can render.
jest.mock('@proton/payments/ui/components/ChargebeeWrapper', () => ({
    ...jest.requireActual('@proton/payments/ui/components/ChargebeeWrapper'),
    ChargebeeCreditCardWrapper: () => <div data-testid="chargebee-credit-card-wrapper" />,
}));

// Same for the SEPA form: it renders a third-party iframe and reads the full directDebit hook.
jest.mock('@proton/components/payments/chargebee/SepaDirectDebit', () => ({
    ...jest.requireActual('@proton/components/payments/chargebee/SepaDirectDebit'),
    SepaDirectDebit: () => <div data-testid="sepa-direct-debit" />,
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
                icon: 'brand-visa',
                text: 'Visa ending in 4242',
                // some plausible value
                value: 'methodid1',
                // disabled: false,
                // custom: true,
            },
            {
                icon: 'brand-paypal',
                text: 'PayPal - someId',
                value: 'methodid2',
                // disabled: false,
                // custom: true,
            },
            {
                icon: 'brand-visa',
                text: 'Visa ending in 3220',
                value: 'methodid3',
                // disabled: false,
                // custom: true,
            },
        ] as ViewPaymentMethod[],
        methods: [
            {
                icon: 'credit-card',
                value: 'card',
                text: 'New credit/debit card',
            },
            {
                icon: 'money-bills',
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
                bitcoinChargebee={{} as any}
                user={undefined}
                directDebit={
                    {
                        customer: {} as any,
                        bankAccount: {} as any,
                    } as any
                }
                savedPaymentMethods={[]}
                currencyOverride={{ isCurrencyOverriden: false } as any}
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
                bitcoinChargebee={{} as any}
                user={undefined}
                directDebit={
                    {
                        customer: {} as any,
                        bankAccount: {} as any,
                    } as any
                }
                savedPaymentMethods={[]}
                currencyOverride={{ isCurrencyOverriden: false } as any}
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
                currencyOverride={{ isCurrencyOverriden: false } as any}
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
                bitcoinChargebee={{} as any}
                user={undefined}
                directDebit={
                    {
                        customer: {} as any,
                        bankAccount: {} as any,
                    } as any
                }
                savedPaymentMethods={[]}
                currencyOverride={{ isCurrencyOverriden: false } as any}
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

    it.each([
        [
            PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL,
            'Your currency has been changed to euros (€) because iDEAL only supports payments in euros.',
        ],
        [
            PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
            'Your currency has been changed to euros (€) because SEPA bank transfers only support payments in euros.',
        ],
    ])('displays currency override banner for %s when isCurrencyOverriden is true', (method, bannerText) => {
        render(
            <WrappedPaymentsNoApi
                onMethod={() => {}}
                flow="subscription"
                method={method}
                amount={1000}
                isAuthenticated={true}
                lastUsedMethod={lastUsedMethod}
                allMethods={allMethods}
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
                bitcoinChargebee={{} as any}
                user={undefined}
                directDebit={
                    {
                        customer: {} as any,
                        bankAccount: {} as any,
                    } as any
                }
                savedPaymentMethods={[]}
                currencyOverride={{ isCurrencyOverriden: true } as any}
                showTaxCountry={true}
                paymentComponentLoaded={jest.fn()}
                selectedProcessor={undefined}
                processingPayment={false}
            />
        );

        expect(screen.getByText(bannerText)).toBeInTheDocument();
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
                    bitcoinChargebee={{} as any}
                    user={undefined}
                    directDebit={
                        {
                            customer: {} as any,
                            bankAccount: {} as any,
                        } as any
                    }
                    savedPaymentMethods={[]}
                    currencyOverride={{ isCurrencyOverriden: false } as any}
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
});
