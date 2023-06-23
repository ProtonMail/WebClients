export type CryptocurrencyType = 'bitcoin';

export interface CryptoPayment {
    Type: 'cryptocurrency';
    Details: {
        Coin: CryptocurrencyType;
    };
}

export interface WrappedCryptoPayment {
    Payment: CryptoPayment;
}
