import type { PrivateKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import type { ItemKey, ShareGetResponse, ShareKeyResponse, TypedOpenedShare, VaultShareKey } from '@proton/pass/types';
import { ContentFormatVersion, ShareType } from '@proton/pass/types';
import { ADDRESS_TYPE } from '@proton/shared/lib/constants';
import { type Address, AddressConfirmationState, type DecryptedKey } from '@proton/shared/lib/interfaces';

import { createVault } from '../processes/vault/create-vault';
import { generateKey, importSymmetricKey } from './crypto-helpers';

/* Load Crypto API outside of web workers, for testing purposes.
 * Dynamic import to avoid loading the library unless required */
export async function setupCryptoProxyForTesting() {
    const { Api: CryptoApi } = await import(
        /* webpackChunkName: "crypto-worker-api" */ '@proton/crypto/lib/worker/api'
    );
    CryptoApi.init({ enforceOpenpgpGrammar: true });
    CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore());
}

export function releaseCryptoProxy() {
    return CryptoProxy.releaseEndpoint();
}

export function randomKey(): Promise<PrivateKeyReference> {
    return CryptoProxy.generateKey({ userIDs: [{ name: 'TestKey', email: 'test@proton.ch' }] });
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
        CatchAll: false,
        ConfirmationState: AddressConfirmationState.CONFIRMATION_CONFIRMED,
        DisplayName: '',
        DomainID: '',
        Email: '',
        HasKeys: 0,
        ID: '345',
        Keys: [],
        Order: 0,
        Permissions: 7,
        Priority: 0,
        ProtonMX: true,
        Receive: 0,
        Send: 0,
        Signature: '',
        SignedKeyList: null,
        Status: 0,
        Type: ADDRESS_TYPE.TYPE_ORIGINAL,
    };
}

export function randomContents(length: number = 20): Uint8Array<ArrayBuffer> {
    const a = [];
    for (let i = 0; i < length; i++) {
        a[i] = Math.ceil(Math.random() * 255);
    }
    return new Uint8Array(a);
}

export const createRandomShareResponses = async (
    userKey: DecryptedKey,
    addressId: string,
    content?: Uint8Array<ArrayBuffer>
): Promise<[ShareGetResponse, ShareKeyResponse]> => {
    const vault = await createVault({ content: content ?? randomContents(), userKey, addressId });

    return [
        {
            AddressID: vault.AddressID,
            Content: vault.Content,
            ContentFormatVersion: ContentFormatVersion.Share,
            ContentKeyRotation: 1,
            CreateTime: 0,
            ExpireTime: 0,
            NewUserInvitesReady: 0,
            Owner: true,
            PendingInvites: 0,
            Permission: 1,
            Primary: false,
            Shared: false,
            ShareID: `shareId-${Math.random()}`,
            ShareRoleID: '1',
            TargetID: `targetId-${Math.random()}`,
            TargetMaxMembers: 2,
            TargetMembers: 1,
            TargetType: ShareType.Vault,
            VaultID: `vaultId-${Math.random()}`,
            CanAutoFill: true,
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
                contentFormatVersion: ContentFormatVersion.Share,
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

export const createRandomVaultKey = async (rotation: number): Promise<VaultShareKey> => {
    const raw = generateKey();
    const key = await importSymmetricKey(raw);
    return { key, raw, rotation, userKeyId: undefined };
};

export const createRandomItemKey = async (rotation: number): Promise<ItemKey> => {
    const raw = generateKey();
    const key = await importSymmetricKey(raw);
    return { key, raw, rotation };
};
