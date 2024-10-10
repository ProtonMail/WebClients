import type { WasmApiExchangeRate } from '@proton/andromeda';
import { WasmNetwork } from '@proton/andromeda';

import { convertAmount, isValidBitcoinAddress } from '.';

describe('bitcoin', () => {
    describe('convertAmount', () => {
        const exchangeRate: WasmApiExchangeRate = {
            ID: '2XgZit8mlLoQu08C93KKnJ8nfwgg5uPOh10HjHciopEhgTisa8UdyjybLMSrQipnY6CvspQgdiuJ_3UTeLUt4w==',
            BitcoinUnit: 'BTC',
            FiatCurrency: 'USD',
            ExchangeRateTime: '2024-03-07T07:01:06+00:00',
            ExchangeRate: 5817100,
            Cents: 100,
            Sign: '$',
        };

        describe('to exchange rate', () => {
            it('should convert BTC to ExchangeRate', () => {
                const btc = 0.000017;
                expect(convertAmount(btc, 'BTC', exchangeRate)).toEqual(0.99);
            });

            it('should convert MBTC to ExchangeRate', () => {
                const mbtc = 0.017;
                expect(convertAmount(mbtc, 'MBTC', exchangeRate)).toEqual(0.99);
            });

            it('should convert SATS to ExchangeRate', () => {
                const sats = 1700;
                expect(convertAmount(sats, 'SATS', exchangeRate)).toEqual(0.99);
            });
        });

        describe('to BTC', () => {
            it('should convert ExchangeRate to BTC', () => {
                const fiat = 0.988907;
                expect(convertAmount(fiat, exchangeRate, 'BTC')).toEqual(0.000017);
            });

            it('should convert SATS to BTC', () => {
                const sats = 1700;
                expect(convertAmount(sats, 'SATS', 'BTC')).toEqual(0.000017);
            });

            it('should convert MBTC to BTC', () => {
                const mbtc = 0.017;
                expect(convertAmount(mbtc, 'MBTC', 'BTC')).toEqual(0.000017);
            });
        });

        describe('to MBTC', () => {
            it('should convert ExchangeRate to MBTC', () => {
                const fiat = 0.988907;
                expect(convertAmount(fiat, exchangeRate, 'MBTC')).toEqual(0.017);
            });

            it('should convert SATS to MBTC', () => {
                const sats = 1700;
                expect(convertAmount(sats, 'SATS', 'MBTC')).toEqual(0.017);
            });

            it('should convert BTC to MBTC', () => {
                const btc = 0.000017;
                expect(convertAmount(btc, 'BTC', 'MBTC')).toEqual(0.017);
            });
        });

        describe('to SATS', () => {
            it('should convert ExchangeRate to SATS', () => {
                const fiat = 0.988907;
                expect(convertAmount(fiat, exchangeRate, 'SATS')).toEqual(1700);
            });

            it('should convert MBTC to SATS', () => {
                const mbtc = 0.017;
                expect(convertAmount(mbtc, 'MBTC', 'SATS')).toEqual(1700);
            });

            it('should convert BTC to SATS', () => {
                const btc = 0.000017;
                expect(convertAmount(btc, 'BTC', 'SATS')).toEqual(1700);
            });
        });
    });

    describe('isValidBitcoinAddress', () => {
        it('should return true', () => {
            expect(
                isValidBitcoinAddress('tb1qft6ryf9qg5tsw7x4j34xt6aph0jmrp5ufda3dr', WasmNetwork.Testnet)
            ).toBeTruthy();
        });

        it('should return false', () => {
            expect(isValidBitcoinAddress('tb1.AHKBE', WasmNetwork.Testnet)).toBeFalsy();
        });
    });
});
