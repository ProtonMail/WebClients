import { render } from '@testing-library/react';

import { PAYMENT_METHOD_TYPES } from '@proton/payments';
import type { CardPayment, PaypalPayment } from '@proton/payments';

import PaymentVerificationImage from './PaymentVerificationImage';

describe('PaymentVerificationImage', () => {
    it.each([PAYMENT_METHOD_TYPES.PAYPAL, PAYMENT_METHOD_TYPES.PAYPAL_CREDIT])(
        'should render paypal image. Payment method: %s',
        (Type) => {
            const payment: PaypalPayment = {
                Type: Type as any,
            };

            const { getByAltText } = render(<PaymentVerificationImage payment={payment} type={Type as any} />);

            expect(getByAltText('PayPal')).toBeDefined();
        }
    );

    it('should render Paypal if payment object is empty but the type is defined', () => {
        const { getByAltText } = render(<PaymentVerificationImage payment={{}} type={PAYMENT_METHOD_TYPES.PAYPAL} />);

        expect(getByAltText('PayPal')).toBeDefined();
    });

    it('should render image for the respective credit card', () => {
        const payment: CardPayment = {
            Type: PAYMENT_METHOD_TYPES.CARD,
            Details: {
                Number: '4242424242424242',
            } as any,
        };

        const { getByAltText } = render(
            <PaymentVerificationImage payment={payment} type={PAYMENT_METHOD_TYPES.CARD} />
        );

        expect(getByAltText('Visa')).toBeDefined();
    });

    it('should render nothing if payment is empty and type is card', () => {
        const { container } = render(<PaymentVerificationImage payment={{}} type={PAYMENT_METHOD_TYPES.CARD} />);

        expect(container).toBeEmptyDOMElement();
    });
});
