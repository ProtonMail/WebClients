import { sendB2BEventsBundle } from '@proton/pass/lib/b2b/b2b.requests';
import type { AnyStorage } from '@proton/pass/types';
import type { B2BEvent } from '@proton/pass/types/data/b2b';
import type { EventDispatcher, EventDispatcherAlarm } from '@proton/pass/utils/event/dispatcher';
import { createEventDispatcher } from '@proton/pass/utils/event/dispatcher';
import { UNIX_HOUR, UNIX_MINUTE } from '@proton/pass/utils/time/constants';
import { getEpoch } from '@proton/pass/utils/time/epoch';

type B2BDispatcherOptions<StorageKey extends string> = {
    alarm: EventDispatcherAlarm;
    storage: AnyStorage<Record<StorageKey, string>>;
    getEnabled: () => boolean;
    getStorageKey: () => StorageKey;
};

export const createB2BEventDispatcher = <StorageKey extends string>({
    alarm,
    storage,
    getEnabled,
    getStorageKey,
}: B2BDispatcherOptions<StorageKey>) =>
    createEventDispatcher<B2BEvent, StorageKey>({
        id: 'B2BEvents',
        alarm,
        maxRetries: 3,
        storage,
        dispatch: sendB2BEventsBundle,
        getEnabled,
        getSendTime: () => getEpoch() + (ENV === 'production' ? UNIX_HOUR : UNIX_MINUTE),
        getStorageKey,
    });

export type B2BEventDispatcher = EventDispatcher<B2BEvent>;
