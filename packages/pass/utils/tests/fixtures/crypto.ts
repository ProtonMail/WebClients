import type { PrivateKeyReference } from '@protontech/crypto';
import { CryptoProxy } from '@protontech/crypto';

import { ADDRESS_TYPE } from '@proton/shared/lib/constants';
import { type Address, AddressConfirmationState } from '@proton/shared/lib/interfaces/Address';
import type { Group } from '@proton/shared/lib/interfaces/Group';
import type { AddressKey, DecryptedKey } from '@proton/shared/lib/interfaces/Key';

import { createVault } from '../../../lib/crypto/processes/vault/create-vault';
import { generateKey, importSymmetricKey } from '../../../lib/crypto/utils/crypto-helpers';
import type { ShareGetResponse, ShareKeyResponse } from '../../../types/api/pass';
import type { ItemKey, TypedOpenedShare, VaultShareKey } from '../../../types/crypto/pass-types';
import { ContentFormatVersion } from '../../../types/crypto/pass-types';
import { ShareType } from '../../../types/data/shares';
import { uniqueId } from '../../string/unique-id';

/* Load Crypto API outside of web workers, for testing purposes.
 * Dynamic import to avoid loading the library unless required */
export async function setupCryptoProxyForTesting() {
    const { Api: CryptoApi } = await import(
        /* webpackChunkName: "crypto-worker-api" */ '@protontech/crypto/proxy/endpoint/api.ts'
    );
    CryptoApi.init({});
    CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore());
}

export function releaseCryptoProxy() {
    return CryptoProxy.releaseEndpoint();
}

function randomKey(): Promise<PrivateKeyReference> {
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

export const randomContents = (length: number = 20): Uint8Array<ArrayBuffer> =>
    crypto.getRandomValues(new Uint8Array(length));

export const createRandomShareResponses = async (
    encryptionKey: DecryptedKey,
    signingKey: DecryptedKey,
    addressId: string,
    content?: Uint8Array<ArrayBuffer>
): Promise<[ShareGetResponse, ShareKeyResponse]> => {
    const vault = await createVault({
        content: content ?? randomContents(),
        encryptionKey,
        signingKey,
        addressId,
    });

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
            ShareID: `shareId-${uniqueId()}`,
            ShareRoleID: '1',
            TargetID: `targetId-${uniqueId()}`,
            TargetMaxMembers: 2,
            TargetMembers: 1,
            TargetType: ShareType.Vault,
            VaultID: `vaultId-${uniqueId()}`,
            CanAutoFill: true,
            Flags: 0,
        },
        {
            Key: vault.EncryptedVaultKey,
            KeyRotation: 1,
            CreateTime: 0,
            UserKeyID: encryptionKey.ID,
        },
    ];
};

export const createRandomShare = <T extends ShareType>(targetType: T): TypedOpenedShare<T> => {
    const base = {
        shareId: `shareId-${uniqueId()}`,
        vaultId: `vaultId-${uniqueId()}`,
        targetId: `targetId-${uniqueId()}`,
        addressId: `addressId-${uniqueId()}`,
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

export const createRandomGroupKey = async (
    groupId: string
): Promise<{ group: Group; groupKey: DecryptedKey; groupPublicKey: string }> => {
    const groupKey = await createRandomKey();
    const groupArmoredKey = await CryptoProxy.exportPrivateKey({
        format: 'armored',
        privateKey: groupKey.privateKey,
        passphrase: TEST_KEY_PASSWORD,
    });
    const groupPublicKey = await CryptoProxy.exportPublicKey({
        key: groupKey.publicKey,
        format: 'armored',
    });
    const groupAddressKey: AddressKey = {
        ID: groupKey.ID,
        PrivateKey: groupArmoredKey,
        Primary: 1,
        Active: 1,
        Fingerprint: '',
        Fingerprints: [],
        Version: 1,
        Flags: 0,
        Signature: '',
        AddressForwardingID: '',
    };
    const group = {
        ID: groupId,
        Address: { ...randomAddress(), Keys: [groupAddressKey] },
    } as unknown as Group;

    return { group, groupKey, groupPublicKey };
};
