import { fromUnixTime } from 'date-fns';

import { CryptoProxy, serverTime } from '@proton/crypto';
import { getMeetingLink } from '@proton/meet';
import type { SaveMeetingParams } from '@proton/meet/hooks/useSaveMeeting';
import { generateAttendeeToken } from '@proton/shared/lib/calendar/attendees';
import { generateProtonCalendarUID } from '@proton/shared/lib/calendar/helper';
import { serialize } from '@proton/shared/lib/calendar/vcal';
import { getProdId } from '@proton/shared/lib/calendar/vcalConfig';
import { dateTimeToProperty } from '@proton/shared/lib/calendar/vcalConverter';
import { withDtstamp } from '@proton/shared/lib/calendar/veventHelper';
import { convertUTCDateTimeToZone, fromUTCDate } from '@proton/shared/lib/date/timezone';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import { type CreateMeetingResponse, MeetingType } from '@proton/shared/lib/interfaces/Meet';
import { VIDEO_CONFERENCE_PROVIDER } from '@proton/shared/lib/interfaces/calendar';

import { modelToDescriptionProperties } from '../components/eventModal/eventForm/modelToProperties';
import config from '../config';
import { decryptBookingSessionKey } from '../containers/bookings/utils/bookingCryptoUtils';
import type { BookingDetails, BookingTimeslot } from './booking.store';

interface PrepareBookingSubmissionParams {
    timeslot: BookingTimeslot;
    bookingDetails: BookingDetails;
    bookingSecretBase64Url: string;
    bookingKeySalt: string;
    attendeeName: string;
    attendeeEmail: string;
    organizerName: string;
    organizerEmail: string;
    saveMeeting: (params: SaveMeetingParams) => Promise<{
        response: CreateMeetingResponse;
        passwordBase: string;
    }>;
}

const prodId = getProdId(config);

const getBookingConferenceDescription = async (
    bookingDetails: BookingDetails,
    timeslot: BookingTimeslot,
    saveMeeting: (params: SaveMeetingParams) => Promise<{
        response: CreateMeetingResponse;
        passwordBase: string;
    }>
) => {
    if (!bookingDetails.withProtonMeetLink) {
        return { description: { value: bookingDetails.description } };
    }

    const startDate = fromUnixTime(timeslot.startTime);
    const endDate = fromUnixTime(timeslot.endTime);

    const { response, passwordBase } = await saveMeeting({
        params: {
            customPassword: '',
            protonCalendar: true, // todo not sure we need to pass this
            meetingName: bookingDetails.summary,
            recurrence: null, // todo handle this once we support recurring events
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
            timeZone: timeslot.timezone,
            type: MeetingType.SCHEDULED,
        },
        addressId: null,
        noPasswordSave: true,
    });

    const meetingId = response.Meeting.MeetingLinkName;
    const meetingLink = getMeetingLink(response.Meeting.MeetingLinkName, passwordBase);

    return modelToDescriptionProperties({
        description: bookingDetails.description,
        conferenceId: meetingId,
        conferenceUrl: meetingLink,
        conferenceHost: bookingDetails.inviterEmail,
        conferenceProvider: VIDEO_CONFERENCE_PROVIDER.PROTON_MEET,
    });
};

export const prepareBookingSubmission = async ({
    timeslot,
    bookingDetails,
    bookingSecretBase64Url,
    bookingKeySalt,
    attendeeName,
    attendeeEmail,
    organizerName,
    organizerEmail,
    saveMeeting,
}: PrepareBookingSubmissionParams) => {
    const sharedSessionKey = await decryptBookingSessionKey(
        bookingSecretBase64Url,
        bookingKeySalt,
        bookingDetails.calendarId,
        timeslot.bookingKeyPacket
    );

    const startDate = fromUnixTime(timeslot.startTime);
    const endDate = fromUnixTime(timeslot.endTime);

    const dtstart = convertUTCDateTimeToZone(fromUTCDate(startDate), timeslot.timezone);
    const dtend = convertUTCDateTimeToZone(fromUTCDate(endDate), timeslot.timezone);

    const conferenceDescription = await getBookingConferenceDescription(bookingDetails, timeslot, saveMeeting);

    const uid = generateProtonCalendarUID();
    const timePartVevent = withDtstamp({
        component: 'vevent',
        'x-pm-BookingUID': { value: bookingDetails.bookingUid },
        uid: { value: uid },
        dtstart: {
            value: { ...dtstart, isUTC: false },
            parameters: {
                tzid: timeslot.timezone,
            },
        },
        dtend: {
            value: { ...dtend, isUTC: false },
            parameters: {
                tzid: timeslot.timezone,
            },
        },
        sequence: { value: 0 },
        organizer: {
            value: `mailto:${organizerEmail}`,
            parameters: {
                cn: organizerName,
            },
        },
        ...(timeslot.rrule
            ? {
                  value: {
                      freq: timeslot.rrule,
                  },
              }
            : undefined),
    });

    const contentPartVevent = {
        component: 'vevent',
        'x-pm-BookingUID': { value: bookingDetails.bookingUid },
        uid: { value: uid },
        summary: { value: bookingDetails.summary },
        ...conferenceDescription,
        dstamp: dateTimeToProperty(fromUTCDate(new Date(+serverTime())), true),
        location: { value: bookingDetails.location }, // TODO check if we need to do something when having meet link
    };

    const attendeePartVevent = {
        component: 'vevent',
        'x-pm-BookingUID': { value: bookingDetails.bookingUid },
        uid: { value: uid },
        attendee: [
            {
                value: `mailto:${attendeeEmail}`,
                parameters: {
                    cn: attendeeName,
                },
            },
        ],
        organizer: {
            value: `mailto:${organizerEmail}`,
            parameters: {
                cn: organizerName,
            },
        },
    };

    const timePartIcsRaw: string = serialize({
        component: 'vcalendar',
        components: [timePartVevent],
        version: { value: '2.0' },
        prodId: { value: prodId },
    });
    const contentPartIcs: string = serialize({
        component: 'vcalendar',
        components: [contentPartVevent],
        version: { value: '2.0' },
        prodId: { value: prodId },
    });
    const attendeePartIcs: string = serialize({
        component: 'vcalendar',
        components: [attendeePartVevent],
        version: { value: '2.0' },
        prodId: { value: prodId },
    });
    const fullIcs = serialize({
        component: 'vcalendar',
        components: [timePartVevent, contentPartVevent, attendeePartVevent],
        version: { value: '2.0' },
        prodId: { value: prodId },
    });

    const { message: encryptedContentPartBytes } = await CryptoProxy.encryptMessage({
        textData: contentPartIcs,
        sessionKey: sharedSessionKey,
        format: 'binary',
    });

    const { message: encryptedAttendeeDataBytes } = await CryptoProxy.encryptMessage({
        textData: attendeePartIcs,
        sessionKey: sharedSessionKey,
        format: 'binary',
    });

    const attendeeToken = await generateAttendeeToken(attendeeEmail, uid);

    return {
        contentPart: uint8ArrayToBase64String(encryptedContentPartBytes),
        timePart: timePartIcsRaw,
        attendeeData: uint8ArrayToBase64String(encryptedAttendeeDataBytes),
        attendeeToken: attendeeToken,
        emailData: {
            name: attendeeName,
            email: attendeeEmail,
        },
        ics: fullIcs,
    };
};
