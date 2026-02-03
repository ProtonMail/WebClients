import { ConnectionQuality, RoomEvent } from 'livekit-client';
import type { Participant, RemoteTrackPublication, Room } from 'livekit-client';

import { MINUTE } from '@proton/shared/lib/constants';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import shuffle from '@proton/utils/shuffle';

import { logParticipantQuality } from './meetingTelemetry';
import type { ParticipantQualityStats } from './types';
import { calculateStatsDelta, getWebRTCStats, shouldReportStats } from './utils';

const BATCH_SIZE = 10;
const REPORT_INTERVAL_MS = 10 * MINUTE;
const EARLY_REPORT_TIMEOUT = MINUTE;
const MAX_POOR_QUALITY_STATS_PER_REPORT = 3;
const MAX_STATS_PER_REPORT = 6;

export class ParticipantQualityTelemetryProcessor {
    private room: Room;
    private poorQualityStats: ParticipantQualityStats[] = [];
    private interval: NodeJS.Timeout | null = null;
    private earlyReportTimeout: NodeJS.Timeout | null = null;
    private previousStatsByTrackSid = new Map<string, ParticipantQualityStats>();

    constructor(room: Room) {
        this.room = room;
    }

    private getStatsForAllParticipants = async () => {
        const participants = this.room.remoteParticipants;

        const validPublicationsWithIdentities = [...participants.values()].flatMap((participant) => {
            const validPublications = Array.from(participant.trackPublications.values()).filter(
                (publication) =>
                    publication.isSubscribed && publication.isEnabled && !publication.isMuted && publication.track
            );
            return validPublications.map((publication) => ({
                publication: publication,
                identity: participant.identity,
            }));
        });

        const promises = validPublicationsWithIdentities
            .map(({ publication, identity }) => async () => {
                return getWebRTCStats(publication as RemoteTrackPublication, identity, this.room.name);
            })
            .flat();

        const stats = await runInQueue(promises, BATCH_SIZE);

        return stats.flat().filter((stats) => stats !== null);
    };

    private handleConnectionQualityChanged = async (quality: ConnectionQuality, participant: Participant) => {
        if (participant.identity !== this.room.localParticipant.identity || quality !== ConnectionQuality.Poor) {
            return;
        }

        const statsByPublications = await Promise.all(
            Array.from(participant.trackPublications.values()).map(async (publication) => {
                return getWebRTCStats(publication as RemoteTrackPublication, participant.identity, this.room.name);
            })
        );

        const stats = statsByPublications.filter((stats) => stats !== null);
        stats.forEach((stat) => {
            this.previousStatsByTrackSid.set(stat.trackSid, stat);
        });

        this.poorQualityStats = [...this.poorQualityStats, ...stats];
    };

    private handleReport = async () => {
        const stats = await this.getStatsForAllParticipants();

        const filteredStats = stats.filter((stat) => {
            const previous = this.previousStatsByTrackSid.get(stat.trackSid);
            const delta = calculateStatsDelta(stat, previous);
            return shouldReportStats(delta);
        });

        stats.forEach((stat) => {
            this.previousStatsByTrackSid.set(stat.trackSid, stat);
        });

        const selectedPoorQualityStats = shuffle(this.poorQualityStats).slice(0, MAX_POOR_QUALITY_STATS_PER_REPORT);
        const selectedStats = shuffle(filteredStats).slice(0, MAX_STATS_PER_REPORT - selectedPoorQualityStats.length);

        // Will be batched by telemetry
        selectedStats.forEach((stat) => {
            logParticipantQuality(stat);
        });

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
    }
}
