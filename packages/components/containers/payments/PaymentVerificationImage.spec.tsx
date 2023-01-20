import { render } from '@testing-library/react';

import { PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';

import PaymentVerificationImage from './PaymentVerificationImage';
import { CardPayment } from './interface';

describe('PaymentVerificationImage', () => {
    it('should render', () => {
        const { container } = render(<PaymentVerificationImage />);

        expect(container.querySelector('img')).toBeDefined();
    });

    it.each([PAYMENT_METHOD_TYPES.PAYPAL, PAYMENT_METHOD_TYPES.PAYPAL_CREDIT])(
        'should render paypal image. Payment method: %s',
        (type) => {
            const { getByAltText } = render(<PaymentVerificationImage type={type} />);

            expect(getByAltText('PayPal')).toBeDefined();
        }
    );

    it('should render image for the respective credit card', () => {
        const payment: CardPayment = {
            Type: PAYMENT_METHOD_TYPES.CARD,
            Details: {
                Number: '4242424242424242',
            } as any,
        };

        const { getByAltText } = render(<PaymentVerificationImage payment={payment} />);

        expect(getByAltText('Visa')).toBeDefined();
    });
});
