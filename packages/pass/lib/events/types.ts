import type { SyncResultV1 } from './v1/sync';
import type { SyncResultV2 } from './v2/user-events.sync';

export enum SyncType {
    /** Fetches all data */
    FULL = 'full',
    /** Re-fetches only diff */
    PARTIAL = 'partial',
}

export type SyncResult = SyncResultV1 | SyncResultV2;
