import { telemetry } from '@proton/shared/lib/telemetry';

import type { JoinStats, ParticipantQualityStats, RecordingStats } from './types';

export const logParticipantQuality = (qualityStats: ParticipantQualityStats) => {
    telemetry.sendCustomEvent('meet-participant-quality', qualityStats);
};

export const logJoinStats = (joinStats: JoinStats) => {
    telemetry.sendCustomEvent('meet-join-stats', joinStats);
};

export const logRecordingStats = (recordingStats: RecordingStats) => {
    telemetry.sendCustomEvent('meet-recording-stats', recordingStats);
};
