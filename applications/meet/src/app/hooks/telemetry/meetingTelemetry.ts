import { telemetry } from '@proton/shared/lib/telemetry';

import type { ParticipantQualityStats } from './types';

export const logParticipantQuality = (qualityStats: ParticipantQualityStats) => {
    telemetry.sendCustomEvent('meet-participant-quality', qualityStats);
};
