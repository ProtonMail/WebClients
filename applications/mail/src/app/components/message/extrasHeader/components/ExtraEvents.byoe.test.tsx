import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getModelState } from '@proton/account/test';
import type { MessageStateWithData } from '@proton/mail/store/messages/messagesTypes';
import { CALENDAR_V1 } from '@proton/shared/lib/api/calendars';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { generateAttendeeToken } from '@proton/shared/lib/calendar/attendees';
import { ICAL_METHOD } from '@proton/shared/lib/calendar/constants';
import { ADDRESS_FLAGS, ADDRESS_STATUS, ADDRESS_TYPE, APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import { encryptAttachment } from '@proton/shared/lib/mail/send/attachments';
import { type ApiMockHandler, addApiMock } from '@proton/testing/lib/api';

import ExtraEvents from 'proton-mail/components/message/extrasHeader/components/ExtraEvents';
import { getCompleteAddress, minimalCache } from 'proton-mail/helpers/test/cache';
import {
    type GeneratedKey,
    generateKeys as generateAddressKeys,
    getAddressKeyCache,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from 'proton-mail/helpers/test/crypto';
import { mailTestRender } from 'proton-mail/helpers/test/render';

jest.setTimeout(20000);

const userName = 'byoeAddress';
const userEmailAddress = 'byoeAddress@gmail.com';
const dummySenderEmailAddress = 'sender@protonmail.com';
const userPrimaryAddressID = 'byoe-address';
const dummyRecipientExternalEmailAddress = 'recipient@gmail.com';
const dummySenderExternalEmailAddress = 'sender@gmail.com';
const dummyAttachmentID = 'attachment-id';
const dummyFileName = 'invite.ics';

const anotherEmailAddress = 'another@protonmail.ch';

let addressKey: GeneratedKey;

const setup = async ({
    attachments,
    senderEmailAddress = dummySenderEmailAddress,
    methodInMimeType,
    isSimpleLogin,
}: {
    senderEmailAddress?: string;
    attachments: { filename: string; ics: string; attachmentID: string }[];
    methodInMimeType?: ICAL_METHOD;
    isSimpleLogin?: boolean;
}) => {
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

    // Mock address keys to encrypt ICS attachment
    minimalCache();
    const address = getCompleteAddress({
        ID: userPrimaryAddressID,
        Email: userEmailAddress,
        Status: ADDRESS_STATUS.STATUS_ENABLED,
        Flags: ADDRESS_FLAGS.BYOE,
        Type: ADDRESS_TYPE.TYPE_EXTERNAL,
    });

    const preloadedState = {
        addresses: getModelState([address]),
        addressKeys: getAddressKeyCache(address, [addressKey]),
    };

    return {
        preloadedState,
        message: {
            localID: '1',
            data: {
                ID: '1',
                Sender: { Name: senderEmailAddress, Address: senderEmailAddress, IsSimpleLogin: isSimpleLogin ? 1 : 0 },
                AddressID: userPrimaryAddressID,
                Subject: 'A new invitation',
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

describe('Event widget for pure BYOE account', () => {
    let createCalendarSpy: ApiMockHandler;
    beforeAll(async () => {
        await setupCryptoProxyForTesting();

        addressKey = await generateAddressKeys(userName, userEmailAddress);
    });

    beforeEach(() => {
        jest.clearAllMocks();

        createCalendarSpy = jest.fn(() => Promise.resolve({}));
        addApiMock(CALENDAR_V1, createCalendarSpy, 'post');
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    it('should display the expected fields for the "new invitation" happy case', async () => {
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
 TOKEN=8c1a8462577e2be791f3a0286436e89c70d428f7:mailto:${userEmailAddress}
ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE;PARTSTAT=NEEDS-ACTION;X-PM-TOKEN=32
 f76161336da5e2c44e4d58c40e5015bba1da9d:mailto:${anotherEmailAddress}
DTSTAMP:20211013T144456Z
X-PM-SHARED-EVENT-ID:CDr63-NYMQl8L_dbp9qzbaSXmb9e6L8shmaxZfF3hWz9vVD3FX0j4l
 kmct4zKnoOX7KgYBPbcZFccjIsD34lAZXTuO99T1XXd7WE8B36T7s=
X-PM-SESSION-KEY:IAhhZBd+KXKPm95M2QRJK7WgGHovpnVdJZb2mMoiwMM=
END:VEVENT
END:VCALENDAR`;

        const { message, preloadedState } = await setup({
            attachments: [{ attachmentID: dummyAttachmentID, filename: dummyFileName, ics }],
            methodInMimeType: ICAL_METHOD.REQUEST,
        });

        await mailTestRender(<ExtraEvents message={message} />, { preloadedState });

        // Event title
        await screen.findByText('Walk on the moon');

        // Event date
        /**
         * The exact text displayed in the event date field depends on the timezone and locale of the
         * machine that runs the code. So here we just check that the date header is present. See
         * dedicated tests of the date header component for tests of the text displayed.
         */
        expect(screen.getByTestId('extra-event-date-header')).toBeInTheDocument();

        // Event warning
        expect(screen.getByText('Event already ended')).toBeInTheDocument();

        // Event link
        expect(screen.queryByText(`Open in ${getAppName(APPS.PROTONCALENDAR)}`)).not.toBeInTheDocument();

        // RSVP buttons are not shown
        expect(screen.queryByText(/Attending?/)).not.toBeInTheDocument();
        expect(screen.queryByText(/Yes/, { selector: 'button' })).not.toBeInTheDocument();
        expect(screen.queryByText(/Maybe/, { selector: 'button' })).not.toBeInTheDocument();
        expect(screen.queryByText(/No/, { selector: 'button' })).not.toBeInTheDocument();

        // Event organizer
        expect(screen.getByText('Organizer:')).toBeInTheDocument();
        const organizerElement = screen.getByTitle(dummySenderEmailAddress);
        expect(organizerElement).toHaveAttribute('href', expect.stringMatching(`mailto:${dummySenderEmailAddress}`));
        expect(organizerElement).toHaveTextContent(dummySenderEmailAddress);

        // Event collapsed attendees
        const showAttendeesButton = screen.getByText('Show');
        expect(screen.queryByText(new RegExp(userEmailAddress))).not.toBeInTheDocument();

        await userEvent.click(showAttendeesButton);
        expect(screen.getByText('Show less')).toBeInTheDocument();
        expect(screen.getByText(new RegExp(anotherEmailAddress))).toBeInTheDocument();
        const selfAttendeeElement = screen.getByTitle(`You <${userEmailAddress}>`);
        expect(selfAttendeeElement).toHaveTextContent(`You <${userEmailAddress}>`);
        expect(selfAttendeeElement).toHaveAttribute('href', expect.stringMatching(`mailto:${userEmailAddress}`));

        // We should not create a calendar for pure byoe accounts
        expect(createCalendarSpy).not.toHaveBeenCalled();

        // Claim proton address button should be visible
        expect(screen.getByTestId('calendar-widget-claim-address-button')).toBeInTheDocument();
    });

    it('should show the correct UI for an outdated invitation', async () => {
        const dummyUID = 'testUID@example.domain';
        const dummyToken = await generateAttendeeToken(canonicalizeInternalEmail(userEmailAddress), dummyUID);

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
ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE;PARTSTAT=NEEDS-ACTION;X-PM-TOKEN=${dummyToken}:mailto:${userEmailAddress}
DTSTAMP:20100917T133417Z
END:VEVENT
END:VCALENDAR`;

        const { message, preloadedState } = await setup({
            attachments: [{ attachmentID: dummyAttachmentID, filename: dummyFileName, ics }],
        });

        await mailTestRender(<ExtraEvents message={message} />, { preloadedState });

        expect(await screen.findByText(/Event already ended/)).toBeInTheDocument();

        // We should not create a calendar for pure byoe accounts
        expect(createCalendarSpy).not.toHaveBeenCalled();

        // Claim proton address button should be visible
        expect(screen.getByTestId('calendar-widget-claim-address-button')).toBeInTheDocument();
    });

    it('should show the correct UI for an unsupported ics with import PUBLISH', async () => {
        const dummyUID = 'testUID@example.domain';
        const dummyToken = await generateAttendeeToken(canonicalizeInternalEmail(userEmailAddress), dummyUID);

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
ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE;PARTSTAT=NEEDS-ACTION;X-PM-TOKEN=${dummyToken}:mailto:${userEmailAddress}
DTSTAMP:20210917T133417Z
END:VEVENT
END:VCALENDAR`;

        const { message, preloadedState } = await setup({
            attachments: [{ attachmentID: dummyAttachmentID, filename: dummyFileName, ics }],
        });
        await mailTestRender(<ExtraEvents message={message} />, { preloadedState });

        await screen.findByText('Time zone not supported');
        expect(screen.queryByTestId('ics-widget-summary')).not.toBeInTheDocument();

        // We should not create a calendar for pure byoe accounts
        expect(createCalendarSpy).not.toHaveBeenCalled();
    });

    it('should show the correct UI for a supported ics with import PUBLISH', async () => {
        const dummyUID = 'testUID@example.domain';
        const dummyToken = await generateAttendeeToken(canonicalizeInternalEmail(userEmailAddress), dummyUID);

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
ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE;PARTSTAT=NEEDS-ACTION;X-PM-TOKEN=${dummyToken}:mailto:${userEmailAddress}
DTSTAMP:20210917T133417Z
END:VEVENT
END:VCALENDAR`;

        const { message, preloadedState } = await setup({
            attachments: [{ attachmentID: dummyAttachmentID, filename: dummyFileName, ics }],
        });

        await mailTestRender(<ExtraEvents message={message} />, { preloadedState });

        expect(screen.queryByText(/Add to Proton Calendar/)).not.toBeInTheDocument();
        expect(screen.queryByTestId('ics-widget-summary')).not.toBeInTheDocument();

        // We should not create a calendar for pure byoe accounts
        expect(createCalendarSpy).not.toHaveBeenCalled();
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
                const { message, preloadedState } = await setup({
                    attachments: [{ attachmentID: dummyAttachmentID, filename: dummyFileName, ics }],
                    methodInMimeType: ICAL_METHOD.REQUEST,
                    senderEmailAddress: dummyRecipientExternalEmailAddress,
                });
                await mailTestRender(<ExtraEvents message={message} />, { preloadedState });
                // Alert is displayed
                expect(
                    await screen.findByText(
                        `You cannot respond to ${BRAND_NAME} invites if you're not on the participants list at the moment.`
                    )
                ).toBeInTheDocument();

                // RSVP buttons are not shown
                expect(screen.queryByText(/Attending?/)).not.toBeInTheDocument();
                expect(screen.queryByText(/Yes/, { selector: 'button' })).not.toBeInTheDocument();
                expect(screen.queryByText(/Maybe/, { selector: 'button' })).not.toBeInTheDocument();
                expect(screen.queryByText(/No/, { selector: 'button' })).not.toBeInTheDocument();

                // We should not create a calendar for pure byoe accounts
                expect(createCalendarSpy).not.toHaveBeenCalled();

                // Claim proton address button should not be visible
                expect(screen.queryByTestId('calendar-widget-claim-address-button')).not.toBeInTheDocument();
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

            it('should show the correct data when the attendee is a party crasher and the organizer is external', async () => {
                // dummySenderExternalEmailAddress sends an invitation to dummyRecipientExternalEmailAddress
                // Then dummyRecipientExternalEmailAddress forwards the invite to dummyUserEmailAddress.
                // => dummyUserEmailAddress is now a party crasher
                const { message, preloadedState } = await setup({
                    attachments: [
                        { attachmentID: dummyAttachmentID, filename: dummyFileName, ics: partyCrasherExternalICS },
                    ],
                    methodInMimeType: ICAL_METHOD.REQUEST,
                    senderEmailAddress: dummyRecipientExternalEmailAddress,
                });
                await mailTestRender(<ExtraEvents message={message} />, { preloadedState });
                // Alert is displayed
                expect(await screen.findByText('Event already ended')).toBeInTheDocument();

                // RSVP buttons are not shown
                expect(screen.queryByText(/Attending?/)).not.toBeInTheDocument();
                expect(screen.queryByText(/Yes/, { selector: 'button' })).not.toBeInTheDocument();
                expect(screen.queryByText(/Maybe/, { selector: 'button' })).not.toBeInTheDocument();
                expect(screen.queryByText(/No/, { selector: 'button' })).not.toBeInTheDocument();

                // We should not create a calendar for pure byoe accounts
                expect(createCalendarSpy).not.toHaveBeenCalled();

                // Claim proton address button should be visible
                expect(screen.getByTestId('calendar-widget-claim-address-button')).toBeInTheDocument();
            });

            it('should not be possible to accept party crasher events when the mail is coming from SimpleLogin', async () => {
                const { message, preloadedState } = await setup({
                    attachments: [
                        { attachmentID: dummyAttachmentID, filename: dummyFileName, ics: partyCrasherExternalICS },
                    ],
                    methodInMimeType: ICAL_METHOD.REQUEST,
                    senderEmailAddress: dummyRecipientExternalEmailAddress,
                    isSimpleLogin: true,
                });
                await mailTestRender(<ExtraEvents message={message} />, { preloadedState });
                // Alert is displayed
                expect(await screen.findByText('Event already ended')).toBeInTheDocument();

                // RSVP buttons are not shown
                expect(screen.queryByText(/Attending?/)).not.toBeInTheDocument();
                expect(screen.queryByText(/Yes/, { selector: 'button' })).not.toBeInTheDocument();
                expect(screen.queryByText(/Maybe/, { selector: 'button' })).not.toBeInTheDocument();
                expect(screen.queryByText(/No/, { selector: 'button' })).not.toBeInTheDocument();

                // We should not create a calendar for pure byoe accounts
                expect(createCalendarSpy).not.toHaveBeenCalled();

                // Claim proton address button should be visible
                expect(screen.getByTestId('calendar-widget-claim-address-button')).toBeInTheDocument();
            });
        });
    });
});
