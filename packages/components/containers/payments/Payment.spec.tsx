import { render, waitFor } from '@testing-library/react';

import { PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';

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

describe('Payment', () => {
    beforeEach(() => {
        apiMock.mockReset();

        // That's an unresolved issue of jsdom https://github.com/jsdom/jsdom/issues/918
        (window as any).SVGElement.prototype.getBBox = jest.fn().mockReturnValue({ width: 0 });
    });

    it('should render', () => {
        apiMock.mockReturnValue({});

        render(
            <Payment
                type="subscription"
                onMethod={() => {}}
                method={PAYMENT_METHOD_TYPES.CARD}
                amount={1000}
                card={getDefault()}
                cardErrors={{}}
                onCard={() => {}}
                paypal={{}}
                paypalCredit={{}}
            />
        );
    });

    it('should render <Alert3DS> if the payment method is card', async () => {
        apiMock.mockReturnValue({});

        let { container } = render(
            <Payment
                type="subscription"
                onMethod={() => {}}
                method={PAYMENT_METHOD_TYPES.CARD}
                amount={1000}
                card={getDefault()}
                cardErrors={{}}
                onCard={() => {}}
                paypal={{}}
                paypalCredit={{}}
            />
        );

        await waitFor(() => {
            expect(container).toHaveTextContent('We use 3-D Secure to protect your payments.');
        });
    });

    it('should not render <Alert3DS> if flow type is "signup"', async () => {
        apiMock.mockReturnValue({});

        let { container } = render(
            <Payment
                onMethod={() => {}}
                type="signup"
                method={PAYMENT_METHOD_TYPES.CARD}
                amount={1000}
                card={getDefault()}
                cardErrors={{}}
                onCard={() => {}}
                paypal={{}}
                paypalCredit={{}}
            />
        );

        await waitFor(() => {
            expect(container).not.toHaveTextContent('We use 3-D Secure to protect your payments.');
        });
    });

    it('should render <Alert3DS> if user selected a perviously used credit card (customPaymentMethod)', async () => {
        apiMock.mockImplementation((query) => {
            if (query.url === 'payments/methods') {
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
                onMethod={() => {}}
                type="signup"
                method="my-custom-method-123"
                amount={1000}
                card={getDefault()}
                cardErrors={{}}
                onCard={() => {}}
                paypal={{}}
                paypalCredit={{}}
            />
        );

        await waitFor(() => {
            expect(container).toHaveTextContent('We use 3-D Secure to protect your payments.');
        });
    });

    it('should render <Alert3DS> if user selected a perviously used method which is not a credit card', async () => {
        apiMock.mockImplementation((query) => {
            if (query.url === 'payments/methods') {
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
                onMethod={() => {}}
                type="signup"
                method="my-custom-method-123"
                amount={1000}
                card={getDefault()}
                cardErrors={{}}
                onCard={() => {}}
                paypal={{}}
                paypalCredit={{}}
            />
        );

        await waitFor(() => {
            expect(container).not.toHaveTextContent('We use 3-D Secure to protect your payments.');
        });
    });
});
