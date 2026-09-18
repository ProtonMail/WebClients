import { getMailDropDayStart, getMailDropStart } from './dateHelpers';

describe('getMailDropStart', () => {
    // Tuesday, 1 September 2026, represented as a fake-UTC date.
    const tuesday = new Date(Date.UTC(2026, 8, 1));

    const oneDayGrid = (gridY: number) => ({
        clientX: 0,
        clientY: gridY,
        gridRect: { left: 0, top: 0, width: 600, height: 1440 },
        days: [tuesday],
        interval: 30,
    });

    it('maps a drop at 14:00 on a single day to Tuesday 14:00', () => {
        // 14:00 -> 840 minutes into a 1440-minute (24h) grid.
        const start = getMailDropStart(oneDayGrid(840));

        expect(start).toEqual(Date.UTC(2026, 8, 1, 14, 0));
    });

    it('snaps off-grid drop positions to the configured interval', () => {
        // 9:07 -> snaps down to 9:00 (540 minutes).
        const start = getMailDropStart(oneDayGrid(547));

        expect(start).toEqual(Date.UTC(2026, 8, 1, 9, 0));
    });

    it('clamps a drop beyond the right edge to the nearest day column', () => {
        const start = getMailDropStart({
            ...oneDayGrid(840),
            // clientX far beyond the single-day column width
            clientX: 5000,
        });

        expect(start).toEqual(Date.UTC(2026, 8, 1, 14, 0));
    });

    it('returns 0 when there are no day columns', () => {
        const start = getMailDropStart({
            ...oneDayGrid(840),
            days: [],
        });

        expect(start).toEqual(0);
    });

    describe('week view', () => {
        const sunday = new Date(Date.UTC(2026, 7, 30));
        const monday = new Date(Date.UTC(2026, 7, 31));
        const tuesday = new Date(Date.UTC(2026, 8, 1));
        const week = [sunday, monday, tuesday];

        it('maps a drop onto the third day (Tuesday) at 14:00', () => {
            // 7-day week split into 3 equal columns -> Tuesday occupies x in [400, 600).
            const start = getMailDropStart({
                clientX: 500,
                clientY: 840,
                gridRect: { left: 0, top: 0, width: 600, height: 1440 },
                days: week,
                interval: 30,
            });

            expect(start).toEqual(Date.UTC(2026, 8, 1, 14, 0));
        });

        it('maps a drop onto the first day (Sunday) at 09:00', () => {
            const start = getMailDropStart({
                clientX: 100,
                clientY: 540,
                gridRect: { left: 0, top: 0, width: 600, height: 1440 },
                days: week,
                interval: 30,
            });

            expect(start).toEqual(Date.UTC(2026, 7, 30, 9, 0));
        });
    });
});

describe('getMailDropDayStart', () => {
    // A 2-row month grid: 7 columns per row.
    const row0 = [
        new Date(Date.UTC(2026, 7, 30)),
        new Date(Date.UTC(2026, 7, 31)),
        new Date(Date.UTC(2026, 8, 1)),
        new Date(Date.UTC(2026, 8, 2)),
        new Date(Date.UTC(2026, 8, 3)),
        new Date(Date.UTC(2026, 8, 4)),
        new Date(Date.UTC(2026, 8, 5)),
    ];
    const row1 = [
        new Date(Date.UTC(2026, 8, 6)),
        new Date(Date.UTC(2026, 8, 7)),
        new Date(Date.UTC(2026, 8, 8)),
        new Date(Date.UTC(2026, 8, 9)),
        new Date(Date.UTC(2026, 8, 10)),
        new Date(Date.UTC(2026, 8, 11)),
        new Date(Date.UTC(2026, 8, 12)),
    ];

    it('maps a drop onto a day cell to the start of that day (default time)', () => {
        // row 0, column 2 (Tuesday 1 Sep): x in [171, 257), y in first half.
        const start = getMailDropDayStart({
            clientX: 200,
            clientY: 50,
            gridRect: { left: 0, top: 0, width: 600, height: 200 },
            rows: [row0, row1],
        });

        expect(start).toEqual(Date.UTC(2026, 8, 1));
    });

    it('maps a drop onto the second row to that row day', () => {
        const start = getMailDropDayStart({
            clientX: 500,
            clientY: 150,
            gridRect: { left: 0, top: 0, width: 600, height: 200 },
            rows: [row0, row1],
        });

        // row 1, column 5 (Friday 11 Sep)
        expect(start).toEqual(Date.UTC(2026, 8, 11));
    });

    it('returns 0 when there are no rows', () => {
        expect(getMailDropDayStart({ clientX: 0, clientY: 0, gridRect: { left: 0, top: 0, width: 600, height: 200 }, rows: [] })).toEqual(
            0
        );
    });
});
