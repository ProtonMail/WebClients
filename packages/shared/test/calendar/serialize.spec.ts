import type { PublicKeyReference, SessionKey } from '@proton/crypto';
import { CryptoProxy, toPublicKeyReference } from '@proton/crypto';
import { getIsAllDay } from '@proton/shared/lib/calendar/veventHelper';
import { ACCENT_COLORS_MAP } from '@proton/shared/lib/colors';
import { omit } from '@proton/shared/lib/helpers/object';
import type { VerificationPreferences } from '@proton/shared/lib/interfaces/VerificationPreferences';
import { disableRandomMock, initRandomMock } from '@proton/testing/lib/mockRandomValues';

import {
    ATTENDEE_MORE_ATTENDEES,
    ATTENDEE_STATUS_API,
    CALENDAR_SHARE_BUSY_TIME_SLOTS,
    EVENT_VERIFICATION_STATUS,
} from '../../lib/calendar/constants';
import { readCalendarEvent, readSessionKeys } from '../../lib/calendar/deserialize';
import { unwrap, wrap } from '../../lib/calendar/helper';
import { createCalendarEvent } from '../../lib/calendar/serialize';
import { setVcalProdId } from '../../lib/calendar/vcalConfig';
import { toCRLF } from '../../lib/helpers/string';
import type { RequireSome } from '../../lib/interfaces';
import type {
    Attendee,
    CalendarEventData,
    CreateOrUpdateCalendarEventData,
    VcalVeventComponent,
} from '../../lib/interfaces/calendar';
import { DecryptableKey, DecryptableKey2 } from '../keys/keys.data';

const getVevent = (hasColor = false): VcalVeventComponent => {
    return {
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
        color: hasColor ? { value: ACCENT_COLORS_MAP.enzian.color } : undefined,
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
};

interface CreateCalendarEventData
    extends RequireSome<
        Partial<Omit<CreateOrUpdateCalendarEventData, 'Permissions'>>,
        | 'SharedEventContent'
        | 'CalendarEventContent'
        | 'AttendeesEventContent'
        | 'SharedKeyPacket'
        | 'CalendarKeyPacket'
    > {
    AddressKeyPacket: string | null;
}

const transformToExternal = (
    data: CreateCalendarEventData,
    publicAddressKey: PublicKeyReference,
    isAllDay: boolean,
    sharedSessionKey?: SessionKey,
    calendarSessionKey?: SessionKey
) => {
    const withAuthor = (x: Omit<CalendarEventData, 'Author'>[], author: string): CalendarEventData[] => {
        return x.map((y) => ({ ...y, Author: author }));
    };
    const withFullAttendee = (
        x?: Omit<Attendee, 'UpdateTime' | 'ID'>[],
        ID = 'dummyID',
        UpdateTime = 0
    ): Attendee[] => {
        return (x || []).map((y, i) => ({ ...y, ID: `${ID}-${i}`, UpdateTime }));
    };

    const getAttendeeVerificationPreferences = async () => {
        return null as unknown as VerificationPreferences;
    };

    return {
        event: {
            SharedEvents: withAuthor(data.SharedEventContent, 'me'),
            CalendarEvents: withAuthor(data.CalendarEventContent, 'me'),
            AttendeesEvents: withAuthor(data.AttendeesEventContent, 'me'),
            Attendees: withFullAttendee(data.Attendees),
            AttendeesInfo: {
                Attendees: [
                    {
                        Status: ATTENDEE_STATUS_API.NEEDS_ACTION,
                        Token: 'abc',
                    },
                    {
                        Status: ATTENDEE_STATUS_API.TENTATIVE,
                        Token: 'bcd',
                    },
                    {
                        Status: ATTENDEE_STATUS_API.ACCEPTED,
                        Token: 'cde',
                    },
                ] as Attendee[],
                MoreAttendees: ATTENDEE_MORE_ATTENDEES.NO,
            },
            Notifications: data.Notifications,
            FullDay: +isAllDay,
            CalendarID: 'calendarID',
            UID: 'eventUID',
            ID: 'eventID',
            Color: null,
        },
        publicKeysMap: {
            me: [publicAddressKey],
        },
        sharedSessionKey,
        calendarSessionKey,
        calendarSettings: {
            ID: 'settingsID',
            CalendarID: 'calendarID',
            DefaultEventDuration: 30,
            DefaultPartDayNotifications: [],
            DefaultFullDayNotifications: [],
            MakesUserBusy: CALENDAR_SHARE_BUSY_TIME_SLOTS.YES,
        },
        addresses: [],
        getAttendeeVerificationPreferences,
    };
};

describe('calendar encryption', () => {
    beforeAll(() => initRandomMock());
    afterAll(() => disableRandomMock());

    it('should encrypt and sign calendar events', async () => {
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
                eventComponent: getVevent(true),
                privateKey: addressKey,
                publicKey: calendarKey,
                isCreateEvent: true,
                isSwitchCalendar: false,
                hasDefaultNotifications: false,
            })
        ).toEqual({
            SharedKeyPacket:
                'wV4DatuD4HBmK9ESAQdAj0DFrbaPJWJK5bIU6nZ6bslNgp09e14a0bpvPiE4KF8wdqsR0TEq277tzM/3EFZt1WA+Ilhvxxmb1sGmMolw+GKQchfX/QwQfOPETEFk+flr',
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
                'wV4DatuD4HBmK9ESAQdAj0DFrbaPJWJK5bIU6nZ6bslNgp09e14a0bpvPiE4KF8wdqsR0TEq277tzM/3EFZt1WA+Ilhvxxmb1sGmMolw+GKQchfX/QwQfOPETEFk+flr',
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
                { Token: 'abc', Status: ATTENDEE_STATUS_API.NEEDS_ACTION, Comment: null },
                { Token: 'bcd', Status: ATTENDEE_STATUS_API.TENTATIVE, Comment: null },
                { Token: 'cde', Status: ATTENDEE_STATUS_API.ACCEPTED, Comment: null },
            ],
            Color: ACCENT_COLORS_MAP.enzian.color,
        });

        // with default notifications
        expect(
            await createCalendarEvent({
                eventComponent: getVevent(false),
                privateKey: addressKey,
                publicKey: calendarKey,
                isCreateEvent: true,
                isSwitchCalendar: false,
                hasDefaultNotifications: true,
            })
        ).toEqual({
            SharedKeyPacket:
                'wV4DatuD4HBmK9ESAQdAj0DFrbaPJWJK5bIU6nZ6bslNgp09e14a0bpvPiE4KF8wdqsR0TEq277tzM/3EFZt1WA+Ilhvxxmb1sGmMolw+GKQchfX/QwQfOPETEFk+flr',
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
                'wV4DatuD4HBmK9ESAQdAj0DFrbaPJWJK5bIU6nZ6bslNgp09e14a0bpvPiE4KF8wdqsR0TEq277tzM/3EFZt1WA+Ilhvxxmb1sGmMolw+GKQchfX/QwQfOPETEFk+flr',
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
                { Token: 'abc', Status: ATTENDEE_STATUS_API.NEEDS_ACTION, Comment: null },
                { Token: 'bcd', Status: ATTENDEE_STATUS_API.TENTATIVE, Comment: null },
                { Token: 'cde', Status: ATTENDEE_STATUS_API.ACCEPTED, Comment: null },
            ],
            Color: null,
        });

        setVcalProdId('');
    });

    it('should roundtrip', async () => {
        const veventComponent = getVevent(true);
        const addressKey = await CryptoProxy.importPrivateKey({ armoredKey: DecryptableKey2, passphrase: '123' });
        const calendarKey = await CryptoProxy.importPrivateKey({
            armoredKey: DecryptableKey.PrivateKey,
            passphrase: '123',
        });
        const publicKey = await toPublicKeyReference(calendarKey);
        const publicAddressKey = await toPublicKeyReference(addressKey);

        const data = (await createCalendarEvent({
            eventComponent: veventComponent,
            privateKey: addressKey,
            publicKey,
            isCreateEvent: true,
            isSwitchCalendar: false,
            hasDefaultNotifications: false,
        })) as CreateCalendarEventData;
        const [sharedSessionKey, calendarSessionKey] = await readSessionKeys({
            calendarEvent: data,
            privateKeys: calendarKey,
        });

        const externalData = transformToExternal(
            data,
            publicAddressKey,
            getIsAllDay(veventComponent),
            sharedSessionKey,
            calendarSessionKey
        );
        const { veventComponent: decryptedVeventComponent, verificationStatus } = await readCalendarEvent(externalData);

        expect(decryptedVeventComponent).toEqual(omit(veventComponent, ['color']));
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
