import type { DBSchema } from 'idb';

export interface Database extends DBSchema {
    config: {
        key: string;
        value: any;
    };
    index_blobs: {
        key: string;
        value: Uint8Array<ArrayBuffer>;
    };
}
