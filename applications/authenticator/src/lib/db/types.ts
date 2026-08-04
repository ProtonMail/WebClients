import type { Dexie, EntityTable } from 'dexie';

import type { BackupEntity } from './entities/backup';
import type { Item } from './entities/items';
import type { RemoteKey } from './entities/remote-keys';
import type { StorageKeyEntity } from './entities/storage-keys';
import type { EncryptedEntityTable } from './middlewares/encryption';

export type AuthenticatorDB = Dexie & {
    items: EncryptedEntityTable<Item, 'id'>;
    keys: EncryptedEntityTable<RemoteKey, 'id'>;
    storageKey: EntityTable<StorageKeyEntity, 'id'>;
    backup: EntityTable<BackupEntity, 'id'>;
};
