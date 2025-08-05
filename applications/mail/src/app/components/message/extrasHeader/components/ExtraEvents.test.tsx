import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getModelState } from '@proton/account/test';
import { useGetVtimezonesMap } from '@proton/components/hooks/useGetVtimezonesMap';
import type { MessageStateWithData } from '@proton/mail/store/messages/messagesTypes';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { generateAttendeeToken } from '@proton/shared/lib/calendar/attendees';
import {
    CALENDAR_DISPLAY,
    CALENDAR_FLAGS,
    CALENDAR_TYPE,
    ICAL_ATTENDEE_RSVP,
    ICAL_ATTENDEE_STATUS,
    ICAL_METHOD,
    SETTINGS_VIEW,
} from '@proton/shared/lib/calendar/constants';
import { MEMBER_PERMISSIONS } from '@proton/shared/lib/calendar/permissions';
import { ACCENT_COLORS } from '@proton/shared/lib/colors';
import { ADDRESS_STATUS, API_CODES, APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import { SETTINGS_WEEK_START } from '@proton/shared/lib/interfaces';
import type {
    CalendarUserSettings,
    CalendarWithOwnMembers,
    VcalVeventComponent,
} from '@proton/shared/lib/interfaces/calendar';
import { CalendarKeyFlags } from '@proton/shared/lib/interfaces/calendar';
import { encryptAttachment } from '@proton/shared/lib/mail/send/attachments';

import * as inviteApi from '../../../../helpers/calendar/inviteApi';
import { generateApiCalendarEvent } from '../../../../helpers/test/calendar';
import { getAddressKeyCache, releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../../helpers/test/crypto';
import type { GeneratedKey } from '../../../../helpers/test/helper';
import {
    addApiMock,
    clearAll,
    generateKeys as generateAddressKeys,
    generateCalendarKeysAndPassphrase,
    getCompleteAddress,
    mailTestRender,
    minimalCache,
} from '../../../../helpers/test/helper';
import ExtraEvents from './ExtraEvents';

jest.setTimeout(20000);

jest.mock('@proton/components/hooks/useSendIcs', () => {
    return {
        __esModule: true,
        default: jest.fn(() => () => Promise.resolve(undefined)),
    };
});
jest.mock('@proton/components/hooks/useGetVtimezonesMap');

const nextYear = new Date().getFullYear() + 1;

const dummyUserName = 'test';
const dummyUserEmailAddress = 'test@pm.me';
const dummySenderEmailAddress = 'sender@protonmail.com';
const dummySenderExternalEmailAddress = 'sender@gmail.com';
const dummyRecipientExternalEmailAddress = 'recipient@gmail.com';
const dummyUserPrimaryAddressID = 'default-address-id';
const dummyCalendarID = 'default-calendar-id';
const dummyCalendarName = 'My calendar';
const dummyCalendarUserSettings = {
    WeekLength: 7,
    WeekStart: SETTINGS_WEEK_START.MONDAY,
    DisplayWeekNumber: 1,
    DefaultCalendarID: dummyCalendarID,
    AutoDetectPrimaryTimezone: 1,
    PrimaryTimezone: 'America/New_York',
    DisplaySecondaryTimezone: 0,
    SecondaryTimezone: null,
    ViewPreference: SETTINGS_VIEW.WEEK,
    InviteLocale: null,
    AutoImportInvite: 0,
};
const dummyMemberID = 'member-id';
const dummyCalendar = {
    ID: dummyCalendarID,
    Name: dummyCalendarName,
    Description: '',
    Type: CALENDAR_TYPE.PERSONAL,
    Owner: { Email: dummyUserEmailAddress },
    Members: [
        {
            ID: dummyMemberID,
            AddressID: dummyUserPrimaryAddressID,
            Flags: CALENDAR_FLAGS.ACTIVE,
            Permissions: MEMBER_PERMISSIONS.OWNS,
            Email: dummyUserEmailAddress,
            CalendarID: dummyCalendarID,
            Color: ACCENT_COLORS[1],
            Display: CALENDAR_DISPLAY.HIDDEN,
            Name: dummyCalendarName,
            Description: '',
            Priority: 1,
        },
    ],
};
const dummyAttachmentID = 'attachment-id';
const dummyCalendarKeyID = 'calendar-key-id';
const dummyEventID = 'event-id';
const dummySharedEventID = 'shared-event-id';
const dummyPassphraseID = 'passphrase-id';
const dummyFileName = 'invite.ics';

const generateCalendars = (numberOfCalendars: number, disableCalendars = false) => {
    const calendars: CalendarWithOwnMembers[] = [];

    for (let i = 0; i < numberOfCalendars; i++) {
        const calendar = {
            ID: `${dummyCalendarID}-${i}`,
            Name: `${dummyCalendarName}-${i}`,
            Description: '',
            Type: CALENDAR_TYPE.PERSONAL,
            Owner: { Email: dummyUserEmailAddress },
            Members: [
                {
                    ID: dummyMemberID,
                    AddressID: dummyUserPrimaryAddressID,
                    Flags: disableCalendars ? CALENDAR_FLAGS.SELF_DISABLED : CALENDAR_FLAGS.ACTIVE,
                    Permissions: MEMBER_PERMISSIONS.OWNS,
                    Email: dummyUserEmailAddress,
                    CalendarID: `${dummyCalendarID}-${i}`,
                    Color: ACCENT_COLORS[1],
                    Display: CALENDAR_DISPLAY.HIDDEN,
                    Name: dummyCalendarName,
                    Description: '',
                    Priority: 1,
                },
            ],
        };

        calendars.push(calendar);
    }

    return calendars;
};

let dummyAddressKey: GeneratedKey;
let dummyCalendarKeysAndPassphrasePromise: ReturnType<typeof generateCalendarKeysAndPassphrase>;

const getSetup = async ({
    userEmailAddress = dummyUserEmailAddress,
    senderEmailAddress = dummySenderEmailAddress,
    attachments,
    methodInMimeType,
    emailSubject = 'A new invitation',
    userAddressKey,
    userPrimaryAddressID = dummyUserPrimaryAddressID,
    userCalendars = [dummyCalendar],
    userCalendarSettings = dummyCalendarUserSettings,
    defaultCalendarID = dummyCalendarID,
    eventCalendarID,
    eventID = dummyEventID,
    sharedEventID = dummySharedEventID,
    veventsApi = [],
    memberID = dummyMemberID,
    alternativeCalendarKeysAndPassphrasePromise,
    alternativeAddressKeyPromise,
    userAddressEnabled = true,
    isSimpleLogin = false,
}: {
    userEmailAddress?: string;
    senderEmailAddress?: string;
    attachments: { filename: string; ics: string; attachmentID: string }[];
    methodInMimeType?: ICAL_METHOD;
    emailSubject?: string;
    userAddressKey?: GeneratedKey;
    userPrimaryAddressID?: string;
    userCalendars?: CalendarWithOwnMembers[];
    userCalendarSettings?: CalendarUserSettings;
    defaultCalendarID?: string | null;
    eventCalendarID?: string;
    eventID?: string;
    sharedEventID?: string;
    veventsApi?: VcalVeventComponent[];
    memberID?: string;
    alternativeCalendarKeysAndPassphrasePromise?: ReturnType<typeof generateCalendarKeysAndPassphrase>;
    alternativeAddressKeyPromise?: ReturnType<typeof generateAddressKeys>;
    userAddressEnabled?: boolean;
    isSimpleLogin?: boolean;
}) => {
    const addressKey = userAddressKey || dummyAddressKey;
    const alternativeAddressKey = await alternativeAddressKeyPromise;
    const { calendarKey, passphrase } = await dummyCalendarKeysAndPassphrasePromise;
    const { calendarKey: alternativeCalendarKey } = (await alternativeCalendarKeysAndPassphrasePromise) || {};
    const encryptedAttachments = await Promise.all(
        attachments.map(async ({ attachmentID, filename, ics }) => {
            let mimeType = 'text/calendar';

            if (methodInMimeType) {
                mimeType += `; method=${methodInMimeType}`;
            }

            const inviteAttachment = new File([new Blob([ics])], filename, { type: mimeType });

            const attachmentPackets = await encryptAttachment(
                ics,
                inviteAttachment,
                false,
                addressKey.publicKeys[0],
                []
            );
            // Mock API calls to get attachment
            addApiMock(`mail/v4/attachments/${attachmentID}`, () => attachmentPackets.data);
            return {
                attachmentID,
                filename,
                ics,
                attachmentPackets,
            };
        })
    );

    // Mock calendar API calls
    const bootstrapCalendarID = eventCalendarID || defaultCalendarID;
    if (bootstrapCalendarID) {
        addApiMock(`calendar/v1/${bootstrapCalendarID}/events/${eventID}/upgrade`, () => ({
            Calendars: userCalendars,
        }));
        addApiMock(`calendar/v2/${bootstrapCalendarID}/bootstrap`, () => ({
            Keys: [
                {
                    ID: dummyCalendarKeyID,
                    CalendarID: defaultCalendarID,
                    PrivateKey: calendarKey.privateKeyArmored,
                    PassphraseID: dummyPassphraseID,
                    Flags: CalendarKeyFlags.PRIMARY + CalendarKeyFlags.ACTIVE,
                },
            ],
            Passphrase: {
                ID: dummyPassphraseID,
                Flags: 1,
                MemberPassphrases: [
                    {
                        MemberID: memberID,
                        Passphrase: passphrase.armored,
                        Signature: passphrase.signature,
                    },
                ],
                Invitations: [],
            },
            Members: [
                {
                    ID: memberID,
                    Email: userEmailAddress,
                    Permissions: 1,
                },
            ],
            CalendarSettings: {
                CalendarID: dummyCalendarKeyID,
                DefaultEventDuration: 30,
                DefaultFullDayNotifications: [
                    { Trigger: '-PT17H', Type: 1 },
                    { Trigger: '-PT17H', Type: 0 },
                ],
                DefaultPartDayNotifications: [
                    { Trigger: '-PT17M', Type: 1 },
                    { Trigger: '-PT17M', Type: 0 },
                ],
                ID: dummyCalendarKeyID,
            },
        }));
    }

    // mock call to get calendar events
    const events = await Promise.all(
        veventsApi.map((eventComponent) =>
            generateApiCalendarEvent({
                eventComponent,
                author: userEmailAddress,
                publicKey: alternativeCalendarKey?.publicKeys[0] || calendarKey.publicKeys[0],
                privateKey: alternativeAddressKey?.privateKeys[0] || addressKey.privateKeys[0],
                eventID,
                sharedEventID,
                calendarID: dummyCalendarID,
            })
        )
    );
    addApiMock('calendar/v1/events', () => ({
        Code: API_CODES.SINGLE_SUCCESS,
        Events: events,
    }));

    // mock address keys to encrypt ICS attachment
    minimalCache();
    const address = getCompleteAddress({
        ID: userPrimaryAddressID,
        Email: userEmailAddress,
        Status: userAddressEnabled ? ADDRESS_STATUS.STATUS_ENABLED : ADDRESS_STATUS.STATUS_DISABLED,
    });

    return {
        preloadedState: {
            addresses: getModelState([address]),
            addressKeys: getAddressKeyCache(address, [addressKey]),
            calendars: getModelState(userCalendars),
            calendarUserSettings: getModelState(userCalendarSettings),
        },
        message: {
            localID: '1',
            data: {
                ID: '1',
                Sender: { Name: senderEmailAddress, Address: senderEmailAddress, IsSimpleLogin: isSimpleLogin ? 1 : 0 },
                AddressID: userPrimaryAddressID,
                Subject: emailSubject,
                Time: new Date().getTime() / 1000,
                Attachments: encryptedAttachments.map(({ attachmentID, filename, attachmentPackets }) => ({
                    ID: attachmentID,
                    Name: filename,
                    KeyPackets: uint8ArrayToBase64String(attachmentPackets.keys),
                    MIMEType: 'text/calendar',
                })),
                ParsedHeaders: {
                    'X-Original-To': userEmailAddress,
                },
            },
        } as unknown as MessageStateWithData,
    };
};

describe('ICS widget', () => {
    beforeAll(async () => {
        await setupCryptoProxyForTesting();

        dummyAddressKey = await generateAddressKeys(dummyUserName, dummyUserEmailAddress);
        dummyCalendarKeysAndPassphrasePromise = generateCalendarKeysAndPassphrase(dummyAddressKey);
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    beforeEach(() => {
        jest.spyOn(inviteApi, 'createCalendarEventFromInvitation');
    });

    afterEach(clearAll);

    it('should not duplicate error banners', async () => {
        // constants
        const dummyUID = 'testUID@example.domain';
        const dummyToken = await generateAttendeeToken(canonicalizeInternalEmail(dummyUserEmailAddress), dummyUID);

        // ics with unsupported time zone
        const ics = `BEGIN:VCALENDAR
PRODID:-//Proton AG//WebCalendar 4.5.0//EN
VERSION:2.0
METHOD:REQUEST
CALSCALE:GREGORIAN
BEGIN:VEVENT
SEQUENCE:1
STATUS:CONFIRMED
SUMMARY:Walk on Mars
UID:${dummyUID}
DTSTART;TZID=Mars/Olympus:20220310T114500
ORGANIZER;CN=ORGO:mailto:${dummySenderEmailAddress}
ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE;PARTSTAT=NEEDS-ACTION;X-PM-TOKEN=${dummyToken}:mailto:${dummyUserEmailAddress}
DTSTAMP:20210917T133417Z
END:VEVENT
END:VCALENDAR`;

        const { message, preloadedState } = await getSetup({
            attachments: [
                { attachmentID: 'attachment-id-1', filename: 'invite.ics', ics },
                { attachmentID: 'attachment-id-2', filename: 'calendar.ics', ics },
            ],
            veventsApi: [],
            eventCalendarID: dummyCalendarID,
        });
        await mailTestRender(<ExtraEvents message={message} />, { preloadedState });

        // test single banner
        expect(await screen.findAllByText('Time zone not supported')).toHaveLength(1);
    });

    describe('organizer mode', () => {
        it('method=reply: displays the correct UI for the case with no calendars', async () => {
            const dummyUID = 'testUID@example.domain';
            const dummyToken = await generateAttendeeToken(canonicalizeInternalEmail(dummyUserEmailAddress), dummyUID);

            const ics = `BEGIN:VCALENDAR
PRODID:-//Proton AG//WebCalendar 4.5.0//EN
VERSION:2.0
METHOD:REPLY
CALSCALE:GREGORIAN
BEGIN:VEVENT
SEQUENCE:1
STATUS:CONFIRMED
SUMMARY:Walk on Mars
UID:${dummyUID}
DTSTART;VALUE=DATE:${nextYear}0920
ORGANIZER;CN=ORGO:mailto:${dummyUserEmailAddress}
ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE;PARTSTAT=NEEDS-ACTION;X-PM-TOKEN=${dummyToken}:mailto:${dummyUserEmailAddress}
DTSTAMP:20100917T133417Z
END:VEVENT
END:VCALENDAR`;
            const { message, preloadedState } = await getSetup({
                attachments: [{ attachmentID: dummyAttachmentID, filename: dummyFileName, ics }],
                userCalendars: [],
                veventsApi: [],
                eventCalendarID: dummyCalendarID,
                userEmailAddress: dummyUserEmailAddress,
                senderEmailAddress: dummyUserEmailAddress,
            });

            await mailTestRender(<ExtraEvents message={message} />, { preloadedState });

            expect(await screen.findByText(/This response is out of date. You have no calendars./)).toBeInTheDocument();
        });

        it('method=counter: decryption error', async () => {
            const alternativeCalendarKeysAndPassphrasePromise = generateCalendarKeysAndPassphrase(dummyAddressKey);

            const dummyUID = 'testUID@example.domain';
            const dummyToken = await generateAttendeeToken(
                canonicalizeInternalEmail(dummySenderEmailAddress),
                dummyUID
            );

            const ics = `BEGIN:VCALENDAR
PRODID:-//Proton AG//WebCalendar 4.5.0//EN
VERSION:2.0
METHOD:COUNTER
CALSCALE:GREGORIAN
BEGIN:VEVENT
SEQUENCE:1
STATUS:CONFIRMED
SUMMARY:Walk on Mars
UID:${dummyUID}
DTSTART;VALUE=DATE:${nextYear}0920
ORGANIZER;CN=ORGO:mailto:${dummyUserEmailAddress}
ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE;PARTSTAT=ACCEPTED;X-PM-TOKEN=${dummyToken}:mailto:${dummySenderEmailAddress}
DTSTAMP:20211013T144456Z
DTSTAMP:20210917T133417Z
END:VEVENT
END:VCALENDAR`;

            // random event not matching ICS (doesn't matter for the decryption error case)
            const eventComponent: VcalVeventComponent = {
                component: 'vevent',
                uid: { value: dummyUID },
                sequence: { value: 1 },
                dtstart: {
                    value: { year: 2021, month: 9, day: 20 },
                    parameters: { type: 'date' },
                },
                dtstamp: {
                    value: { year: 2021, month: 9, day: 17, hours: 13, minutes: 34, seconds: 17, isUTC: true },
                },
                organizer: {
                    value: `mailto:${dummyUserEmailAddress}`,
                    parameters: {
                        cn: 'ORGO',
                    },
                },
                attendee: [
                    {
                        value: `mailto:${dummySenderEmailAddress}`,
                        parameters: {
                            'x-pm-token': dummyToken,
                            partstat: ICAL_ATTENDEE_STATUS.ACCEPTED,
                            rsvp: ICAL_ATTENDEE_RSVP.TRUE,
                        },
                    },
                ],
            };

            const { message, preloadedState } = await getSetup({
                attachments: [{ attachmentID: dummyAttachmentID, filename: dummyFileName, ics }],
                methodInMimeType: ICAL_METHOD.REQUEST,
                veventsApi: [eventComponent],
                eventCalendarID: dummyCalendarID,
                alternativeCalendarKeysAndPassphrasePromise,
            });

            await mailTestRender(<ExtraEvents message={message} />, { preloadedState });

            expect(
                await screen.findByText(
                    `${dummySenderEmailAddress} accepted your invitation and proposed a new time for this event.`
                )
            ).toBeInTheDocument();
        });

        it('no event in db already exists', async () => {
            const dummyUID = 'testUID@example.domain';
            const dummyToken = await generateAttendeeToken(canonicalizeInternalEmail(dummyUserEmailAddress), dummyUID);

            const ics = `BEGIN:VCALENDAR
PRODID:-//Proton AG//WebCalendar 4.5.0//EN
VERSION:2.0
METHOD:REPLY
CALSCALE:GREGORIAN
BEGIN:VEVENT
SEQUENCE:1
STATUS:CONFIRMED
SUMMARY:Walk on Mars
UID:${dummyUID}
DTSTART;VALUE=DATE:${nextYear}0920
ORGANIZER;CN=ORGO:mailto:${dummyUserEmailAddress}
ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE;PARTSTAT=NEEDS-ACTION;X-PM-TOKEN=${dummyToken}:mailto:${dummyUserEmailAddress}
DTSTAMP:20211013T144456Z
DTSTAMP:20210917T133417Z
END:VEVENT
END:VCALENDAR`;

            const { message, preloadedState } = await getSetup({
                attachments: [{ attachmentID: dummyAttachmentID, filename: dummyFileName, ics }],
                veventsApi: [],
                eventCalendarID: dummyCalendarID,
                userEmailAddress: dummyUserEmailAddress,
                senderEmailAddress: dummyUserEmailAddress,
            });

            await mailTestRender(<ExtraEvents message={message} />, { preloadedState });

            expect(
                await screen.findByText(
                    /This response is out of date. The event does not exist in your calendar anymore./
                )
            ).toBeInTheDocument();
        });

        it('method=refresh from future', async () => {
            const dummyUID = 'testUID@example.domain';
            const dummyToken = await generateAttendeeToken(
                canonicalizeInternalEmail(dummySenderEmailAddress),
                dummyUID
            );

            const ics = `BEGIN:VCALENDAR
PRODID:-//Proton AG//WebCalendar 4.5.0//EN
VERSION:2.0
METHOD:REFRESH
CALSCALE:GREGORIAN
BEGIN:VEVENT
SEQUENCE:3
STATUS:CONFIRMED
SUMMARY:Walk on Mars
UID:${dummyUID}
DTSTART;VALUE=DATE:${nextYear}0920
ORGANIZER;CN=ORGO:mailto:${dummyUserEmailAddress}
ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE;PARTSTAT=NEEDS-ACTION;X-PM-TOKEN=${dummyToken}:mailto:${dummySenderEmailAddress}
DTSTAMP:${nextYear}1013T144456Z
END:VEVENT
END:VCALENDAR`;

            const eventComponent: VcalVeventComponent = {
                component: 'vevent',
                uid: { value: dummyUID },
                sequence: { value: 1 },
                dtstart: {
                    value: { year: nextYear, month: 9, day: 20 },
                    parameters: { type: 'date' },
                },
                dtstamp: {
                    value: { year: nextYear, month: 9, day: 17, hours: 13, minutes: 34, seconds: 17, isUTC: true },
                },
                organizer: {
                    value: `mailto:${dummySenderEmailAddress}`,
                    parameters: {
                        cn: 'ORGO',
                    },
                },
                attendee: [
                    {
                        value: `mailto:${dummyUserEmailAddress}`,
                        parameters: {
                            'x-pm-token': dummyToken,
                            partstat: ICAL_ATTENDEE_STATUS.ACCEPTED,
                            rsvp: ICAL_ATTENDEE_RSVP.TRUE,
                        },
                    },
                ],
            };

            const { message, preloadedState } = await getSetup({
                attachments: [{ attachmentID: dummyAttachmentID, filename: dummyFileName, ics }],
                veventsApi: [eventComponent],
                eventCalendarID: dummyCalendarID,
            });

            await mailTestRender(<ExtraEvents message={message} />, { preloadedState });

            expect(
                await screen.findByText(
                    `${dummySenderEmailAddress} asked for the latest updates to an event which doesn't match your invitation details. Please verify the invitation details in your calendar.`
                )
            ).toBeInTheDocument();
        });

        it('method=reply outdated', async () => {
            const dummyUID = 'testUID@example.domain';
            const dummyToken = await generateAttendeeToken(
                canonicalizeInternalEmail(dummySenderEmailAddress),
                dummyUID
            );

            const ics = `BEGIN:VCALENDAR
PRODID:-//Proton AG//WebCalendar 4.5.0//EN
VERSION:2.0
METHOD:REPLY
CALSCALE:GREGORIAN
BEGIN:VEVENT
SEQUENCE:1
STATUS:CONFIRMED
SUMMARY:Walk on Mars
UID:${dummyUID}
DTSTART;VALUE=DATE:${nextYear}0920
ORGANIZER;CN=ORGO:mailto:${dummyUserEmailAddress}
ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE;PARTSTAT=ACCEPTED;X-PM-TOKEN=${dummyToken}:mailto:${dummySenderEmailAddress}
DTSTAMP:${nextYear}1013T144456Z
END:VEVENT
END:VCALENDAR`;

            const eventComponent: VcalVeventComponent = {
                component: 'vevent',
                uid: { value: dummyUID },
                sequence: { value: 2 },
                dtstart: {
                    value: { year: nextYear, month: 9, day: 20 },
                    parameters: { type: 'date' },
                },
                dtstamp: {
                    value: { year: nextYear, month: 9, day: 17, hours: 13, minutes: 34, seconds: 17, isUTC: true },
                },
                organizer: {
                    value: `mailto:${dummyUserEmailAddress}`,
                    parameters: {
                        cn: 'ORGO',
                    },
                },
                attendee: [
                    {
                        value: `mailto:${dummySenderEmailAddress}`,
                        parameters: {
                            'x-pm-token': dummyToken,
                            partstat: ICAL_ATTENDEE_STATUS.ACCEPTED,
                            rsvp: ICAL_ATTENDEE_RSVP.TRUE,
                        },
                    },
                ],
            };

            const { message, preloadedState } = await getSetup({
                attachments: [{ attachmentID: dummyAttachmentID, filename: dummyFileName, ics }],
                veventsApi: [eventComponent],
                eventCalendarID: dummyCalendarID,
            });

            await mailTestRender(<ExtraEvents message={message} />, { preloadedState });

            expect(
                await screen.findByText(`${dummySenderEmailAddress} had previously accepted your invitation.`)
            ).toBeInTheDocument();
        });
    });

    describe('attendee mode', () => {
        it('should display the expected fields for the "new invitation" happy case', async () => {
            // constants
            const anotherEmailAddress = 'another@protonmail.ch';

            const ics = `BEGIN:VCALENDAR
PRODID:-//Proton AG//WebCalendar 4.6.1//EN
VERSION:2.0
METHOD:REQUEST
CALSCALE:GREGORIAN
BEGIN:VTIMEZONE
TZID:Europe/Zurich
LAST-MODIFIED:20210410T122212Z
X-LIC-LOCATION:Europe/Zurich
BEGIN:DAYLIGHT
TZNAME:CEST
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
DTSTART:19700329T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
END:DAYLIGHT
BEGIN:STANDARD
TZNAME:CET
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
DTSTART:19701025T030000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:Walk on the moon
UID:testUID@example.domain
DESCRIPTION:Recommended by Matthieu
DTSTART;TZID=Europe/Zurich:20211018T110000
DTEND;TZID=Europe/Zurich:20211018T120000
ORGANIZER;CN=${dummySenderEmailAddress}:mailto:${dummySenderEmailAddress}
ATTENDEE;CN=TEST;ROLE=REQ-PARTICIPANT;RSVP=TRUE;PARTSTAT=NEEDS-ACTION;X-PM-
 TOKEN=8c1a8462577e2be791f3a0286436e89c70d428f7:mailto:${dummyUserEmailAddress}
ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE;PARTSTAT=NEEDS-ACTION;X-PM-TOKEN=32
 f76161336da5e2c44e4d58c40e5015bba1da9d:mailto:${anotherEmailAddress}
DTSTAMP:20211013T144456Z
X-PM-SHARED-EVENT-ID:CDr63-NYMQl8L_dbp9qzbaSXmb9e6L8shmaxZfF3hWz9vVD3FX0j4l
 kmct4zKnoOX7KgYBPbcZFccjIsD34lAZXTuO99T1XXd7WE8B36T7s=
X-PM-SESSION-KEY:IAhhZBd+KXKPm95M2QRJK7WgGHovpnVdJZb2mMoiwMM=
END:VEVENT
END:VCALENDAR`;

            const { message, preloadedState } = await getSetup({
                attachments: [{ attachmentID: dummyAttachmentID, filename: dummyFileName, ics }],
                methodInMimeType: ICAL_METHOD.REQUEST,
                userCalendarSettings: dummyCalendarUserSettings,
            });
            await mailTestRender(<ExtraEvents message={message} />, { preloadedState });

            // test event title
            await screen.findByText('Walk on the moon');

            // test event date
            /**
             * The exact text displayed in the event date field depends on the timezone and locale of the
             * machine that runs the code. So here we just check that the date header is present. See
             * dedicated tests of the date header component for tests of the text displayed.
             */
            expect(screen.getByTestId('extra-event-date-header')).toBeInTheDocument();

            // test event warning
            expect(screen.getByText('Event already ended')).toBeInTheDocument();

            // test link
            expect(screen.queryByText(`Open in ${getAppName(APPS.PROTONCALENDAR)}`)).not.toBeInTheDocument();

            // test buttons
            expect(screen.getByText(/Attending?/)).toBeInTheDocument();
            expect(screen.getByText(/Yes/, { selector: 'button' })).toBeInTheDocument();
            expect(screen.getByText(/Maybe/, { selector: 'button' })).toBeInTheDocument();
            expect(screen.getByText(/No/, { selector: 'button' })).toBeInTheDocument();

            // test calendar
            expect(screen.getByText(dummyCalendarName)).toBeInTheDocument();

            // test organizer
            expect(screen.getByText('Organizer:')).toBeInTheDocument();
            const organizerElement = screen.getByTitle(dummySenderEmailAddress);
            expect(organizerElement).toHaveAttribute(
                'href',
                expect.stringMatching(`mailto:${dummySenderEmailAddress}`)
            );
            expect(organizerElement).toHaveTextContent(dummySenderEmailAddress);

            // test collapsed attendees
            const showAttendeesButton = screen.getByText('Show');
            expect(screen.queryByText(new RegExp(dummyUserEmailAddress))).not.toBeInTheDocument();

            await userEvent.click(showAttendeesButton);
            expect(screen.getByText('Show less')).toBeInTheDocument();
            expect(screen.getByText(new RegExp(anotherEmailAddress))).toBeInTheDocument();
            const selfAttendeeElement = screen.getByTitle(`You <${dummyUserEmailAddress}>`);
            expect(selfAttendeeElement).toHaveTextContent(`You <${dummyUserEmailAddress}>`);
            expect(selfAttendeeElement).toHaveAttribute(
                'href',
                expect.stringMatching(`mailto:${dummyUserEmailAddress}`)
            );
        });

        it('should display the expected fields for the "already accepted invitation" happy case', async () => {
            // constants
            const dummyUID = 'testUID@example.domain';
            const dummyToken = await generateAttendeeToken(canonicalizeInternalEmail(dummyUserEmailAddress), dummyUID);

            const ics = `BEGIN:VCALENDAR
PRODID:-//Proton AG//WebCalendar 4.5.0//EN
VERSION:2.0
METHOD:REQUEST
CALSCALE:GREGORIAN
BEGIN:VEVENT
SEQUENCE:1
STATUS:CONFIRMED
SUMMARY:Walk on Mars
UID:${dummyUID}
DTSTART;VALUE=DATE:20210920
ORGANIZER;CN=ORGO:mailto:${dummySenderEmailAddress}
ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE;PARTSTAT=NEEDS-ACTION;X-PM-TOKEN=${dummyToken}:mailto:${dummyUserEmailAddress}
DTSTAMP:20210917T133417Z
END:VEVENT
END:VCALENDAR`;
            const eventComponent: VcalVeventComponent = {
                component: 'vevent',
                uid: { value: dummyUID },
                sequence: { value: 1 },
                dtstart: {
                    value: { year: 2021, month: 9, day: 20 },
                    parameters: { type: 'date' },
                },
                dtstamp: {
                    value: { year: 2021, month: 9, day: 17, hours: 13, minutes: 34, seconds: 17, isUTC: true },
                },
                organizer: {
                    value: `mailto:${dummySenderEmailAddress}`,
                    parameters: {
                        cn: 'ORGO',
                    },
                },
                attendee: [
                    {
                        value: `mailto:${dummyUserEmailAddress}`,
                        parameters: {
                            'x-pm-token': dummyToken,
                            partstat: ICAL_ATTENDEE_STATUS.ACCEPTED,
                            rsvp: ICAL_ATTENDEE_RSVP.TRUE,
                        },
                    },
                ],
            };

            const { message, preloadedState } = await getSetup({
                attachments: [{ attachmentID: dummyAttachmentID, filename: dummyFileName, ics }],
                methodInMimeType: ICAL_METHOD.REQUEST,
                veventsApi: [eventComponent],
                eventCalendarID: dummyCalendarID,
            });
            await mailTestRender(<ExtraEvents message={message} />, { preloadedState });

            // test event title
            await screen.findByText('Walk on Mars');

            // test event warning
            expect(screen.getByText('Event already ended')).toBeInTheDocument();

            // test link
            expect(screen.getByText(`Open in ${getAppName(APPS.PROTONCALENDAR)}`)).toBeInTheDocument();

            // test buttons
            expect(screen.getByText('Attending?')).toBeInTheDocument();
            expect(screen.getByTitle('Change my answer')).toHaveTextContent("Yes, I'll attend");

            // test summary
            expect(screen.getByText(/You already accepted this invitation./)).toBeInTheDocument();
        });

        it('shows the correct UI for an outdated invitation', async () => {
            const dummyUID = 'testUID@example.domain';
            const dummyToken = await generateAttendeeToken(canonicalizeInternalEmail(dummyUserEmailAddress), dummyUID);

            const ics = `BEGIN:VCALENDAR
PRODID:-//Proton AG//WebCalendar 4.5.0//EN
VERSION:2.0
METHOD:REQUEST
CALSCALE:GREGORIAN
BEGIN:VEVENT
SEQUENCE:1
STATUS:CONFIRMED
SUMMARY:Walk on Mars
UID:${dummyUID}
DTSTART;VALUE=DATE:20100920
ORGANIZER;CN=ORGO:mailto:${dummySenderEmailAddress}
ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE;PARTSTAT=NEEDS-ACTION;X-PM-TOKEN=${dummyToken}:mailto:${dummyUserEmailAddress}
DTSTAMP:20100917T133417Z
END:VEVENT
END:VCALENDAR`;
            const eventComponent: VcalVeventComponent = {
                component: 'vevent',
                uid: { value: dummyUID },
                sequence: { value: 1 },
                dtstart: {
                    value: { year: 2021, month: 9, day: 20 },
                    parameters: { type: 'date' },
                },
                dtstamp: {
                    // The event was updated in the DB with respect to the invite. Notice DTSTAMP has changed with respect to the ics.
                    value: { year: 2021, month: 9, day: 17, hours: 13, minutes: 34, seconds: 17, isUTC: true },
                },
                organizer: {
                    value: `mailto:${dummySenderEmailAddress}`,
                    parameters: {
                        cn: 'ORGO',
                    },
                },
                attendee: [
                    {
                        value: `mailto:${dummyUserEmailAddress}`,
                        parameters: {
                            'x-pm-token': dummyToken,
                            partstat: ICAL_ATTENDEE_STATUS.ACCEPTED,
                            rsvp: ICAL_ATTENDEE_RSVP.TRUE,
                        },
                    },
                ],
            };
            const defaultCalendar = {
                ID: dummyCalendarID,
                Name: dummyCalendarName,
                Description: '',
                Type: CALENDAR_TYPE.PERSONAL,
                Owner: { Email: dummyUserEmailAddress },
                Members: [
                    {
                        ID: dummyMemberID,
                        AddressID: dummyUserPrimaryAddressID,
                        Permissions: 127 as const,
                        Email: dummyUserEmailAddress,
                        Flags: CALENDAR_FLAGS.ACTIVE,
                        CalendarID: dummyCalendarID,
                        Color: '#f00',
                        Display: CALENDAR_DISPLAY.HIDDEN,
                        Name: dummyCalendarName,
                        Description: '',
                        Priority: 1,
                    },
                ],
            };

            const { message, preloadedState } = await getSetup({
                attachments: [{ attachmentID: dummyAttachmentID, filename: dummyFileName, ics }],
                userCalendars: [defaultCalendar],
                userCalendarSettings: dummyCalendarUserSettings,
                veventsApi: [eventComponent],
                eventCalendarID: dummyCalendarID,
            });

            await mailTestRender(<ExtraEvents message={message} />, { preloadedState });

            expect(
                await screen.findByText(/This invitation is out of date. The event has been updated./)
            ).toBeInTheDocument();
        });

        it('does not display a summary when responding to an invitation', async () => {
            const dummyUID = 'testUID@example.domain';
            const anotherEmailAddress = 'another@protonmail.ch';
            const [dummyToken, anotherToken] = await Promise.all(
                [dummyUserEmailAddress, anotherEmailAddress].map((address) =>
                    generateAttendeeToken(canonicalizeInternalEmail(address), dummyUID)
                )
            );

            const ics = `BEGIN:VCALENDAR
PRODID:-//Proton AG//WebCalendar 4.6.1//EN
VERSION:2.0
METHOD:REQUEST
CALSCALE:GREGORIAN
BEGIN:VTIMEZONE
TZID:Europe/Zurich
LAST-MODIFIED:20210410T122212Z
X-LIC-LOCATION:Europe/Zurich
BEGIN:DAYLIGHT
TZNAME:CEST
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
DTSTART:19700329T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
END:DAYLIGHT
BEGIN:STANDARD
TZNAME:CET
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
DTSTART:19701025T030000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:Walk on the moon
UID:${dummyUID}
DESCRIPTION:Recommended by Matthieu
DTSTART;TZID=Europe/Zurich:20221018T110000
DTEND;TZID=Europe/Zurich:20221018T120000
ORGANIZER;CN=${dummySenderEmailAddress}:mailto:${dummySenderEmailAddress}
ATTENDEE;CN=TEST;ROLE=REQ-PARTICIPANT;RSVP=TRUE;PARTSTAT=NEEDS-ACTION;X-PM-
 TOKEN=${dummyToken}:mailto:${dummyUserEmailAddress}
ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE;PARTSTAT=NEEDS-ACTION;X-PM-TOKEN=
 ${anotherToken}:mailto:${anotherEmailAddress}
DTSTAMP:20211013T144456Z
X-PM-SHARED-EVENT-ID:CDr63-NYMQl8L_dbp9qzbaSXmb9e6L8shmaxZfF3hWz9vVD3FX0j4l
 kmct4zKnoOX7KgYBPbcZFccjIsD34lAZXTuO99T1XXd7WE8B36T7s=
X-PM-SESSION-KEY:IAhhZBd+KXKPm95M2QRJK7WgGHovpnVdJZb2mMoiwMM=
END:VEVENT
END:VCALENDAR`;
            const savedAttendee = {
                value: `mailto:${dummyUserEmailAddress}`,
                parameters: {
                    cn: 'test',
                    'x-pm-token': dummyToken,
                    partstat: ICAL_ATTENDEE_STATUS.ACCEPTED,
                    rsvp: ICAL_ATTENDEE_RSVP.TRUE,
                },
            };
            const savedVevent: VcalVeventComponent = {
                component: 'vevent',
                uid: { value: dummyUID },
                sequence: { value: 0 },
                dtstart: {
                    value: { year: 2022, month: 10, day: 18, hours: 11, minutes: 0, seconds: 0, isUTC: false },
                    parameters: { tzid: 'Europe/Zurich' },
                },
                dtend: {
                    value: { year: 2022, month: 10, day: 18, hours: 12, minutes: 0, seconds: 0, isUTC: false },
                    parameters: { tzid: 'Europe/Zurich' },
                },
                dtstamp: {
                    value: { year: 2021, month: 10, day: 13, hours: 14, minutes: 44, seconds: 56, isUTC: true },
                },
                organizer: {
                    value: `mailto:${dummySenderEmailAddress}`,
                    parameters: {
                        cn: dummySenderEmailAddress,
                    },
                },
                attendee: [
                    savedAttendee,
                    {
                        value: `mailto:${anotherEmailAddress}`,
                        parameters: {
                            cn: anotherEmailAddress,
                            'x-pm-token': anotherToken,
                            partstat: ICAL_ATTENDEE_STATUS.NEEDS_ACTION,
                            rsvp: ICAL_ATTENDEE_RSVP.TRUE,
                        },
                    },
                ],
            };
            const savedEvent = await generateApiCalendarEvent({
                eventComponent: savedVevent,
                author: dummyUserEmailAddress,
                publicKey: (await dummyCalendarKeysAndPassphrasePromise).calendarKey.publicKeys[0],
                privateKey: dummyAddressKey.privateKeys[0],
                eventID: dummyEventID,
                sharedEventID:
                    'CDr63-NYMQl8L_dbp9qzbaSXmb9e6L8shmaxZfF3hWz9vVD3FX0j4lkmct4zKnoOX7KgYBPbcZFccjIsD34lAZXTuO99T1XXd7WE8B36T7s=',
                calendarID: dummyCalendarID,
            });

            // @ts-ignore
            inviteApi.createCalendarEventFromInvitation.mockReturnValueOnce(
                Promise.resolve({ savedEvent, savedVevent, savedAttendee })
            );
            // @ts-ignore
            useGetVtimezonesMap.mockReturnValueOnce(() =>
                Promise.resolve({
                    'Europe/Zurich': { vtimezone: {}, vtimezoneString: '' },
                })
            );

            const { message, preloadedState } = await getSetup({
                attachments: [{ attachmentID: dummyAttachmentID, filename: dummyFileName, ics }],
            });

            await mailTestRender(<ExtraEvents message={message} />, { preloadedState });

            await userEvent.click(await waitFor(() => screen.findByTitle(`Yes, I'll attend`)));

            await waitFor(() => expect(screen.queryByTestId('ics-widget-summary')).not.toBeInTheDocument());
        });

        it('should show the correct UI for an unsupported ics with import PUBLISH', async () => {
            // constants
            const dummyUID = 'testUID@example.domain';
            const dummyToken = await generateAttendeeToken(canonicalizeInternalEmail(dummyUserEmailAddress), dummyUID);

            // ics with unsupported time zone
            const ics = `BEGIN:VCALENDAR
PRODID:-//Proton AG//WebCalendar 4.5.0//EN
VERSION:2.0
METHOD:PUBLISH
CALSCALE:GREGORIAN
BEGIN:VEVENT
SEQUENCE:1
STATUS:CONFIRMED
SUMMARY:Walk on Mars
UID:${dummyUID}
DTSTART;TZID=Mars/Olympus:20220310T114500
ORGANIZER;CN=ORGO:mailto:${dummySenderEmailAddress}
ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE;PARTSTAT=NEEDS-ACTION;X-PM-TOKEN=${dummyToken}:mailto:${dummyUserEmailAddress}
DTSTAMP:20210917T133417Z
END:VEVENT
END:VCALENDAR`;

            const { message, preloadedState } = await getSetup({
                attachments: [{ attachmentID: dummyAttachmentID, filename: dummyFileName, ics }],
                veventsApi: [],
                eventCalendarID: dummyCalendarID,
            });
            await mailTestRender(<ExtraEvents message={message} />, { preloadedState });

            await screen.findByText('Time zone not supported');
            expect(screen.queryByTestId('ics-widget-summary')).not.toBeInTheDocument();
        });

        it('should show the correct UI for a supported ics with import PUBLISH', async () => {
            // constants
            const dummyUID = 'testUID@example.domain';
            const dummyToken = await generateAttendeeToken(canonicalizeInternalEmail(dummyUserEmailAddress), dummyUID);

            const ics = `BEGIN:VCALENDAR
PRODID:-//Proton AG//WebCalendar 4.5.0//EN
VERSION:2.0
METHOD:PUBLISH
CALSCALE:GREGORIAN
BEGIN:VEVENT
SEQUENCE:1
STATUS:CONFIRMED
SUMMARY:Walk on Mars
UID:${dummyUID}
DTSTART;TZID=Europe/Zurich:20220310T114500
ORGANIZER;CN=ORGO:mailto:${dummySenderEmailAddress}
ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE;PARTSTAT=NEEDS-ACTION;X-PM-TOKEN=${dummyToken}:mailto:${dummyUserEmailAddress}
DTSTAMP:20210917T133417Z
END:VEVENT
END:VCALENDAR`;

            const { message, preloadedState } = await getSetup({
                attachments: [{ attachmentID: dummyAttachmentID, filename: dummyFileName, ics }],
                veventsApi: [],
                eventCalendarID: dummyCalendarID,
            });

            await mailTestRender(<ExtraEvents message={message} />, { preloadedState });

            expect(await screen.findByText(/Add to Proton Calendar/)).toBeInTheDocument();
            expect(screen.queryByTestId('ics-widget-summary')).not.toBeInTheDocument();
        });

        describe('Party crasher ICS widget', () => {
            describe('Internal organizer', () => {
                it('should not be possible to accept the event when the attendee is a party crasher and the organizer is internal', async () => {
                    const ics = `BEGIN:VCALENDAR
PRODID:-//Proton AG//WebCalendar 4.5.0//EN
VERSION:2.0
METHOD:REQUEST
CALSCALE:GREGORIAN
BEGIN:VTIMEZONE
TZID:Europe/Zurich
LAST-MODIFIED:20210410T122212Z
X-LIC-LOCATION:Europe/Zurich
BEGIN:DAYLIGHT
TZNAME:CEST
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
DTSTART:19700329T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
END:DAYLIGHT
BEGIN:STANDARD
TZNAME:CET
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
DTSTART:19701025T030000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:Walk on the moon
UID:testUID@proton.me
DESCRIPTION:Recommended by Matthieu
DTSTART;TZID=Europe/Zurich:20211018T110000
DTEND;TZID=Europe/Zurich:20211018T120000
ORGANIZER;CN=${dummySenderEmailAddress}:mailto:${dummySenderEmailAddress}
ATTENDEE;CN=${dummyRecipientExternalEmailAddress};ROLE=REQ-PARTICIPANT;RSVP=TRUE;PARTSTAT=ACCEPTED:mailto:${dummyRecipientExternalEmailAddress}
END:VEVENT
END:VCALENDAR`;

                    // dummySenderEmailAddress sends an invitation to dummyRecipientExternalEmailAddress
                    // Then dummyRecipientExternalEmailAddress forwards the invite to dummyUserEmailAddress.
                    // => dummyUserEmailAddress is now a party crasher
                    const { message, preloadedState } = await getSetup({
                        attachments: [{ attachmentID: dummyAttachmentID, filename: dummyFileName, ics }],
                        methodInMimeType: ICAL_METHOD.REQUEST,
                        userCalendarSettings: dummyCalendarUserSettings,
                        senderEmailAddress: dummyRecipientExternalEmailAddress,
                    });
                    await mailTestRender(<ExtraEvents message={message} />, { preloadedState });
                    // Alert is displayed
                    expect(
                        await screen.findByText(
                            `You cannot respond to ${BRAND_NAME} invites if you're not on the participants list at the moment.`
                        )
                    ).toBeInTheDocument();

                    // test buttons
                    expect(screen.queryByText(/Attending?/)).not.toBeInTheDocument();
                    expect(screen.queryByText(/Yes/, { selector: 'button' })).not.toBeInTheDocument();
                    expect(screen.queryByText(/Maybe/, { selector: 'button' })).not.toBeInTheDocument();
                    expect(screen.queryByText(/No/, { selector: 'button' })).not.toBeInTheDocument();
                });
            });

            describe('External organizer', () => {
                const partyCrasherExternalICS = `BEGIN:VCALENDAR
PRODID:-//Google Inc//Google Calendar 70.9054//EN
VERSION:2.0
METHOD:REQUEST
CALSCALE:GREGORIAN
BEGIN:VTIMEZONE
TZID:Europe/Zurich
LAST-MODIFIED:20210410T122212Z
X-LIC-LOCATION:Europe/Zurich
BEGIN:DAYLIGHT
TZNAME:CEST
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
DTSTART:19700329T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
END:DAYLIGHT
BEGIN:STANDARD
TZNAME:CET
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
DTSTART:19701025T030000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:Walk on the moon
UID:testUID@example.domain
DESCRIPTION:Recommended by Matthieu
DTSTART;TZID=Europe/Zurich:20211018T110000
DTEND;TZID=Europe/Zurich:20211018T120000
ORGANIZER;CN=${dummySenderExternalEmailAddress}:mailto:${dummySenderExternalEmailAddress}
ATTENDEE;CN=${dummyRecipientExternalEmailAddress};ROLE=REQ-PARTICIPANT;RSVP=TRUE;PARTSTAT=ACCEPTED:mailto:${dummyRecipientExternalEmailAddress}
END:VEVENT
END:VCALENDAR`;
                it('should be possible to accept the event when the attendee is a party crasher and the organizer is external', async () => {
                    // dummySenderExternalEmailAddress sends an invitation to dummyRecipientExternalEmailAddress
                    // Then dummyRecipientExternalEmailAddress forwards the invite to dummyUserEmailAddress.
                    // => dummyUserEmailAddress is now a party crasher
                    const { message, preloadedState } = await getSetup({
                        attachments: [
                            { attachmentID: dummyAttachmentID, filename: dummyFileName, ics: partyCrasherExternalICS },
                        ],
                        methodInMimeType: ICAL_METHOD.REQUEST,
                        userCalendarSettings: dummyCalendarUserSettings,
                        senderEmailAddress: dummyRecipientExternalEmailAddress,
                    });
                    await mailTestRender(<ExtraEvents message={message} />, { preloadedState });
                    // Alert is displayed
                    expect(
                        await screen.findByText('Your email address is not in the original participants list.')
                    ).toBeInTheDocument();

                    // test buttons
                    expect(screen.getByText(/Attending?/)).toBeInTheDocument();
                    expect(screen.getByText(/Yes/, { selector: 'button' })).toBeInTheDocument();
                    expect(screen.getByText(/Maybe/, { selector: 'button' })).toBeInTheDocument();
                    expect(screen.getByText(/No/, { selector: 'button' })).toBeInTheDocument();
                });

                it('should show widget when the attendee is a party crasher which accepted the invite, and the organizer is external', async () => {
                    const dummyUID = 'testUID@example.domain';
                    const dummyToken = await generateAttendeeToken(
                        canonicalizeInternalEmail(dummyUserEmailAddress),
                        dummyUID
                    );

                    const ics = `BEGIN:VCALENDAR
PRODID:-//Google Inc//Google Calendar 70.9054//EN
VERSION:2.0
METHOD:REQUEST
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTSTART;VALUE=DATE:20210920
SEQUENCE:1
STATUS:CONFIRMED
SUMMARY:Walk on the moon
UID:${dummyUID}
DESCRIPTION:Recommended by Matthieu
ORGANIZER;CN=${dummySenderExternalEmailAddress}:mailto:${dummySenderExternalEmailAddress}
ATTENDEE;CN=${dummyRecipientExternalEmailAddress};ROLE=REQ-PARTICIPANT;RSVP=TRUE;PARTSTAT=ACCEPTED:mailto:${dummyRecipientExternalEmailAddress}
DTSTAMP:20210917T133417Z
END:VEVENT
END:VCALENDAR`;

                    const eventComponent: VcalVeventComponent = {
                        component: 'vevent',
                        uid: { value: dummyUID },
                        sequence: { value: 1 },
                        dtstart: {
                            value: { year: 2021, month: 9, day: 20 },
                            parameters: { type: 'date' },
                        },
                        dtstamp: {
                            value: { year: 2021, month: 9, day: 17, hours: 13, minutes: 34, seconds: 17, isUTC: true },
                        },
                        organizer: {
                            value: `mailto:${dummySenderExternalEmailAddress}`,
                            parameters: {
                                cn: 'ORGO',
                            },
                        },
                        attendee: [
                            {
                                value: `mailto:${dummyRecipientExternalEmailAddress}`,
                                parameters: {
                                    partstat: ICAL_ATTENDEE_STATUS.ACCEPTED,
                                    rsvp: ICAL_ATTENDEE_RSVP.TRUE,
                                },
                            },
                            {
                                value: `mailto:${dummyUserEmailAddress}`,
                                parameters: {
                                    'x-pm-token': dummyToken,
                                    partstat: ICAL_ATTENDEE_STATUS.ACCEPTED,
                                    rsvp: ICAL_ATTENDEE_RSVP.TRUE,
                                },
                            },
                        ],
                    };

                    // dummySenderExternalEmailAddress sends an invitation to dummyRecipientExternalEmailAddress
                    // Then dummyRecipientExternalEmailAddress forwards the invite to dummyUserEmailAddress.
                    // => dummyUserEmailAddress is now a party crasher, and he accepted the invite.
                    const { message, preloadedState } = await getSetup({
                        attachments: [{ attachmentID: dummyAttachmentID, filename: dummyFileName, ics }],
                        methodInMimeType: ICAL_METHOD.REQUEST,
                        userCalendarSettings: dummyCalendarUserSettings,
                        senderEmailAddress: dummyRecipientExternalEmailAddress,
                        veventsApi: [eventComponent],
                    });
                    await mailTestRender(<ExtraEvents message={message} />, { preloadedState });

                    await screen.findByText('Walk on the moon');

                    // Alert is displayed
                    expect(
                        screen.getByText('Your email address is not in the original participants list.')
                    ).toBeInTheDocument();

                    // test buttons
                    expect(screen.getByText(/Attending?/)).toBeInTheDocument();
                    expect(screen.getByTitle('Change my answer')).toHaveTextContent("Yes, I'll attend");
                });

                it('should show widget when the attendee is a party crasher with disabled address, and organizer is external', async () => {
                    // dummySenderExternalEmailAddress sends an invitation to dummyRecipientExternalEmailAddress
                    // Then dummyRecipientExternalEmailAddress forwards the invite to dummyUserEmailAddress.
                    // => dummyUserEmailAddress is now a party crasher
                    const { message, preloadedState } = await getSetup({
                        attachments: [
                            { attachmentID: dummyAttachmentID, filename: dummyFileName, ics: partyCrasherExternalICS },
                        ],
                        methodInMimeType: ICAL_METHOD.REQUEST,
                        userCalendarSettings: dummyCalendarUserSettings,
                        senderEmailAddress: dummyRecipientExternalEmailAddress,
                        userAddressEnabled: false,
                    });
                    await mailTestRender(<ExtraEvents message={message} />, { preloadedState });
                    // Alert is displayed
                    expect(await screen.findByText('You cannot reply from the invited address.')).toBeInTheDocument();

                    // test buttons
                    expect(screen.queryByText(/Attending?/)).not.toBeInTheDocument();
                    expect(screen.queryByText(/Yes/, { selector: 'button' })).not.toBeInTheDocument();
                    expect(screen.queryByText(/Maybe/, { selector: 'button' })).not.toBeInTheDocument();
                    expect(screen.queryByText(/No/, { selector: 'button' })).not.toBeInTheDocument();
                });

                it('should show widget when the attendee is a party crasher with disabled calendars, and organizer is external', async () => {
                    // dummySenderExternalEmailAddress sends an invitation to dummyRecipientExternalEmailAddress
                    // Then dummyRecipientExternalEmailAddress forwards the invite to dummyUserEmailAddress.
                    // => dummyUserEmailAddress is now a party crasher
                    const { message, preloadedState } = await getSetup({
                        attachments: [
                            { attachmentID: dummyAttachmentID, filename: dummyFileName, ics: partyCrasherExternalICS },
                        ],
                        methodInMimeType: ICAL_METHOD.REQUEST,
                        userCalendarSettings: dummyCalendarUserSettings,
                        senderEmailAddress: dummyRecipientExternalEmailAddress,
                        defaultCalendarID: 'calendar-key-id-0',
                        userCalendars: generateCalendars(2, true),
                    });
                    await mailTestRender(<ExtraEvents message={message} />, { preloadedState });
                    // Alert is displayed
                    expect(await screen.findByText('All your calendars are disabled.')).toBeInTheDocument();
                    expect(
                        await screen.findByText('Create a calendar linked to an active email address.')
                    ).toBeInTheDocument();

                    // test buttons
                    expect(screen.getByText(/Attending?/)).toBeInTheDocument();
                    expect(screen.getByText(/Yes/, { selector: 'button' })).toBeInTheDocument();
                    expect(screen.getByText(/Maybe/, { selector: 'button' })).toBeInTheDocument();
                    expect(screen.getByText(/No/, { selector: 'button' })).toBeInTheDocument();
                });

                it('should show widget when the attendee is a party crasher with disabled calendars, calendar limit reached, and organizer is external', async () => {
                    // dummySenderExternalEmailAddress sends an invitation to dummyRecipientExternalEmailAddress
                    // Then dummyRecipientExternalEmailAddress forwards the invite to dummyUserEmailAddress.
                    // => dummyUserEmailAddress is now a party crasher
                    const { message, preloadedState } = await getSetup({
                        attachments: [
                            { attachmentID: dummyAttachmentID, filename: dummyFileName, ics: partyCrasherExternalICS },
                        ],
                        methodInMimeType: ICAL_METHOD.REQUEST,
                        userCalendarSettings: dummyCalendarUserSettings,
                        senderEmailAddress: dummyRecipientExternalEmailAddress,
                        defaultCalendarID: 'calendar-key-id-0',
                        userCalendars: generateCalendars(25, true),
                    });
                    await mailTestRender(<ExtraEvents message={message} />, { preloadedState });
                    // Alert is displayed
                    expect(await screen.findByText('All your calendars are disabled.')).toBeInTheDocument();
                    expect(
                        await screen.findByText('Enable an email address linked to one of your calendars.')
                    ).toBeInTheDocument();
                    expect(
                        await screen.findByText(
                            'Or you can delete one of your calendars and create a new one linked to an active email address.'
                        )
                    ).toBeInTheDocument();

                    // test buttons
                    expect(screen.getByText(/Attending?/)).toBeInTheDocument();
                    expect(screen.getByText(/Yes/, { selector: 'button' })).toBeInTheDocument();
                    expect(screen.getByText(/Maybe/, { selector: 'button' })).toBeInTheDocument();
                    expect(screen.getByText(/No/, { selector: 'button' })).toBeInTheDocument();
                });

                it('should not be possible to accept party crasher events when the mail is coming from SimpleLogin', async () => {
                    const { message, preloadedState } = await getSetup({
                        attachments: [
                            { attachmentID: dummyAttachmentID, filename: dummyFileName, ics: partyCrasherExternalICS },
                        ],
                        methodInMimeType: ICAL_METHOD.REQUEST,
                        userCalendarSettings: dummyCalendarUserSettings,
                        senderEmailAddress: dummyRecipientExternalEmailAddress,
                        isSimpleLogin: true,
                    });
                    await mailTestRender(<ExtraEvents message={message} />, { preloadedState });
                    // Alert is displayed
                    expect(
                        await screen.findByText('Your email address is not in the original participants list.')
                    ).toBeInTheDocument();

                    // test buttons
                    expect(screen.queryByText(/Attending?/)).not.toBeInTheDocument();
                    expect(screen.queryByText(/Yes/, { selector: 'button' })).not.toBeInTheDocument();
                    expect(screen.queryByText(/Maybe/, { selector: 'button' })).not.toBeInTheDocument();
                    expect(screen.queryByText(/No/, { selector: 'button' })).not.toBeInTheDocument();
                });
            });
        });
    });
});
