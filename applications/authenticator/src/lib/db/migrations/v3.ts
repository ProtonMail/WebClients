import type { default as Dexie, EntityTable } from 'dexie';
import type { Item } from 'proton-authenticator/lib/db/entities/items';
import type { LegacyRemoteKey } from 'proton-authenticator/lib/db/entities/remote-keys';
import { getOrderByIndex } from 'proton-authenticator/lib/entries/ordering';

export type LegacyAuthenticatorDB = Dexie & {
    items: EntityTable<Item, 'id'>;
    keys: EntityTable<LegacyRemoteKey, 'id'>;
};

export default (db: Dexie) => {
    db.version(3)
        .stores({
            items: 'id,issuer,name,order',
            keys: 'id,userKeyId',
        })
        .upgrade((tx) => {
            let index = 0;
            return tx
                .table('items')
                .toCollection()
                .modify((item) => {
                    item.order = getOrderByIndex(index++);
                });
        });
};
