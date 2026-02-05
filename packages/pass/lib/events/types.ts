import type { SyncResultV1 } from './v1/sync';

export enum SyncType {
    /** Fetches all data */
    FULL = 'full',
    /** Re-fetches only diff */
    PARTIAL = 'partial',
}

export type SyncResult = SyncResultV1;
