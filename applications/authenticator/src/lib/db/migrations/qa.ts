import { default as Dexie } from 'dexie';

import logger from '../../logger';
import type { AuthenticatorDB } from '../types';
import { closeDB, openDB } from '../utils';
import v1 from './v1';
import v2 from './v2';
import type { LegacyAuthenticatorDB } from './v3';
import v3 from './v3';
import { downgradeToLegacyKeys } from './v4';

/** Downgrades database to v3 for QA testing migration flows. Faster than
 * reinstalling from a prior version. Results in a DB without encryption */
export const qaDowngradeDB = async (db: AuthenticatorDB) => {
    const items = await db.items.toSafeArray();
    const keys = await db.keys.toSafeArray();

    await db.backup.clear();
    await db.storageKey.clear();
    await db.items.clear();
    await db.keys.clear();

    await closeDB(db);
    indexedDB.deleteDatabase(db.name);

    const downgrade = new Dexie(db.name) as LegacyAuthenticatorDB;

    v1(downgrade);
    v2(downgrade);
    v3(downgrade);

    await openDB(downgrade);
    if (items.length) await downgrade.items.bulkAdd(items);
    if (keys.length) await downgrade.keys.bulkAdd(await downgradeToLegacyKeys(keys));

    await closeDB(downgrade);

    logger.info(`[qa] db downgraded`);
    window.location.reload();
};
