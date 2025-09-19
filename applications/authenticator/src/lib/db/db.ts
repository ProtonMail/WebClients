import type { EntityTable } from 'dexie';
import { default as Dexie } from 'dexie';
import { config } from 'proton-authenticator/lib/app/env';
import {
    clearBackupPassword,
    resolveBackupPassword,
    saveBackupPassword,
} from 'proton-authenticator/lib/backup/password';
import type { BackupEntity } from 'proton-authenticator/lib/db/entities/backup';
import type { StorageKeyEntity } from 'proton-authenticator/lib/db/entities/storage-keys';
import setupDBVersions from 'proton-authenticator/lib/db/migrations';
import { AuthenticatorDBMigrationError, closeDB, getCurrentDBVersion, openDB } from 'proton-authenticator/lib/db/utils';
import logger from 'proton-authenticator/lib/logger';
import { createFallbackAdapter } from 'proton-authenticator/lib/storage-key/adapter.fallback';
import { createKeyringAdapter } from 'proton-authenticator/lib/storage-key/adapter.keyring';
import { createPasswordAdapter } from 'proton-authenticator/lib/storage-key/adapter.password';
import { createStorageKeyService } from 'proton-authenticator/lib/storage-key/service';
import { StorageKeySource } from 'proton-authenticator/lib/storage-key/types';
import { c } from 'ttag';

import { AUTHENTICATOR_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import type { Item } from './entities/items';
import { ItemEntity } from './entities/items';
import type { RemoteKey } from './entities/remote-keys';
import { RemoteKeyEntity } from './entities/remote-keys';
import type { EncryptedEntityTable } from './middlewares/encryption';
import { createEncryptionMiddleware } from './middlewares/encryption';

const { API_URL } = config;

export const DATABASE_NAME = API_URL.includes('proton.black') ? 'authenticatordb_black' : 'authenticatordb';

export type AuthenticatorDB = Dexie & {
    items: EncryptedEntityTable<Item, 'id'>;
    keys: EncryptedEntityTable<RemoteKey, 'id'>;
    storageKey: EntityTable<StorageKeyEntity, 'id'>;
    backup: EntityTable<BackupEntity, 'id'>;
};

export const db = new Dexie(DATABASE_NAME, { autoOpen: false }) as AuthenticatorDB;

export const StorageKey = createStorageKeyService({
    default: StorageKeySource.KEYRING,
    adapters: {
        [StorageKeySource.FALLBACK]: createFallbackAdapter(),
        [StorageKeySource.KEYRING]: createKeyringAdapter(),
        [StorageKeySource.PASSWORD]: createPasswordAdapter(),
    },
    /** Called when a storage key is available (initial setup
     * or key reset) - migrate encrypted data. At this
     * point we can decrypt the items with the previous
     * key as the service awaits the `onSaved` call to
     * set the encryption key on its local state */
    onStorageKey: async (ref, options) => {
        if (options.rotated) {
            /** Key rotation: migrate existing encrypted data with new key.
             * Resolve items outside transaction to avoid timeout from
             * crypto operations. It's imperative that we do not enter
             * this code path if data has not be encrypted yet on app update. */
            const items = await db.items.toSafeArray();
            const keys = await db.keys.toSafeArray();

            await db.transaction('rw', db.tables, async () => {
                logger.info('[storage-key::rotation] migration required');

                /** Clear items/keys/storageKeys */
                await Promise.all([db.items.clear(), db.keys.clear(), db.storageKey.clear()]);

                /** If an encrypted backup password was set, we need to
                 * re-encrypt it with the incoming key. Using `Dexie.waitFor`
                 * to keep the current IDB transaction alive during decryption. */
                const backupPassword = await Dexie.waitFor(resolveBackupPassword()).catch(noop);

                /** `onSaved` will mutate the internal key
                 * reference stored on the StorageKey service */
                options.onSaved();

                /** Re-encrypts data with the rotated key */
                await Promise.all([
                    db.storageKey.add(ref),
                    items.length && db.items.bulkAdd(items),
                    keys.length && db.keys.bulkAdd(keys),
                ]);

                logger.info('[storage-key::rotation] re-encrypted data');

                if (backupPassword) {
                    logger.info('[storage-key::rotation] re-encrypted backup password');
                    await saveBackupPassword(backupPassword);
                }
            });
        } else {
            await db.transaction('rw', db.tables, async () => {
                /** If not rotated then we're either dealing with a first
                 * app launch, update to v4 OR a storage key reset on init.
                 * Data-loss is expected if no backup was saved (migration). */
                await Promise.all([db.storageKey.clear(), db.items.clear(), db.keys.clear()]);
                await db.storageKey.add(ref);
                clearBackupPassword();

                logger.info('[storage-key::setup] cleared data');
                options.onSaved();
            });
        }
    },
});

/** Initializes the database with encryption middleware.
 * Critical: Opens DB without encryption first to allow migrations to complete,
 * particularly the v3→v4 upgrade which must run on unencrypted data.
 * Only after migrations finish do we attach encryption middleware. */
export const setupDB = async () => {
    const currentVersion = await getCurrentDBVersion(DATABASE_NAME);
    const migrateBeforeMiddlewareSetup = Boolean(currentVersion && currentVersion < 4);
    logger.info(`[db::setup] current=${currentVersion ?? -1}`);

    setupDBVersions(db);

    /** Run migrations before activating the encryption middleware
     * to properly store the backup that will be re-hydrated */
    if (migrateBeforeMiddlewareSetup) {
        await openDB(db).catch(() => {
            /** NOTE: we consider any error here as being a migration error
             * so we can enter the backup snapshot flow in `ErrorScreen.tsx`.
             * This should ideally never happen but we want to avoid data-loss. */
            if (db.isOpen()) db.close();
            throw new AuthenticatorDBMigrationError(
                c('authenticator-2025:Error')
                    .t`Migration failed after updating ${AUTHENTICATOR_APP_NAME}. You can try again, or backup your data and reset the app to continue.`
            );
        });

        await closeDB(db);
        logger.info('[db::setup] migration finished');
    }

    db.use({
        stack: 'dbcore',
        name: 'encryption',
        level: 0,
        create: createEncryptionMiddleware({
            db,
            encryptedTables: {
                items: ItemEntity,
                keys: RemoteKeyEntity,
            },

            get encryptionKey() {
                return StorageKey.read();
            },
        }),
    });

    logger.info('[db::setup] encryption middleware activated');
    await openDB(db);

    if (db.verno < 4) {
        /** Do not tolerate booting the app if the upgrade did not succeed. */
        logger.info('[db::setup] db.verno < 4');
        throw new Error(
            c('authenticator-2025:Error')
                .t`Failed database migration. If the issue persists, please contact customer support.`
        );
    }
};
