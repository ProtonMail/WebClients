import { render, waitFor } from '@testing-library/react';

import { ViewPaymentMethod } from '@proton/components/payments/client-extensions';
import { CardModel, PAYMENT_METHOD_TYPES, SavedPaymentMethod } from '@proton/components/payments/core';
import { CardFieldStatus } from '@proton/components/payments/react-extensions/useCard';

import { PaymentsNoApi } from './Payment';

let apiMock: jest.Mock;
jest.mock('../../hooks/useApi', () => {
    let api = jest.fn();
    apiMock = api;

    return {
        __esModule: true,
        default: () => api,
    };
});

const defaultCard: CardModel = {
    number: '',
    month: '',
    year: '',
    cvc: '',
    zip: '',
    country: 'US',
};

const cardFieldStatus: CardFieldStatus = {
    number: false,
    month: false,
    year: false,
    cvc: false,
    zip: false,
    country: false,
};

let paymentMethods: SavedPaymentMethod[];
let options;

let lastUsedMethod: ViewPaymentMethod;

let allMethods: ViewPaymentMethod[];

beforeEach(() => {
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
        apiMock.mockReturnValue({});

        const method = PAYMENT_METHOD_TYPES.CARD;
        const customPaymentMethod = paymentMethods.find(({ ID }) => method === ID);

        render(
            <PaymentsNoApi
                api={apiMock}
                type="subscription"
                onMethod={() => {}}
                method={method}
                amount={1000}
                card={defaultCard}
                cardErrors={{}}
                onCard={() => {}}
                paypal={{}}
                paypalCredit={{}}
                cardFieldStatus={cardFieldStatus}
                paymentMethods={paymentMethods}
                isAuthenticated={true}
                lastUsedMethod={lastUsedMethod}
                allMethods={allMethods}
                customPaymentMethod={customPaymentMethod}
                loading={false}
                currency="USD"
            />
        );
    });

    it('should render <Alert3DS> if the payment method is card', async () => {
        apiMock.mockReturnValue({});

        let { container } = render(
            <PaymentsNoApi
                api={apiMock}
                type="subscription"
                onMethod={() => {}}
                method={PAYMENT_METHOD_TYPES.CARD}
                amount={1000}
                card={defaultCard}
                cardErrors={{}}
                onCard={() => {}}
                paypal={{}}
                paypalCredit={{}}
                cardFieldStatus={cardFieldStatus}
                paymentMethods={paymentMethods}
                isAuthenticated={true}
                lastUsedMethod={lastUsedMethod}
                allMethods={allMethods}
                customPaymentMethod={undefined}
                loading={false}
                currency="USD"
            />
        );

        await waitFor(() => {
            expect(container).toHaveTextContent('We use 3-D Secure to protect your payments');
        });
    });

    it('should not render <Alert3DS> if flow type is "signup"', async () => {
        apiMock.mockReturnValue({});

        let { container } = render(
            <PaymentsNoApi
                api={apiMock}
                onMethod={() => {}}
                type="signup"
                method={PAYMENT_METHOD_TYPES.CARD}
                amount={1000}
                card={defaultCard}
                cardErrors={{}}
                onCard={() => {}}
                paypal={{}}
                paypalCredit={{}}
                cardFieldStatus={cardFieldStatus}
                paymentMethods={paymentMethods}
                isAuthenticated={true}
                lastUsedMethod={lastUsedMethod}
                allMethods={allMethods}
                customPaymentMethod={undefined}
                loading={false}
                currency="USD"
            />
        );

        await waitFor(() => {
            expect(container).not.toHaveTextContent('We use 3-D Secure to protect your payments');
        });
    });

    it('should render <Alert3DS> if user selected a perviously used credit card (customPaymentMethod)', async () => {
        apiMock.mockImplementation((query) => {
            if (query.url === 'payments/v4/methods') {
                return {
                    PaymentMethods: [
                        {
                            ID: 'my-custom-method-123',
                            Type: PAYMENT_METHOD_TYPES.CARD,
                        },
                    ],
                };
            }

            return {};
        });

        paymentMethods = [
            {
                ID: 'my-custom-method-123',
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
            },
        ];

        let customPaymentMethod = paymentMethods[0];

        let { container } = render(
            <PaymentsNoApi
                api={apiMock}
                onMethod={() => {}}
                type="signup"
                method="my-custom-method-123"
                amount={1000}
                card={defaultCard}
                cardErrors={{}}
                onCard={() => {}}
                paypal={{}}
                paypalCredit={{}}
                cardFieldStatus={cardFieldStatus}
                paymentMethods={paymentMethods}
                isAuthenticated={true}
                lastUsedMethod={lastUsedMethod}
                allMethods={allMethods}
                customPaymentMethod={customPaymentMethod}
                loading={false}
                currency="USD"
            />
        );

        await waitFor(() => {
            expect(container).toHaveTextContent('We use 3-D Secure to protect your payments');
        });
    });

    it('should render <Alert3DS> if user selected a perviously used method which is not a credit card', async () => {
        apiMock.mockImplementation((query) => {
            if (query.url === 'payments/v4/methods') {
                return {
                    PaymentMethods: [
                        {
                            ID: 'my-custom-method-123',
                            Type: PAYMENT_METHOD_TYPES.PAYPAL,
                        },
                    ],
                };
            }

            return {};
        });

        paymentMethods = [
            {
                ID: 'my-custom-method-123',
                Type: PAYMENT_METHOD_TYPES.PAYPAL,
                Order: 497,
                Details: {
                    BillingAgreementID: 'Billing1',
                    PayerID: 'Payer1',
                    Payer: '',
                },
            },
        ];

        let customPaymentMethod = paymentMethods[0];

        let { container } = render(
            <PaymentsNoApi
                api={apiMock}
                onMethod={() => {}}
                type="signup"
                method="my-custom-method-123"
                amount={1000}
                card={defaultCard}
                cardErrors={{}}
                onCard={() => {}}
                paypal={{}}
                paypalCredit={{}}
                cardFieldStatus={cardFieldStatus}
                paymentMethods={paymentMethods}
                isAuthenticated={true}
                lastUsedMethod={lastUsedMethod}
                allMethods={allMethods}
                customPaymentMethod={customPaymentMethod}
                loading={false}
                currency="USD"
            />
        );

        await waitFor(() => {
            expect(container).not.toHaveTextContent('We use 3-D Secure to protect your payments');
        });
    });
});
