import { render, screen } from '@testing-library/react';

import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { SavedPaymentMethod } from '@proton/payments/core/interface';

import SavedPaymentMethodIcon from './SavedPaymentMethodIcon';

const savedCard = (Brand: string) =>
    ({
        ID: 'id-1',
        Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
        Order: 500,
        Details: { Brand, Last4: '4242', ExpMonth: '01', ExpYear: '2030', Name: 'Ada', Country: 'CH', ZIP: '1234' },
    }) as SavedPaymentMethod;

it('should render the brand icon for a saved card', () => {
    render(<SavedPaymentMethodIcon savedMethod={savedCard('Visa')} />);

    const icon = screen.getByRole('img');
    expect(icon).toHaveAttribute('alt', 'Visa');
    expect(icon).toHaveAttribute('src');
});

it('should render an icon without a source for a brand that has none', () => {
    render(<SavedPaymentMethodIcon savedMethod={savedCard('Cartes Bancaires')} />);

    const icon = screen.getByRole('img');
    expect(icon).toHaveAttribute('alt', 'Cartes Bancaires');
    expect(icon).not.toHaveAttribute('src');
});

it.each([
    [PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL, 'PayPal'],
    [PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT, 'SEPA Bank transfer'],
])('should render the icon for a saved %s', (Type, alt) => {
    render(
        <SavedPaymentMethodIcon savedMethod={{ ID: 'id-1', Type, Order: 500, Details: {} } as SavedPaymentMethod} />
    );

    expect(screen.getByRole('img')).toHaveAttribute('alt', alt);
});

it.each([PAYMENT_METHOD_TYPES.APPLE_PAY, PAYMENT_METHOD_TYPES.GOOGLE_PAY, PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL])(
    'should render nothing for a saved %s, which has no icon here',
    (Type) => {
        const { container } = render(
            <SavedPaymentMethodIcon savedMethod={{ ID: 'id-1', Type, Order: 500, Details: {} } as SavedPaymentMethod} />
        );

        expect(container).toBeEmptyDOMElement();
    }
);

it('should render nothing without a saved method', () => {
    const { container } = render(<SavedPaymentMethodIcon savedMethod={undefined} />);

    expect(container).toBeEmptyDOMElement();
});
