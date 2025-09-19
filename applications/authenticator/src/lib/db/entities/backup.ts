import type { Item } from 'proton-authenticator/lib/db/entities/items';
import type { RemoteKey } from 'proton-authenticator/lib/db/entities/remote-keys';

export type BackupEntity = {
    id: string;
    items: Item[];
    keys: RemoteKey[];
    version: number;
    date: number;
};
