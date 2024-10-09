import type { PrivateKeyReference, PublicKeyReference } from '@proton/crypto/lib';
import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto/lib';
import { stringToUtf8Array } from '@proton/crypto/lib/utils';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';
import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

const IV_LENGTH = 12;
const KEY_LENGTH = 32;
const ALGORITHM = 'AES-GCM';

export enum WalletSignatureContextEnum {
    WALLET_KEY = 'wallet.key',
    BITCOIN_ADDRESS = 'wallet.bitcoin-address',
}

export type WalletSignatureContext = `${WalletSignatureContextEnum}`;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const getSymmetricKey = async (key: Uint8Array): Promise<CryptoKey> => {
    // https://github.com/vercel/edge-runtime/issues/813
    const slicedKey = new Uint8Array(key.slice(0, KEY_LENGTH));

    const x = crypto.subtle.importKey('raw', slicedKey, ALGORITHM, false, ['decrypt', 'encrypt']);
    slicedKey.fill(0);
    return x;
};

//  Taken from pass
export const decryptData = async (key: CryptoKey, data: Uint8Array) => {
    const iv = data.slice(0, IV_LENGTH);
    const cipher = data.slice(IV_LENGTH, data.length);
    const result = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, cipher);

    return new Uint8Array(result);
};

//  Taken from pass
export const generateEntropy = (len: number): Uint8Array => crypto.getRandomValues(new Uint8Array(len));

//  Taken from pass
const encryptData = async (key: CryptoKey, data: Uint8Array) => {
    const iv = generateEntropy(IV_LENGTH);
    const cipher = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, data);

    return mergeUint8Arrays([iv, new Uint8Array(cipher)]);
};

export type EncryptedWalletPart = Partial<
    { mnemonic: string; publicKey: undefined } | { mnemonic: undefined; publicKey: string }
>;

export const decryptTextData = async (armoredMessage: string, keys: PrivateKeyReference[]) => {
    const { data } = await CryptoProxy.decryptMessage({
        armoredMessage,
        decryptionKeys: keys,
        verificationKeys: keys,
    });

    return data;
};

type DecryptReturnType<T extends 'binary' | 'utf8'> = T extends 'binary' ? Uint8Array : string;

export const decryptPgp = async <T extends 'binary' | 'utf8'>(
    armoredMessage: string,
    format: T,
    keys: PrivateKeyReference[]
): Promise<DecryptReturnType<T>> => {
    const { data } = await CryptoProxy.decryptMessage({
        armoredMessage,
        decryptionKeys: keys,
        verificationKeys: keys,
        format,
    });

    return data as DecryptReturnType<T>;
};

const isString = (data: string | Uint8Array): data is string => typeof data === 'string';

export const encryptPgp = async <T extends string | Uint8Array>(
    data: T,
    keys: PublicKeyReference[],
    signingKeys?: PrivateKeyReference[]
) => {
    const common = {
        encryptionKeys: keys,
        signingKeys,
        format: 'armored',
    } as const;

    let message: string;
    if (isString(data)) {
        message = await CryptoProxy.encryptMessage({
            textData: data,
            ...common,
        }).then(({ message }) => message);
    } else {
        message = await CryptoProxy.encryptMessage({
            binaryData: data as Uint8Array,
            ...common,
        }).then(({ message }) => message);
    }

    return message;
};

export const signData = async <T extends string | Uint8Array>(
    data: T,
    context: WalletSignatureContext,
    keys: PrivateKeyReference[]
) => {
    const common = {
        signingKeys: keys,
        detached: true,
        format: 'armored',
        context: { critical: true, value: context },
    } as const;

    let signature;
    if (isString(data)) {
        signature = await CryptoProxy.signMessage({
            textData: data,
            ...common,
        });
    } else {
        signature = await CryptoProxy.signMessage({
            binaryData: data as Uint8Array,
            ...common,
        });
    }

    return signature;
};

export const verifySignedData = async <T extends string | Uint8Array>(
    data: T,
    signature: string,
    context: WalletSignatureContext,
    keys: (PrivateKeyReference | PublicKeyReference)[]
) => {
    const common = {
        armoredSignature: signature,
        verificationKeys: keys,
        context: { required: true, value: context },
    } as const;

    if (isString(data)) {
        return CryptoProxy.verifyMessage({
            textData: data,
            ...common,
        }).then(({ verified }) => verified === VERIFICATION_STATUS.SIGNED_AND_VALID);
    } else {
        return CryptoProxy.verifyMessage({
            binaryData: data as Uint8Array,
            ...common,
        }).then(({ verified }) => verified === VERIFICATION_STATUS.SIGNED_AND_VALID);
    }
};

const decryptArmoredWalletKey = async (walletKey: string, walletKeySignature: string, keys: DecryptedKey[]) => {
    const decryptedEntropy = await decryptPgp(
        walletKey,
        'binary',
        keys.map((k) => k.privateKey)
    );

    const isKeyVerified = await verifySignedData(
        decryptedEntropy,
        walletKeySignature,
        'wallet.key',
        keys.map((k) => k.publicKey)
    );

    if (!isKeyVerified) {
        throw new Error('Key could not be verified');
    }

    return decryptedEntropy;
};

export const decryptWalletKey = async (walletKey: string, walletKeySignature: string, keys: DecryptedKey[]) => {
    const decryptedEntropy = await decryptArmoredWalletKey(walletKey, walletKeySignature, keys);
    return getSymmetricKey(decryptedEntropy);
};

export const decryptWalletKeyForHmac = async (walletKey: string, walletKeySignature: string, keys: DecryptedKey[]) => {
    const decryptedEntropy = await decryptArmoredWalletKey(walletKey, walletKeySignature, keys);

    // https://github.com/vercel/edge-runtime/issues/813
    const slicedKey = new Uint8Array(decryptedEntropy.slice(0, KEY_LENGTH));

    return crypto.subtle.importKey('raw', slicedKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
};

export const hmac = async (hmacKey: CryptoKey, data: string) => {
    return crypto.subtle.sign({ name: 'HMAC', hash: { name: 'SHA-256' } }, hmacKey, stringToUtf8Array(data));
};

/**
 * Encrypts a wallet's data with provided key
 *
 * @param dataToEncrypt an array containing the data to encrypt with the provided wallet key
 * @param key key to use to encrypt wallet data
 * @returns an array containing the data encrypted
 */
export const encryptWalletDataWithWalletKey = async (dataToEncrypt: string[], key: CryptoKey): Promise<string[]> => {
    const encryptedData = await Promise.all(
        dataToEncrypt.map(async (data) => {
            const binaryData = encoder.encode(data);

            const encryptedMnemonic = await encryptData(key, binaryData);
            return uint8ArrayToBase64String(encryptedMnemonic);
        })
    );

    return encryptedData;
};

/**
 * Encrypts a wallet's data
 *
 * @param dataToEncrypt an array containing the data to encrypt with the generated wallet key
 * @param userKey user key to use to encrypt generated wallet key
 * @returns a tupple containing encrypted data and a nested tupple with the encrypted wallet key, its signature, the decrypted wallet key and the id of the user key used to encrypt the wallet key
 */
export const encryptWalletData = async (
    dataToEncrypt: string[],
    userKey: DecryptedKey
): Promise<[string[], [string, string, CryptoKey, string]]> => {
    const entropy = generateEntropy(KEY_LENGTH);
    const key = await getSymmetricKey(entropy);

    const encryptedData = await encryptWalletDataWithWalletKey(dataToEncrypt, key);

    const entropySignature = await signData(entropy, 'wallet.key', [userKey.privateKey]);
    const encryptedEntropy = await encryptPgp(entropy, [userKey.publicKey]);

    return [encryptedData, [encryptedEntropy, entropySignature, key, userKey.ID]];
};

/**
 * Decrypts an array of data using provided wallet key
 *
 * @param dataToDecrypt an array containing wallet's data to decrypt with provided walletKey
 * @param walletKey (a.k.a encrypted entropy) used to encrypt wallet's data
 * @returns an array containing wallet's decrypted wallet
 */
export const decryptWalletData = async (dataToDecrypt: (string | null)[], walletKey: CryptoKey) => {
    const decryptedData = await Promise.all(
        dataToDecrypt.map(async (data) => {
            if (!data) {
                return null;
            }

            try {
                const decodedEncryptedMnemonic = base64StringToUint8Array(data);

                const decryptedBinaryMnemonic = await decryptData(walletKey, decodedEncryptedMnemonic);
                return decoder.decode(decryptedBinaryMnemonic);
            } catch (e) {
                return null;
            }
        })
    );

    return decryptedData;
};

/**
 * Decrypts a mnemonic encrypted with user key
 *
 * @param encryptedMnemonic encrypted mnemonic with user key
 * @param keys used to encrypt mnemonic
 * @returns wallet's mnemonic encrypted with walletKey (a.k.a encrypted entropy)
 */
export const decryptMnemonicWithUserKey = async (encryptedMnemonic: string | null, keys: DecryptedKey[]) => {
    if (encryptedMnemonic === null) {
        return null;
    }
    const { data: decryptedBinaryMnemonic } = await CryptoProxy.decryptMessage({
        binaryMessage: base64StringToUint8Array(encryptedMnemonic),
        decryptionKeys: keys.map((k) => k.privateKey),
        format: 'binary',
    });

    return uint8ArrayToBase64String(decryptedBinaryMnemonic);
};

/**
 * FIXED RANDOM VALUES
 * iv: 138 168 89 85 141 143 120 250 36 179 21 3
 * entropy: 239 203 93 93 253 145 50 82 227 145 154 177 206 86 83 32 251 160 160 29 164 144 177 101 205 128 169 38 59 33 146 218
 *
 * ENCRYPTION
 *
 * mnemonic: benefit indoor helmet wine exist height grain spot rely half beef nothing
 *
 * binaryMnemonic: 98 101 110 101 102 105 116 32 105 110 100 111 111 114 32 104 101 108 109 101 116 32 119 105 110 101 32 101 120 105 115 116 32 104 101 105 103 104 116 32 103 114 97 105 110 32 115 112 111 116 32 114 101 108 121 32 104 97 108 102 32 98 101 101 102 32 110 111 116 104 105 110 103
 *
 * encryptedMnemonic: 138 168 89 85 141 143 120 250 36 179 21 3 59 145 252 29 63 5 174 134 25 223 80 218 184 142 146 129 245 237 29 170 53 179 131 148 228 222 57 45 99 182 246 135 101 10 221 181 70 250 251 35 125 35 177 109 243 193 230 92 122 185 230 244 91 27 211 17 248 41 195 247 96 86 171 61 48 230 236 46 123 89 18 81 70 132 254 219 193 202 154 215 22 179 152 211 60 252 204 177 73
 * encryptedEntropy: 193 94 3 244 235 160 246 244 245 221 113 18 1 7 64 22 214 162 11 26 181 249 56 92 97 7 128 223 100 248 18 178 207 81 159 25 19 170 0 101 211 206 77 221 115 196 121 48 250 109 229 105 64 127 59 226 80 32 162 175 225 90 105 27 134 49 158 218 157 46 88 215 143 169 153 193 193 216 42 47 204 248 104 32 93 246 144 45 217 186 156 252 72 63 160 176 210 192 23 1 208 177 99 227 40 211 59 183 147 160 70 242 28 3 113 219 103 0 35 38 179 123 67 202 109 116 208 188 191 17 214 220 2 22 218 77 89 110 92 218 251 23 51 80 89 123 60 254 141 159 55 239 174 46 90 30 216 18 182 231 109 113 7 141 53 233 27 117 102 174 59 163 106 60 155 167 205 17 248 35 176 194 123 18 229 160 85 78 217 17 156 130 235 24 155 158 176 194 87 54 207 90 95 210 17 210 71 220 8 130 125 21 97 166 114 29 79 144 180 159 49 80 112 8 171 136 127 252 2 137 163 173 154 78 23 218 135 155 72 228 69 65 194 144 254 6 90 153 76 16 139 5 130 119 154 109 71 200 122 87 246 112 72 223 156 160 59 173 252 101 214 11 194 107 76 7 164 19 69 16 127 172 17 66 177 19 92 145 22 200 237 167 108 59 129 133 112 35 96 134 221 143 132 151 32 222 249 224 185 139 6 81 142 186
 *
 * encodedEncryptedEntropy: wV4D9Oug9vT13XESAQdAFtaiCxq1+ThcYQeA32T4ErLPUZ8ZE6oAZdPOTd1zxHkw+m3laUB/O+JQIKKv4VppG4YxntqdLljXj6mZwcHYKi/M+GggXfaQLdm6nPxIP6Cw0sAXAdCxY+Mo0zu3k6BG8hwDcdtnACMms3tDym100Ly/EdbcAhbaTVluXNr7FzNQWXs8/o2fN++uLloe2BK2521xB4016Rt1Zq47o2o8m6fNEfgjsMJ7EuWgVU7ZEZyC6xibnrDCVzbPWl/SEdJH3AiCfRVhpnIdT5C0nzFQcAiriH/8AomjrZpOF9qHm0jkRUHCkP4GWplMEIsFgneabUfIelf2cEjfnKA7rfxl1gvCa0wHpBNFEH+sEUKxE1yRFsjtp2w7gYVwI2CG3Y+ElyDe+eC5iwZRjro=
 * encodedEncryptedMnemonic: iqhZVY2PePoksxUDO5H8HT8FroYZ31DauI6SgfXtHao1s4OU5N45LWO29odlCt21Rvr7I30jsW3zweZcernm9Fsb0xH4KcP3YFarPTDm7C57WRJRRoT+28HKmtcWs5jTPPzMsUk=
 *
 * DECRYPTION
 *
 * encodedEncryptedEntropy: wV4D9Oug9vT13XESAQdAFtaiCxq1+ThcYQeA32T4ErLPUZ8ZE6oAZdPOTd1zxHkw+m3laUB/O+JQIKKv4VppG4YxntqdLljXj6mZwcHYKi/M+GggXfaQLdm6nPxIP6Cw0sAXAdCxY+Mo0zu3k6BG8hwDcdtnACMms3tDym100Ly/EdbcAhbaTVluXNr7FzNQWXs8/o2fN++uLloe2BK2521xB4016Rt1Zq47o2o8m6fNEfgjsMJ7EuWgVU7ZEZyC6xibnrDCVzbPWl/SEdJH3AiCfRVhpnIdT5C0nzFQcAiriH/8AomjrZpOF9qHm0jkRUHCkP4GWplMEIsFgneabUfIelf2cEjfnKA7rfxl1gvCa0wHpBNFEH+sEUKxE1yRFsjtp2w7gYVwI2CG3Y+ElyDe+eC5iwZRjro=
 * encodedEncryptedMnemonic: iqhZVY2PePoksxUDO5H8HT8FroYZ31DauI6SgfXtHao1s4OU5N45LWO29odlCt21Rvr7I30jsW3zweZcernm9Fsb0xH4KcP3YFarPTDm7C57WRJRRoT+28HKmtcWs5jTPPzMsUk=
 *
 * decodedEncryptedEntropy: 193 94 3 244 235 160 246 244 245 221 113 18 1 7 64 22 214 162 11 26 181 249 56 92 97 7 128 223 100 248 18 178 207 81 159 25 19 170 0 101 211 206 77 221 115 196 121 48 250 109 229 105 64 127 59 226 80 32 162 175 225 90 105 27 134 49 158 218 157 46 88 215 143 169 153 193 193 216 42 47 204 248 104 32 93 246 144 45 217 186 156 252 72 63 160 176 210 192 23 1 208 177 99 227 40 211 59 183 147 160 70 242 28 3 113 219 103 0 35 38 179 123 67 202 109 116 208 188 191 17 214 220 2 22 218 77 89 110 92 218 251 23 51 80 89 123 60 254 141 159 55 239 174 46 90 30 216 18 182 231 109 113 7 141 53 233 27 117 102 174 59 163 106 60 155 167 205 17 248 35 176 194 123 18 229 160 85 78 217 17 156 130 235 24 155 158 176 194 87 54 207 90 95 210 17 210 71 220 8 130 125 21 97 166 114 29 79 144 180 159 49 80 112 8 171 136 127 252 2 137 163 173 154 78 23 218 135 155 72 228 69 65 194 144 254 6 90 153 76 16 139 5 130 119 154 109 71 200 122 87 246 112 72 223 156 160 59 173 252 101 214 11 194 107 76 7 164 19 69 16 127 172 17 66 177 19 92 145 22 200 237 167 108 59 129 133 112 35 96 134 221 143 132 151 32 222 249 224 185 139 6 81 142 186
 * decryptedEntropy: 239 203 93 93 253 145 50 82 227 145 154 177 206 86 83 32 251 160 160 29 164 144 177 101 205 128 169 38 59 33 146 218
 *
 * decodedEncryptedMnemonic: 138 168 89 85 141 143 120 250 36 179 21 3 59 145 252 29 63 5 174 134 25 223 80 218 184 142 146 129 245 237 29 170 53 179 131 148 228 222 57 45 99 182 246 135 101 10 221 181 70 250 251 35 125 35 177 109 243 193 230 92 122 185 230 244 91 27 211 17 248 41 195 247 96 86 171 61 48 230 236 46 123 89 18 81 70 132 254 219 193 202 154 215 22 179 152 211 60 252 204 177 73
 * decryptedBinaryMnemonic: 98 101 110 101 102 105 116 32 105 110 100 111 111 114 32 104 101 108 109 101 116 32 119 105 110 101 32 101 120 105 115 116 32 104 101 105 103 104 116 32 103 114 97 105 110 32 115 112 111 116 32 114 101 108 121 32 104 97 108 102 32 98 101 101 102 32 110 111 116 104 105 110 103
 * decryptedMnemonic: benefit indoor helmet wine exist height grain spot rely half beef nothing
 */
