import { render, screen, within } from '@testing-library/react';

import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';

import { TaxRow } from './TaxRow';

const checkResult = {
    Currency: 'CHF',
    Taxes: [{ Name: 'VAT', Rate: 8.1, Amount: 898 }],
} as unknown as SubscriptionEstimation;

describe('TaxRow', () => {
    it('shows the tax amount', () => {
        render(<TaxRow checkResult={checkResult} loading={false} />);

        expect(screen.getByTestId('taxAmount')).toHaveTextContent('8.98');
    });

    it('shows a placeholder instead of the amount while the tax may still change', () => {
        render(<TaxRow checkResult={checkResult} loading />);

        expect(screen.queryByTestId('taxAmount')).not.toBeInTheDocument();
        expect(within(screen.getByTestId('tax')).getByTestId('skeleton-loader')).toBeInTheDocument();
    });
});
