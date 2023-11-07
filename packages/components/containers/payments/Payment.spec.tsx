import { render, waitFor } from '@testing-library/react';

import { PAYMENT_METHOD_TYPES } from '@proton/components/payments/core';
import { CardFieldStatus } from '@proton/components/payments/react-extensions/useCard';

import Payment from './Payment';
import getDefault from './getDefaultCard';

jest.mock('../../hooks/useAuthentication', () => jest.fn().mockReturnValue({ UID: 'user123' }));

let apiMock: jest.Mock;
jest.mock('../../hooks/useApi', () => {
    let api = jest.fn();
    apiMock = api;

    return {
        __esModule: true,
        default: () => api,
    };
});

const cardFieldStatus: CardFieldStatus = {
    fullname: false,
    number: false,
    month: false,
    year: false,
    cvc: false,
    zip: false,
    country: false,
};

describe('Payment', () => {
    beforeEach(() => {
        apiMock.mockReset();
    });

    it('should render', () => {
        apiMock.mockReturnValue({});

        render(
            <Payment
                api={apiMock}
                type="subscription"
                onMethod={() => {}}
                method={PAYMENT_METHOD_TYPES.CARD}
                amount={1000}
                card={getDefault()}
                cardErrors={{}}
                onCard={() => {}}
                paypal={{}}
                paypalCredit={{}}
                cardFieldStatus={cardFieldStatus}
            />
        );
    });

    it('should render <Alert3DS> if the payment method is card', async () => {
        apiMock.mockReturnValue({});

        let { container } = render(
            <Payment
                api={apiMock}
                type="subscription"
                onMethod={() => {}}
                method={PAYMENT_METHOD_TYPES.CARD}
                amount={1000}
                card={getDefault()}
                cardErrors={{}}
                onCard={() => {}}
                paypal={{}}
                paypalCredit={{}}
                cardFieldStatus={cardFieldStatus}
            />
        );

        await waitFor(() => {
            expect(container).toHaveTextContent('We use 3-D Secure to protect your payments');
        });
    });

    it('should not render <Alert3DS> if flow type is "signup"', async () => {
        apiMock.mockReturnValue({});

        let { container } = render(
            <Payment
                api={apiMock}
                onMethod={() => {}}
                type="signup"
                method={PAYMENT_METHOD_TYPES.CARD}
                amount={1000}
                card={getDefault()}
                cardErrors={{}}
                onCard={() => {}}
                paypal={{}}
                paypalCredit={{}}
                cardFieldStatus={cardFieldStatus}
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

        let { container } = render(
            <Payment
                api={apiMock}
                onMethod={() => {}}
                type="signup"
                method="my-custom-method-123"
                amount={1000}
                card={getDefault()}
                cardErrors={{}}
                onCard={() => {}}
                paypal={{}}
                paypalCredit={{}}
                cardFieldStatus={cardFieldStatus}
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

        let { container } = render(
            <Payment
                api={apiMock}
                onMethod={() => {}}
                type="signup"
                method="my-custom-method-123"
                amount={1000}
                card={getDefault()}
                cardErrors={{}}
                onCard={() => {}}
                paypal={{}}
                paypalCredit={{}}
                cardFieldStatus={cardFieldStatus}
            />
        );

        await waitFor(() => {
            expect(container).not.toHaveTextContent('We use 3-D Secure to protect your payments');
        });
    });
});
