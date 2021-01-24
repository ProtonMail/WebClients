import { decryptPrivateKey } from 'pmcrypto';
import { createCalendarEvent } from '../../lib/calendar/serialize';
import { readCalendarEvent, readPersonalPart, readSessionKeys } from '../../lib/calendar/deserialize';
import { DecryptableKey, DecryptableKey2 } from '../keys/keys.data';
import { unwrap, wrap } from '../../lib/calendar/helper';
import { toCRLF } from './veventHelper.spec';
import { ATTENDEE_STATUS_API } from '../../lib/calendar/constants';
import { EVENT_VERIFICATION_STATUS } from '../../lib/calendar/interface';
import { initRandomMock, disableRandomMock } from '../mockRandomValues';

const veventComponent = {
    component: 'vevent',
    components: [
        {
            component: 'valarm',
            trigger: {
                value: { weeks: 0, days: 0, hours: 15, minutes: 0, seconds: 0, isNegative: true },
            },
        },
    ],
    uid: { value: '123' },
    dtstamp: {
        value: { year: 2019, month: 12, day: 11, hours: 12, minutes: 12, seconds: 12, isUTC: true },
    },
    dtstart: {
        value: { year: 2019, month: 12, day: 11, hours: 12, minutes: 12, seconds: 12, isUTC: true },
    },
    dtend: {
        value: { year: 2019, month: 12, day: 12, hours: 12, minutes: 12, seconds: 12, isUTC: true },
    },
    summary: { value: 'my title' },
    comment: [{ value: 'asdasd' }],
    attendee: [
        {
            value: 'mailto:james@bond.co.uk',
            parameters: {
                cutype: 'INDIVIDUAL',
                role: 'REQ-PARTICIPANT',
                rsvp: 'TRUE',
                partstat: 'NEEDS-ACTION',
                'x-pm-token': 'abc',
                'x-pm-permissions': 1,
                cn: 'james@bond.co.uk',
            },
        },
        {
            value: 'mailto:dr.no@mi6.co.uk',
            parameters: {
                cutype: 'INDIVIDUAL',
                role: 'REQ-PARTICIPANT',
                rsvp: 'TRUE',
                partstat: 'TENTATIVE',
                'x-pm-token': 'bcd',
                'x-pm-permissions': 1,
                cn: 'Dr No.',
            },
        },
        {
            value: 'mailto:moneypenny@mi6.co.uk',
            parameters: {
                cutype: 'INDIVIDUAL',
                role: 'NON-PARTICIPANT',
                partstat: 'ACCEPTED',
                rsvp: 'FALSE',
                cn: 'Miss Moneypenny',
                'x-pm-token': 'cde',
                'x-pm-permissions': 2,
            },
        },
    ],
};

const transformToExternal = (data, publicAddressKey, sharedSessionKey, calendarSessionKey) => {
    const withAuthor = (x, author) => {
        if (!x) {
            return;
        }
        return x.map((y) => ({ ...y, Author: author }));
    };

    return {
        event: {
            SharedEvents: withAuthor(data.SharedEventContent, 'me'),
            CalendarEvents: withAuthor(data.CalendarEventContent, 'me'),
            AttendeesEvents: withAuthor(data.AttendeesEventContent, 'me'),
            Attendees: data.Attendees,
        },
        publicKeysMap: {
            me: [publicAddressKey],
        },
        sharedSessionKey,
        calendarSessionKey,
    };
};

describe('calendar encryption', () => {
    beforeAll(initRandomMock);
    afterAll(disableRandomMock);
    it('should encrypt and sign calendar events', async () => {
        const primaryCalendarKey = await decryptPrivateKey(DecryptableKey.PrivateKey, '123');
        const data = await createCalendarEvent({
            eventComponent: veventComponent,
            privateKey: primaryCalendarKey,
            publicKey: primaryCalendarKey.toPublic(),
            signingKey: primaryCalendarKey, // Should be an address key
        });
        expect(data).toEqual({
            SharedKeyPacket:
                'wV4DatuD4HBmK9ESAQdAh5aMHBZCvQYA9q2Gm4j5LJYj0N/ETwHe/+Icmt09yl8w81ByP+wHwvShTNdKZNv7ziSuGkYloQ9Y2hReRQR0Vdacz4LtBa2T3H17aBbI/rBs',
            SharedEventContent: [
                {
                    Type: 2,
                    Data: wrap(
                        'BEGIN:VEVENT\r\nUID:123\r\nDTSTAMP:20191211T121212Z\r\nDTSTART:20191211T121212Z\r\nDTEND:20191212T121212Z\r\nEND:VEVENT'
                    ),
                    Signature: jasmine.stringMatching(/-----BEGIN PGP SIGNATURE-----.*/),
                },
                {
                    Type: 3,
                    Data: jasmine.stringMatching(/0rIB8pECtS5Mmdeh\+pBh0SN5j5TqWA.*/g),
                    Signature: jasmine.stringMatching(/-----BEGIN PGP SIGNATURE-----.*/g),
                },
            ],
            CalendarKeyPacket:
                'wV4DatuD4HBmK9ESAQdAh5aMHBZCvQYA9q2Gm4j5LJYj0N/ETwHe/+Icmt09yl8w81ByP+wHwvShTNdKZNv7ziSuGkYloQ9Y2hReRQR0Vdacz4LtBa2T3H17aBbI/rBs',
            CalendarEventContent: [
                {
                    Type: 3,
                    Data: jasmine.stringMatching(/0rAB8pECtS5Mmdeh\+pBh0SN5.*/g),
                    Signature: jasmine.stringMatching(/-----BEGIN PGP SIGNATURE-----.*/g),
                },
            ],
            PersonalEventContent: {
                Type: 2,
                Data: wrap(
                    'BEGIN:VEVENT\r\nUID:123\r\nDTSTAMP:20191211T121212Z\r\nBEGIN:VALARM\r\nTRIGGER:-PT15H\r\nEND:VALARM\r\nEND:VEVENT'
                ),
                Signature: jasmine.stringMatching(/-----BEGIN PGP SIGNATURE-----.*/g),
            },
            AttendeesEventContent: [
                {
                    Type: 3,
                    Data: jasmine.stringMatching(/0sErAfKRArUuTJnXofqQYdEjeY\+U6.*/g),
                    Signature: jasmine.stringMatching(/-----BEGIN PGP SIGNATURE-----.*/g),
                },
            ],
            Attendees: [
                { Token: 'abc', Permissions: 1, Status: ATTENDEE_STATUS_API.NEEDS_ACTION },
                { Token: 'bcd', Permissions: 1, Status: ATTENDEE_STATUS_API.TENTATIVE },
                { Token: 'cde', Permissions: 2, Status: ATTENDEE_STATUS_API.ACCEPTED },
            ],
        });
    });

    it('should roundtrip', async () => {
        const addressKey = await decryptPrivateKey(DecryptableKey2, '123');
        const primaryCalendarKey = await decryptPrivateKey(DecryptableKey.PrivateKey, '123');
        const publicKey = primaryCalendarKey.toPublic();
        const publicAddressKey = addressKey.toPublic();

        const data = await createCalendarEvent({
            eventComponent: veventComponent,
            privateKey: primaryCalendarKey,
            publicKey,
            signingKey: addressKey,
        });

        const [sharedSessionKey, calendarSessionKey] = await readSessionKeys(data, primaryCalendarKey);
        const {
            veventComponent: otherVeventComponent,
            verificationStatus: verificationStatusOther,
        } = await readCalendarEvent(transformToExternal(data, publicAddressKey, sharedSessionKey, calendarSessionKey));
        const {
            veventComponent: { components },
            verificationStatus: verificationStatusPersonal,
        } = await readPersonalPart(data.PersonalEventContent, publicAddressKey);

        expect({ ...otherVeventComponent, components }).toEqual(veventComponent);
        expect(verificationStatusOther).toEqual(EVENT_VERIFICATION_STATUS.SUCCESSFUL);
        expect(verificationStatusPersonal).toEqual(EVENT_VERIFICATION_STATUS.SUCCESSFUL);
    });
});

describe('wrapping', () => {
    it('should add wrapping', () => {
        expect(wrap('asd')).toEqual(
            toCRLF(`BEGIN:VCALENDAR
VERSION:2.0
asd
END:VCALENDAR`)
        );
    });
    it('should remove wrapping', () => {
        expect(unwrap(wrap('BEGIN:VEVENT asd END:VEVENT'))).toEqual('BEGIN:VEVENT asd END:VEVENT');
    });
});
