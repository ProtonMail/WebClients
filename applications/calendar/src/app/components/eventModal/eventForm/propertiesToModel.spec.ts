import { parse } from '@proton/shared/lib/calendar/vcal';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';

import { propertiesToModel } from './propertiesToModel';

describe('properties to model', () => {
    test('can parse start and end time correctly', () => {
        const VEVENT = `BEGIN:VEVENT
DTSTART;TZID=America/New_York:20190719T120000
DTEND;TZID=Europe/Zurich:20190719T183000
SUMMARY:My title
END:VEVENT`;
        expect(
            propertiesToModel({
                veventComponent: parse(VEVENT) as VcalVeventComponent,
                isAllDay: false,
                isProtonProtonInvite: false,
                tzid: 'Europe/Zurich',
            })
        ).toMatchObject({
            title: 'My title',
            start: {
                date: new Date(2019, 6, 19),
                time: new Date(2000, 0, 1, 12),
                tzid: 'America/New_York',
            },
            end: {
                date: new Date(2019, 6, 19),
                time: new Date(2000, 0, 1, 18, 30),
                tzid: 'Europe/Zurich',
            },
        });
    });

    test('it allows end before start in part day event', () => {
        const VEVENT = `BEGIN:VEVENT
DTSTART;TZID=Europe/Zurich:20190719T120000
DTEND;TZID=Europe/Zurich:20190719T110000
END:VEVENT`;
        expect(
            propertiesToModel({
                veventComponent: parse(VEVENT) as VcalVeventComponent,
                isAllDay: false,
                isProtonProtonInvite: false,
                tzid: 'Europe/Zurich',
            })
        ).toMatchObject({
            start: {
                date: new Date(2019, 6, 19),
                time: new Date(2000, 0, 1, 12),
                tzid: 'Europe/Zurich',
            },
            end: {
                date: new Date(2019, 6, 19),
                time: new Date(2000, 0, 1, 11),
                tzid: 'Europe/Zurich',
            },
        });
    });

    test('it allows end before start in full day event', () => {
        const VEVENT = `BEGIN:VEVENT
DTSTART;VALUE=DATE:20190719
DTEND;VALUE=DATE:20190718
END:VEVENT`;
        expect(
            propertiesToModel({
                veventComponent: parse(VEVENT) as VcalVeventComponent,
                isAllDay: true,
                isProtonProtonInvite: false,
                tzid: 'Europe/Zurich',
            })
        ).toMatchObject({
            start: {
                date: new Date(2019, 6, 19),
                time: new Date(2000, 0, 1, 0),
            },
            end: {
                date: new Date(2019, 6, 17),
                time: new Date(2000, 0, 1, 0),
            },
        });
    });
});
