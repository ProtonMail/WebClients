import { enUS } from 'date-fns/locale';
import { getAlarmMessage } from '../../src/app/helpers/alarms';
import { convertZonedDateTimeToUTC, convertUTCDateTimeToZone, toUTCDate } from 'proton-shared/lib/date/timezone';

const formatOptions = { locale: enUS };

describe('getAlarmMessage', () => {
    const tzidEurope = 'Europe/Zurich';
    const tzidAsia = 'Asia/Seoul';

    const testFakeZonedDate = { year: 2019, month: 10, day: 13, hours: 20, minutes: 0, seconds: 0 };
    const testComponent = {
        dtstart: {
            value: { ...testFakeZonedDate, isUTC: false },
            parameters: { tzid: tzidEurope }
        },
        summary: { value: 'test alarm' }
    };
    const testFulldayComponent = {
        dtstart: {
            value: { ...testFakeZonedDate, isUTC: false },
            parameters: { tzid: tzidEurope, type: 'date' }
        },
        summary: { value: 'test alarm' }
    };
    const start = toUTCDate(convertZonedDateTimeToUTC(testFakeZonedDate, tzidEurope));

    test('it should display the right notification for events happening today', () => {
        const fakeZonedNow = { ...testFakeZonedDate, hours: 1 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(getAlarmMessage({ component: testComponent, start, now, tzid: tzidEurope, formatOptions })).toEqual(
            'test alarm will start at 8:00 PM'
        );
    });

    test('it should display the right notification for full-day events happening today', () => {
        const fakeZonedNow = { ...testFakeZonedDate, hours: 1 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(
            getAlarmMessage({ component: testFulldayComponent, start, now, tzid: tzidEurope, formatOptions })
        ).toEqual('test alarm starts today');
    });

    test('it should display the right notification for events happening tomorrow', () => {
        const fakeZonedNow = { ...testFakeZonedDate, day: 12 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        console.log(now);
        expect(getAlarmMessage({ component: testComponent, start, now, tzid: tzidEurope, formatOptions })).toEqual(
            'test alarm will start tomorrow at 8:00 PM'
        );
    });

    test('it should display the right notification for full-day events happening tomorrow', () => {
        const fakeZonedNow = { ...testFakeZonedDate, day: 12 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(
            getAlarmMessage({ component: testFulldayComponent, start, now, tzid: tzidEurope, formatOptions })
        ).toEqual('test alarm will start tomorrow');
    });

    test('it should display the right notification for full-day events happening yesterday', () => {
        const fakeZonedNow = { ...testFakeZonedDate, day: 14 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(
            getAlarmMessage({ component: testFulldayComponent, start, now, tzid: tzidEurope, formatOptions })
        ).toEqual('test alarm started yesterday');
    });

    test('it should display the right notification for events happening yesterday', () => {
        const fakeZonedNow = { ...testFakeZonedDate, day: 14 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(getAlarmMessage({ component: testComponent, start, now, tzid: tzidEurope, formatOptions })).toEqual(
            'test alarm started yesterday at 8:00 PM'
        );
    });

    test('it should display the right notification for events happening later this month', () => {
        const fakeZonedNow = { ...testFakeZonedDate, day: 5 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(getAlarmMessage({ component: testComponent, start, now, tzid: tzidEurope, formatOptions })).toEqual(
            'test alarm will start on Sunday 13th at 8:00 PM'
        );
    });

    test('it should display the right notification for full-day events happening later this month', () => {
        const fakeZonedNow = { ...testFakeZonedDate, day: 5 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(
            getAlarmMessage({ component: testFulldayComponent, start, now, tzid: tzidEurope, formatOptions })
        ).toEqual('test alarm will start on Sunday 13th');
    });

    test('it should display the right notification for events happening earlier this month', () => {
        const fakeZonedNow = { ...testFakeZonedDate, day: 22 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(getAlarmMessage({ component: testComponent, start, now, tzid: tzidEurope, formatOptions })).toEqual(
            'test alarm started on Sunday 13th at 8:00 PM'
        );
    });

    test('it should display the right notification for full-day events happening earlier this month', () => {
        const fakeZonedNow = { ...testFakeZonedDate, day: 22 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(
            getAlarmMessage({ component: testFulldayComponent, start, now, tzid: tzidEurope, formatOptions })
        ).toEqual('test alarm started on Sunday 13th');
    });

    test('it should display the right notification for events happening later this year', () => {
        const fakeZonedNow = { ...testFakeZonedDate, month: 7 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(getAlarmMessage({ component: testComponent, start, now, tzid: tzidEurope, formatOptions })).toEqual(
            'test alarm will start on Sunday 13th October at 8:00 PM'
        );
    });

    test('it should display the right notification for full-day events happening later this year', () => {
        const fakeZonedNow = { ...testFakeZonedDate, month: 7 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(
            getAlarmMessage({ component: testFulldayComponent, start, now, tzid: tzidEurope, formatOptions })
        ).toEqual('test alarm will start on Sunday 13th October');
    });

    test('it should display the right notification for events happening earlier this year', () => {
        const fakeZonedNow = { ...testFakeZonedDate, month: 12 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(getAlarmMessage({ component: testComponent, start, now, tzid: tzidEurope, formatOptions })).toEqual(
            'test alarm started on Sunday 13th October at 8:00 PM'
        );
    });

    test('it should display the right notification for full-day events happening earlier this year', () => {
        const fakeZonedNow = { ...testFakeZonedDate, month: 12 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(
            getAlarmMessage({ component: testFulldayComponent, start, now, tzid: tzidEurope, formatOptions })
        ).toEqual('test alarm started on Sunday 13th October');
    });

    test('it should display the right notification for events happening in future years', () => {
        const fakeZonedNow = { ...testFakeZonedDate, year: 2002 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(getAlarmMessage({ component: testComponent, start, now, tzid: tzidEurope, formatOptions })).toEqual(
            'test alarm will start on Sunday, October 13th, 2019 at 8:00 PM'
        );
    });

    test('it should display the right notification for full-day events happening in future years', () => {
        const fakeZonedNow = { ...testFakeZonedDate, year: 2002 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(
            getAlarmMessage({ component: testFulldayComponent, start, now, tzid: tzidEurope, formatOptions })
        ).toEqual('test alarm will start on Sunday, October 13th, 2019');
    });

    test('it should display the right notification for events happening in past years', () => {
        const fakeZonedNow = { ...testFakeZonedDate, year: 2022 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(getAlarmMessage({ component: testComponent, start, now, tzid: tzidEurope, formatOptions })).toEqual(
            'test alarm started on Sunday, October 13th, 2019 at 8:00 PM'
        );
    });

    test('it should display the right notification for full-day events happening in past years', () => {
        const fakeZonedNow = { ...testFakeZonedDate, year: 2022 };
        const now = toUTCDate(convertUTCDateTimeToZone(fakeZonedNow, tzidEurope));
        expect(
            getAlarmMessage({ component: testFulldayComponent, start, now, tzid: tzidEurope, formatOptions })
        ).toEqual('test alarm started on Sunday, October 13th, 2019');
    });

    test('it should display the right notification for events happening both this month and next year', () => {
        const fakeZonedNow = { ...testFakeZonedDate, day: 5 };
        const now = toUTCDate(convertUTCDateTimeToZone(fakeZonedNow, tzidEurope));
        expect(getAlarmMessage({ component: testComponent, start, now, tzid: tzidEurope, formatOptions })).toEqual(
            'test alarm will start on Sunday 13th at 8:00 PM'
        );
    });

    test('it should display the right notification for events happening both this month and next year', () => {
        const fakeZonedNow = { ...testFakeZonedDate, day: 5 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(getAlarmMessage({ component: testComponent, start, now, tzid: tzidEurope, formatOptions })).toEqual(
            'test alarm will start on Sunday 13th at 8:00 PM'
        );
    });

    test('it should take into account day changes due to timezone differences', () => {
        const fakeZonedNow = { ...testFakeZonedDate, hours: 10 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(getAlarmMessage({ component: testComponent, start, now, tzid: tzidEurope, formatOptions })).toEqual(
            'test alarm will start at 8:00 PM'
        );
        expect(getAlarmMessage({ component: testComponent, start, now, tzid: tzidAsia, formatOptions })).toEqual(
            'test alarm will start tomorrow at 3:00 AM'
        );
    });
});
