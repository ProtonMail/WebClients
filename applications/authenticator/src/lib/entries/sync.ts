import type { WasmEntryOperation, WasmOperationType } from '@protontech/authenticator-rust-core/worker';
import {
    createEntries,
    deleteEntries,
    getAuthenticatorKeys,
    getEntries,
    reorderEntry,
    storeAuthenticatorKey,
    updateEntries,
} from 'proton-authenticator/lib/api';
import type {
    AuthenticatorEntriesResponse,
    AuthenticatorEntryResponse,
    AuthenticatorKeyResponse,
    AuthenticatorKeysResponse,
} from 'proton-authenticator/lib/api/types';
import { type EncryptionKey, authService } from 'proton-authenticator/lib/auth/service';
import { db } from 'proton-authenticator/lib/db/db';
import type { Item } from 'proton-authenticator/lib/db/entities/items';
import logger from 'proton-authenticator/lib/logger';
import { withErrorDetails } from 'proton-authenticator/lib/utils/errors';
import { service } from 'proton-authenticator/lib/wasm/service';
import type { AppThunkExtra } from 'proton-authenticator/store';
import { c } from 'ttag';

import { CryptoProxy } from '@proton/crypto';
import { createPageIterator } from '@proton/pass/lib/api/utils';
import type { Maybe } from '@proton/pass/types/utils';
import { prop } from '@proton/pass/utils/fp/lens';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { seq } from '@proton/pass/utils/fp/promises';
import { sortOn } from '@proton/pass/utils/fp/sort';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import { toMap } from '@proton/shared/lib/helpers/object';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';
import chunk from '@proton/utils/chunk';
import noop from '@proton/utils/noop';

import type { WasmRemoteEntryWithKey } from './items';
import { fromRemoteWasmEntry, toLocalWasmEntry, toWasmEntry } from './items';
import { getOrderByIndex, itemSyncSortWithOrdering } from './ordering';

type SyncState = {
    lastUpdated?: Date;
    abortController?: AbortController;
};

const STATE: SyncState = {};
const BATCH_SIZE = 100;

const serializeKey = async (keyBytes: Uint8Array<ArrayBuffer>, userKey: DecryptedKey) => {
    const { message } = await CryptoProxy.encryptMessage({
        binaryData: keyBytes,
        encryptionKeys: [userKey.publicKey],
        signingKeys: [userKey.privateKey],
        format: 'binary',
    });

    return uint8ArrayToBase64String(message);
};

const parseRemoteKey = async ({ UserKeyID, Key, KeyID }: AuthenticatorKeyResponse): Promise<Maybe<EncryptionKey>> => {
    try {
        const userKeys = authService.getUserKeys();
        const userKey = userKeys.find(({ ID }) => ID === UserKeyID);

        if (!userKey) {
            logger.warn(`[Sync::parseRemoteKey] User key ${UserKeyID} not found for remote key ${KeyID}`);
            return;
        }

        const { data: keyBytes } = await CryptoProxy.decryptMessage({
            binaryMessage: base64StringToUint8Array(Key),
            decryptionKeys: [userKey.privateKey],
            verificationKeys: [userKey.publicKey],
            format: 'binary',
            expectSigned: true,
        });

        return { id: KeyID, userKeyId: UserKeyID, keyBytes };
    } catch {}
};

const parseRemoteEntry = async (payload: AuthenticatorEntryResponse): Promise<Maybe<WasmRemoteEntryWithKey>> => {
    try {
        const key = await authService.getEncryptionKeyById(payload.AuthenticatorKeyID);

        if (!key) {
            logger.warn(`[Sync::parseRemoteEntry] Missing key ${payload.AuthenticatorKeyID}`);
            return;
        }

        const content = base64StringToUint8Array(payload.Content);
        const [entry] = service.decrypt_entries([content], key.keyBytes);

        return {
            entry: { ...entry, note: entry.note ?? '' },
            keyId: payload.AuthenticatorKeyID,
            modify_time: payload.ModifyTime,
            remote_id: payload.EntryID,
            revision: payload.Revision,
        };
    } catch {
        logger.error(`[Sync::parseRemoteEntry] Failed to parse entry (${payload.EntryID})`);
    }
};

const mergeRemoteEntries = async (remoteEntries: AuthenticatorEntryResponse[]) => {
    if (!remoteEntries.length) return;

    logger.info(`[Sync::mergeRemoteEntries] Merging ${remoteEntries.length} remote entries`);

    try {
        const parsedRemoteEntries = (await Promise.all(remoteEntries.map(parseRemoteEntry))).filter(truthy);
        const changeset = parsedRemoteEntries.map(fromRemoteWasmEntry).map((item) => ({
            key: item.id,
            changes: item,
        }));

        await db.items.bulkUpdate(changeset);
        logger.info(`[Sync::mergeRemoteEntries] Merged ${changeset.length}/${remoteEntries.length}`);
    } catch (err) {
        logger.error(`[Sync::mergeRemoteEntries] Failed to merge ${remoteEntries.length} entries (${err})`);
        throw err;
    }
};

export const fetchRemoteKeys = async () => {
    logger.info(`[Sync::fetchRemoteKeys] Fetching remote keys`);

    const api = authService.getApi();
    if (!api) throw new Error('Missing API');

    const userKeys = authService.getUserKeys();
    const [primaryUserKey] = userKeys;

    if (!userKeys.length) throw new Error('[Sync::fetchRemoteKeys] Missing user keys');

    /** Fetch all authenticator keys from server and filter to only our user keys */
    const { Keys } = (await api<{ Keys: AuthenticatorKeysResponse }>(getAuthenticatorKeys())).Keys;
    const activeKeys = Keys.filter(({ UserKeyID }) => userKeys.some(({ ID }) => ID === UserKeyID));

    /** Parse remote keys - some may fail due to corruption or credential changes */
    const remoteEncryptionKeys = (await Promise.all(activeKeys.map(parseRemoteKey))).filter(truthy);
    const remoteEncryptionKeyForPrimaryKey = remoteEncryptionKeys.find((key) => key.userKeyId === primaryUserKey.ID);

    logger.info(`[Sync::fetchRemoteKeys] Fetched ${remoteEncryptionKeys.length}/${activeKeys.length} remote keys`);

    /** Critical error: Server has keys for all our user keys but we parsed none.
     * This indicates all remote keys are corrupted/unusable (e.g. after password reset).
     * Cannot safely generate new keys as it would create conflicts. */
    if (userKeys.length <= activeKeys.length && !remoteEncryptionKeys.length) {
        throw new Error('[Sync::fetchRemoteKeys] Failed to parse keys');
    }

    /** No encryption key found for primary user key. Generate new key,
     * encrypt with primary user key, and upload to server.*/
    if (!remoteEncryptionKeyForPrimaryKey) {
        try {
            logger.info(`[Sync::fetchRemoteKeys] Generating new encryption key for user key (${primaryUserKey.ID})`);
            const keyBytes = service.generate_key() as Uint8Array<ArrayBuffer>;
            const serializedEncryptedKey = await serializeKey(keyBytes, primaryUserKey);

            const { Key } = await api<{ Key: AuthenticatorKeyResponse }>(storeAuthenticatorKey(serializedEncryptedKey));
            const { UserKeyID: userKeyId, KeyID: id } = Key;
            const syncEncryptionKey: EncryptionKey = { id, userKeyId, keyBytes };

            await authService.addEncryptionKeys([syncEncryptionKey, ...remoteEncryptionKeys]);
            logger.info(`[Sync::fetchRemoteKeys] Uploaded encryption key for user key (${primaryUserKey.ID})`);
        } catch (err) {
            /** Fallback: store any successfully parsed remote keys even if upload failed */
            await authService.addEncryptionKeys(remoteEncryptionKeys);
            logger.error(`[Sync::fetchRemoteKeys] Failed to upload generated key (${err})`);
            throw err;
        }
    } else {
        /** Primary user key already has a remote encryption key - store all parsed keys */
        logger.info(`[Sync::fetchRemoteKeys] Found ${remoteEncryptionKeys.length} remote key(s)`);
        await authService.addEncryptionKeys(remoteEncryptionKeys);
    }
};

export const addRemoteEntries = async (items: Omit<Item, 'order'>[], extra?: AppThunkExtra) => {
    if (!items.length) return;

    logger.info(`[Sync::addRemoteEntries] Adding ${items.length} entries to API`);

    const api = authService.getApi();
    if (!api) throw new Error('Missing API');

    const [userKey] = authService.getUserKeys();
    if (!userKey) throw new Error('Missing user key');

    try {
        const entries = items.map(toWasmEntry);

        const remoteKey = await authService.getEncryptionKey();
        if (!remoteKey) throw new Error('Missing remote encryption key');

        const encryptedEntries = service.encrypt_entries(entries, remoteKey.keyBytes) as Uint8Array<ArrayBuffer>[];
        const requests = chunk(encryptedEntries, BATCH_SIZE).map((batch) => createEntries(batch, remoteKey.id));

        const responses = await seq(requests, api<{ Entries: AuthenticatorEntryResponse[] }>);
        const remoteEntries = responses.flatMap(prop('Entries'));

        await mergeRemoteEntries(remoteEntries);
        logger.info(`[Sync::addRemoteEntries] Added ${items.length} entries to API`);
    } catch (err) {
        logger.error(`[Sync::addRemoteEntries] Failed to add ${items.length} entries to API (${err})`);

        extra?.createNotification({
            type: 'error',
            text: withErrorDetails(c('authenticator-2025:Info').t`Failed syncing local items to remote`)(err),
        });

        throw err;
    }
};

export const updateRemoteEntries = async (items: Omit<Item, 'order'>[], extra?: AppThunkExtra) => {
    if (!items.length) return;

    logger.info(`[Sync::updateRemoteEntries] Updating ${items.length} entries in API`);

    const api = authService.getApi();
    if (!api) throw new Error('Missing API');

    const [userKey] = authService.getUserKeys();
    if (!userKey) throw new Error('Missing user key');

    try {
        const payload = (
            await Promise.all(
                items.map(async (item) => {
                    const syncMetadata = item.syncMetadata;

                    if (!syncMetadata) {
                        /** Item lacks sync metadata, indicating it hasn't been synced to the server yet.
                         * This can occur when the initial sync fails but the user continues making local changes.
                         * We skip this item to prevent corruption, but ideally we should handle this by
                         * treating it as a new remote entry creation instead of an update operation. */
                        logger.error(`[sync::updateRemoteEntries] item ${item.id} has not been synced yet`);
                        return null;
                    }

                    const remoteKey = await authService.getEncryptionKeyById(syncMetadata.keyId);

                    if (!remoteKey) {
                        /** The encryption key referenced by this item's sync metadata no longer exists.
                         * This indicates a critical sync state inconsistency - the item thinks it's synced
                         * but we can't decrypt/encrypt it anymore. The item's sync metadata should be
                         * cleared to reset it to an unsynced state. */
                        logger.error(`[sync::updateRemoteEntries] Missing remote key for ${item.id}`);
                        return null;
                    }

                    const { keyBytes } = remoteKey;
                    const entry = toWasmEntry(item);
                    const [encryptedEntry] = service.encrypt_entries([entry], keyBytes) as Uint8Array<ArrayBuffer>[];

                    return { encryptedEntry, syncMetadata };
                })
            )
        ).filter(truthy);

        const requests = chunk(payload, BATCH_SIZE).map(updateEntries);
        const responses = await Promise.all(requests.map(api<{ Entries: AuthenticatorEntryResponse[] }>));
        const updatedEntries = responses.flatMap(prop('Entries'));
        await mergeRemoteEntries(updatedEntries);

        logger.info(`[Sync::updateRemoteEntries] Updated ${items.length} entries in API`);
    } catch (err) {
        logger.error(`[Sync::updateRemoteEntries] Failed to update ${items.length} entries in API (${err})`);
        extra?.createNotification({
            type: 'error',
            text: withErrorDetails(c('authenticator-2025:Info').t`Failed updating remote items`)(err),
        });

        throw err;
    }
};

export const reorderRemoteEntry = async (encryptedId: string, AfterID?: string) => {
    logger.info(`[Sync::reorderRemoteEntries] Reordering entry ${encryptedId} after ${AfterID} in API`);

    const api = authService.getApi();
    if (!api) throw new Error('Missing API');

    try {
        await api(reorderEntry(encryptedId, { AfterID: AfterID ?? null }));
        logger.info(`[Sync::reorderRemoteEntries] Reordered entry ${encryptedId} after ${AfterID} in API`);
    } catch (err) {
        logger.error(`[Sync::reorderRemoteEntries] Failed to reorder remote entry (${err})`);
        throw err;
    }
};

/** Returns the list of remote entries that were successfully
 * deleted. This allows handling partial deletions in case of
 * API errors if a batch could not be successfuly deleted. */
export const deleteRemoteEntries = async (remoteIds: string[]): Promise<string[]> => {
    if (!remoteIds.length) return [] as string[];

    logger.info(`[Sync::deleteRemoteEntries] Deleting ${remoteIds.length} entries from API`);

    const api = authService.getApi();
    if (!api) throw new Error('Missing API');

    try {
        const requests = chunk(remoteIds, BATCH_SIZE).map(deleteEntries);
        const deletions = (
            await seq(requests, (request) =>
                api(request)
                    .then(() => request.data.EntryIDs)
                    .catch(() => [] as string[])
            )
        ).flat();

        logger.info(`[Sync::deleteRemoteEntries] Deleted ${deletions.length}/${remoteIds.length} entries from API`);
        return deletions;
    } catch (err) {
        logger.error(`[Sync::deleteRemoteEntries] Failed to remove remote entries (${err})`);
        throw err;
    }
};

/** Upsert: new remote items needing to be added to local DB
 *  DeleteLocal: local items pending deletions already deleted BE-side
 *  DeleteLocalAndRemote: local items pending deletions not deleted BE-side
 *  Push: local items requiring to be synced BE-side
 *  Update: remote items needing to be updated locally */
type SyncOperationType = WasmOperationType | 'Update';

/** Returns wether there were any changes to the local database  */
const syncRemoteEntries = async (
    parsedRemoteEntries: WasmRemoteEntryWithKey[],
    extra?: AppThunkExtra
): Promise<boolean> => {
    logger.info(`[Sync::syncRemoteEntries] Syncing remote entries`);

    try {
        const dbEntries = await db.items.toSafeArray();
        const localMap = toMap(dbEntries, 'id');
        const localItems = dbEntries.map(toLocalWasmEntry);

        /** Add ordering metadata to remote entries for two-tier sorting */
        const orderedRemoteEntries = parsedRemoteEntries.map((entry, order) => ({ ...entry, order }));
        const remoteMap = toMap(orderedRemoteEntries, 'remote_id');

        /** Calculate required sync operations using WASM service */
        const actions = service
            .calculate_operations(parsedRemoteEntries, localItems)
            .reduce<Record<SyncOperationType, WasmEntryOperation[]>>(
                (actions, op) => {
                    /** We consider a Push with a remote_id as an `Update` */
                    let operation: SyncOperationType = op.operation;
                    if (operation === 'Push' && op.remote_id) operation = 'Update';
                    actions[operation].push(op);

                    return actions;
                },
                { Upsert: [], DeleteLocal: [], DeleteLocalAndRemote: [], Push: [], Update: [] }
            );

        /** Prepare upserts: new remote items to add locally
         * Use temporary ordering - final two-tier ordering applied after all operations */
        const upserts = actions.Upsert.map(({ remote_id }) => {
            if (remote_id && remoteMap[remote_id]) {
                const { order, ...entry } = remoteMap[remote_id];
                return {
                    ...fromRemoteWasmEntry(entry),
                    order: getOrderByIndex(order),
                };
            }
        }).filter(truthy);

        /** Prepare remote deletions: items that need backend cleanup before local removal */
        const remoteDeletes = actions.DeleteLocalAndRemote.map(prop('remote_id')).filter(truthy);
        const remoteDeletesMap = toMap(actions.DeleteLocalAndRemote, 'remote_id');

        /** 1. Execute remote deletions first. Only remove items locally
         * if backend deletion succeeds to ensure cleanup on retry. */
        const deletedRemoteEntryIds = remoteDeletes.length
            ? await deleteRemoteEntries(remoteDeletes)
                  .then((deleted) => deleted.map((remoteId) => remoteDeletesMap[remoteId].entry.id))
                  .catch(() => [])
            : [];

        /** Combine local-only deletions with successfully deleted remote items  */
        const localDeletes = actions.DeleteLocal.map((item) => item.entry.id).concat(deletedRemoteEntryIds);

        /** Prepare local items for backend sync, preserving user orderings */
        const pushes = actions.Push.map((op) => localMap[op.entry.id])
            .filter(truthy)
            .sort(sortOn('order', 'ASC'));

        /** Prepare local updates with remote changes, ensuring sync metadata exists */
        const updates = actions.Update.map(({ entry, revision, remote_id }) => {
            const item = localMap[entry.id];
            const remoteEntry = remote_id ? remoteMap[remote_id] : null;

            if (!(item && revision)) return;
            if (!item.syncMetadata) {
                if (!remoteEntry) return; /** something went wrong */
                item.syncMetadata = fromRemoteWasmEntry(remoteEntry).syncMetadata;
            } else item.syncMetadata = { ...item.syncMetadata, revision };

            return item;
        }).filter(truthy);

        /** 2. Execute remote create/update operations
         * These run outside the database transaction because they will mutate
         * the local database with syncMetadata updates after successful API calls */
        await Promise.all([
            pushes.length && addRemoteEntries(pushes, extra).catch(noop),
            updates.length && updateRemoteEntries(updates, extra).catch(noop),
            upserts.length && db.items.bulkPut(upserts).catch(noop),
            localDeletes.length && db.items.bulkDelete(localDeletes).catch(noop),
        ]);

        /** Apply two-tier ordering to maintain consistent item positioning
         * accross devices. Note: Some items may remain unsynced due to backend
         * errors or offline state. */
        const reordering = (await db.items.toSafeArray())
            .sort(itemSyncSortWithOrdering(remoteMap))
            .map((item, idx) => ({ key: item.id, changes: { order: getOrderByIndex(idx) } }));

        await db.items.bulkUpdate(reordering);
        STATE.lastUpdated = new Date();

        let report = `Synced remote entries with ${upserts.length} upserts`;
        report += `, ${localDeletes.length} deletes`;
        report += `, ${pushes.length} pushes`;
        report += ` and ${updates.length} updates.`;
        logger.info(`[Sync::fetchRemoteEntries] ${report}`);

        return Boolean(upserts.length || localDeletes.length || pushes.length || updates.length);
    } catch (err) {
        logger.error(`[Sync::syncRemoteEntries] Failed to sync remote entries (${err})`);
        throw err;
    }
};

export const fetchRemoteEntries = async (extra?: AppThunkExtra): Promise<boolean> => {
    STATE.abortController?.abort();
    logger.info(`[Sync::fetchRemoteEntries] Fetching remote entries`);

    try {
        STATE.abortController = new AbortController();
        const api = authService.getApi();
        if (!api) throw new Error('Missing API');

        const entries = await createPageIterator({
            request: async (Since) => {
                const { Entries: data } = await api<{ Entries: AuthenticatorEntriesResponse }>({
                    ...getEntries(Since),
                    signal: STATE.abortController?.signal,
                });

                return { data: data.Entries, cursor: data.LastID };
            },
        })();

        logger.info(`[Sync::fetchRemoteEntries] Fetched ${entries.length} remote entries from API`);
        const parsedRemoteEntries = (await Promise.all(entries.map(parseRemoteEntry))).filter(truthy);
        logger.info(`[Sync::fetchRemoteEntries] Parsed ${parsedRemoteEntries.length} remote entries from API`);
        return await syncRemoteEntries(parsedRemoteEntries, extra);
    } catch (err) {
        logger.info(`[Sync::fetchRemoteEntries] Failed to fetch remote entries from API (${err})`);
        return false;
    }
};
