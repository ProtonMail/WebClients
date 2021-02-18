import { layout } from './layout';
import { sortEvents } from './sortLayout';

const getDate = (minutes) => new Date(2000, 0, 1, 0, minutes);

const getEvent = (start, end) => ({ start: getDate(start), end: getDate(end) });

describe('sort', () => {
    test('it should sort by start time and use event length as tie breaker', () => {
        expect(sortEvents([getEvent(5, 21), getEvent(10, 20), getEvent(30, 50), getEvent(5, 20)])).toEqual([
            getEvent(5, 21),
            getEvent(5, 20),
            getEvent(10, 20),
            getEvent(30, 50),
        ]);
    });

    test('it should prioritize all day events if are not seen as part day events', () => {
        const a = {
            start: new Date(Date.UTC(2000, 1, 4, 0, 0)),
            end: new Date(Date.UTC(2000, 1, 4, 0, 0)),
            isAllDay: true,
        };
        const b = {
            start: new Date(Date.UTC(2000, 1, 5, 0, 0)),
            end: new Date(Date.UTC(2000, 1, 5, 0, 0)),
            isAllDay: true,
        };
        const c = {
            start: new Date(Date.UTC(2000, 1, 4, 16, 0)),
            end: new Date(Date.UTC(2000, 1, 5, 15, 0)),
        };
        expect(sortEvents([b, a, c])).toEqual([a, c, b]);
    });
});

const H = 60;

describe('layout', () => {
    test('it should layout events', () => {
        expect(layout(sortEvents([getEvent(10 * H, 12 * H)]))).toEqual([{ column: 0, columns: 1 }]);
    });

    test('it should layout events', () => {
        expect(layout(sortEvents([getEvent(10 * H, 12 * H), getEvent(13 * H, 15 * H)]))).toEqual([
            { column: 0, columns: 1 },
            { column: 0, columns: 1 },
        ]);
    });

    test('it should layout events', () => {
        expect(layout(sortEvents([getEvent(15 * H, 17 * H), getEvent(13 * H, 16 * H)]))).toEqual([
            { column: 0, columns: 2 },
            { column: 1, columns: 2 },
        ]);
    });

    test('it should layout events respecting the max width', () => {
        expect(
            layout(
                sortEvents([
                    getEvent(10 * H, 10 * H + 15),
                    getEvent(12 * H, 14 * H),
                    getEvent(13 * H, 16 * H),
                    getEvent(15 * H, 17 * H),
                ])
            )
        ).toEqual([
            { column: 0, columns: 1 },
            { column: 0, columns: 2 },
            { column: 1, columns: 2 },
            { column: 0, columns: 2 },
        ]);
    });

    test('it should layout events for a day view', () => {
        expect(
            layout([getEvent(1, 7), getEvent(1, 2), getEvent(1, 2), getEvent(1, 1), getEvent(5, 6), getEvent(7, 8)])
        ).toEqual([
            { column: 0, columns: 4 },
            { column: 1, columns: 4 },
            { column: 2, columns: 4 },
            { column: 3, columns: 4 },
            { column: 1, columns: 4 },
            { column: 0, columns: 1 },
        ]);
    });

    test('it should layout events for a day view', () => {
        expect(
            layout([getEvent(1, 7), getEvent(1, 3), getEvent(1, 2), getEvent(1, 2), getEvent(1, 2), getEvent(4, 5)])
        ).toEqual([
            { column: 0, columns: 5 },
            { column: 1, columns: 5 },
            { column: 2, columns: 5 },
            { column: 3, columns: 5 },
            { column: 4, columns: 5 },
            { column: 1, columns: 5 },
        ]);
    });
});
