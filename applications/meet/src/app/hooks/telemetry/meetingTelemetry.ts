import { meetingLogger } from '@proton/meet/utils/meetingLogger';
import { telemetry } from '@proton/shared/lib/telemetry';

import type { JoinStats, ParticipantQualityStats, RecordingStats } from './types';

const sendCustomEventAndLog = (eventName: string, payload: Record<string, unknown>) => {
    meetingLogger.info(`[telemetry] ${eventName}`, payload);
    telemetry.sendCustomEvent(eventName, payload);
};

export const logParticipantQuality = (qualityStats: ParticipantQualityStats) => {
    sendCustomEventAndLog('meet-participant-quality', qualityStats);
};

export const logJoinStats = (joinStats: JoinStats) => {
    sendCustomEventAndLog('meet-join-stats', joinStats);
};

export const logRecordingStats = (recordingStats: RecordingStats) => {
    sendCustomEventAndLog('meet-recording-stats', recordingStats);
};
