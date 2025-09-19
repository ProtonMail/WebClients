import type { default as Dexie } from 'dexie';

export default (db: Dexie) => {
    db.version(1).stores({
        items: 'id,issuer',
        keys: 'id,userKeyId',
    });
};
