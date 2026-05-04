import type { Room } from 'livekit-client';

import { collectReceiverStats } from './inboundRtpStats';

const TICK_INTERVAL_MS = 2_000;

const formatNumber = (value: unknown): unknown => (typeof value === 'number' ? value.toFixed(3) : value);

/**
 * Lightweight diagnostic logger that prints a console.table snapshot of all
 * subscribed remote receivers' inbound-rtp stats every {@link TICK_INTERVAL_MS}.
 * Always feature-flag gated; it only exists to help humans correlate broken
 * audio reports with the underlying cryptor/transport behaviour.
 *
 * It is intentionally separate from {@link E2eeRecoveryManager} so toggling
 * verbose logging never affects the actual recovery decisions.
 */
export class E2eeStatsDebugger {
    private readonly room: Room;
    private interval: NodeJS.Timeout | null = null;

    constructor(room: Room) {
        this.room = room;
    }

    setup = () => {
        // eslint-disable-next-line no-console
        console.log('E2eeStatsDebugger: enabled — printing inbound-rtp stats every 2s');

        this.interval = setInterval(() => {
            void this.print();
        }, TICK_INTERVAL_MS);
    };

    cleanup = () => {
        if (this.interval) {
            clearInterval(this.interval);

            this.interval = null;
        }
    };

    private print = async () => {
        try {
            const ticks = await collectReceiverStats(this.room);

            const rows = ticks
                .filter((tick) => Boolean(tick.stats))
                .map((tick) => {
                    const stats = tick.stats ?? {};
                    return {
                        t: new Date().toISOString().slice(11, 19),
                        participant: tick.participant.identity.slice(-6),
                        kind: tick.kind,
                        sid: tick.publication.trackSid.slice(-6),
                        pktsRx: stats.packetsReceived,
                        pktsLost: stats.packetsLost,
                        bytesRx: stats.bytesReceived,
                        framesDec: stats.framesDecoded,
                        framesDrop: stats.framesDropped,
                        concSamples: stats.concealedSamples,
                        concEvents: stats.concealmentEvents,
                        silentConc: stats.silentConcealedSamples,
                        totalSamplesRx: stats.totalSamplesReceived,
                        totalAudioEnergy: formatNumber(stats.totalAudioEnergy),
                        audioLevel: formatNumber(stats.audioLevel),
                        jitter: formatNumber(stats.jitter),
                    };
                });

            if (rows.length) {
                // eslint-disable-next-line no-console
                console.table(rows);
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.warn('E2eeStatsDebugger: print failed', error);
        }
    };
}
