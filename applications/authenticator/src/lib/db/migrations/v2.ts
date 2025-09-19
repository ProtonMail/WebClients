import type { default as Dexie } from 'dexie';

export default (db: Dexie) => {
    db.version(2).stores({
        items: 'id,issuer,name',
        keys: 'id,userKeyId',
    });
};
