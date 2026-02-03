import type { Track } from 'livekit-client';

export interface ParticipantQualityStats extends Record<string, unknown> {
    identity: string;
    type: Track.Kind;
    packetsReceived?: number;
    packetsLost?: number;
    packetsDiscarded?: number;

    // jitter (network + receiver delaying packets)
    jitter?: number;
    jitterBufferDelay?: number;

    // Video decode stats
    framesReceived?: number;
    framesDropped?: number;
    freezeCount?: number;
    totalFreezesDuration?: number;
    pliCount?: number;

    // Audio stats
    concealedSamples?: number;
    totalSamplesReceived?: number;
    totalAudioEnergy?: number;

    availableIncomingBitrate?: number;
}
