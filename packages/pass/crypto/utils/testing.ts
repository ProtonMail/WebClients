import type { PrivateKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import type { ShareGetResponse, ShareKeyResponse, TypedOpenedShare } from '@proton/pass/types';
import { CONTENT_FORMAT_VERSION, ShareType } from '@proton/pass/types';
import { ADDRESS_TYPE } from '@proton/shared/lib/constants';
import type { Address, DecryptedKey } from '@proton/shared/lib/interfaces';

import { createVault } from '../processes/vault/create-vault';

/**
 * Load Crypto API outside of web workers, for testing purposes.
 * Dynamic import to avoid loading the library unless required
 */
export async function setupCryptoProxyForTesting() {
    const { Api: CryptoApi } = await import(
        /* webpackChunkName: "crypto-worker-api" */ '@proton/crypto/lib/worker/api'
    );
    CryptoApi.init();

    CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore());
}

export function releaseCryptoProxy() {
    return CryptoProxy.releaseEndpoint();
}

export function randomKey(): Promise<PrivateKeyReference> {
    return CryptoProxy.generateKey({ userIDs: [{ name: 'TestKey', email: 'test@proton.ch' }], curve: 'ed25519' });
}

export const TEST_KEY_PASSWORD = 'p4ssphr4se';
export const TEST_USER_KEY_ID = 'userkey_123';

export const createRandomKey = async (): Promise<DecryptedKey> => {
    const generatedKey = await randomKey();

    return {
        privateKey: generatedKey,
        publicKey: generatedKey,
        ID: TEST_USER_KEY_ID,
    };
};

export function randomAddress(): Address {
    return {
        DisplayName: '',
        DomainID: '',
        Email: '',
        HasKeys: 0,
        Keys: [],
        Order: 0,
        Priority: 0,
        Receive: 0,
        Send: 0,
        Signature: '',
        SignedKeyList: null,
        Status: 0,
        Type: ADDRESS_TYPE.TYPE_ORIGINAL,
        ID: '345',
        ProtonMX: true,
    };
}

export function randomContents(length: number = 20): Uint8Array {
    let a = [];
    for (let i = 0; i < length; i++) {
        a[i] = Math.ceil(Math.random() * 255);
    }
    return new Uint8Array(a);
}

export const createRandomShareResponses = async (
    userKey: DecryptedKey,
    addressId: string,
    content?: Uint8Array
): Promise<[ShareGetResponse, ShareKeyResponse]> => {
    const vault = await createVault({ content: content ?? randomContents(), userKey, addressId });

    return [
        {
            ShareID: `shareId-${Math.random()}`,
            VaultID: `vaultId-${Math.random()}`,
            AddressID: vault.AddressID,
            TargetType: ShareType.Vault,
            TargetID: `targetId-${Math.random()}`,
            Content: vault.Content,
            Permission: 1,
            ContentKeyRotation: 1,
            ContentFormatVersion: CONTENT_FORMAT_VERSION,
            ExpireTime: 0,
            CreateTime: 0,
            Primary: false,
        },
        {
            Key: vault.EncryptedVaultKey,
            KeyRotation: 1,
            CreateTime: 0,
            UserKeyID: userKey.ID,
        },
    ];
};

export const createRandomShare = <T extends ShareType>(targetType: T): TypedOpenedShare<T> => {
    const base = {
        shareId: `shareId-${Math.random()}`,
        vaultId: `vaultId-${Math.random()}`,
        targetId: `targetId-${Math.random()}`,
        addressId: `addressId-${Math.random()}`,
        permission: 42,
        expireTime: 0,
        createTime: 0,
    };

    switch (targetType) {
        case ShareType.Vault: {
            return {
                ...base,
                targetType,
                content: randomContents(),
                contentKeyRotation: 1,
                contentFormatVersion: CONTENT_FORMAT_VERSION,
            } as TypedOpenedShare<T>;
        }
        case ShareType.Item: {
            return {
                ...base,
                targetType,
                content: null,
                contentKeyRotation: null,
                contentFormatVersion: null,
            } as TypedOpenedShare<T>;
        }
        default: {
            throw new Error('Unknown target share type');
        }
    }
};
