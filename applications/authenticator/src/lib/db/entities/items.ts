import type { WasmLocalEntryState } from '@protontech/authenticator-rust-core/worker';
import { AuthenticatorEncryptionTag } from 'proton-authenticator/lib/crypto';

import type { DeriveEncryptedEntity } from './encryption';
import { defineEncryptedEntity } from './encryption';

export type ItemSyncMetadata = {
    entryId: string;
    revision: number;
    keyId: string;
    modifyTime: number;
    state: WasmLocalEntryState;
};

export type Item = {
    entryType: 'Totp' | 'Steam';
    id: string;
    issuer: string;
    name: string;
    note: string;
    order: number;
    period: number;
    secret: string;
    syncMetadata?: ItemSyncMetadata;
    uri: string;
};

export const ItemEntity = defineEncryptedEntity<Item>()({
    primaryKey: 'id',
    safeProps: ['id', 'issuer', 'name', 'order'] as const,
    tag: AuthenticatorEncryptionTag.Item,
});

export type EncryptedItem = DeriveEncryptedEntity<typeof ItemEntity>;
