import { render, screen } from '@testing-library/react';

import { exchangeRate } from '@proton/wallet';

import { BitcoinAmount } from './BitcoinAmount';

describe('BitcoinAmount', () => {
    it('should display bitcoin in correct currency', () => {
        render(<BitcoinAmount bitcoin={500100} unit={{ value: 'BTC' }} />);
        expect(screen.getByText('0.005001 BTC')).toBeInTheDocument();

        render(<BitcoinAmount bitcoin={500100} unit={{ value: 'MBTC' }} />);
        expect(screen.getByText('5.001 mBTC')).toBeInTheDocument();

        render(<BitcoinAmount bitcoin={500100} unit={{ value: 'SATS' }} />);
        expect(screen.getByText('500100 SATs')).toBeInTheDocument();
    });

    it('should change precision', () => {
        // default is 6
        render(<BitcoinAmount bitcoin={500100} unit={{ value: 'BTC' }} />);
        expect(screen.getByText('0.005001 BTC')).toBeInTheDocument();

        render(<BitcoinAmount bitcoin={500100} unit={{ value: 'BTC' }} precision={3} />);
        expect(screen.getByText('0.005 BTC')).toBeInTheDocument();

        render(<BitcoinAmount bitcoin={500100} unit={{ value: 'BTC' }} precision={9} />);
        expect(screen.getByText('0.005001000 BTC')).toBeInTheDocument();
    });

    describe('when fiat is provided', () => {
        it('should display fiat converion', () => {
            const { container } = render(
                <BitcoinAmount bitcoin={500100} unit={{ value: 'BTC' }} exchangeRate={{ value: exchangeRate }} />
            );

            expect(container).toHaveTextContent('$18.29');
        });
    });

    describe('when fiat is not provided', () => {
        it('should not display fiat conversion', () => {
            const { container } = render(<BitcoinAmount bitcoin={500100} unit={{ value: 'BTC' }} />);
            expect(container).not.toHaveTextContent('$18.29');
        });
    });

    describe('format', () => {
        describe('when format is not provided', () => {
            it('should display fiat as first content by default', () => {
                const { container } = render(
                    <BitcoinAmount
                        bitcoin={500100}
                        unit={{ value: 'BTC' }}
                        exchangeRate={{ value: exchangeRate }}
                        showColor
                    />
                );

                expect(container).toHaveTextContent('$18.29');
                expect(screen.getByTestId('first-content')).toHaveTextContent('18.29');
            });
        });

        describe('when format is fiatFirst', () => {
            it('should display fiat as first content', () => {
                const { container } = render(
                    <BitcoinAmount
                        bitcoin={500100}
                        unit={{ value: 'BTC' }}
                        exchangeRate={{ value: exchangeRate }}
                        format="fiatFirst"
                        showColor
                    />
                );

                expect(container).toHaveTextContent('$18.29');
                expect(screen.getByTestId('first-content')).toHaveTextContent('18.29');
            });
        });

        describe('when format is bitcoinFirst', () => {
            it('should display fiat as first content', () => {
                render(
                    <BitcoinAmount
                        bitcoin={500100}
                        unit={{ value: 'BTC' }}
                        exchangeRate={{ value: exchangeRate }}
                        format="bitcoinFirst"
                        showColor
                    />
                );
                expect(screen.getByTestId('first-content')).toHaveTextContent('0.005001 BTC');
            });
        });

        describe('when fiat is not provided', () => {
            it('should display bitcoin as first content', () => {
                render(<BitcoinAmount bitcoin={500100} unit={{ value: 'BTC' }} firstClassName="my-first-classname" />);
                expect(screen.getByText('0.005001 BTC')).toHaveClass('my-first-classname');
            });
        });
    });

    describe('when showColor is true', () => {
        // testing with bitcoinFirst is easier than testing with fiatFirst
        describe('when amount is negative', () => {
            it('should have first content in red', () => {
                render(
                    <BitcoinAmount
                        format="bitcoinFirst"
                        bitcoin={-500100}
                        unit={{ value: 'BTC' }}
                        exchangeRate={{ value: exchangeRate }}
                        showColor
                    />
                );
                expect(screen.getByTestId('first-content')).toHaveClass('color-danger');
            });
        });

        describe('when amount is positive', () => {
            it('should have first content in green', () => {
                render(
                    <BitcoinAmount
                        format="bitcoinFirst"
                        bitcoin={500100}
                        unit={{ value: 'BTC' }}
                        exchangeRate={{ value: exchangeRate }}
                        showColor
                    />
                );
                expect(screen.getByTestId('first-content')).toHaveClass('color-success');
            });
        });
    });
});
