import type { GatewayServerTimeline, GatewayTimelineSpan, TimelineSeries } from './timelines';

/**
 * How many slots the timeline span is cut into. A malformed span has no slots.
 */
const getSlotCount = ({ Start, End, PointSeconds }: GatewayTimelineSpan) =>
    PointSeconds > 0 && End > Start ? Math.floor((End - Start) / PointSeconds) : 0;

/**
 * Which recorded value the line draws: the backend saves both per slot.
 */
type SlotReading = 'Average' | 'Peak';

const readSlot =
    (reading: SlotReading) =>
    (slot: { Average: number | null; Peak: number | null } | null): number | null =>
        slot?.[reading] ?? null;

const hasReading = (value: number | null | undefined): value is number => value !== null && value !== undefined;

/**
 * Turns one server's timeline into the line the chart draws.
 *
 * The chart takes a non-nullable number per point, so gaps are cut rather than filled: what survives is the last
 * unbroken run of readings, timestamped from its own slots.
 *
 * @param server the server's readings over the timeline span, e.g. `{ ID: 's1', Removed: false, Peak: 90, Points: [{ Average: 10, Peak: 20 }, null ] }`
 * @param timelineSpan the timeline span the readings sit in, e.g. `{ Start: 1_700_000_000, End: 1_700_000_900, PointSeconds: 300 }`
 * @param reading which recorded value to draw — defaults to `'Average'`
 * @returns the drawable line — for the example arguments, `{ serverId: 's1', removed: false, peak: 90, points: [{ timestamp: 1_700_000_600, value: 10 }] }`,
 * since the gap mid-span discards everything before it
 */
export const toTimelineSeries = (
    server: GatewayServerTimeline,
    timelineSpan: GatewayTimelineSpan,
    reading: SlotReading = 'Average'
): TimelineSeries => {
    const slots = (server.Points ?? []).slice(0, getSlotCount(timelineSpan));
    const read = readSlot(reading);

    // Trailing gaps end the line, they do not discard it.
    let end = slots.length;
    while (end > 0 && !hasReading(read(slots[end - 1]))) {
        end -= 1;
    }

    let start = end;
    while (start > 0 && hasReading(read(slots[start - 1]))) {
        start -= 1;
    }

    return {
        serverId: server.ID,
        removed: server.Removed,
        peak: server.Peak,
        points: slots.slice(start, end).map((slot, offset) => ({
            timestamp: timelineSpan.Start + (start + offset) * timelineSpan.PointSeconds,
            value: read(slot) as number,
        })),
    };
};
