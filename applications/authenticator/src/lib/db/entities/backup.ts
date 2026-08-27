import type { Item } from './items';
import type { RemoteKey } from './remote-keys';

export type BackupEntity = {
    id: string;
    items: Item[];
    keys: RemoteKey[];
    version: number;
    date: number;
};
