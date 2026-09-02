import { ConnectionQuality, RoomEvent } from 'livekit-client';
import type { Participant, RemoteTrackPublication, Room } from 'livekit-client';

import { MINUTE } from '@proton/shared/lib/constants';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import shuffle from '@proton/utils/shuffle';

import { logParticipantQuality } from './meetingTelemetry';
import type { ParticipantQualityStats } from './types';
import { calculateStatsDelta, getUrlWithoutProtocol, getWebRTCStats, shouldReportStats } from './utils';

const BATCH_SIZE = 10;
const REPORT_INTERVAL_MS = 10 * MINUTE;
const EARLY_REPORT_TIMEOUT = MINUTE;
const MAX_POOR_QUALITY_STATS_PER_REPORT = 3;
const MAX_STATS_PER_REPORT = 6;

export class ParticipantQualityTelemetryProcessor {
    private room: Room;
    private websocketUrl?: string;
    private poorQualityStats: ParticipantQualityStats[] = [];
    private interval: NodeJS.Timeout | null = null;
    private earlyReportTimeout: NodeJS.Timeout | null = null;
    private previousSampleByTrackSid = new Map<string, { stats: ParticipantQualityStats; sampledAt: number }>();
    private isKillSwitchEnabled: boolean;
    private startedAt = Date.now();

    constructor(room: Room, websocketUrl?: string, isKillSwitchEnabled = false) {
        this.room = room;
        this.websocketUrl = websocketUrl ? getUrlWithoutProtocol(websocketUrl) : undefined;
        this.isKillSwitchEnabled = isKillSwitchEnabled;
    }

    private getStatsForAllParticipants = async () => {
        const localParticipant = this.room.localParticipant;
        const allParticipants: Participant[] = [...this.room.remoteParticipants.values(), localParticipant];

        const validPublicationsWithIdentities = allParticipants.flatMap((participant) => {
            const isLocal = participant === localParticipant;
            const validPublications = Array.from(participant.trackPublications.values()).filter(
                (publication) =>
                    (isLocal || publication.isSubscribed) &&
                    publication.isEnabled &&
                    !publication.isMuted &&
                    publication.track
            );
            return validPublications.map((publication) => ({
                publication,
                identity: participant.identity,
                isLocal,
            }));
        });

        const promises = validPublicationsWithIdentities
            .map(({ publication, identity, isLocal }) => async () => {
                return getWebRTCStats(
                    publication as unknown as RemoteTrackPublication,
                    identity,
                    this.room.name,
                    isLocal
                );
            })
            .flat();

        const stats = await runInQueue(promises, BATCH_SIZE);
        const participantCount = allParticipants.length;

        return stats
            .flat()
            .filter((stats) => stats !== null)
            .map((stat) => ({ ...stat, participantCount }));
    };

    private handleConnectionQualityChanged = async (quality: ConnectionQuality, participant: Participant) => {
        if (participant.identity !== this.room.localParticipant.identity || quality !== ConnectionQuality.Poor) {
            return;
        }

        // This path only ever runs for the local participant, so these are publisher-side stats
        const statsByPublications = await Promise.all(
            Array.from(participant.trackPublications.values()).map(async (publication) => {
                return getWebRTCStats(
                    publication as RemoteTrackPublication,
                    participant.identity,
                    this.room.name,
                    true
                );
            })
        );

        const stats = statsByPublications.filter((stats) => stats !== null);
        const sampledAt = Date.now();
        stats.forEach((stat) => {
            this.previousSampleByTrackSid.set(stat.trackSid, { stats: stat, sampledAt });
        });

        this.poorQualityStats = [...this.poorQualityStats, ...stats];
    };

    private handleReport = async () => {
        const stats = await this.getStatsForAllParticipants();
        const sampledAt = Date.now();

        const statsWithFlag = stats.map((stat) => {
            const previous = this.previousSampleByTrackSid.get(stat.trackSid);
            const delta = calculateStatsDelta(stat, previous?.stats);
            const windowSeconds = (sampledAt - (previous?.sampledAt ?? this.startedAt)) / 1000;
            return { stat, flagged: shouldReportStats(delta, windowSeconds) };
        });

        stats.forEach((stat) => {
            this.previousSampleByTrackSid.set(stat.trackSid, { stats: stat, sampledAt });
        });

        const selectedPoorQualityStats = shuffle(this.poorQualityStats).slice(0, MAX_POOR_QUALITY_STATS_PER_REPORT);
        const flaggedStats = statsWithFlag.filter(({ flagged }) => flagged);

        const selectedStats = this.isKillSwitchEnabled
            ? shuffle(flaggedStats).slice(0, Math.max(0, MAX_STATS_PER_REPORT - selectedPoorQualityStats.length))
            : flaggedStats;

        // Will be batched by telemetry
        [...selectedPoorQualityStats.map((stat) => ({ stat, flagged: true })), ...selectedStats].forEach(
            ({ stat, flagged }) => {
                logParticipantQuality({ ...stat, flagged, websocketUrl: this.websocketUrl });
            }
        );

        this.poorQualityStats = [];
    };

    listen() {
        this.room.on(RoomEvent.ConnectionQualityChanged, this.handleConnectionQualityChanged);

        this.interval = setInterval(this.handleReport, REPORT_INTERVAL_MS);

        // Doing an early report as in case of bad audio/video quality meetings can end earlier than 10 minutes
        this.earlyReportTimeout = setTimeout(this.handleReport, EARLY_REPORT_TIMEOUT);
    }

    stopListening() {
        this.room.off(RoomEvent.ConnectionQualityChanged, this.handleConnectionQualityChanged);

        if (this.interval) {
            clearInterval(this.interval);
        }

        if (this.earlyReportTimeout) {
            clearTimeout(this.earlyReportTimeout);
        }

        void this.handleReport();
    }
}
