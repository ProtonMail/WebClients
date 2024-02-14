import { render, screen } from '@testing-library/react';

import { WasmBitcoinUnit } from '../../pkg';
import { BitcoinAmount } from './BitcoinAmount';

describe('BitcoinAmount', () => {
    it('should display bitcoin in correct currency', () => {
        render(<BitcoinAmount bitcoin={500100} unit={WasmBitcoinUnit.BTC} />);
        expect(screen.getByText('0.005001 BTC')).toBeInTheDocument();

        render(<BitcoinAmount bitcoin={500100} unit={WasmBitcoinUnit.MBTC} />);
        expect(screen.getByText('5.001 mBTC')).toBeInTheDocument();

        render(<BitcoinAmount bitcoin={500100} unit={WasmBitcoinUnit.SAT} />);
        expect(screen.getByText('500100 SAT')).toBeInTheDocument();
    });

    it('should change precision', () => {
        // default is 6
        render(<BitcoinAmount bitcoin={500100} unit={WasmBitcoinUnit.BTC} />);
        expect(screen.getByText('0.005001 BTC')).toBeInTheDocument();

        render(<BitcoinAmount bitcoin={500100} unit={WasmBitcoinUnit.BTC} precision={3} />);
        expect(screen.getByText('0.005 BTC')).toBeInTheDocument();

        render(<BitcoinAmount bitcoin={500100} unit={WasmBitcoinUnit.BTC} precision={9} />);
        expect(screen.getByText('0.005001000 BTC')).toBeInTheDocument();
    });

    describe('when fiat is provided', () => {
        it('should display fiat converion', () => {
            const { container } = render(<BitcoinAmount bitcoin={500100} unit={WasmBitcoinUnit.BTC} fiat="USD" />);

            expect(container).toHaveTextContent('$18.29');
        });
    });

    describe('when fiat is not provided', () => {
        it('should not display fiat conversion', () => {
            const { container } = render(<BitcoinAmount bitcoin={500100} unit={WasmBitcoinUnit.BTC} />);
            expect(container).not.toHaveTextContent('$18.29');
        });
    });

    describe('format', () => {
        describe('when format is not provided', () => {
            it('should display fiat as first content by default', () => {
                render(<BitcoinAmount bitcoin={500100} unit={WasmBitcoinUnit.BTC} fiat="USD" showColor />);
                expect(screen.getByTestId('first-content').children[0]).toHaveTextContent('$18.29');
            });
        });

        describe('when format is fiatFirst', () => {
            it('should display fiat as first content', () => {
                render(
                    <BitcoinAmount
                        bitcoin={500100}
                        unit={WasmBitcoinUnit.BTC}
                        fiat="USD"
                        format="fiatFirst"
                        showColor
                    />
                );
                expect(screen.getByTestId('first-content').children[0]).toHaveTextContent('$18.29');
            });
        });

        describe('when format is bitcoinFirst', () => {
            it('should display fiat as first content', () => {
                render(
                    <BitcoinAmount
                        bitcoin={500100}
                        unit={WasmBitcoinUnit.BTC}
                        fiat="USD"
                        format="bitcoinFirst"
                        showColor
                    />
                );
                expect(screen.getByTestId('first-content')).toHaveTextContent('0.005001 BTC');
            });
        });

        describe('when fiat is not provided', () => {
            it('should display bitcoin as first content', () => {
                render(
                    <BitcoinAmount bitcoin={500100} unit={WasmBitcoinUnit.BTC} firstClassName="my-first-classname" />
                );
                expect(screen.getByText('0.005001 BTC')).toHaveClass('my-first-classname');
            });
        });
    });

    describe('when showColor is true', () => {
        describe('when amount is negative', () => {
            it('should have first content in red', () => {
                render(<BitcoinAmount bitcoin={-500100} unit={WasmBitcoinUnit.BTC} fiat="USD" showColor />);
                expect(screen.getByTestId('first-content').children[0]).toHaveClass('color-danger');
            });
        });

        describe('when amount is positive', () => {
            it('should have first content in green', () => {
                render(<BitcoinAmount bitcoin={500100} unit={WasmBitcoinUnit.BTC} fiat="USD" showColor />);
                expect(screen.getByTestId('first-content').children[0]).toHaveClass('color-success');
            });
        });
    });
});
