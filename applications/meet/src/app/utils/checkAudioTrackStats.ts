import type { RemoteParticipant, RemoteTrackPublication } from 'livekit-client';
import { Track } from 'livekit-client';

interface AudioTrackStats {
    type: string;
    kind: string;
    packetsReceived?: number;
    bytesReceived?: number;
}

interface AudioTrackContext {
    participant: RemoteParticipant;
    source: Track.Source;
}

interface AudioTrackThresholds {
    checkIntervalMs: number;
    speakingActivityMarginMs: number;
    minExpectedPackets: number;
    minExpectedAudioBytesWhileSpeaking: number;
}

const findInboundAudioRtpReport = (stats: RTCStatsReport) => {
    return ([...stats.values()] as AudioTrackStats[]).find(
        (report: AudioTrackStats) => report.type === 'inbound-rtp' && report.kind === 'audio'
    );
};

const getAudioProgressCounters = (report: AudioTrackStats) => {
    // Prefer packets (widely available); fall back to bytes for portability.
    const packetsReceived = typeof report.packetsReceived === 'number' ? report.packetsReceived : undefined;
    const bytesReceived = typeof report.bytesReceived === 'number' ? report.bytesReceived : undefined;
    const currentValue = packetsReceived ?? bytesReceived ?? 0;
    return { packetsReceived, bytesReceived, currentValue };
};

const getParticipantLastSpokeAtMs = (participant: RemoteParticipant) => {
    if ('lastSpokeAt' in participant && participant.lastSpokeAt instanceof Date) {
        return participant.lastSpokeAt.getTime();
    }
    return 0;
};

const didParticipantSpeakRecently = (
    participant: RemoteParticipant,
    nowMs: number,
    thresholds: Pick<AudioTrackThresholds, 'checkIntervalMs' | 'speakingActivityMarginMs'>
) => {
    const lastSpokeAtMs = getParticipantLastSpokeAtMs(participant);
    return nowMs - lastSpokeAtMs <= thresholds.checkIntervalMs + thresholds.speakingActivityMarginMs;
};

const shouldRequireAudioProgress = (context: AudioTrackContext, spokeRecently: boolean) => {
    return (
        context.source === Track.Source.ScreenShareAudio ||
        (context.source === Track.Source.Microphone && (spokeRecently || context.participant.isSpeaking))
    );
};

const getMinExpectedDeltaForAudio = (
    shouldRequireProgress: boolean,
    packetsReceived: number | undefined,
    thresholds: Pick<AudioTrackThresholds, 'minExpectedPackets' | 'minExpectedAudioBytesWhileSpeaking'>
) => {
    if (!shouldRequireProgress) {
        return 0;
    }

    return packetsReceived !== undefined
        ? thresholds.minExpectedPackets
        : thresholds.minExpectedAudioBytesWhileSpeaking;
};

export const checkAudioTrackStats = async (
    publication: RemoteTrackPublication,
    context: AudioTrackContext | undefined,
    thresholds: AudioTrackThresholds
) => {
    try {
        const stats = await publication.track!.getRTCStatsReport();
        if (!stats) {
            return null;
        }

        const audioReport = findInboundAudioRtpReport(stats);
        if (!audioReport) {
            return null;
        }

        const { packetsReceived, currentValue } = getAudioProgressCounters(audioReport);

        const nowMs = Date.now();
        const spokeRecently = context ? didParticipantSpeakRecently(context.participant, nowMs, thresholds) : false;
        const requireProgress = context ? shouldRequireAudioProgress(context, spokeRecently) : false;
        const minExpectedDelta = getMinExpectedDeltaForAudio(requireProgress, packetsReceived, thresholds);

        return {
            currentValue,
            isStuck: false,
            minExpectedDelta,
        };
    } catch {
        return null;
    }
};
