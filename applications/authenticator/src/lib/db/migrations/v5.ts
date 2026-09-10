import type { default as Dexie } from 'dexie';

/** Drops the `issuer` & `name` fields. No `upgrade` function on purpose.
 * Existing items are rewritten without those fields on their next mutation. */
export default (db: Dexie) => {
    db.version(5).stores({
        items: 'id,order',
        keys: 'id,userKeyId',
        storageKey: 'id',
        backup: 'id',
    });
};
