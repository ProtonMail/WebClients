import { CryptoProxy, toPublicKeyReference } from '@proton/crypto';
import { getIsAllDay } from '@proton/shared/lib/calendar/vcalHelper';
import { disableRandomMock, initRandomMock } from '@proton/testing/lib/mockRandomValues';

import { ATTENDEE_STATUS_API, EVENT_VERIFICATION_STATUS } from '../../lib/calendar/constants';
import { readCalendarEvent, readSessionKeys } from '../../lib/calendar/deserialize';
import { unwrap, wrap } from '../../lib/calendar/helper';
import { createCalendarEvent } from '../../lib/calendar/serialize';
import { setVcalProdId } from '../../lib/calendar/vcalConfig';
import { toCRLF } from '../../lib/helpers/string';
import { DecryptableKey, DecryptableKey2 } from '../keys/keys.data';

const veventComponent = {
    component: 'vevent',
    components: [
        {
            component: 'valarm',
            action: { value: 'DISPLAY' },
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
            },
        },
    ],
};

const transformToExternal = (data, publicAddressKey, sharedSessionKey, calendarSessionKey, isAllDay) => {
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
            Notifications: data.Notifications,
            IsPersonalMigrated: true,
            FullDay: +isAllDay,
        },
        publicKeysMap: {
            me: [publicAddressKey],
        },
        sharedSessionKey,
        calendarSessionKey,
        calendarSettings: {
            DefaultPartDayNotifications: [],
            DefaultFullDayNotifications: [],
        },
    };
};

describe('calendar encryption', () => {
    beforeAll(() => initRandomMock());
    afterAll(() => disableRandomMock());

    it('should encrypt and sign calendar events (legacy personal events)', async () => {
        const dummyProdId = 'Proton Calendar';
        setVcalProdId(dummyProdId);
        const calendarKey = await CryptoProxy.importPrivateKey({
            armoredKey: DecryptableKey.PrivateKey,
            passphrase: '123',
        });
        const addressKey = await CryptoProxy.importPrivateKey({ armoredKey: DecryptableKey2, passphrase: '123' });
        const data = await createCalendarEvent({
            eventComponent: veventComponent,
            privateKey: addressKey,
            publicKey: calendarKey,
            isCreateEvent: true,
            isSwitchCalendar: false,
            personalEventsDeprecated: false,
            hasDefaultNotifications: false,
        });
        expect(data).toEqual({
            SharedKeyPacket:
                'wV4DatuD4HBmK9ESAQdAh5aMHBZCvQYA9q2Gm4j5LJYj0N/ETwHe/+Icmt09yl8w81ByP+wHwvShTNdKZNv7ziSuGkYloQ9Y2hReRQR0Vdacz4LtBa2T3H17aBbI/rBs',
            SharedEventContent: [
                {
                    Type: 2,
                    Data: wrap(
                        'BEGIN:VEVENT\r\nUID:123\r\nDTSTAMP:20191211T121212Z\r\nDTSTART:20191211T121212Z\r\nDTEND:20191212T121212Z\r\nEND:VEVENT',
                        dummyProdId
                    ),
                    Signature: jasmine.stringMatching(/-----BEGIN PGP SIGNATURE-----.*/),
                },
                {
                    Type: 3,
                    // the following check is just to ensure some stability in the process generating the signatures
                    // i.e. given the same input, we produce the same encrypted data
                    Data: jasmine.stringMatching(/0sADAfKRArUuTJnXofqQYdEjeY\+U6lg.*/g),
                    Signature: jasmine.stringMatching(/-----BEGIN PGP SIGNATURE-----.*/g),
                },
            ],
            CalendarKeyPacket:
                'wV4DatuD4HBmK9ESAQdAh5aMHBZCvQYA9q2Gm4j5LJYj0N/ETwHe/+Icmt09yl8w81ByP+wHwvShTNdKZNv7ziSuGkYloQ9Y2hReRQR0Vdacz4LtBa2T3H17aBbI/rBs',
            CalendarEventContent: [
                {
                    Type: 3,
                    // the following check is just to ensure some stability in the process generating the signatures
                    // i.e. given the same input, we produce the same encrypted data
                    Data: jasmine.stringMatching(/0sABAfKRArUuTJnXofqQYdEjeY\+U6lg.*/g),
                    Signature: jasmine.stringMatching(/-----BEGIN PGP SIGNATURE-----.*/g),
                },
            ],
            PersonalEventContent: {
                Type: 2,
                Data: wrap(
                    'BEGIN:VEVENT\r\nUID:123\r\nDTSTAMP:20191211T121212Z\r\nBEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER:-PT15H\r\nEND:VALARM\r\nEND:VEVENT',
                    dummyProdId
                ),
                Signature: jasmine.stringMatching(/-----BEGIN PGP SIGNATURE-----.*/g),
            },
            Notifications: [{ Type: 1, Trigger: '-PT15H' }],
            AttendeesEventContent: [
                {
                    Type: 3,
                    // the following check is just to ensure some stability in the process generating the signatures
                    // i.e. given the same input, we produce the same encrypted data
                    Data: jasmine.stringMatching(/0sE8AfKRArUuTJnXofqQYdEjeY\+U6lh.*/g),
                    Signature: jasmine.stringMatching(/-----BEGIN PGP SIGNATURE-----.*/g),
                },
            ],
            Attendees: [
                { Token: 'abc', Status: ATTENDEE_STATUS_API.NEEDS_ACTION },
                { Token: 'bcd', Status: ATTENDEE_STATUS_API.TENTATIVE },
                { Token: 'cde', Status: ATTENDEE_STATUS_API.ACCEPTED },
            ],
        });
        setVcalProdId('');
    });

    it('should encrypt and sign calendar events (deprecated personal events)', async () => {
        const dummyProdId = 'Proton Calendar';
        setVcalProdId(dummyProdId);
        const calendarKey = await CryptoProxy.importPrivateKey({
            armoredKey: DecryptableKey.PrivateKey,
            passphrase: '123',
        });
        const addressKey = await CryptoProxy.importPrivateKey({ armoredKey: DecryptableKey2, passphrase: '123' });

        // without default notifications
        expect(
            await createCalendarEvent({
                eventComponent: veventComponent,
                privateKey: addressKey,
                publicKey: calendarKey,
                isCreateEvent: true,
                isSwitchCalendar: false,
                personalEventsDeprecated: true,
                hasDefaultNotifications: false,
            })
        ).toEqual({
            SharedKeyPacket:
                'wV4DatuD4HBmK9ESAQdAh5aMHBZCvQYA9q2Gm4j5LJYj0N/ETwHe/+Icmt09yl8w81ByP+wHwvShTNdKZNv7ziSuGkYloQ9Y2hReRQR0Vdacz4LtBa2T3H17aBbI/rBs',
            SharedEventContent: [
                {
                    Type: 2,
                    Data: wrap(
                        'BEGIN:VEVENT\r\nUID:123\r\nDTSTAMP:20191211T121212Z\r\nDTSTART:20191211T121212Z\r\nDTEND:20191212T121212Z\r\nEND:VEVENT',
                        dummyProdId
                    ),
                    Signature: jasmine.stringMatching(/-----BEGIN PGP SIGNATURE-----.*/),
                },
                {
                    Type: 3,
                    // the following check is just to ensure some stability in the process generating the signatures
                    // i.e. given the same input, we produce the same encrypted data
                    Data: jasmine.stringMatching(/0sADAfKRArUuTJnXofqQYdEjeY\+U6lg.*/g),
                    Signature: jasmine.stringMatching(/-----BEGIN PGP SIGNATURE-----.*/g),
                },
            ],
            CalendarKeyPacket:
                'wV4DatuD4HBmK9ESAQdAh5aMHBZCvQYA9q2Gm4j5LJYj0N/ETwHe/+Icmt09yl8w81ByP+wHwvShTNdKZNv7ziSuGkYloQ9Y2hReRQR0Vdacz4LtBa2T3H17aBbI/rBs',
            CalendarEventContent: [
                {
                    Type: 3,
                    // the following check is just to ensure some stability in the process generating the signatures
                    // i.e. given the same input, we produce the same encrypted data
                    Data: jasmine.stringMatching(/0sABAfKRArUuTJnXofqQYdEjeY\+U6lg.*/g),
                    Signature: jasmine.stringMatching(/-----BEGIN PGP SIGNATURE-----.*/g),
                },
            ],
            Notifications: [{ Type: 1, Trigger: '-PT15H' }],
            AttendeesEventContent: [
                {
                    Type: 3,
                    // the following check is just to ensure some stability in the process generating the signatures
                    // i.e. given the same input, we produce the same encrypted data
                    Data: jasmine.stringMatching(/0sE8AfKRArUuTJnXofqQYdEjeY\+U6lh.*/g),
                    Signature: jasmine.stringMatching(/-----BEGIN PGP SIGNATURE-----.*/g),
                },
            ],
            Attendees: [
                { Token: 'abc', Status: ATTENDEE_STATUS_API.NEEDS_ACTION },
                { Token: 'bcd', Status: ATTENDEE_STATUS_API.TENTATIVE },
                { Token: 'cde', Status: ATTENDEE_STATUS_API.ACCEPTED },
            ],
        });

        // with default notifications
        expect(
            await createCalendarEvent({
                eventComponent: veventComponent,
                privateKey: addressKey,
                publicKey: calendarKey,
                isCreateEvent: true,
                isSwitchCalendar: false,
                personalEventsDeprecated: true,
                hasDefaultNotifications: true,
            })
        ).toEqual({
            SharedKeyPacket:
                'wV4DatuD4HBmK9ESAQdAh5aMHBZCvQYA9q2Gm4j5LJYj0N/ETwHe/+Icmt09yl8w81ByP+wHwvShTNdKZNv7ziSuGkYloQ9Y2hReRQR0Vdacz4LtBa2T3H17aBbI/rBs',
            SharedEventContent: [
                {
                    Type: 2,
                    Data: wrap(
                        'BEGIN:VEVENT\r\nUID:123\r\nDTSTAMP:20191211T121212Z\r\nDTSTART:20191211T121212Z\r\nDTEND:20191212T121212Z\r\nEND:VEVENT',
                        dummyProdId
                    ),
                    Signature: jasmine.stringMatching(/-----BEGIN PGP SIGNATURE-----.*/),
                },
                {
                    Type: 3,
                    // the following check is just to ensure some stability in the process generating the signatures
                    // i.e. given the same input, we produce the same encrypted data
                    Data: jasmine.stringMatching(/0sADAfKRArUuTJnXofqQYdEjeY\+U6lg.*/g),
                    Signature: jasmine.stringMatching(/-----BEGIN PGP SIGNATURE-----.*/g),
                },
            ],
            CalendarKeyPacket:
                'wV4DatuD4HBmK9ESAQdAh5aMHBZCvQYA9q2Gm4j5LJYj0N/ETwHe/+Icmt09yl8w81ByP+wHwvShTNdKZNv7ziSuGkYloQ9Y2hReRQR0Vdacz4LtBa2T3H17aBbI/rBs',
            CalendarEventContent: [
                {
                    Type: 3,
                    // the following check is just to ensure some stability in the process generating the signatures
                    // i.e. given the same input, we produce the same encrypted data
                    Data: jasmine.stringMatching(/0sABAfKRArUuTJnXofqQYdEjeY\+U6lg.*/g),
                    Signature: jasmine.stringMatching(/-----BEGIN PGP SIGNATURE-----.*/g),
                },
            ],
            Notifications: null,
            AttendeesEventContent: [
                {
                    Type: 3,
                    // the following check is just to ensure some stability in the process generating the signatures
                    // i.e. given the same input, we produce the same encrypted data
                    Data: jasmine.stringMatching(/0sE8AfKRArUuTJnXofqQYdEjeY\+U6lh.*/g),
                    Signature: jasmine.stringMatching(/-----BEGIN PGP SIGNATURE-----.*/g),
                },
            ],
            Attendees: [
                { Token: 'abc', Status: ATTENDEE_STATUS_API.NEEDS_ACTION },
                { Token: 'bcd', Status: ATTENDEE_STATUS_API.TENTATIVE },
                { Token: 'cde', Status: ATTENDEE_STATUS_API.ACCEPTED },
            ],
        });

        setVcalProdId('');
    });

    it('should roundtrip', async () => {
        const addressKey = await CryptoProxy.importPrivateKey({ armoredKey: DecryptableKey2, passphrase: '123' });
        const calendarKey = await CryptoProxy.importPrivateKey({
            armoredKey: DecryptableKey.PrivateKey,
            passphrase: '123',
        });
        const publicKey = await toPublicKeyReference(calendarKey);
        const publicAddressKey = await toPublicKeyReference(addressKey);

        const data = await createCalendarEvent({
            eventComponent: veventComponent,
            prodId: 'Proton Calendar',
            privateKey: addressKey,
            publicKey,
            isCreateEvent: true,
            isSwitchCalendar: false,
            personalEventsDeprecated: true,
            hasDefaultNotifications: false,
        });
        const [sharedSessionKey, calendarSessionKey] = await readSessionKeys({
            calendarEvent: data,
            privateKeys: calendarKey,
        });
        const { veventComponent: decryptedVeventComponent, verificationStatus } = await readCalendarEvent(
            transformToExternal(
                data,
                publicAddressKey,
                sharedSessionKey,
                calendarSessionKey,
                getIsAllDay(veventComponent)
            )
        );

        expect(decryptedVeventComponent).toEqual(veventComponent);
        expect(verificationStatus).toEqual(EVENT_VERIFICATION_STATUS.SUCCESSFUL);
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
        expect(wrap('asd', 'gfd')).toEqual(
            toCRLF(`BEGIN:VCALENDAR
VERSION:2.0
PRODID:gfd
asd
END:VCALENDAR`)
        );
    });
    it('should remove wrapping', () => {
        expect(unwrap(wrap('BEGIN:VEVENT asd END:VEVENT', 'gfd'))).toEqual('BEGIN:VEVENT asd END:VEVENT');
    });
});
