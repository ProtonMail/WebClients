export type AesGcmCryptoKey = {
    type: 'AesGcmCryptoKey';
    encryptKey: CryptoKey;
};

export type AesKwCryptoKey = {
    type: 'AesKwCryptoKey';
    wrappingKey: CryptoKey;
};
