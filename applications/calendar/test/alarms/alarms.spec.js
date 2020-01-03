import { enUS } from 'date-fns/locale';
import { getAlarmMessage } from '../../src/app/helpers/alarms';
import { convertZonedDateTimeToUTC, convertUTCDateTimeToZone, toUTCDate } from 'proton-shared/lib/date/timezone';

const formatOptions = { locale: enUS };

describe('getAlarmMessage', () => {
    const tzidEurope = 'Europe/Zurich';
    const tzidAsia = 'Asia/Seoul';

    const testFakeUtcDate = { year: 2019, month: 12, day: 13, hours: 20, minutes: 0, seconds: 0 };
    const testComponent = {
        dtstart: {
            value: { ...testFakeUtcDate, isUTC: false },
            parameters: { tzid: tzidEurope }
        },
        summary: { value: 'test alarm' }
    };
    const testFulldayComponent = {
        dtstart: {
            value: { ...testFakeUtcDate, isUTC: false },
            parameters: { tzid: tzidEurope, type: 'date' }
        },
        summary: { value: 'test alarm' }
    };
    const start = toUTCDate(convertZonedDateTimeToUTC(testFakeUtcDate, tzidEurope));

    test('it should display the right notification for events happening today', () => {
        const fakeUtcNow = { ...testFakeUtcDate, hours: 1 };
        const now = toUTCDate(convertUTCDateTimeToZone(fakeUtcNow, tzidEurope));
        expect(getAlarmMessage(testComponent, start, now, tzidEurope, formatOptions)).toEqual(
            'test alarm will start at 8:00 PM'
        );
    });

    test('it should display the right notification for full-day events happening today', () => {
        const fakeUtcNow = { ...testFakeUtcDate, hours: 1 };
        const now = toUTCDate(convertUTCDateTimeToZone(fakeUtcNow, tzidEurope));
        expect(getAlarmMessage(testFulldayComponent, start, now, tzidEurope, formatOptions)).toEqual(
            'test alarm started today'
        );
    });

    test('it should display the right notification for events happening tomorrow', () => {
        const fakeUtcNow = { ...testFakeUtcDate, day: 12 };
        const now = toUTCDate(convertUTCDateTimeToZone(fakeUtcNow, tzidEurope));
        expect(getAlarmMessage(testComponent, start, now, tzidEurope, formatOptions)).toEqual(
            'test alarm will start tomorrow at 8:00 PM'
        );
    });

    test('it should display the right notification for full-day events happening tomorrow', () => {
        const fakeUtcNow = { ...testFakeUtcDate, day: 12 };
        const now = toUTCDate(convertUTCDateTimeToZone(fakeUtcNow, tzidEurope));
        expect(getAlarmMessage(testFulldayComponent, start, now, tzidEurope, formatOptions)).toEqual(
            'test alarm will start tomorrow'
        );
    });

    test('it should display the right notification for events happening this month', () => {
        const fakeUtcNow = { ...testFakeUtcDate, day: 5 };
        const now = toUTCDate(convertUTCDateTimeToZone(fakeUtcNow, tzidEurope));
        expect(getAlarmMessage(testComponent, start, now, tzidEurope, formatOptions)).toEqual(
            'test alarm will start on Friday 13th at 8:00 PM'
        );
    });

    test('it should display the right notification for full-day events happening this month', () => {
        const fakeUtcNow = { ...testFakeUtcDate, day: 5 };
        const now = toUTCDate(convertUTCDateTimeToZone(fakeUtcNow, tzidEurope));
        expect(getAlarmMessage(testFulldayComponent, start, now, tzidEurope, formatOptions)).toEqual(
            'test alarm will start on Friday 13th'
        );
    });

    test('it should display the right notification for events happening this year', () => {
        const fakeUtcNow = { ...testFakeUtcDate, month: 7 };
        const now = toUTCDate(convertUTCDateTimeToZone(fakeUtcNow, tzidEurope));
        expect(getAlarmMessage(testComponent, start, now, tzidEurope, formatOptions)).toEqual(
            'test alarm will start on Friday 13th December at 8:00 PM'
        );
    });

    test('it should display the right notification for full-day events happening this year', () => {
        const fakeUtcNow = { ...testFakeUtcDate, month: 7 };
        const now = toUTCDate(convertUTCDateTimeToZone(fakeUtcNow, tzidEurope));
        expect(getAlarmMessage(testFulldayComponent, start, now, tzidEurope, formatOptions)).toEqual(
            'test alarm will start on Friday 13th December'
        );
    });

    test('it should display the right notification for events happening in future years', () => {
        const fakeUtcNow = { ...testFakeUtcDate, year: 2002 };
        const now = toUTCDate(convertUTCDateTimeToZone(fakeUtcNow, tzidEurope));
        expect(getAlarmMessage(testComponent, start, now, tzidEurope, formatOptions)).toEqual(
            'test alarm will start on Friday, December 13th, 2019 at 8:00 PM'
        );
    });

    test('it should display the right notification for full-day events happening in future years', () => {
        const fakeUtcNow = { ...testFakeUtcDate, year: 2002 };
        const now = toUTCDate(convertUTCDateTimeToZone(fakeUtcNow, tzidEurope));
        expect(getAlarmMessage(testFulldayComponent, start, now, tzidEurope, formatOptions)).toEqual(
            'test alarm will start on Friday, December 13th, 2019'
        );
    });

    test('it should display the right notification for events happening both this month and next year', () => {
        const fakeUtcNow = { ...testFakeUtcDate, day: 5 };
        const now = toUTCDate(convertUTCDateTimeToZone(fakeUtcNow, tzidEurope));
        expect(getAlarmMessage(testComponent, start, now, tzidEurope, formatOptions)).toEqual(
            'test alarm will start on Friday 13th at 8:00 PM'
        );
    });

    test('it should take into account day changes due to timezone differences', () => {
        const fakeUtcNow = { ...testFakeUtcDate, hours: 10 };
        const now = toUTCDate(convertUTCDateTimeToZone(fakeUtcNow, tzidEurope));
        expect(getAlarmMessage(testComponent, start, now, tzidEurope, formatOptions)).toEqual(
            'test alarm will start at 8:00 PM'
        );
        expect(getAlarmMessage(testComponent, start, now, tzidAsia, formatOptions)).toEqual(
            'test alarm will start tomorrow at 4:00 AM'
        );
    });
});
