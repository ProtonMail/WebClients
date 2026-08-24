import type { AnyStorage } from '../../types';
import type { B2BEvent } from '../../types/data/b2b';
import type { EventDispatcher } from '../../utils/event/dispatcher';
import { createEventDispatcher } from '../../utils/event/dispatcher';
import type { AbstractAlarm } from '../../utils/time/alarm';
import { UNIX_HOUR, UNIX_MINUTE } from '../../utils/time/constants';
import { getEpoch } from '../../utils/time/epoch';
import { sendB2BEventsBundle } from './b2b.requests';

type B2BDispatcherOptions<StorageKey extends string> = {
    alarm: AbstractAlarm;
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
