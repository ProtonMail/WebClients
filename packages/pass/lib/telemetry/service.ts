import type { AnyStorage, Maybe } from '@proton/pass/types';
import type { TelemetryEvent } from '@proton/pass/types/data/telemetry';
import type { EventDispatcher, EventDispatcherAlarm } from '@proton/pass/utils/event/dispatcher';
import { createEventDispatcher } from '@proton/pass/utils/event/dispatcher';
import { logger } from '@proton/pass/utils/logger';
import { merge } from '@proton/pass/utils/object/merge';
import { UNIX_HOUR, UNIX_MINUTE } from '@proton/pass/utils/time/constants';
import { getEpoch } from '@proton/pass/utils/time/epoch';

import { sendTelemetryBundle } from './telemetry.requests';

const STORAGE_KEY = 'telemetry' as const;
const MIN_DT = ENV === 'production' ? 6 * UNIX_HOUR : UNIX_MINUTE; /* DEV: chrome alarms need to be >60 seconds */
const MAX_DT = ENV === 'production' ? 12 * UNIX_HOUR : 2 * UNIX_MINUTE;

export type TelemetryStorageKey = typeof STORAGE_KEY;

type TelemetryServiceOptions = {
    alarm: EventDispatcherAlarm;
    storage: AnyStorage<Record<TelemetryStorageKey, string>>;
    getEnabled: () => boolean;
    getUserTier: () => Maybe<string>;
};

export const createCoreTelemetryService = ({ alarm, storage, getEnabled, getUserTier }: TelemetryServiceOptions) =>
    createEventDispatcher<TelemetryEvent, TelemetryStorageKey>({
        alarm,
        key: STORAGE_KEY,
        maxRetries: 2,
        storage,
        dispatch: sendTelemetryBundle,
        getEnabled,
        getSendTime: () => getEpoch() + MIN_DT + Math.floor(Math.random() * (MAX_DT - MIN_DT)),
        prepare: (event) => {
            logger.info(`[Telemetry] Adding ${event.Event} to current bundle`);
            return merge(event, { Dimensions: { user_tier: getUserTier() } });
        },
    });

export type TelemetryService = EventDispatcher<TelemetryEvent>;
