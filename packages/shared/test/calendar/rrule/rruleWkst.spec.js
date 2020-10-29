import withVeventRruleWkst from '../../../lib/calendar/rruleWkst';

describe('rrule wkst', () => {
    it('should apply a wkst if it is relevant (weekly)', () => {
        const vevent = {
            component: 'vevent',
            dtstart: {
                value: { year: 2019, month: 7, day: 19, hours: 12, minutes: 0, seconds: 0, isUTC: false },
                parameters: { tzid: 'America/New_York' },
            },
            summary: {
                value: 'asd',
            },
            rrule: {
                value: {
                    freq: 'WEEKLY',
                    byday: ['MO'],
                    interval: 2,
                },
            },
        };
        const newVevent = withVeventRruleWkst(vevent, 0);
        expect(newVevent).toEqual({
            component: 'vevent',
            dtstart: {
                value: { year: 2019, month: 7, day: 19, hours: 12, minutes: 0, seconds: 0, isUTC: false },
                parameters: { tzid: 'America/New_York' },
            },
            summary: {
                value: 'asd',
            },
            rrule: {
                value: {
                    freq: 'WEEKLY',
                    byday: ['MO'],
                    interval: 2,
                    wkst: 'SU',
                },
            },
        });
    });

    it('should apply a wkst if it is relevant (yearly)', () => {
        const vevent = {
            component: 'vevent',
            rrule: {
                value: {
                    freq: 'YEARLY',
                    byweekno: 1,
                },
            },
        };
        const newVevent = withVeventRruleWkst(vevent, 0);
        expect(newVevent).toEqual({
            component: 'vevent',
            rrule: {
                value: {
                    freq: 'YEARLY',
                    byweekno: 1,
                    wkst: 'SU',
                },
            },
        });
    });

    it('should not apply a wkst if it is the default value', () => {
        const vevent = {
            component: 'vevent',
            rrule: {
                value: {
                    freq: 'WEEKLY',
                    byday: ['MO'],
                    interval: 2,
                },
            },
        };
        const newVevent = withVeventRruleWkst(vevent, 1);
        expect(newVevent.rrule.value).toEqual({
            freq: 'WEEKLY',
            byday: ['MO'],
            interval: 2,
        });
    });

    it('should not apply a wkst if it is not needed', () => {
        const vevent = {
            component: 'vevent',
            rrule: {
                value: {
                    freq: 'WEEKLY',
                    interval: 2,
                },
            },
        };
        const newVevent = withVeventRruleWkst(vevent, 0);
        expect(newVevent.rrule.value.wkst).toBeUndefined();
    });

    it('should not apply a wkst if it is not needed #2', () => {
        const vevent = {
            component: 'vevent',
            rrule: {
                value: {
                    freq: 'WEEKLY',
                },
            },
        };
        const newVevent = withVeventRruleWkst(vevent, 0);
        expect(newVevent.rrule.value.wkst).toBeUndefined();
    });

    it('should remove wkst if it is not relevant', () => {
        const vevent = {
            component: 'vevent',
            rrule: {
                value: {
                    freq: 'WEEKLY',
                    byday: ['MO'],
                    interval: 2,
                    wkst: 'SU',
                },
            },
        };
        const newVevent = withVeventRruleWkst(vevent, 1);
        expect(newVevent.rrule.value).toEqual({
            freq: 'WEEKLY',
            byday: ['MO'],
            interval: 2,
        });
    });
});
