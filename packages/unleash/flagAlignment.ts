import { EVENT_LOOP_INTERVAL_FLAG } from '@proton/shared/lib/unleash/sharedUnleashClient';

import { CommonFeatureFlag } from './UnleashFeatureFlags';

const eventLoopIntervalFlagCheck: typeof EVENT_LOOP_INTERVAL_FLAG = CommonFeatureFlag.EventLoopInterval;

if (eventLoopIntervalFlagCheck !== EVENT_LOOP_INTERVAL_FLAG) {
    throw new Error('Event loop interval flag is out of sync with CommonFeatureFlag.EventLoopInterval');
}
