import type { AnyStorage, Maybe } from '@proton/pass/types';
import type { TelemetryEvent } from '@proton/pass/types/data/telemetry';
import type { EventDispatcher } from '@proton/pass/utils/event/dispatcher';
import { createEventDispatcher } from '@proton/pass/utils/event/dispatcher';
import { logger } from '@proton/pass/utils/logger';
import { merge } from '@proton/pass/utils/object/merge';
import type { AbstractAlarm } from '@proton/pass/utils/time/alarm';
import { UNIX_HOUR, UNIX_MINUTE } from '@proton/pass/utils/time/constants';
import { getEpoch } from '@proton/pass/utils/time/epoch';

import { sendTelemetryBundle } from './telemetry.requests';

const MIN_DT = ENV === 'production' ? 6 * UNIX_HOUR : UNIX_MINUTE; /* DEV: chrome alarms need to be >60 seconds */
const MAX_DT = ENV === 'production' ? 12 * UNIX_HOUR : 2 * UNIX_MINUTE;

type TelemetryServiceOptions<StorageKey extends string> = {
    alarm: AbstractAlarm;
    storage: AnyStorage<Record<StorageKey, string>>;
    getStorageKey: () => StorageKey;
    getEnabled: () => boolean;
    getUserTier: () => Maybe<string>;
};

export const createCoreTelemetryService = <StorageKey extends string>({
    alarm,
    storage,
    getEnabled,
    getStorageKey,
    getUserTier,
}: TelemetryServiceOptions<StorageKey>) =>
    createEventDispatcher<TelemetryEvent, StorageKey>({
        id: 'Telemetry',
        alarm,
        maxRetries: 2,
        storage,
        dispatch: sendTelemetryBundle,
        getEnabled,
        getSendTime: () => getEpoch() + MIN_DT + Math.floor(Math.random() * (MAX_DT - MIN_DT)),
        getStorageKey,
        prepare: (event) => {
            logger.info(`[Telemetry] Adding ${event.Event} to current bundle`);
            return merge(event, { Dimensions: { user_tier: getUserTier() } });
        },
    });

export type TelemetryService = EventDispatcher<TelemetryEvent>;
