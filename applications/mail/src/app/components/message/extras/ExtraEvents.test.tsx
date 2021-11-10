import { generateAttendeeToken } from '@proton/shared/lib/calendar/attendees';
import {
    CALENDAR_FLAGS,
    ICAL_ATTENDEE_RSVP,
    ICAL_ATTENDEE_STATUS,
    ICAL_METHOD,
    SETTINGS_VIEW,
} from '@proton/shared/lib/calendar/constants';
import { API_CODES, LABEL_COLORS } from '@proton/shared/lib/constants';
import { canonizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { SETTINGS_WEEK_START } from '@proton/shared/lib/interfaces';
import {
    Calendar,
    CALENDAR_TYPE,
    CalendarDisplay,
    CalendarKeyFlags,
    CalendarUserSettings,
    VcalVeventComponent,
} from '@proton/shared/lib/interfaces/calendar';
import { encryptAttachment } from '@proton/shared/lib/mail/send/attachments';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { concatArrays } from 'pmcrypto';
import { generateApiCalendarEvent } from '../../../helpers/test/calendar';
import {
    addAddressToCache,
    addApiMock,
    addKeysToAddressKeysCache,
    clearAll,
    generateCalendarKeysAndPassphrase,
    GeneratedKey,
    generateKeys as generateAddressKeys,
    minimalCache,
    render,
} from '../../../helpers/test/helper';
import { MessageExtended } from '../../../models/message';
import ExtraEvents from './ExtraEvents';

const dummyUserName = 'test';
const dummyUserEmailAddress = 'test@pm.me';
const dummySenderEmailAddress = 'sender@protonmail.com';
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
    SecondaryTimezone: undefined,
    ViewPreference: SETTINGS_VIEW.WEEK,
};
const dummyMemberID = 'member-id';
const dummyAttachmentID = 'attachment-id';
const dummyCalendarKeyID = 'calendar-key-id';
const dummyEventID = 'event-id';
const dummySharedEventID = 'shared-event-id';
const dummyPassphraseID = 'passphrase-id';

const dummyAddressKeyPromise = generateAddressKeys(dummyUserName, dummyUserEmailAddress);
const dummyCalendarKeysAndPassphrasePromise = generateCalendarKeysAndPassphrase(dummyAddressKeyPromise);

const getSetup = async ({
    userEmailAddress = dummyUserEmailAddress,
    ics,
    filename = 'invite.ics',
    method,
    emailSubject = 'A new invitation',
    attachmentID = dummyAttachmentID,
    userAddressKey,
    userPrimaryAddressID = dummyUserPrimaryAddressID,
    userCalendars = [],
    userCalendarSettings = dummyCalendarUserSettings,
    defaultCalendarID = dummyCalendarID,
    eventCalendarID,
    eventID = dummyEventID,
    sharedEventID = dummySharedEventID,
    vevents = [],
    memberID = dummyMemberID,
}: {
    userEmailAddress?: string;
    ics: string;
    filename?: string;
    method?: ICAL_METHOD;
    emailSubject?: string;
    attachmentID?: string;
    userAddressKey?: GeneratedKey;
    userPrimaryAddressID?: string;
    userCalendars: Calendar[];
    userCalendarSettings?: CalendarUserSettings;
    defaultCalendarID?: string | null;
    eventCalendarID?: string;
    eventID?: string;
    sharedEventID?: string;
    vevents?: VcalVeventComponent[];
    memberID?: string;
}) => {
    const addressKey = userAddressKey || (await dummyAddressKeyPromise);
    const { calendarKey, passphrase } = await dummyCalendarKeysAndPassphrasePromise;
    const inviteAttachment = new File([new Blob([ics])], filename, {
        type: `text/calendar; method=${method}`,
    });
    const attachmentPackets = await encryptAttachment(ics, inviteAttachment, false, addressKey.publicKeys, []);
    const concatenatedPackets = concatArrays(
        [attachmentPackets.data, attachmentPackets.keys, attachmentPackets.signature].filter(isTruthy)
    );

    // Mock API calls to get attachment
    addApiMock(`mail/v4/attachments/${attachmentID}`, () => concatenatedPackets);

    // Mock calendar API calls
    addApiMock('calendar/v1', () => ({
        Calendars: userCalendars,
    }));
    addApiMock('settings/calendar', () => ({
        CalendarUserSettings: userCalendarSettings,
    }));
    const bootstrapCalendarID = eventCalendarID || defaultCalendarID;
    if (bootstrapCalendarID) {
        addApiMock(`calendar/v1/${bootstrapCalendarID}/bootstrap`, () => ({
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
            CalendarSettings: userCalendarSettings,
        }));
    }

    // mock call to get calendar events
    const events = await Promise.all(
        vevents.map((eventComponent) =>
            generateApiCalendarEvent({
                eventComponent,
                author: userEmailAddress,
                memberID,
                privateKey: calendarKey.privateKeys[0],
                publicKey: calendarKey.publicKeys[0],
                signingKey: addressKey.privateKeys[0],
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
    addAddressToCache({ ID: userPrimaryAddressID, Email: userEmailAddress });
    addKeysToAddressKeysCache(userPrimaryAddressID, addressKey);

    return {
        localID: '1',
        data: {
            ID: '1',
            AddressID: userPrimaryAddressID,
            Subject: emailSubject,
            Time: new Date().getTime() / 1000,
            Attachments: [
                {
                    ID: attachmentID,
                    Name: filename,
                    KeyPackets: uint8ArrayToBase64String(attachmentPackets.keys),
                    MIMEType: 'text/calendar',
                },
            ],
        },
    } as MessageExtended;
};

describe('ICS widget', () => {
    afterEach(clearAll);

    it('should display the expected fields for the "new invitation" happy case', async () => {
        // constants
        const anotherEmailAddress = 'another@protonmail.ch';

        const ics = `BEGIN:VCALENDAR
PRODID:-//Proton Technologies//ProtonCalendar 4.6.1//EN
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
        const defaultCalendar = {
            ID: dummyCalendarID,
            Name: dummyCalendarName,
            Description: '',
            Display: CalendarDisplay.HIDDEN,
            Color: LABEL_COLORS[1],
            Flags: CALENDAR_FLAGS.ACTIVE,
            Type: CALENDAR_TYPE.PERSONAL,
        };

        const message = await getSetup({
            ics,
            method: ICAL_METHOD.REQUEST,
            userCalendars: [defaultCalendar],
            userCalendarSettings: dummyCalendarUserSettings,
        });
        await render(<ExtraEvents message={message} />, false);

        // test event title
        expect(screen.queryByText('Walk on the moon')).toBeInTheDocument();

        // test event date
        /**
         * The exact text displayed in the event date field depends on the timezone and locale of the
         * machine that runs the code. So here we just check that the date header is present. See
         * dedicated tests of the date header component for tests of the text displayed.
         */
        expect(screen.queryByTestId('extra-event-date-header')).toBeInTheDocument();

        // test event warning
        expect(screen.queryByText('This event has already happened')).toBeInTheDocument();

        // test link
        expect(screen.queryByText('Open in ProtonCalendar')).not.toBeInTheDocument();

        // test buttons
        expect(screen.queryByText('Attending?')).toBeInTheDocument();
        expect(screen.queryByTitle("Yes, I'll attend")).toHaveTextContent('Yes');
        expect(screen.getByText('Yes').closest('button')).toHaveAttribute(
            'title',
            expect.stringMatching("Yes, I'll attend")
        );
        expect(screen.getByText('Maybe').closest('button')).toHaveAttribute(
            'title',
            expect.stringMatching("Maybe I'll attend")
        );
        expect(screen.getByText('No').closest('button')).toHaveAttribute(
            'title',
            expect.stringMatching("No, I won't attend")
        );

        // test calendar
        expect(screen.queryByText(dummyCalendarName)).toBeInTheDocument();

        // test organizer
        expect(screen.queryByText('Organizer:')).toBeInTheDocument();
        const organizerElement = screen.queryByTitle(dummySenderEmailAddress);
        expect(organizerElement).toHaveAttribute('href', expect.stringMatching(`mailto:${dummySenderEmailAddress}`));
        expect(organizerElement).toHaveTextContent(dummySenderEmailAddress);

        // test collapsed attendees
        const showAttendeesButton = screen.getByText('Show');
        expect(screen.queryByText(new RegExp(dummyUserEmailAddress))).not.toBeInTheDocument();
        userEvent.click(showAttendeesButton);
        expect(screen.queryByText('Show less')).toBeInTheDocument();
        expect(screen.queryByText(new RegExp(anotherEmailAddress))).toBeInTheDocument();
        const selfAttendeeElement = screen.queryByTitle(`You <${dummyUserEmailAddress}>`);
        expect(selfAttendeeElement).toHaveTextContent(`You <${dummyUserEmailAddress}>`);
        expect(selfAttendeeElement).toHaveAttribute('href', expect.stringMatching(`mailto:${dummyUserEmailAddress}`));
    });

    it('should display the expected fields for the "already accepted invitation" happy case', async () => {
        // constants
        const dummyUID = 'testUID@example.domain';
        const dummyToken = await generateAttendeeToken(canonizeInternalEmail(dummyUserEmailAddress), dummyUID);

        const ics = `BEGIN:VCALENDAR
PRODID:-//Proton Technologies//ProtonCalendar 4.5.0//EN
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
        const defaultCalendar = {
            ID: dummyCalendarID,
            Name: dummyCalendarName,
            Description: '',
            Display: CalendarDisplay.HIDDEN,
            Color: LABEL_COLORS[1],
            Flags: CALENDAR_FLAGS.ACTIVE,
            Type: CALENDAR_TYPE.PERSONAL,
        };

        const message = await getSetup({
            ics,
            method: ICAL_METHOD.REQUEST,
            userCalendars: [defaultCalendar],
            userCalendarSettings: dummyCalendarUserSettings,
            vevents: [eventComponent],
            eventCalendarID: dummyCalendarID,
        });
        await render(<ExtraEvents message={message} />, false);

        // test event title
        expect(screen.queryByText('Walk on Mars')).toBeInTheDocument();

        // test event warning
        expect(screen.queryByText('This event has already happened')).toBeInTheDocument();

        // test link
        expect(screen.queryByText('Open in ProtonCalendar')).toBeInTheDocument();

        // test buttons
        expect(screen.queryByText('Attending?')).toBeInTheDocument();
        expect(screen.queryByTitle('Change my answer')).toHaveTextContent("Yes, I'll attend");
    });
});
