import type { MaybeNull } from '../../types/utils';
import type { SyncResultV1 } from './v1/sync';
import type { SyncResultV2 } from './v2/user-events.sync';

export type SyncResult = SyncResultV1 | SyncResultV2;

export enum SyncStrategy {
    /** @deprecated legacy polling mechanism */
    LEGACY = 'LEGACY',
    /** User events polling */
    USER_EVENTS = 'USER_EVENTS',
}

export type EventProcessor = Generator<any, boolean>;

export type SyncMigration = { userEventId: MaybeNull<string>; strategy: SyncStrategy };
