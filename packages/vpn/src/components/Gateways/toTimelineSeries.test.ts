import type {
    GatewayConnectedUsersTimeline,
    GatewayServerTimeline,
    GatewayTimelines,
    GatewayTimelineSpan,
} from './timelines';
import { toTimelineSeries } from './toTimelineSeries';

const START = 1_700_000_000;
const FIVE_MINUTES = 300;

const GAP = null;
const NOTHING_DRAWN = {};

type Reported = number | typeof GAP;
type SlotReading = 'Average' | 'Peak';

const startOfSlot = (slot: number) => START + slot * FIVE_MINUTES;

const timelineSpanOf = (slots: number): GatewayTimelineSpan => ({
    Start: START,
    End: startOfSlot(slots),
    PointSeconds: FIVE_MINUTES,
});

const EMPTY_SPAN = { Start: START, End: START, PointSeconds: FIVE_MINUTES };
const BACKWARDS_SPAN = { Start: START, End: START - FIVE_MINUTES, PointSeconds: FIVE_MINUTES };
const SLOTS_OF_NO_LENGTH = { Start: START, End: startOfSlot(2), PointSeconds: 0 };
const SLOTS_OF_NEGATIVE_LENGTH = { Start: START, End: startOfSlot(2), PointSeconds: -FIVE_MINUTES };

const recorded = (average: Reported) => (average === GAP ? null : { Average: average, Peak: average + 2 });

const serverReporting = (reported: Reported[], overrides: Partial<GatewayServerTimeline> = {}) =>
    ({
        ID: 's1',
        Removed: false,
        DataSince: START,
        Peak: null,
        Points: reported.map(recorded),
        ...overrides,
    }) as unknown as GatewayServerTimeline;

const drawnFrom = (
    reported: Reported[],
    timelineSpan = timelineSpanOf(reported.length),
    reading: SlotReading = 'Average'
) =>
    Object.fromEntries(
        toTimelineSeries(serverReporting(reported), timelineSpan, reading).points.map(({ timestamp, value }) => [
            `s${(timestamp - START) / FIVE_MINUTES}`,
            value,
        ])
    );

describe('toTimelineSeries', () => {
    describe('a timeline span with no gaps in it', () => {
        it('draws every reading at the slot it was recorded in', () => {
            expect(drawnFrom([10, 20, 30])).toEqual({ s0: 10, s1: 20, s2: 30 });
        });

        it('draws a zero, which is a reading of nothing rather than no reading', () => {
            expect(drawnFrom([0, 0, 1])).toEqual({ s0: 0, s1: 0, s2: 1 });
        });
    });

    describe('a timeline span with gaps, where the last unbroken run survives', () => {
        it.each([
            { shape: 'a gap at the start', reported: [GAP, GAP, 5, 6], drawn: { s2: 5, s3: 6 } },
            { shape: 'a hole in the middle', reported: [1, 2, GAP, 7, 8], drawn: { s3: 7, s4: 8 } },
            { shape: 'several holes', reported: [1, GAP, 2, GAP, 3, 4], drawn: { s4: 3, s5: 4 } },
            { shape: 'a gap at the end', reported: [1, 2, GAP, GAP], drawn: { s0: 1, s1: 2 } },
            { shape: 'a gap at each end', reported: [GAP, 1, 2, GAP], drawn: { s1: 1, s2: 2 } },
            { shape: 'a hole and then a gap at the end', reported: [1, GAP, 9, GAP], drawn: { s2: 9 } },
            { shape: 'one lone reading', reported: [3], drawn: { s0: 3 } },
            { shape: 'nothing but gaps', reported: [GAP, GAP], drawn: NOTHING_DRAWN },
            { shape: 'no slots at all', reported: [], drawn: NOTHING_DRAWN },
        ])('resolves a server reporting $shape', ({ reported, drawn }) => {
            expect(drawnFrom(reported)).toEqual(drawn);
        });

        it('timestamps a surviving reading from its own slot, not from its place in the line', () => {
            const { points } = toTimelineSeries(serverReporting([GAP, GAP, GAP, 4, 5]), timelineSpanOf(5));

            expect(points).toEqual([
                { timestamp: startOfSlot(3), value: 4 },
                { timestamp: startOfSlot(4), value: 5 },
            ]);
        });
    });

    describe('a timeline span and a response that disagree', () => {
        it.each([
            {
                shape: 'more readings than slots',
                reported: [1, 2, 3, 4, 5, 6],
                slots: 4,
                drawn: { s0: 1, s1: 2, s2: 3, s3: 4 },
            },
            { shape: 'fewer readings than slots', reported: [1, 2], slots: 5, drawn: { s0: 1, s1: 2 } },
        ])('draws only the slots the timeline span declares, given $shape', ({ reported, slots, drawn }) => {
            expect(drawnFrom(reported, timelineSpanOf(slots))).toEqual(drawn);
        });

        it.each([
            { shape: 'an empty timeline span', timelineSpan: EMPTY_SPAN },
            { shape: 'a timeline span ending before it starts', timelineSpan: BACKWARDS_SPAN },
            { shape: 'slots no seconds long', timelineSpan: SLOTS_OF_NO_LENGTH },
            { shape: 'slots a negative number of seconds long', timelineSpan: SLOTS_OF_NEGATIVE_LENGTH },
        ])('draws nothing, and does not throw, for $shape', ({ timelineSpan }) => {
            expect(drawnFrom([1, 2, 3], timelineSpan)).toEqual(NOTHING_DRAWN);
        });
    });

    describe('what the server carries into its line', () => {
        it('carries the server identity, its removed flag and its peak through untouched', () => {
            const server = serverReporting([10], { ID: 's9', Removed: true, Peak: 42 });

            expect(toTimelineSeries(server, timelineSpanOf(1))).toEqual({
                serverId: 's9',
                removed: true,
                peak: 42,
                points: [{ timestamp: startOfSlot(0), value: 10 }],
            });
        });

        it('draws the peak of each slot when asked for it instead of the average', () => {
            expect(drawnFrom([10, 20], timelineSpanOf(2), 'Peak')).toEqual({ s0: 12, s1: 22 });
        });

        it('draws an empty line for a server carrying no points at all', () => {
            const server = { ID: 's1', Removed: false, Peak: null, Points: null } as unknown as GatewayServerTimeline;

            expect(toTimelineSeries(server, timelineSpanOf(3))).toEqual({
                serverId: 's1',
                removed: false,
                peak: null,
                points: [],
            });
        });
    });
});

const fullResponse = (): GatewayTimelines => ({
    Load: {
        GatewayID: 'g1',
        Window: timelineSpanOf(3),
        CapacityThreshold: 80,
        ServersTotal: 1,
        Servers: [serverReporting([1, GAP, 3])],
    },
    ConnectedUsers: {
        GatewayID: 'g1',
        Window: timelineSpanOf(3),
        CapacityThreshold: null,
        MonitoringOn: true,
        ServersTotal: 1,
        Servers: [serverReporting([4, 5, GAP])],
    },
});

describe('the full timelines response', () => {
    it('holds a load timeline and a connected users timeline against the contract', () => {
        const { Load, ConnectedUsers } = fullResponse();
        const connectedUsers: GatewayConnectedUsersTimeline = ConnectedUsers;

        expect(connectedUsers.MonitoringOn).toBe(true);
        expect(Load.Servers[0].Points).toHaveLength(3);
        expect(connectedUsers.Servers[0].Points).toHaveLength(3);
    });
});
