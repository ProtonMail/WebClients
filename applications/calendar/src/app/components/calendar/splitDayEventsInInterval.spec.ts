import { TMP_UNIQUE_ID } from '@proton/shared/lib/calendar/constants';

import type { CalendarViewEventData } from '../../containers/calendar/interface';
import { splitDayEventsInInterval } from './splitDayEventsInInterval';

describe('splitDayEventsInInterval()', () => {
    describe('in week/day view', () => {
        // enough to test week view since the logic is the same
        const min = new Date(Date.UTC(2023, 10, 27)); // Monday 27/11/2023
        const max = new Date(Date.UTC(2023, 11, 3)); // Sunday 3/12/2023

        // In week or day view, only all-day events or part-day events lasting >= 24 hours go into the day events row

        describe('for events displayed within range in view', () => {
            it('places in one column all-day events lasting one day', () => {
                const event = {
                    uniqueId: TMP_UNIQUE_ID,
                    isAllDay: true,
                    isAllPartDay: false,
                    start: new Date(Date.UTC(2023, 10, 29)), // Wednesday 29/11/2023
                    end: new Date(Date.UTC(2023, 10, 29)),
                    data: {} as CalendarViewEventData,
                };

                expect(
                    splitDayEventsInInterval({
                        events: [event],
                        min,
                        max,
                    })
                ).toEqual([
                    {
                        idx: 0,
                        start: 2,
                        end: 3,
                    },
                ]);
            });

            it('places in one column an all-day events on the last day of the range', () => {
                const event = {
                    uniqueId: TMP_UNIQUE_ID,
                    isAllDay: true,
                    isAllPartDay: false,
                    start: new Date(Date.UTC(2023, 11, 3)), // Sunday 3/12/2023
                    end: new Date(Date.UTC(2023, 11, 3)),
                    data: {} as CalendarViewEventData,
                };

                expect(
                    splitDayEventsInInterval({
                        events: [event],
                        min,
                        max,
                    })
                ).toEqual([
                    {
                        idx: 0,
                        start: 6,
                        end: 7,
                    },
                ]);
            });

            it('places in two columns all-day events lasting two days ', () => {
                const event = {
                    uniqueId: TMP_UNIQUE_ID,
                    isAllDay: true,
                    isAllPartDay: false,
                    start: new Date(Date.UTC(2023, 10, 29)), // Wednesday 29/11/2023
                    end: new Date(Date.UTC(2023, 10, 30)), // Thursday 30/11/2023
                    data: {} as CalendarViewEventData,
                };

                expect(
                    splitDayEventsInInterval({
                        events: [event],
                        min,
                        max,
                    })
                ).toEqual([
                    {
                        idx: 0,
                        start: 2,
                        end: 4,
                    },
                ]);
            });

            it('places in two columns part-day events lasting 24 hours not ending at midnight', () => {
                const event = {
                    uniqueId: TMP_UNIQUE_ID,
                    isAllDay: false,
                    isAllPartDay: true,
                    start: new Date(Date.UTC(2023, 10, 29, 12)), // Wednesday 29/11/2023 12:00
                    end: new Date(Date.UTC(2023, 10, 30, 12)), // Thursday 30/11/2023 12:00
                    data: {} as CalendarViewEventData,
                };

                expect(
                    splitDayEventsInInterval({
                        events: [event],
                        min,
                        max,
                    })
                ).toEqual([
                    {
                        idx: 0,
                        start: 2,
                        end: 4,
                    },
                ]);
            });

            it('places in one column part-day events lasting 24 hours on the last day of the range', () => {
                const event = {
                    uniqueId: TMP_UNIQUE_ID,
                    isAllDay: false,
                    isAllPartDay: true,
                    start: new Date(Date.UTC(2023, 11, 3, 0)), // Sunday 3/12/2023 0:00
                    end: new Date(Date.UTC(2023, 11, 4, 0)), // Monday 4/12/2023 0:00
                    data: {} as CalendarViewEventData,
                };

                expect(
                    splitDayEventsInInterval({
                        events: [event],
                        min,
                        max,
                    })
                ).toEqual([
                    {
                        idx: 0,
                        start: 6,
                        end: 7,
                    },
                ]);
            });

            it('places in two columns part-day events lasting between 24 hours and 48 hours and ending at midnight ', () => {
                const event = {
                    uniqueId: TMP_UNIQUE_ID,
                    isAllDay: false,
                    isAllPartDay: true,
                    start: new Date(Date.UTC(2023, 10, 28, 12)), // Tuesday 28/11/2023 12:00
                    end: new Date(Date.UTC(2023, 10, 30)), // Thursday 30/11/2023 0:00
                    data: {} as CalendarViewEventData,
                };

                expect(
                    splitDayEventsInInterval({
                        events: [event],
                        min,
                        max,
                    })
                ).toEqual([
                    {
                        idx: 0,
                        start: 1,
                        end: 3,
                    },
                ]);
            });

            it('places in one column part-day events starting at midnight and lasting 24 hours ', () => {
                const event = {
                    uniqueId: TMP_UNIQUE_ID,
                    isAllDay: false,
                    isAllPartDay: true,
                    start: new Date(Date.UTC(2023, 10, 29)), // Thursday 29/11/2023 0:00
                    end: new Date(Date.UTC(2023, 10, 30)), // Thursday 30/11/2023 0:00
                    data: {} as CalendarViewEventData,
                };

                expect(
                    splitDayEventsInInterval({
                        events: [event],
                        min,
                        max,
                    })
                ).toEqual([
                    {
                        idx: 0,
                        start: 2,
                        end: 3,
                    },
                ]);
            });

            it('places in two columns part-day events starting at midnight and lasting 48 hours ', () => {
                const event = {
                    uniqueId: TMP_UNIQUE_ID,
                    isAllDay: false,
                    isAllPartDay: true,
                    start: new Date(Date.UTC(2023, 10, 29)), // Thursday 29/11/2023 0:00
                    end: new Date(Date.UTC(2023, 11, 1)), // Friday 1/12/2023 0:00
                    data: {} as CalendarViewEventData,
                };

                expect(
                    splitDayEventsInInterval({
                        events: [event],
                        min,
                        max,
                    })
                ).toEqual([
                    {
                        idx: 0,
                        start: 2,
                        end: 4,
                    },
                ]);
            });
        });

        describe('for events partially or totally falling outside of range in view', () => {
            it('places in one column all-day events ending outside the range', () => {
                const event = {
                    uniqueId: TMP_UNIQUE_ID,
                    isAllDay: true,
                    isAllPartDay: false,
                    start: new Date(Date.UTC(2023, 11, 3)), // Sunday 3/12/2023
                    end: new Date(Date.UTC(2023, 11, 4)), // Monday 4/12/2023
                    data: {} as CalendarViewEventData,
                };

                expect(
                    splitDayEventsInInterval({
                        events: [event],
                        min,
                        max,
                    })
                ).toEqual([
                    {
                        idx: 0,
                        start: 6,
                        end: 7,
                    },
                ]);
            });

            it('places in one column part-day events lasting 24 hours not ending at midnight and ending outside the range', () => {
                const event = {
                    uniqueId: TMP_UNIQUE_ID,
                    isAllDay: false,
                    isAllPartDay: true,
                    start: new Date(Date.UTC(2023, 11, 3, 12)), // Sunday 3/12/2023 19:00
                    end: new Date(Date.UTC(2023, 11, 4, 12)), // Monday 4/12/2023 19:00
                    data: {} as CalendarViewEventData,
                };

                expect(
                    splitDayEventsInInterval({
                        events: [event],
                        min,
                        max,
                    })
                ).toEqual([
                    {
                        idx: 0,
                        start: 6,
                        end: 7,
                    },
                ]);
            });

            it('places in one column part-day events lasting more than 24 hours ending at midnight outside of the range', () => {
                const event = {
                    uniqueId: TMP_UNIQUE_ID,
                    isAllDay: false,
                    isAllPartDay: true,
                    start: new Date(Date.UTC(2023, 11, 3, 12)), // Sunday 3/12/2023 19:00
                    end: new Date(Date.UTC(2023, 11, 5, 0)), // Tuesday 5/12/2023 0:00
                    data: {} as CalendarViewEventData,
                };

                expect(
                    splitDayEventsInInterval({
                        events: [event],
                        min,
                        max,
                    })
                ).toEqual([
                    {
                        idx: 0,
                        start: 6,
                        end: 7,
                    },
                ]);
            });

            it('skips part-day events lasting more than 24 hours which fall outside of range', () => {
                const event = {
                    uniqueId: TMP_UNIQUE_ID,
                    isAllDay: false,
                    isAllPartDay: true,
                    start: new Date(Date.UTC(2023, 11, 4, 0, 1)), // Wednesday 29/11/2023
                    end: new Date(Date.UTC(2023, 11, 5, 9)),
                    data: {} as CalendarViewEventData,
                };

                expect(
                    splitDayEventsInInterval({
                        events: [event],
                        min,
                        max,
                    })
                ).toEqual([]);
            });

            it('skips part-day events lasting more than 24 hours and ending on midnight which fall outside of range', () => {
                const event = {
                    uniqueId: TMP_UNIQUE_ID,
                    isAllDay: false,
                    isAllPartDay: true,
                    start: new Date(Date.UTC(2023, 11, 4, 0, 1)), // Wednesday 29/11/2023
                    end: new Date(Date.UTC(2023, 11, 6, 0)),
                    data: {} as CalendarViewEventData,
                };

                expect(
                    splitDayEventsInInterval({
                        events: [event],
                        min,
                        max,
                    })
                ).toEqual([]);
            });
        });
    });

    describe('in month view', () => {
        // month view gets split into week rows
        const min = new Date(Date.UTC(2023, 10, 27)); // Monday 27/11/2023
        const max = new Date(Date.UTC(2023, 11, 3)); // Sunday 3/12/2023

        // We don't need to repeat the cases already tested for week view since they will behave the same

        it('places in one column part-day events contained in one day ', () => {
            const event = {
                uniqueId: TMP_UNIQUE_ID,
                isAllDay: false,
                isAllPartDay: false,
                start: new Date(Date.UTC(2023, 10, 29, 12)), // Wednesday 29/11/2023
                end: new Date(Date.UTC(2023, 10, 29, 12, 45)),
                data: {} as CalendarViewEventData,
            };

            expect(
                splitDayEventsInInterval({
                    events: [event],
                    min,
                    max,
                })
            ).toEqual([
                {
                    idx: 0,
                    start: 2,
                    end: 3,
                },
            ]);
        });

        it('places in one column part-day events spread across two days but lasting less than 24 hours ', () => {
            const event = {
                uniqueId: TMP_UNIQUE_ID,
                isAllDay: false,
                isAllPartDay: false,
                start: new Date(Date.UTC(2023, 10, 29, 12)), // Wednesday 29/11/2023
                end: new Date(Date.UTC(2023, 10, 30, 9)),
                data: {} as CalendarViewEventData,
            };

            expect(
                splitDayEventsInInterval({
                    events: [event],
                    min,
                    max,
                })
            ).toEqual([
                {
                    idx: 0,
                    start: 2,
                    end: 3,
                },
            ]);
        });

        it('skips part-day events spread across two rows lasting less than 24 hours', () => {
            const event = {
                uniqueId: TMP_UNIQUE_ID,
                isAllDay: false,
                isAllPartDay: false,
                start: new Date(Date.UTC(2023, 10, 26, 23)), // Wednesday 29/11/2023
                end: new Date(Date.UTC(2023, 10, 27, 9)),
                data: {} as CalendarViewEventData,
            };

            expect(
                splitDayEventsInInterval({
                    events: [event],
                    min,
                    max,
                })
            ).toEqual([]);
        });

        it('skips part-day events lasting less than 24 hours which fall outside of range', () => {
            const event = {
                uniqueId: TMP_UNIQUE_ID,
                isAllDay: false,
                isAllPartDay: false,
                start: new Date(Date.UTC(2023, 11, 4, 0, 1)), // Wednesday 29/11/2023
                end: new Date(Date.UTC(2023, 11, 4, 9)),
                data: {} as CalendarViewEventData,
            };

            expect(
                splitDayEventsInInterval({
                    events: [event],
                    min,
                    max,
                })
            ).toEqual([]);
        });

        it('skips part-day events lasting less than 24 hours and end on midnight which fall outside of range', () => {
            const event = {
                uniqueId: TMP_UNIQUE_ID,
                isAllDay: false,
                isAllPartDay: false,
                start: new Date(Date.UTC(2023, 11, 4, 0, 1)), // Wednesday 29/11/2023
                end: new Date(Date.UTC(2023, 11, 5, 0)),
                data: {} as CalendarViewEventData,
            };

            expect(
                splitDayEventsInInterval({
                    events: [event],
                    min,
                    max,
                })
            ).toEqual([]);
        });
    });
});
