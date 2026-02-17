import { render, screen } from '@testing-library/react';
import { addMonths } from 'date-fns';

import type { RequiredCheckResponse } from '@proton/payments/core/checkout';
import { CYCLE } from '@proton/payments/core/constants';
import { SubscriptionMode, TaxInclusive } from '@proton/payments/core/subscription/constants';

import { TaxRow } from './TaxRow';

describe('TaxRow', () => {
    const createMockCheckResult = (overrides = {}): RequiredCheckResponse => ({
        Amount: 1000,
        AmountDue: 1200,
        Currency: 'USD',
        Cycle: CYCLE.YEARLY,
        TaxInclusive: TaxInclusive.INCLUSIVE,
        Coupon: null,
        SubscriptionMode: SubscriptionMode.Regular,
        BaseRenewAmount: null,
        RenewCycle: null,
        Taxes: [
            {
                Name: 'VAT',
                Rate: 20,
                Amount: 200,
            },
        ],
        PeriodEnd: +addMonths(new Date(), (overrides as any).Cycle ?? CYCLE.YEARLY) / 1000,
        ...overrides,
    });

    describe('when checkResult is missing', () => {
        it('returns null when checkResult is undefined', () => {
            const { container } = render(<TaxRow checkResult={undefined} />);

            expect(container.firstChild).toBeNull();
        });

        it('returns null when checkResult is null', () => {
            const { container } = render(<TaxRow checkResult={null as any} />);

            expect(container.firstChild).toBeNull();
        });
    });

    describe('when formatTax returns null', () => {
        it('returns null when taxes array is empty', () => {
            const checkResult = createMockCheckResult({
                Taxes: [],
            });

            const { container } = render(<TaxRow checkResult={checkResult} />);

            expect(container.firstChild).toBeNull();
        });

        it('returns null when taxes array is undefined', () => {
            const checkResult = createMockCheckResult({
                Taxes: undefined,
            });

            const { container } = render(<TaxRow checkResult={checkResult} />);

            expect(container.firstChild).toBeNull();
        });
    });

    describe('when rendering tax information', () => {
        it('renders single tax with custom tax name', () => {
            const checkResult = createMockCheckResult({
                Taxes: [
                    {
                        Name: 'GST',
                        Rate: 15.5,
                        Amount: 155,
                    },
                ],
            });

            render(<TaxRow checkResult={checkResult} />);

            const taxContainer = screen.getByTestId('tax');
            expect(taxContainer).toBeInTheDocument();
            expect(taxContainer).toHaveTextContent('GST 15.5%');
            expect(taxContainer).toHaveTextContent('US$1.55');
        });

        it('renders single tax with default VAT name when tax name is undefined', () => {
            const checkResult = createMockCheckResult({
                Taxes: [
                    {
                        Name: undefined as any,
                        Rate: 20,
                        Amount: 200,
                    },
                ],
            });

            render(<TaxRow checkResult={checkResult} />);

            const taxContainer = screen.getByTestId('tax');
            expect(taxContainer).toBeInTheDocument();
            expect(taxContainer).toHaveTextContent('VAT 20%');
            expect(taxContainer).toHaveTextContent('US$2');
        });

        it('renders multiple taxes with "Taxes" label and combined rate', () => {
            const checkResult = createMockCheckResult({
                Taxes: [
                    {
                        Name: 'VAT',
                        Rate: 20,
                        Amount: 200,
                    },
                    {
                        Name: 'State Tax',
                        Rate: 5,
                        Amount: 50,
                    },
                    {
                        Name: 'City Tax',
                        Rate: 3,
                        Amount: 30,
                    },
                ],
            });

            render(<TaxRow checkResult={checkResult} />);

            const taxContainer = screen.getByTestId('tax');
            expect(taxContainer).toBeInTheDocument();
            expect(taxContainer).toHaveTextContent('Taxes 28%');
            expect(taxContainer).toHaveTextContent('US$2.80');
        });

        it('formats tax rate with correct decimal precision', () => {
            const checkResult = createMockCheckResult({
                Taxes: [
                    {
                        Name: 'VAT',
                        Rate: 8.12345,
                        Amount: 200,
                    },
                ],
            });

            render(<TaxRow checkResult={checkResult} />);

            const taxContainer = screen.getByTestId('tax');
            expect(taxContainer).toBeInTheDocument();
            expect(taxContainer).toHaveTextContent('VAT 8.1235%');
            expect(taxContainer).toHaveTextContent('US$2');
        });

        it('handles different currencies correctly', () => {
            const checkResult = createMockCheckResult({
                Currency: 'EUR',
                Taxes: [
                    {
                        Name: 'VAT',
                        Rate: 21,
                        Amount: 210,
                    },
                ],
            });

            render(<TaxRow checkResult={checkResult} />);

            const taxContainer = screen.getByTestId('tax');
            expect(taxContainer).toBeInTheDocument();
            expect(taxContainer).toHaveTextContent('VAT 21%');
            expect(taxContainer).toHaveTextContent('2.10 €');
        });

        it('handles zero rate taxes', () => {
            const checkResult = createMockCheckResult({
                Taxes: [
                    {
                        Name: 'Exempt',
                        Rate: 0,
                        Amount: 0,
                    },
                ],
            });

            render(<TaxRow checkResult={checkResult} />);

            const taxContainer = screen.getByTestId('tax');
            expect(taxContainer).toBeInTheDocument();
            expect(taxContainer).toHaveTextContent('Exempt 0%');
            expect(taxContainer).toHaveTextContent('US$0');
        });
    });

    describe('component structure', () => {
        it('renders correct DOM structure', () => {
            const checkResult = createMockCheckResult();

            render(<TaxRow checkResult={checkResult} />);

            const taxContainer = screen.getByTestId('tax');
            expect(taxContainer.tagName).toBe('DIV');
            expect(taxContainer).toHaveClass('flex', 'justify-space-between', 'gap-2');

            // Check the direct child spans (Price component creates nested spans)
            const directChildSpans = Array.from(taxContainer.children).filter((child) => child.tagName === 'SPAN');
            expect(directChildSpans).toHaveLength(2);
            expect(directChildSpans[0]).toHaveTextContent('VAT 20%');
            expect(directChildSpans[1]).toHaveTextContent('US$2');
        });

        it('includes price component with correct test id', () => {
            const checkResult = createMockCheckResult();

            render(<TaxRow checkResult={checkResult} />);

            const priceElement = screen.getByTestId('taxAmount');
            expect(priceElement).toBeInTheDocument();
        });
    });

    describe('edge cases', () => {
        it('handles very high tax rates', () => {
            const checkResult = createMockCheckResult({
                Taxes: [
                    {
                        Name: 'High Tax',
                        Rate: 99.9999,
                        Amount: 999,
                    },
                ],
            });

            render(<TaxRow checkResult={checkResult} />);

            const taxContainer = screen.getByTestId('tax');
            expect(taxContainer).toBeInTheDocument();
            expect(taxContainer).toHaveTextContent('High Tax 99.9999%'); // withDecimalPrecision limits to 4 decimal places
            expect(taxContainer).toHaveTextContent('US$9.99');
        });

        it('handles empty tax name gracefully', () => {
            const checkResult = createMockCheckResult({
                Taxes: [
                    {
                        Name: '',
                        Rate: 20,
                        Amount: 200,
                    },
                ],
            });

            render(<TaxRow checkResult={checkResult} />);

            const taxContainer = screen.getByTestId('tax');
            expect(taxContainer).toBeInTheDocument();
            expect(taxContainer).toHaveTextContent('20%'); // Empty name doesn't fall back to VAT, only undefined/null does
            expect(taxContainer).toHaveTextContent('US$2');
        });
    });
});
