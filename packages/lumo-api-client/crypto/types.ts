export type AesGcmCryptoKey = {
    type: 'AesGcmCryptoKey';
    encryptKey: CryptoKey;
};

export type SpaceDataEncryptionCryptoKey = AesGcmCryptoKey;

export type AesKwCryptoKey = {
    type: 'AesKwCryptoKey';
    wrappingKey: CryptoKey;
};

export type MasterCryptoKey = AesKwCryptoKey;
