import { render } from '@testing-library/react';

import { type Currency, PAYMENT_METHOD_TYPES } from '@proton/payments';

import PayPalView from './PayPalView';

beforeEach(() => {
    jest.clearAllMocks();
});

let amountAndCurrency = {
    Amount: 1000,
    Currency: 'EUR' as Currency,
};

it('should render', () => {
    const { container } = render(
        <PayPalView
            amount={amountAndCurrency.Amount}
            currency={amountAndCurrency.Currency}
            method={PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL}
        />
    );
    expect(container).not.toBeEmptyDOMElement();
});
