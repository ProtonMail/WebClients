import type { ItemSyncMetadata } from 'proton-authenticator/lib/db/entities/items';

import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

import type {
    AuthenticatorCreateEntriesRequest,
    AuthenticatorEntryDeleteBulkInput,
    AuthenticatorEntryUpdateBulkRequest,
    AuthenticatorEntryUpdateWithEntryRequest,
    AuthenticatorReorderEntryRequest,
} from './types';

export const getAuthenticatorKeys = () => ({
    method: 'get',
    url: 'authenticator/v1/key',
});

export const storeAuthenticatorKey = (Key: string) => ({
    method: 'post',
    url: 'authenticator/v1/key',
    data: { Key },
});

export const getEntries = (Since?: string) => ({
    method: 'get',
    url: 'authenticator/v1/entry',
    params: { Since },
});

export const createEntries = (encryptedEntries: Uint8Array<ArrayBuffer>[], keyId: string) => {
    const data: AuthenticatorCreateEntriesRequest = {
        Entries: encryptedEntries.map((content) => ({
            AuthenticatorKeyID: keyId,
            Content: uint8ArrayToBase64String(content),
            ContentFormatVersion: 1,
        })),
    };

    return {
        method: 'post',
        url: 'authenticator/v1/entry/bulk',
        data,
    };
};

export const deleteEntries = (encryptedIds: string[]) => {
    const data: AuthenticatorEntryDeleteBulkInput = { EntryIDs: encryptedIds };

    return {
        method: 'delete',
        url: `authenticator/v1/entry/bulk`,
        data,
    };
};

export const updateEntries = (
    payload: { syncMetadata: ItemSyncMetadata; encryptedEntry: Uint8Array<ArrayBuffer> }[]
) => {
    const Entries: AuthenticatorEntryUpdateWithEntryRequest[] = payload.map((i) => ({
        Content: uint8ArrayToBase64String(i.encryptedEntry),
        EntryID: i.syncMetadata.entryId,
        AuthenticatorKeyID: i.syncMetadata.keyId,
        LastRevision: i.syncMetadata.revision,
        ContentFormatVersion: 1,
    }));

    const data: AuthenticatorEntryUpdateBulkRequest = { Entries };

    return {
        method: 'put',
        url: `authenticator/v1/entry/bulk`,
        data,
    };
};

export const reorderEntry = (entryId: string, data: AuthenticatorReorderEntryRequest) => ({
    method: 'put',
    url: `authenticator/v1/entry/${entryId}/order`,
    data,
});
