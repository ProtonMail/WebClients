import { render, screen } from '@testing-library/react';

import { PayPalInfoMessage } from '@proton/payments-hooks/payment-methods/paypal/PayPalInfoMessage';
import type { Currency } from '@proton/payments/core/interface';

import { PayPalView } from './PayPalView';

const amountAndCurrency = {
    Amount: 1000,
    Currency: 'EUR' as Currency,
};

describe('<PayPalView />', () => {
    it('should render info message', () => {
        const { container } = render(
            <PayPalView amount={amountAndCurrency.Amount} currency={amountAndCurrency.Currency}>
                <div className="p-4 border rounded bg-weak mb-4" data-testid="paypal-view">
                    <PayPalInfoMessage />
                </div>
            </PayPalView>
        );
        expect(container).not.toBeEmptyDOMElement();
        screen.getByText(
            'We will redirect you to PayPal in a new browser tab to complete this transaction. If you use any pop-up blockers, please disable them to continue.'
        );
    });

    it('should render minimum amount alert', () => {
        const { container } = render(
            <PayPalView amount={1} currency={amountAndCurrency.Currency}>
                <div className="p-4 border rounded bg-weak mb-4" data-testid="paypal-view">
                    <PayPalInfoMessage />
                </div>
            </PayPalView>
        );
        expect(container).not.toBeEmptyDOMElement();
        screen.getByText('Amount below minimum', { exact: false });
    });

    it('should render maximum amount alert', () => {
        const { container } = render(
            <PayPalView amount={4000001} currency={amountAndCurrency.Currency}>
                <div className="p-4 border rounded bg-weak mb-4" data-testid="paypal-view">
                    <PayPalInfoMessage />
                </div>
            </PayPalView>
        );
        expect(container).not.toBeEmptyDOMElement();
        screen.getByText('Amount above the maximum.');
    });
});
