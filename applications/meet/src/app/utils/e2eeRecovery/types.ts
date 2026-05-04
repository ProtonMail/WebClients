import type { RemoteParticipant, RemoteTrackPublication } from 'livekit-client';

export type RecoveryReason =
    | 'video-stall'
    | 'audio-stalled'
    | 'audio-missing-stats'
    | 'audio-concealment'
    | 'audio-persistent-noise'
    | 'encryption-error';

/**
 * Raw inbound-rtp stats dictionary. Browsers expose different subsets so we
 * stay loose-typed here and let detectors read only the fields they care
 * about. `undefined` means the track is subscribed but has not produced an
 * inbound-rtp stat yet (during initial subscription or after a transceiver
 * reset).
 */
export type InboundRtpStats = Record<string, any>;

export interface ReceiverStatsTick {
    participant: RemoteParticipant;
    publication: RemoteTrackPublication;
    kind: 'audio' | 'video';
    stats: InboundRtpStats | undefined;
}

export interface ReportError {
    (label: string, options?: unknown): void;
}
