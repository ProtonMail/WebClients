import { downloadDir, join } from '@tauri-apps/api/path';
import { save } from '@tauri-apps/plugin-dialog';
import { create } from '@tauri-apps/plugin-fs';
import type { Transaction } from 'dexie';
import { Dexie } from 'dexie';
import { createBackupFilename } from 'proton-authenticator/lib/backup/writer';
import { DATABASE_NAME } from 'proton-authenticator/lib/db/db';
import type { BackupEntity } from 'proton-authenticator/lib/db/entities/backup';
import type { Item } from 'proton-authenticator/lib/db/entities/items';
import type { LegacyRemoteKey, RemoteKey } from 'proton-authenticator/lib/db/entities/remote-keys';
import { validateEncryptedValue } from 'proton-authenticator/lib/db/middlewares/encryption';
import { executeRawDBOperation } from 'proton-authenticator/lib/db/utils';
import { toWasmEntry } from 'proton-authenticator/lib/entries/items';
import logger from 'proton-authenticator/lib/logger';
import { service } from 'proton-authenticator/lib/wasm/service';
import { c } from 'ttag';

import { ENCRYPTION_ALGORITHM } from '@proton/crypto/lib/subtle/aesGcm';
import type { MaybeNull } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

export const V4_MIGRATION_BACK_UP_ID = 'authenticator::migration::v4';

if (process.env.QA_BUILD) {
    const self = window as any;
    self['qa::migration::suppress'] = () => localStorage.setItem('qa::migration::suppressed', '1');
    self['qa::migration::enable'] = () => localStorage.removeItem('qa::migration::suppressed');
}

/** Migrates legacy keys from v3 to v4 format. Remote keys prior to v4 were
 * stored 'extractable' so we can export them, moving from `LegacyStoredRemoteKey`
 * to encrypted `StoredRemoteKey` during migration. */
export const migrateLegacyKeys = async (legacyKeys: LegacyRemoteKey[]): Promise<RemoteKey[]> =>
    (
        await Promise.all(
            /** Remote keys prior to v4 where stored 'extractable' so we
             * can export them. We're moving from `LegacyStoredRemoteKey`
             * to encrypted `StoredRemoteKey` during the migration. */
            legacyKeys.map(async (remoteKey): Promise<MaybeNull<RemoteKey>> => {
                try {
                    const { id, userKeyId } = remoteKey;
                    /** Legacy local encryption key was stored as
                     * a `LegacyStoredRemoteKey` prior to v4 */
                    if (!userKeyId || id === 'local') return null;
                    const rawKey = await crypto.subtle.exportKey('raw', remoteKey.key);
                    const encodedKey = uint8ArrayToBase64String(new Uint8Array(rawKey));
                    return { id, userKeyId, encodedKey };
                } catch {
                    return null;
                }
            })
        )
    ).filter(truthy);

/** Converts v4+ keys back to v3 legacy format for QA testing migrations.
 * Recreates extractable keys from encoded format. */
export const downgradeToLegacyKeys = async (keys: RemoteKey[]): Promise<LegacyRemoteKey[]> =>
    (
        await Promise.all(
            keys.map(async (legacyKey): Promise<MaybeNull<LegacyRemoteKey>> => {
                try {
                    const { id, userKeyId, encodedKey } = legacyKey;
                    const bytes = base64StringToUint8Array(encodedKey);
                    const usages = ['encrypt', 'decrypt'] as const;
                    const key = await crypto.subtle.importKey('raw', bytes, ENCRYPTION_ALGORITHM, true, usages);

                    return { id, userKeyId, key };
                } catch {
                    return null;
                }
            })
        )
    ).filter(truthy);

/** Creates a backup snapshot before resetting the database to handle potential
 * migration failures. Only works with database versions 3 and below. */
export const resetWithSnapshot = async () =>
    executeRawDBOperation(DATABASE_NAME, async (db) => {
        if (db.verno >= 4) throw new Error(c('Warning').t`Database cannot be backed up.`);

        const items = await db.table<Item>('items').toArray();

        /** Ensure we're not trying to snapshot encrypted or empty data */
        if (!items || items.length === 0 || items.some(validateEncryptedValue)) {
            await db.delete();
            return true;
        }

        const path = await save({
            defaultPath: await join(await downloadDir(), createBackupFilename()),
            filters: [{ name: 'Export', extensions: ['json'] }],
        });

        if (!path) throw new Error(c('Warning').t`No backup location selected.`);

        const snapshot = service.export_entries(items.map(toWasmEntry));
        const buffer = new TextEncoder().encode(snapshot);

        const fileHandle = await create(path);
        await fileHandle.write(buffer);
        await fileHandle.close();

        await db.delete();
        return true;
    });

/** Should only be called on a transaction before
 * migrating to database V4. Expects the encryption
 * middleware to not be set-up for unencrypted data. */
export const backupForV4 = async (
    version: number,
    items: Item[],
    legacyKeys: LegacyRemoteKey[]
): Promise<BackupEntity> => {
    const keys = await migrateLegacyKeys(legacyKeys);
    logger.info(`[db::migration] backed up ${items.length} item(s), ${keys.length} key(s)`);

    return {
        id: V4_MIGRATION_BACK_UP_ID,
        date: +new Date(),
        items,
        keys,
        version,
    };
};

/** NOTE: critical this runs before setting up the
 * encryption middlware. Generating a backup requires
 * reading items prior to the encrypted DB migration */
export const upgradeV4 = async (tx: Transaction) => {
    logger.info(`[db::migration] backing up for v4`);
    const version = tx.db.verno;

    const [items, legacyKeys] = await Promise.all([
        tx.table<Item>('items').toArray(),
        tx.table<LegacyRemoteKey>('keys').toArray(),
    ]);

    /** Keep transaction alive during crypto operations */
    await Dexie.waitFor(backupForV4(version, items, legacyKeys))
        .then((backup) => tx.table('backup').add(backup))
        .catch((err) => {
            /** Do not tolerate booting without writing the backup */
            logger.error(`[db::migration] failure ${err}`);
            throw err;
        });

    if (process.env.QA_BUILD) {
        /** QA flag for generating migration errors */
        const flag = localStorage.getItem('qa::migration::suppressed');
        if (flag !== null) throw new Error('QA: Migration suppressed');
    }

    await Promise.all([tx.table('items').clear(), tx.table('keys').clear()]);

    logger.info(`[db::migration] backed up legacy data`);
};

export default (db: Dexie) => {
    db.version(4)
        .stores({
            items: 'id,issuer,name,order',
            keys: 'id,userKeyId',
            storageKey: 'id',
            backup: 'id',
        })
        .upgrade(upgradeV4);
};
