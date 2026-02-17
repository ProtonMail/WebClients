import { render, screen } from '@testing-library/react';
import { addMonths } from 'date-fns';

import { CYCLE, SubscriptionMode, TaxInclusive } from '@proton/payments';
import type { RequiredCheckResponse } from '@proton/payments/core/checkout';

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
            expect(taxContainer).toHaveTextContent('Including 15.5% GST');
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
            expect(taxContainer).toHaveTextContent('Including 20% VAT');
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
            expect(taxContainer).toHaveTextContent('Including 28% taxes');
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
            expect(taxContainer).toHaveTextContent('Including 8.1235% VAT');
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
            expect(taxContainer).toHaveTextContent('Including 21% VAT');
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
            expect(taxContainer).toHaveTextContent('Including 0% Exempt');
            expect(taxContainer).toHaveTextContent('US$0');
        });
    });

    describe('when TaxInclusive is EXCLUSIVE', () => {
        it('renders single tax without "Including" prefix', () => {
            const checkResult = createMockCheckResult({
                TaxInclusive: TaxInclusive.EXCLUSIVE,
                Taxes: [
                    {
                        Name: 'VAT',
                        Rate: 20,
                        Amount: 200,
                    },
                ],
            });

            render(<TaxRow checkResult={checkResult} />);

            const taxContainer = screen.getByTestId('tax');
            expect(taxContainer).toBeInTheDocument();
            expect(taxContainer).toHaveTextContent('20% VAT');
            expect(taxContainer).not.toHaveTextContent('Including');
            expect(taxContainer).toHaveTextContent('US$2');
        });

        it('renders multiple taxes without "Including" prefix', () => {
            const checkResult = createMockCheckResult({
                TaxInclusive: TaxInclusive.EXCLUSIVE,
                Taxes: [
                    {
                        Name: 'VAT',
                        Rate: 20,
                        Amount: 200,
                    },
                    {
                        Name: 'State Tax',
                        Rate: 8,
                        Amount: 80,
                    },
                ],
            });

            render(<TaxRow checkResult={checkResult} />);

            const taxContainer = screen.getByTestId('tax');
            expect(taxContainer).toBeInTheDocument();
            expect(taxContainer).toHaveTextContent('28% taxes');
            expect(taxContainer).not.toHaveTextContent('Including');
            expect(taxContainer).toHaveTextContent('US$2.80');
        });

        it('renders custom tax name in exclusive mode', () => {
            const checkResult = createMockCheckResult({
                TaxInclusive: TaxInclusive.EXCLUSIVE,
                Taxes: [
                    {
                        Name: 'GST',
                        Rate: 10,
                        Amount: 100,
                    },
                ],
            });

            render(<TaxRow checkResult={checkResult} />);

            const taxContainer = screen.getByTestId('tax');
            expect(taxContainer).toHaveTextContent('10% GST');
            expect(taxContainer).not.toHaveTextContent('Including');
            expect(taxContainer).toHaveTextContent('US$1');
        });
    });

    describe('when TaxInclusive is undefined', () => {
        it('renders row with amount but no label text in first span', () => {
            const checkResult = createMockCheckResult({
                TaxInclusive: undefined as any,
                Taxes: [
                    {
                        Name: 'VAT',
                        Rate: 20,
                        Amount: 200,
                    },
                ],
            });

            render(<TaxRow checkResult={checkResult} />);

            const taxContainer = screen.getByTestId('tax');
            expect(taxContainer).toBeInTheDocument();
            expect(taxContainer).not.toHaveTextContent('Including');
            expect(taxContainer).toHaveTextContent('US$2');
            const directChildSpans = Array.from(taxContainer.children).filter((child) => child.tagName === 'SPAN');
            expect(directChildSpans).toHaveLength(2);
            expect(directChildSpans[0]).toHaveTextContent('');
            expect(directChildSpans[1]).toHaveTextContent('US$2');
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
            expect(directChildSpans[0]).toHaveTextContent('Including 20% VAT');
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
            expect(taxContainer).toHaveTextContent('Including 99.9999% High Tax'); // withDecimalPrecision limits to 4 decimal places
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
            expect(taxContainer).toHaveTextContent('Including 20%'); // Empty name doesn't fall back to VAT, only undefined/null does
            expect(taxContainer).toHaveTextContent('US$2');
        });
    });
});
