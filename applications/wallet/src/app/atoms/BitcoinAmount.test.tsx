import { render, screen } from '@testing-library/react';

import { BitcoinUnitEnum } from '../types';
import { BitcoinAmount } from './BitcoinAmount';

describe('BitcoinAmount', () => {
    it('should display bitcoin in correct currency', () => {
        render(<BitcoinAmount unit={BitcoinUnitEnum.BTC}>{500100}</BitcoinAmount>);
        expect(screen.getByText('0.005001 BTC')).toBeInTheDocument();

        render(<BitcoinAmount unit={BitcoinUnitEnum.mBTC}>{500100}</BitcoinAmount>);
        expect(screen.getByText('5.001 mBTC')).toBeInTheDocument();

        render(<BitcoinAmount unit={BitcoinUnitEnum.SAT}>{500100}</BitcoinAmount>);
        expect(screen.getByText('500100 SAT')).toBeInTheDocument();
    });

    it('should change precision', () => {
        // default is 6
        render(<BitcoinAmount unit={BitcoinUnitEnum.BTC}>{500100}</BitcoinAmount>);
        expect(screen.getByText('0.005001 BTC')).toBeInTheDocument();

        render(
            <BitcoinAmount unit={BitcoinUnitEnum.BTC} precision={3}>
                {500100}
            </BitcoinAmount>
        );
        expect(screen.getByText('0.005 BTC')).toBeInTheDocument();

        render(
            <BitcoinAmount unit={BitcoinUnitEnum.BTC} precision={9}>
                {500100}
            </BitcoinAmount>
        );
        expect(screen.getByText('0.005001000 BTC')).toBeInTheDocument();
    });

    describe('when fiat is provided', () => {
        it('should display fiat converion', () => {
            const { container } = render(
                <BitcoinAmount unit={BitcoinUnitEnum.BTC} fiat="USD">
                    {500100}
                </BitcoinAmount>
            );

            expect(container).toHaveTextContent('$18.29');
        });
    });

    describe('when fiat is not provided', () => {
        it('should not display fiat conversion', () => {
            const { container } = render(<BitcoinAmount unit={BitcoinUnitEnum.BTC}>{500100}</BitcoinAmount>);

            expect(container).not.toHaveTextContent('$18.29');
        });
    });
});
