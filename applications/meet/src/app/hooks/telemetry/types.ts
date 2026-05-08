import type { Track } from 'livekit-client';

export interface ParticipantQualityStats extends Record<string, unknown> {
    identity: string;
    roomId: string;
    type: Track.Source;
    trackSid: string;
    isLocal: boolean;
    participantCount?: number;

    packetsReceived?: number;
    packetsLost?: number;
    packetsDiscarded?: number;

    // jitter (network + receiver delaying packets)
    jitter?: number;
    jitterBufferDelay?: number;
    jitterBufferEmittedCount?: number;

    // Video decode stats
    framesReceived?: number;
    framesDropped?: number;
    framesDecoded?: number;
    framesPerSecond?: number;
    frameWidth?: number;
    frameHeight?: number;
    freezeCount?: number;
    totalFreezesDuration?: number;
    pliCount?: number;
    nackCount?: number;
    totalDecodeTime?: number;
    decoderImplementation?: string;

    // Audio stats
    concealedSamples?: number;
    totalSamplesReceived?: number;
    totalAudioEnergy?: number;

    // Network
    availableIncomingBitrate?: number;
    availableOutgoingBitrate?: number;
    roundTripTime?: number;
    totalRoundTripTime?: number;
    responsesReceived?: number;

    // Video encode (local participant only)
    qualityLimitationReason?: string;
    qualityLimitationDurationCpu?: number;
    qualityLimitationDurationBandwidth?: number;
    encoderImplementation?: string;
}

export interface JoinStats extends Record<string, unknown> {
    roomId: string;
    isReconnect: boolean;
    isInstantJoin: boolean;
    participantCount: number;

    // Per-phase durations (ms) — null means the phase did not complete
    tokenFetchMs: number | null;
    mlsSetupMs: number | null;
    livekitConnectMs: number | null;
    deviceInitMs: number | null;
    totalJoinMs: number | null;

    // Connection path
    stunFailed: boolean;
    turnFallback: boolean;
    connectionAttempts: number;

    // ICE candidate info from the winning candidate-pair
    localCandidateType?: string;
    remoteCandidateType?: string;
    localCandidateProtocol?: string;

    // navigator.connection hints — browser-dependent
    networkEffectiveType?: string;
    networkRtt?: number;
    networkDownlink?: number;
}
