import { TMP_UNIQUE_ID } from '@proton/shared/lib/calendar/constants';

import type { CalendarViewEvent, CalendarViewEventData } from '../../containers/calendar/interface';
import { layout } from './layout';
import { sortEvents } from './sortLayout';

const getDate = (minutes: number) => new Date(2000, 0, 1, 0, minutes);

const getEvent = (startMinutes: number, endMinutes: number) =>
    ({
        uniqueId: TMP_UNIQUE_ID,
        start: getDate(startMinutes),
        end: getDate(endMinutes),
        isAllDay: false,
        isAllPartDay: false,
        data: {} as CalendarViewEventData,
    }) as CalendarViewEvent;

const getLayoutEventsForTimeGrid = (events: CalendarViewEvent[]) =>
    events.map(({ start, end }) => ({
        start: 60 * start.getHours() + start.getMinutes(),
        end: 60 * end.getHours() + end.getMinutes(),
    }));

const getLayoutEventsForDayGrid = (events: CalendarViewEvent[]) =>
    events.map(({ start, end }) => ({
        start: start.getMinutes(),
        end: end.getMinutes(),
    }));

describe('sort', () => {
    it('should sort by start time and use event length as tie breaker', () => {
        expect(sortEvents([getEvent(5, 21), getEvent(10, 20), getEvent(30, 50), getEvent(5, 20)])).toEqual([
            getEvent(5, 21),
            getEvent(5, 20),
            getEvent(10, 20),
            getEvent(30, 50),
        ]);
    });

    it('should prioritize all day events if are not seen as part day events', () => {
        const a = {
            ...getEvent(0, 0),
            start: new Date(Date.UTC(2000, 1, 4, 0, 0)),
            end: new Date(Date.UTC(2000, 1, 4, 0, 0)),
            isAllDay: true,
        };
        const b = {
            ...getEvent(0, 0),
            start: new Date(Date.UTC(2000, 1, 5, 0, 0)),
            end: new Date(Date.UTC(2000, 1, 5, 0, 0)),
            isAllDay: true,
        };
        const c = {
            ...getEvent(0, 0),
            start: new Date(Date.UTC(2000, 1, 4, 16, 0)),
            end: new Date(Date.UTC(2000, 1, 5, 15, 0)),
        };
        expect(sortEvents([b, a, c])).toEqual([a, c, b]);
    });
});

const H = 60;

describe('layout', () => {
    describe('in the time grid', () => {
        // we fake minutes through "integer hours" in getEvent

        it('should layout a single event', () => {
            expect(layout(getLayoutEventsForTimeGrid(sortEvents([getEvent(10 * H, 12 * H)])))).toEqual([
                { column: 0, columns: 1 },
            ]);
        });

        it('should layout non-overlapping events', () => {
            expect(
                layout(getLayoutEventsForTimeGrid(sortEvents([getEvent(10 * H, 12 * H), getEvent(13 * H, 15 * H)])))
            ).toEqual([
                { column: 0, columns: 1 },
                { column: 0, columns: 1 },
            ]);
        });

        it('should layout overlapping events', () => {
            expect(
                layout(getLayoutEventsForTimeGrid(sortEvents([getEvent(15 * H, 17 * H), getEvent(13 * H, 16 * H)])))
            ).toEqual([
                { column: 0, columns: 2 },
                { column: 1, columns: 2 },
            ]);
        });

        it('should layout events respecting the max width in the time grid', () => {
            expect(
                layout(
                    getLayoutEventsForTimeGrid(
                        sortEvents([
                            getEvent(10 * H, 10 * H + 15),
                            getEvent(12 * H, 14 * H),
                            getEvent(13 * H, 16 * H),
                            getEvent(15 * H, 17 * H),
                        ])
                    )
                )
            ).toEqual([
                { column: 0, columns: 1 },
                { column: 0, columns: 2 },
                { column: 1, columns: 2 },
                { column: 0, columns: 2 },
            ]);
        });
    });

    describe('in the all-day event row', () => {
        // we fake column position through "integer minutes" in getEvent
        it('should layout events for a day view', () => {
            expect(
                layout(
                    getLayoutEventsForDayGrid([
                        getEvent(1, 7),
                        getEvent(1, 2),
                        getEvent(1, 2),
                        getEvent(1, 1),
                        getEvent(5, 6),
                        getEvent(7, 8),
                    ])
                )
            ).toEqual([
                { column: 0, columns: 4 },
                { column: 1, columns: 4 },
                { column: 2, columns: 4 },
                { column: 3, columns: 4 },
                { column: 1, columns: 4 },
                { column: 0, columns: 1 },
            ]);
        });

        it('should layout events for a day view', () => {
            expect(
                layout(
                    getLayoutEventsForDayGrid([
                        getEvent(1, 7),
                        getEvent(1, 3),
                        getEvent(1, 2),
                        getEvent(1, 2),
                        getEvent(1, 2),
                        getEvent(4, 5),
                    ])
                )
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
});
