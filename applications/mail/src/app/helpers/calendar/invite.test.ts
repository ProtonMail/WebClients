import { getIsRruleSupported } from 'proton-shared/lib/calendar/integration/rrule';
import { parse } from 'proton-shared/lib/calendar/vcal';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { RequireSome } from '../../models/utils';

describe('getIsRruleSupported for invitations', () => {
    test('should accept events with daily recurring rules valid for invitations', () => {
        const vevents = [
            `BEGIN:VEVENT\r\nRRULE:FREQ=DAILY;UNTIL=20200330T150000Z;INTERVAL=100;BYMONTH=3\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=DAILY;INTERVAL=2;BYSECOND=30;BYMINUTE=5,10,15;BYHOUR=10\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=DAILY;INTERVAL=2;BYWEEKNO=13;COUNT=499;WKST=TH\r\nEND:VEVENT`
        ];
        const rrules = vevents.map((vevent) => {
            const parsedVevent = parse(vevent) as RequireSome<VcalVeventComponent, 'rrule'>;
            return parsedVevent.rrule.value;
        });
        expect(rrules.map((rrule) => getIsRruleSupported(rrule, true))).toEqual(vevents.map(() => true));
    });

    test('should refuse events with invalid daily recurring rules', () => {
        const vevents = [
            `BEGIN:VEVENT\r\nRRULE:FREQ=DAILY;COUNT=500\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=DAILY;INTERVAL=1000;BYMONTHDAY=11,22\r\nEND:VEVENT`
        ];
        const rrules = vevents.map((vevent) => {
            const parsedVevent = parse(vevent) as RequireSome<VcalVeventComponent, 'rrule'>;
            return parsedVevent.rrule.value;
        });
        expect(rrules.map((rrule) => getIsRruleSupported(rrule, true))).toEqual(vevents.map(() => false));
    });

    test('should accept events with yearly recurring rules valid for invitations', () => {
        const vevents = [
            `BEGIN:VEVENT\r\nRRULE:FREQ=YEARLY;UNTIL=20200330T150000Z;INTERVAL=1;BYDAY=MO,SU,TH;BYMONTHDAY=30,31;BYMONTH=3\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=YEARLY;INTERVAL=2;BYSECOND=30;BYHOUR=10;BYMONTH=5\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=YEARLY;INTERVAL=2;BYMONTHDAY=17,22;COUNT=499\r\nEND:VEVENT`
        ];
        const rrules = vevents.map((vevent) => {
            const parsedVevent = parse(vevent) as RequireSome<VcalVeventComponent, 'rrule'>;
            return parsedVevent.rrule.value;
        });
        expect(rrules.map((rrule) => getIsRruleSupported(rrule, true))).toEqual(vevents.map(() => true));
    });

    test('should refuse events with invalid yearly recurring rules', () => {
        const vevents = [
            `BEGIN:VEVENT\r\nRRULE:FREQ=YEARLY;COUNT=500\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=YEARLY;INTERVAL=100;BYMONTHDAY=11,22\r\nEND:VEVENT`
        ];
        const rrules = vevents.map((vevent) => {
            const parsedVevent = parse(vevent) as RequireSome<VcalVeventComponent, 'rrule'>;
            return parsedVevent.rrule.value;
        });
        expect(rrules.map((rrule) => getIsRruleSupported(rrule, true))).toEqual(vevents.map(() => false));
    });
});
