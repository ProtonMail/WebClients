import { render, screen, waitFor } from '@testing-library/react';

import type { ViewPaymentMethod } from '@proton/components/payments/client-extensions';
import type { SavedPaymentMethod, SavedPaymentMethodExternal, SavedPaymentMethodInternal } from '@proton/payments';
import { MethodStorage, PAYMENT_METHOD_TYPES } from '@proton/payments';
import { applyHOCs, withApi, withCache, withConfig, withNotifications } from '@proton/testing';

import { PaymentsNoApi } from './Payment';

const apiMock = jest.fn();
jest.mock('../../hooks/useApi', () => {
    return {
        __esModule: true,
        default: () => apiMock,
    };
});

let paymentMethods: SavedPaymentMethod[];
let options;

let lastUsedMethod: ViewPaymentMethod;

let allMethods: ViewPaymentMethod[];

const WrappedPaymentsNoApi = applyHOCs(withApi(), withConfig(), withCache(), withNotifications())(PaymentsNoApi);

beforeEach(() => {
    jest.clearAllMocks();

    paymentMethods = [
        {
            ID: 'methodid1',
            Type: PAYMENT_METHOD_TYPES.CARD,
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
            External: MethodStorage.INTERNAL,
        },
        {
            ID: 'methodid2',
            Type: PAYMENT_METHOD_TYPES.PAYPAL,
            Order: 498,
            Details: {
                BillingAgreementID: 'Billing1',
                PayerID: 'Payer1',
                Payer: 'buyer@example.com',
            },
            External: MethodStorage.INTERNAL,
        },
        {
            ID: 'methodid3',
            Type: PAYMENT_METHOD_TYPES.CARD,
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
            External: MethodStorage.INTERNAL,
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
        const method = PAYMENT_METHOD_TYPES.CARD;
        const savedMethodInternal = paymentMethods.find(({ ID }) => method === ID) as SavedPaymentMethodInternal;

        render(
            <WrappedPaymentsNoApi
                flow="subscription"
                onMethod={() => {}}
                method={method}
                amount={1000}
                isAuthenticated={true}
                lastUsedMethod={lastUsedMethod}
                allMethods={allMethods}
                savedMethodInternal={savedMethodInternal}
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
            />
        );
    });

    it('should not render <Alert3DS> if flow type is "signup"', async () => {
        const { container } = render(
            <WrappedPaymentsNoApi
                onMethod={() => {}}
                flow="signup"
                method={PAYMENT_METHOD_TYPES.CARD}
                amount={1000}
                isAuthenticated={true}
                lastUsedMethod={lastUsedMethod}
                allMethods={allMethods}
                savedMethodInternal={undefined}
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
                External: MethodStorage.EXTERNAL,
            },
        ];

        const savedMethodExternal = paymentMethods[0] as SavedPaymentMethodExternal;

        const { container } = render(
            <WrappedPaymentsNoApi
                onMethod={() => {}}
                flow="subscription"
                method="my-custom-method-123"
                amount={1000}
                isAuthenticated={true}
                lastUsedMethod={lastUsedMethod}
                allMethods={allMethods}
                savedMethodExternal={savedMethodExternal}
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
                External: MethodStorage.INTERNAL,
            },
        ];

        const savedMethodInternal: SavedPaymentMethodInternal = paymentMethods[0] as SavedPaymentMethodInternal;

        const { container } = render(
            <WrappedPaymentsNoApi
                onMethod={() => {}}
                flow="subscription"
                method="my-custom-method-123"
                amount={1000}
                isAuthenticated={true}
                lastUsedMethod={lastUsedMethod}
                allMethods={allMethods}
                savedMethodInternal={savedMethodInternal}
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
            />
        );

        await waitFor(() => {
            expect(container).not.toHaveTextContent('We use 3-D Secure to protect your payments');
        });
    });

    it('displays currency override banner when isCurrencyOverriden is true', () => {
        render(
            <WrappedPaymentsNoApi
                onMethod={() => {}}
                flow="subscription"
                method="my-custom-method-123"
                amount={1000}
                isAuthenticated={true}
                lastUsedMethod={lastUsedMethod}
                allMethods={allMethods}
                savedMethodInternal={undefined}
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
            />
        );

        expect(
            screen.getByText(
                'Your currency has been changed to euros (€) because SEPA bank transfers only support payments in euros.'
            )
        ).toBeInTheDocument();
    });
});
