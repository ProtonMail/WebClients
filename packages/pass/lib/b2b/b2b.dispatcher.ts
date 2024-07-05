import { sendB2BEventsBundle } from '@proton/pass/lib/b2b/b2b.requests';
import type { AnyStorage } from '@proton/pass/types';
import type { B2BEvent } from '@proton/pass/types/data/b2b';
import type { EventDispatcher, EventDispatcherAlarm } from '@proton/pass/utils/event/dispatcher';
import { createEventDispatcher } from '@proton/pass/utils/event/dispatcher';
import { UNIX_HOUR, UNIX_MINUTE } from '@proton/pass/utils/time/constants';
import { getEpoch } from '@proton/pass/utils/time/epoch';

const STORAGE_KEY = 'b2bEvents' as const;
export type B2BEventsStorageKey = typeof STORAGE_KEY;

type B2BDispatcherOptions = {
    alarm: EventDispatcherAlarm;
    storage: AnyStorage<Record<B2BEventsStorageKey, string>>;
    getEnabled: () => boolean;
};

export const createB2BEventDispatcher = ({ alarm, storage, getEnabled }: B2BDispatcherOptions) =>
    createEventDispatcher<B2BEvent, B2BEventsStorageKey>({
        alarm,
        key: STORAGE_KEY,
        maxRetries: 3,
        storage,
        dispatch: sendB2BEventsBundle,
        getEnabled,
        getSendTime: () => getEpoch() + (ENV === 'production' ? UNIX_HOUR : UNIX_MINUTE),
    });

export type B2BEventDispatcher = EventDispatcher<B2BEvent>;
