import { render, screen } from '@testing-library/react';

import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { PlainPaymentMethodType } from '@proton/payments/core/interface';

import PaymentMethodIcon from './PaymentMethodIcon';

it.each([
    [PAYMENT_METHOD_TYPES.GOOGLE_PAY, 'Google Pay'],
    [PAYMENT_METHOD_TYPES.APPLE_PAY, 'Apple Pay'],
    [PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT, 'SEPA'],
    [PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN, 'Bitcoin'],
    [PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL, 'PayPal'],
    [PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL, 'iDEAL'],
])('should render a single icon for %s', (type, alt) => {
    render(<PaymentMethodIcon type={type} />);

    expect(screen.getByRole('img')).toHaveAttribute('alt', alt);
});

it('should render the accepted card brands for a new card', () => {
    render(<PaymentMethodIcon type={PAYMENT_METHOD_TYPES.CHARGEBEE_CARD} />);

    expect(screen.getAllByRole('img').map((icon) => icon.getAttribute('alt'))).toEqual([
        'Visa',
        'Mastercard',
        'American Express',
        'More cards',
    ]);
});

it.each([PAYMENT_METHOD_TYPES.CASH, PAYMENT_METHOD_TYPES.TOKEN])('should render nothing for %s', (type) => {
    const { container } = render(<PaymentMethodIcon type={type} />);

    expect(container).toBeEmptyDOMElement();
});

it('should render nothing for a type this client does not know', () => {
    const { container } = render(<PaymentMethodIcon type={'kakao-pay' as PlainPaymentMethodType} />);

    expect(container).toBeEmptyDOMElement();
});
