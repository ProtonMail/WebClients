import type { Track } from 'livekit-client';

export interface ParticipantQualityStats extends Record<string, unknown> {
    identity: string;
    roomId: string;
    type: Track.Source;
    trackSid: string;
    isLocal: boolean;
    // Which peer connection the candidate-pair fields describe. Both legs terminate at the SFU.
    pcRole?: 'publisher' | 'subscriber';
    participantCount?: number;
    // Whether this row tripped a quality threshold. Local rows are reported either way, so this is
    // what separates a degraded uplink from a healthy baseline sample.
    flagged?: boolean;

    websocketUrl?: string;

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

    // Send side, summed across simulcast layers (local participant only)
    packetsSent?: number;
    retransmittedPacketsSent?: number;
    framesEncoded?: number;
    targetBitrate?: number;

    // The SFU's RTCP receiver report on our uplink — measures the user -> SFU leg
    remotePacketsLost?: number;
    remoteFractionLost?: number;
    remoteJitter?: number;
    remoteRoundTripTime?: number;

    // Capture side, separates a degraded camera/mic from a degraded uplink (local participant only)
    sourceFramesPerSecond?: number;
    sourceWidth?: number;
    sourceHeight?: number;
    sourceAudioLevel?: number;

    // ICE candidate info from the winning candidate-pair of this track's peer connection
    localCandidateType?: string;
    remoteCandidateType?: string;
    localCandidateProtocol?: string;
}

export interface JoinStats extends Record<string, unknown> {
    roomId: string;
    isReconnect: boolean;
    isInstantJoin: boolean;
    participantCount: number;

    websocketUrl?: string;

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

export interface RecordingStats extends Record<string, unknown> {
    roomId: string;
    identity: string;
    recordingDuration: number;
    recordingSize: number;
    recordingExtension: string;
    recordingMimeType: string;
}
