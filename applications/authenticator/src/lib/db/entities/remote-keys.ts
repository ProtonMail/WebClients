import { AuthenticatorEncryptionTag } from 'proton-authenticator/lib/crypto';

import type { DeriveEncryptedEntity } from './encryption';
import { defineEncryptedEntity } from './encryption';

/**
 * NOTE: Legacy `CryptoKey` stored were exportable
 * @deprecated: should not be used outside of migrations
 */
export type LegacyRemoteKey = {
    id: string;
    userKeyId: string;
    key: CryptoKey;
};

export type RemoteKey = {
    id: string;
    userKeyId: string;
    encodedKey: string;
};

export const RemoteKeyEntity = defineEncryptedEntity<RemoteKey>()({
    primaryKey: 'id',
    safeProps: ['id', 'userKeyId'] as const,
    tag: AuthenticatorEncryptionTag.RemoteKey,
});

export type EncryptedItem = DeriveEncryptedEntity<typeof RemoteKeyEntity>;
