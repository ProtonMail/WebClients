import { parse, serialize } from '@proton/shared/lib/calendar/vcal';
import { getDateOrDateTimeProperty } from '@proton/shared/lib/calendar/vcalConverter';
import updateAllRecurrence from './updateAllRecurrence';
import { UpdateAllPossibilities } from '../eventActions/getRecurringUpdateAllPossibilities';

const getRecurrence = (start, end) => {
    return {
        localStart: start,
        localEnd: end,
    };
};

const c = (component, start, end) => {
    return {
        ...component,
        dtstart: getDateOrDateTimeProperty(component.dtstart, start),
        dtend: getDateOrDateTimeProperty(component.dtend, end),
    };
};

const d = (year = 2000, month = 1, date = 1, hours = 0, minutes = 0) =>
    new Date(Date.UTC(year, month - 1, date, hours, minutes));

const expectCompare = (component, str) => {
    expect(serialize(component).replace(/\r/g, '')).toBe(str);
};

const ALL_DAY_COMPONENT = parse(`BEGIN:VEVENT
UID:abc
DTSTART;VALUE=DATE:20190812
DTEND;VALUE=DATE:20190813
SUMMARY:text
RRULE:FREQ=DAILY
END:VEVENT`);

const PART_DAY_COMPONENT = parse(`BEGIN:VEVENT
UID:abc
DTSTART;TZID=Europe/Zurich:20190719T120000
DTEND:20190719T160000Z
SUMMARY:text
RRULE:FREQ=DAILY
END:VEVENT`);

describe('update all recurrence', () => {
    it('should keep original start date (all day)', () => {
        const newComponent = c(ALL_DAY_COMPONENT, d(2019, 8, 16), d(2019, 8, 17));
        const recurrence = getRecurrence(d(2019, 8, 16), d(2019, 8, 16));
        const updatedComponent = updateAllRecurrence({
            component: newComponent,
            originalComponent: ALL_DAY_COMPONENT,
            recurrence,
            isSingleEdit: false,
            isInvitation: false,
            mode: UpdateAllPossibilities.KEEP_ORIGINAL_START_DATE_BUT_USE_TIME,
        });
        expectCompare(
            updatedComponent,
            `BEGIN:VEVENT
UID:abc
DTSTART;VALUE=DATE:20190812
DTEND;VALUE=DATE:20190813
SUMMARY:text
RRULE:FREQ=DAILY
END:VEVENT`
        );
    });

    it('should use the new start date (all day)', () => {
        const newComponent = c(ALL_DAY_COMPONENT, d(2019, 8, 17), d(2019, 8, 18));
        const recurrence = getRecurrence(d(2019, 8, 16), d(2019, 8, 16));

        const updatedComponent = updateAllRecurrence({
            component: newComponent,
            originalComponent: ALL_DAY_COMPONENT,
            recurrence,
            mode: UpdateAllPossibilities.USE_NEW_START_DATE,
            isSingleEdit: false,
            isInvitation: false,
        });

        expectCompare(
            updatedComponent,
            `BEGIN:VEVENT
UID:abc
DTSTART;VALUE=DATE:20190817
DTEND;VALUE=DATE:20190818
SUMMARY:text
RRULE:FREQ=DAILY
END:VEVENT`
        );
    });

    it('should keep the old date (part day)', () => {
        const oldStart = d(2019, 7, 20, 12);
        const newStart = d(2019, 7, 20, 14);
        const oldEnd = d(2019, 7, 20, 18);
        const newComponent = c(PART_DAY_COMPONENT, newStart, oldEnd);
        const localEnd = d(2019, 7, 20, 16);
        const recurrence = getRecurrence(oldStart, localEnd);

        const updatedComponent = updateAllRecurrence({
            component: newComponent,
            originalComponent: PART_DAY_COMPONENT,
            recurrence,
            isSingleEdit: false,
            isInvitation: false,
            mode: UpdateAllPossibilities.KEEP_ORIGINAL_START_DATE_BUT_USE_TIME,
        });

        expectCompare(
            updatedComponent,
            `BEGIN:VEVENT
UID:abc
DTSTART;TZID=Europe/Zurich:20190719T140000
DTEND:20190719T180000Z
SUMMARY:text
RRULE:FREQ=DAILY
END:VEVENT`
        );
    });

    it('should take the new date (all day -> part day)', () => {
        const newComponent = c(PART_DAY_COMPONENT, d(2019, 8, 16, 14), d(2019, 8, 16, 18));
        const recurrence = getRecurrence(d(2019, 8, 16), d(2019, 8, 16));

        const updatedComponent = updateAllRecurrence({
            component: newComponent,
            originalComponent: ALL_DAY_COMPONENT,
            recurrence,
            isSingleEdit: false,
            isInvitation: false,
            mode: UpdateAllPossibilities.KEEP_ORIGINAL_START_DATE_BUT_USE_TIME,
        });

        expectCompare(
            updatedComponent,
            `BEGIN:VEVENT
UID:abc
DTSTART;TZID=Europe/Zurich:20190812T140000
DTEND:20190812T180000Z
SUMMARY:text
RRULE:FREQ=DAILY
END:VEVENT`
        );
    });
});
