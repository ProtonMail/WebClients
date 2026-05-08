import { type RemoteTrackPublication, Track } from 'livekit-client';

import type { ParticipantQualityStats } from './types';

export const getWebRTCStats = async (
    pub: RemoteTrackPublication,
    identity: string,
    roomId: string,
    isLocal = false
) => {
    if ((!isLocal && !pub.isSubscribed) || !pub.isEnabled || pub.isMuted || !pub.track) {
        return null;
    }

    const stats: Record<string, unknown> = {
        identity,
        roomId,
        type: pub.track.source,
        trackSid: pub.trackSid,
        isLocal,
    };

    try {
        const rtcStats = await pub.track.getRTCStatsReport();
        if (rtcStats) {
            rtcStats.forEach((report) => {
                if (report.type === 'inbound-rtp') {
                    stats.packetsReceived = report.packetsReceived;
                    stats.packetsLost = report.packetsLost;
                    stats.jitter = report.jitter;
                    stats.packetsDiscarded = report.packetsDiscarded;
                    stats.framesDropped = report.framesDropped;
                    stats.framesReceived = report.framesReceived;
                    stats.framesDecoded = report.framesDecoded;
                    stats.framesPerSecond = report.framesPerSecond;
                    stats.frameWidth = report.frameWidth;
                    stats.frameHeight = report.frameHeight;
                    stats.freezeCount = report.freezeCount;
                    stats.totalFreezesDuration = report.totalFreezesDuration;
                    stats.pliCount = report.pliCount;
                    stats.nackCount = report.nackCount;
                    stats.totalDecodeTime = report.totalDecodeTime;
                    stats.decoderImplementation = report.decoderImplementation;
                    stats.concealedSamples = report.concealedSamples;
                    stats.totalSamplesReceived = report.totalSamplesReceived;
                    stats.totalAudioEnergy = report.totalAudioEnergy;
                    stats.jitterBufferDelay = report.jitterBufferDelay;
                    stats.jitterBufferEmittedCount = report.jitterBufferEmittedCount;
                }

                if (report.type === 'outbound-rtp' && isLocal) {
                    stats.qualityLimitationReason = report.qualityLimitationReason;
                    stats.qualityLimitationDurationCpu = report.qualityLimitationDurations?.cpu;
                    stats.qualityLimitationDurationBandwidth = report.qualityLimitationDurations?.bandwidth;
                    stats.encoderImplementation = report.encoderImplementation;
                }

                if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                    stats.availableIncomingBitrate = report.availableIncomingBitrate;
                    stats.availableOutgoingBitrate = report.availableOutgoingBitrate;
                    stats.roundTripTime = report.currentRoundTripTime;
                    stats.totalRoundTripTime = report.totalRoundTripTime;
                    stats.responsesReceived = report.responsesReceived;
                }
            });
        }
    } catch {
        return null;
    }

    return Object.keys(stats).length > 5 ? (stats as ParticipantQualityStats) : null;
};

const toDelta = (current: number | undefined, previous: number | undefined) => {
    if (current === undefined) {
        return undefined;
    }

    if (previous === undefined) {
        return current;
    }

    if (current < previous) {
        return current;
    }

    return current - previous;
};

export const calculateStatsDelta = (
    current: ParticipantQualityStats,
    previous: ParticipantQualityStats | undefined
): ParticipantQualityStats => {
    return {
        identity: current.identity,
        roomId: current.roomId,
        type: current.type,
        trackSid: current.trackSid,
        isLocal: current.isLocal,
        participantCount: current.participantCount,

        packetsReceived: toDelta(current.packetsReceived, previous?.packetsReceived),
        packetsLost: toDelta(current.packetsLost, previous?.packetsLost),
        packetsDiscarded: toDelta(current.packetsDiscarded, previous?.packetsDiscarded),

        framesReceived: toDelta(current.framesReceived, previous?.framesReceived),
        framesDropped: toDelta(current.framesDropped, previous?.framesDropped),
        framesDecoded: toDelta(current.framesDecoded, previous?.framesDecoded),
        freezeCount: toDelta(current.freezeCount, previous?.freezeCount),
        totalFreezesDuration: toDelta(current.totalFreezesDuration, previous?.totalFreezesDuration),
        pliCount: toDelta(current.pliCount, previous?.pliCount),
        nackCount: toDelta(current.nackCount, previous?.nackCount),
        totalDecodeTime: toDelta(current.totalDecodeTime, previous?.totalDecodeTime),

        concealedSamples: toDelta(current.concealedSamples, previous?.concealedSamples),
        totalSamplesReceived: toDelta(current.totalSamplesReceived, previous?.totalSamplesReceived),
        totalAudioEnergy: toDelta(current.totalAudioEnergy, previous?.totalAudioEnergy),

        jitterBufferDelay: toDelta(current.jitterBufferDelay, previous?.jitterBufferDelay),
        jitterBufferEmittedCount: toDelta(current.jitterBufferEmittedCount, previous?.jitterBufferEmittedCount),

        totalRoundTripTime: toDelta(current.totalRoundTripTime, previous?.totalRoundTripTime),
        responsesReceived: toDelta(current.responsesReceived, previous?.responsesReceived),

        qualityLimitationDurationCpu: toDelta(
            current.qualityLimitationDurationCpu,
            previous?.qualityLimitationDurationCpu
        ),
        qualityLimitationDurationBandwidth: toDelta(
            current.qualityLimitationDurationBandwidth,
            previous?.qualityLimitationDurationBandwidth
        ),

        // Non-cumulative estimates
        jitter: current.jitter,
        availableIncomingBitrate: current.availableIncomingBitrate,
        availableOutgoingBitrate: current.availableOutgoingBitrate,
        roundTripTime: current.roundTripTime,
        framesPerSecond: current.framesPerSecond,
        frameWidth: current.frameWidth,
        frameHeight: current.frameHeight,
        decoderImplementation: current.decoderImplementation,
        encoderImplementation: current.encoderImplementation,
        qualityLimitationReason: current.qualityLimitationReason,
    };
};

export const shouldReportStats = (stats: ParticipantQualityStats): boolean => {
    // Check packet loss rate
    if (stats.packetsReceived !== undefined && stats.packetsLost !== undefined) {
        const totalPackets = stats.packetsReceived + stats.packetsLost;
        if (totalPackets > 0) {
            const packetLossRate = stats.packetsLost / totalPackets;
            if (packetLossRate > 0.025) {
                return true;
            }
        }
    }

    if (stats.jitter !== undefined && stats.jitter > 0.1) {
        return true;
    }

    if (stats.framesReceived !== undefined && stats.framesDropped !== undefined) {
        const totalFrames = stats.framesReceived + stats.framesDropped;
        if (totalFrames > 0) {
            const frameDropRate = stats.framesDropped / totalFrames;
            if (frameDropRate > 0.05) {
                return true;
            }
        }
    }

    if (stats.totalFreezesDuration !== undefined && stats.totalFreezesDuration > 10) {
        return true;
    }

    if (
        stats.concealedSamples !== undefined &&
        stats.totalSamplesReceived !== undefined &&
        stats.totalSamplesReceived > 0
    ) {
        const concealmentRate = stats.concealedSamples / stats.totalSamplesReceived;
        if (concealmentRate > 0.02) {
            return true;
        }
    }

    if (stats.availableIncomingBitrate !== undefined) {
        if (
            (stats.type === Track.Source.Camera || stats.type === Track.Source.ScreenShare) &&
            stats.availableIncomingBitrate < 100_000
        ) {
            return true;
        }
        if (
            (stats.type === Track.Source.Microphone || stats.type === Track.Source.ScreenShareAudio) &&
            stats.availableIncomingBitrate < 20_000
        ) {
            return true;
        }
    }

    // RTT above 300ms is perceptible as echo / desync
    if (stats.roundTripTime !== undefined && stats.roundTripTime > 0.3) {
        return true;
    }

    // Encoder CPU-limited for more than 5s in the reporting interval
    if (stats.qualityLimitationDurationCpu !== undefined && stats.qualityLimitationDurationCpu > 5000) {
        return true;
    }

    return false;
};
