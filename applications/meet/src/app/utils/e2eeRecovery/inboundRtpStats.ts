import type { RemoteTrackPublication, Room } from 'livekit-client';

import type { InboundRtpStats, ReceiverStatsTick } from './types';

/**
 * Extracts the inbound-rtp stats dictionary for a single receiver. Returns
 * undefined if the receiver doesn't expose getStats yet (e.g. the track is
 * still being subscribed or the underlying transceiver was just replaced).
 */
const readInboundRtp = async (publication: RemoteTrackPublication): Promise<InboundRtpStats | undefined> => {
    const receiver = publication.track?.receiver;

    if (!receiver?.getStats) {
        return undefined;
    }

    try {
        const report = await receiver.getStats();

        for (const [, value] of report) {
            if (value?.type === 'inbound-rtp') {
                return value;
            }
        }
    } catch {
        // Ignore individual receiver failures so one bad receiver doesn't
        // block the whole tick.
    }
    return undefined;
};

/**
 * Iterates over every remote track publication in the room and collects its
 * inbound-rtp stats. Single source of truth for the stats walk shared between
 * the recovery manager and the debug logger.
 */
export const collectReceiverStats = async (room: Room): Promise<ReceiverStatsTick[]> => {
    const ticks: ReceiverStatsTick[] = [];

    for (const participant of room.remoteParticipants.values()) {
        for (const publication of participant.trackPublications.values()) {
            const stats = await readInboundRtp(publication);

            ticks.push({
                participant,
                publication,
                kind: stats?.kind ?? (publication.kind === 'video' ? 'video' : 'audio'),
                stats,
            });
        }
    }

    return ticks;
};
