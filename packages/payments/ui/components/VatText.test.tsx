import { render, screen } from '@testing-library/react';

import { addMonths } from '@proton/shared/lib/date-fns-utc';

import { CYCLE, PLANS } from '../../core/constants';
import { SubscriptionMode, TaxInclusive } from '../../core/subscription/constants';
import type { SubscriptionEstimation } from '../../core/subscription/interface';
import { InclusiveVatText } from './VatText';

describe('InclusiveVatText', () => {
    const createMockCheckResult = (overrides = {}): SubscriptionEstimation => ({
        Amount: 1000,
        AmountDue: 1200,
        Currency: 'USD',
        Cycle: CYCLE.YEARLY,
        TaxInclusive: TaxInclusive.INCLUSIVE,
        Coupon: null,
        SubscriptionMode: SubscriptionMode.Regular,
        BaseRenewAmount: null,
        RenewCycle: null,
        PeriodEnd: +addMonths(new Date(), (overrides as any).Cycle ?? CYCLE.YEARLY) / 1000,
        Taxes: [
            {
                Name: 'VAT',
                Rate: 20,
                Amount: 200,
            },
        ],
        requestData: {
            Plans: { [PLANS.MAIL]: 1 },
            Currency: 'USD',
            Cycle: CYCLE.YEARLY,
        },
        ...overrides,
    });

    describe('when tax is not inclusive', () => {
        it('returns null when TaxInclusive is not INCLUSIVE', () => {
            const checkResult = createMockCheckResult({
                TaxInclusive: TaxInclusive.EXCLUSIVE,
            });

            const { container } = render(<InclusiveVatText checkResult={checkResult} />);

            expect(container.firstChild).toBeNull();
        });

        it('returns null when TaxInclusive is undefined', () => {
            const checkResult = createMockCheckResult({
                TaxInclusive: undefined,
            });

            const { container } = render(<InclusiveVatText checkResult={checkResult} />);

            expect(container.firstChild).toBeNull();
        });
    });

    describe('when tax is inclusive but missing data', () => {
        it('returns null when taxes array is empty', () => {
            const checkResult = createMockCheckResult({
                Taxes: [],
            });

            const { container } = render(<InclusiveVatText checkResult={checkResult} />);

            expect(container.firstChild).toBeNull();
        });

        it('returns null when taxes array is undefined', () => {
            const checkResult = createMockCheckResult({
                Taxes: undefined,
            });

            const { container } = render(<InclusiveVatText checkResult={checkResult} />);

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

            render(<InclusiveVatText checkResult={checkResult} />);

            const taxContainer = screen.getByTestId('tax');
            expect(taxContainer).toBeInTheDocument();
            expect(taxContainer).toHaveTextContent('Including 15.5% tax: US$1.55');
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

            render(<InclusiveVatText checkResult={checkResult} />);

            const taxContainer = screen.getByTestId('tax');
            expect(taxContainer).toBeInTheDocument();
            expect(taxContainer).toHaveTextContent('Including 20% tax: US$2');
        });

        it('applies custom className when provided', () => {
            const checkResult = createMockCheckResult();
            const customClassName = 'custom-tax-class';

            render(<InclusiveVatText checkResult={checkResult} className={customClassName} />);

            const taxContainer = screen.getByTestId('tax');
            expect(taxContainer).toHaveClass(customClassName);
            expect(taxContainer).toHaveTextContent('Including 20% tax: US$2');
        });

        it('does not apply className when not provided', () => {
            const checkResult = createMockCheckResult();

            render(<InclusiveVatText checkResult={checkResult} />);

            const taxContainer = screen.getByTestId('tax');
            expect(taxContainer).not.toHaveClass();
            expect(taxContainer.className).toBe('');
            expect(taxContainer).toHaveTextContent('Including 20% tax: US$2');
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

            render(<InclusiveVatText checkResult={checkResult} />);

            const taxContainer = screen.getByTestId('tax');
            expect(taxContainer).toBeInTheDocument();
            expect(taxContainer).toHaveTextContent('Including 8.1235% tax: US$2');
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

            render(<InclusiveVatText checkResult={checkResult} />);

            const taxContainer = screen.getByTestId('tax');
            expect(taxContainer).toBeInTheDocument();
            expect(taxContainer).toHaveTextContent('Including 21% tax: 2.10 €');
        });
    });

    describe('partial props', () => {
        it('handles undefined checkResult gracefully', () => {
            const { container } = render(<InclusiveVatText checkResult={undefined} />);

            expect(container.firstChild).toBeNull();
        });

        it('handles missing className gracefully', () => {
            const checkResult = createMockCheckResult();

            render(<InclusiveVatText checkResult={checkResult} />);

            const taxContainer = screen.getByTestId('tax');
            expect(taxContainer).toBeInTheDocument();
            expect(taxContainer.className).toBe('');
            expect(taxContainer).toHaveTextContent('Including 20% tax: US$2');
        });
    });

    describe('component structure', () => {
        it('renders correct DOM structure', () => {
            const checkResult = createMockCheckResult();

            render(<InclusiveVatText checkResult={checkResult} />);

            const taxContainer = screen.getByTestId('tax');
            expect(taxContainer.tagName).toBe('DIV');
            expect(taxContainer).toHaveTextContent('Including 20% tax: US$2');

            const spanElement = taxContainer.querySelector('span');
            expect(spanElement).toBeInTheDocument();
        });

        it('includes price component with correct test id', () => {
            const checkResult = createMockCheckResult();

            render(<InclusiveVatText checkResult={checkResult} />);

            const taxContainer = screen.getByTestId('tax');
            expect(taxContainer).toHaveTextContent('Including 20% tax: US$2');

            const priceElement = screen.getByTestId('taxAmount');
            expect(priceElement).toBeInTheDocument();
        });
    });

    describe('multiple taxes', () => {
        it('should render multiple taxes by summing up tax amounts', () => {
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

            render(<InclusiveVatText checkResult={checkResult} />);

            const taxContainer = screen.getByTestId('tax');
            expect(taxContainer).toBeInTheDocument();
            expect(taxContainer).toHaveTextContent('Including 28% taxes: US$2.80');
        });
    });
});
