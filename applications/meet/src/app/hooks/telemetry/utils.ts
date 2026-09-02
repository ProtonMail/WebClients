import { type RemoteTrackPublication, Track } from 'livekit-client';

import type { ParticipantQualityStats } from './types';

export const getUrlWithoutProtocol = (url: string) => url.replace(/^[a-z]+:\/\//i, '');

// identity, roomId, type, trackSid, isLocal, pcRole
const BASE_STAT_KEY_COUNT = 6;

// Simulcast emits one outbound-rtp / remote-inbound-rtp pair per layer. The pre-existing fields keep
// last-layer-wins so previously collected data stays comparable, but the uplink fields are aggregated:
// a loss ratio built from two different layers would be meaningless.
const sumStat = (accumulator: number | undefined, value: number | undefined) =>
    value === undefined ? accumulator : (accumulator ?? 0) + value;

const maxStat = (accumulator: number | undefined, value: number | undefined) =>
    value === undefined ? accumulator : Math.max(accumulator ?? value, value);

// Avoids inflating the key count checked at the end of getWebRTCStats
const assignIfDefined = (target: Record<string, unknown>, key: string, value: unknown) => {
    if (value !== undefined) {
        target[key] = value;
    }
};

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
        // Local tracks report on the publisher peer connection, remote ones on the subscriber peer
        // connection. Both legs terminate at the SFU, so roundTripTime below means different hops.
        pcRole: isLocal ? 'publisher' : 'subscriber',
    };

    try {
        const rtcStats = await pub.track.getRTCStatsReport();
        if (rtcStats) {
            const candidatesById = new Map<string, any>();
            let activeCandidatePair: any = null;

            let packetsSent: number | undefined;
            let retransmittedPacketsSent: number | undefined;
            let framesEncoded: number | undefined;
            let targetBitrate: number | undefined;
            let remotePacketsLost: number | undefined;
            let remoteFractionLost: number | undefined;
            let remoteJitter: number | undefined;
            let remoteRoundTripTime: number | undefined;

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

                    packetsSent = sumStat(packetsSent, report.packetsSent);
                    retransmittedPacketsSent = sumStat(retransmittedPacketsSent, report.retransmittedPacketsSent);
                    framesEncoded = sumStat(framesEncoded, report.framesEncoded);
                    targetBitrate = sumStat(targetBitrate, report.targetBitrate);
                }

                // The SFU's own RTCP receiver report — the only measurement of the user -> SFU leg
                if (report.type === 'remote-inbound-rtp' && isLocal) {
                    remotePacketsLost = sumStat(remotePacketsLost, report.packetsLost);
                    remoteFractionLost = maxStat(remoteFractionLost, report.fractionLost);
                    remoteJitter = maxStat(remoteJitter, report.jitter);
                    remoteRoundTripTime = maxStat(remoteRoundTripTime, report.roundTripTime);
                }

                // Capture side, to tell a degraded camera/mic apart from a degraded uplink
                if (report.type === 'media-source' && isLocal) {
                    assignIfDefined(stats, 'sourceFramesPerSecond', report.framesPerSecond);
                    assignIfDefined(stats, 'sourceWidth', report.width);
                    assignIfDefined(stats, 'sourceHeight', report.height);
                    assignIfDefined(stats, 'sourceAudioLevel', report.audioLevel);
                }

                if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                    stats.availableIncomingBitrate = report.availableIncomingBitrate;
                    stats.availableOutgoingBitrate = report.availableOutgoingBitrate;
                    stats.roundTripTime = report.currentRoundTripTime;
                    stats.totalRoundTripTime = report.totalRoundTripTime;
                    stats.responsesReceived = report.responsesReceived;
                    activeCandidatePair = report;
                }

                if (report.type === 'local-candidate' || report.type === 'remote-candidate') {
                    candidatesById.set(report.id, report);
                }
            });

            assignIfDefined(stats, 'packetsSent', packetsSent);
            assignIfDefined(stats, 'retransmittedPacketsSent', retransmittedPacketsSent);
            assignIfDefined(stats, 'framesEncoded', framesEncoded);
            assignIfDefined(stats, 'targetBitrate', targetBitrate);
            assignIfDefined(stats, 'remotePacketsLost', remotePacketsLost);
            assignIfDefined(stats, 'remoteFractionLost', remoteFractionLost);
            assignIfDefined(stats, 'remoteJitter', remoteJitter);
            assignIfDefined(stats, 'remoteRoundTripTime', remoteRoundTripTime);

            if (activeCandidatePair) {
                // Candidate types and protocol only — never addresses, ports or URLs
                const localCandidate = candidatesById.get(activeCandidatePair.localCandidateId);
                const remoteCandidate = candidatesById.get(activeCandidatePair.remoteCandidateId);
                assignIfDefined(stats, 'localCandidateType', localCandidate?.candidateType);
                assignIfDefined(stats, 'remoteCandidateType', remoteCandidate?.candidateType);
                assignIfDefined(stats, 'localCandidateProtocol', localCandidate?.protocol);
            }
        }
    } catch {
        return null;
    }

    return Object.keys(stats).length > BASE_STAT_KEY_COUNT ? (stats as ParticipantQualityStats) : null;
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
        pcRole: current.pcRole,
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

        // Send side (local participant only)
        packetsSent: toDelta(current.packetsSent, previous?.packetsSent),
        retransmittedPacketsSent: toDelta(current.retransmittedPacketsSent, previous?.retransmittedPacketsSent),
        framesEncoded: toDelta(current.framesEncoded, previous?.framesEncoded),
        remotePacketsLost: toDelta(current.remotePacketsLost, previous?.remotePacketsLost),

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
        targetBitrate: current.targetBitrate,
        remoteFractionLost: current.remoteFractionLost,
        remoteJitter: current.remoteJitter,
        remoteRoundTripTime: current.remoteRoundTripTime,
        sourceFramesPerSecond: current.sourceFramesPerSecond,
        sourceWidth: current.sourceWidth,
        sourceHeight: current.sourceHeight,
        sourceAudioLevel: current.sourceAudioLevel,

        localCandidateType: current.localCandidateType,
        remoteCandidateType: current.remoteCandidateType,
        localCandidateProtocol: current.localCandidateProtocol,
    };
};

const CPU_LIMITED_WINDOW_RATIO = 0.1;
const FREEZE_WINDOW_RATIO = 0.02;

const MIN_WINDOW_SECONDS = 1;

export const shouldReportStats = (stats: ParticipantQualityStats, windowSeconds: number): boolean => {
    const hasUsableWindow = windowSeconds >= MIN_WINDOW_SECONDS;

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

    if (
        hasUsableWindow &&
        stats.totalFreezesDuration !== undefined &&
        stats.totalFreezesDuration / windowSeconds > FREEZE_WINDOW_RATIO
    ) {
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

    // Sustained encoder CPU limitation, rather than the transient spikes a tab switch or a screen-share start produces
    if (
        hasUsableWindow &&
        stats.qualityLimitationDurationCpu !== undefined &&
        stats.qualityLimitationDurationCpu / windowSeconds > CPU_LIMITED_WINDOW_RATIO
    ) {
        return true;
    }

    // Send-side triggers. Without these the local participant is almost never reported, since every
    // check above reads inbound-rtp fields that only exist on the subscriber peer connection.
    // packetsSent already counts the packets the SFU reports as lost, so it is the whole denominator
    if (stats.packetsSent !== undefined && stats.remotePacketsLost !== undefined) {
        if (stats.packetsSent > 0 && stats.remotePacketsLost / stats.packetsSent > 0.025) {
            return true;
        }
    }

    if (stats.remoteFractionLost !== undefined && stats.remoteFractionLost > 0.025) {
        return true;
    }

    if (stats.remoteJitter !== undefined && stats.remoteJitter > 0.1) {
        return true;
    }

    if (stats.remoteRoundTripTime !== undefined && stats.remoteRoundTripTime > 0.3) {
        return true;
    }

    if (
        stats.packetsSent !== undefined &&
        stats.packetsSent > 0 &&
        stats.retransmittedPacketsSent !== undefined &&
        stats.retransmittedPacketsSent / stats.packetsSent > 0.1
    ) {
        return true;
    }

    return false;
};
