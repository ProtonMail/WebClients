import { fromUnixTime } from 'date-fns';

import { CryptoProxy } from '@proton/crypto';
import type { SessionKey } from '@proton/crypto';
import { getMeetingLink } from '@proton/meet';
import type { SaveMeetingParams } from '@proton/meet/hooks/useSaveMeeting';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { generateAttendeeToken } from '@proton/shared/lib/calendar/attendees';
import {
    ICAL_ATTENDEE_ROLE,
    ICAL_ATTENDEE_RSVP,
    ICAL_ATTENDEE_STATUS,
    ICAL_METHOD,
} from '@proton/shared/lib/calendar/constants';
import { generateProtonCalendarUID } from '@proton/shared/lib/calendar/helper';
import { createInviteIcs, generateVtimezonesComponents } from '@proton/shared/lib/calendar/mailIntegration/invite';
import { serialize } from '@proton/shared/lib/calendar/vcal';
import { getProdId } from '@proton/shared/lib/calendar/vcalConfig';
import { getDateTimeProperty } from '@proton/shared/lib/calendar/vcalConverter';
import { withDtstamp } from '@proton/shared/lib/calendar/veventHelper';
import { APPS } from '@proton/shared/lib/constants';
import { convertTimestampToTimezone } from '@proton/shared/lib/date/timezone';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import { type CreateMeetingResponse, MeetingType } from '@proton/shared/lib/interfaces/Meet';
import type { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import { VIDEO_CONFERENCE_PROVIDER } from '@proton/shared/lib/interfaces/calendar';
import type { GetVTimezonesMap } from '@proton/shared/lib/interfaces/hooks/GetVTimezonesMap';

import {
    modelToAttendeeProperties,
    modelToDescriptionProperties,
    modelToGeneralProperties,
    modelToOrganizerProperties,
} from '../components/eventModal/eventForm/modelToProperties';
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
    getVTimezonesMap: GetVTimezonesMap;
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
            type: MeetingType.SCHEDULED, // todo update this once we support recurring events
        },
        addressId: null,
        noPasswordSave: true,
    });

    const meetingId = response.Meeting.MeetingLinkName;
    const meetingLink = getMeetingLink(response.Meeting.MeetingLinkName, passwordBase);

    return modelToDescriptionProperties({
        description: bookingDetails.description,
        conferenceId: meetingId,
        conferenceUrl: getAppHref(meetingLink, APPS.PROTONMEET),
        conferenceHost: bookingDetails.inviterEmail,
        conferenceProvider: VIDEO_CONFERENCE_PROVIDER.PROTON_MEET,
    });
};

const getBookingTimePartVevent = (vevent: VcalVeventComponent) => {
    return {
        component: 'vevent',
        uid: vevent.uid,
        'x-pm-BookingUID': vevent['x-pm-BookingUID'],
        dtstart: vevent.dtstart,
        dtend: vevent.dtend,
        sequence: vevent.sequence,
        organizer: vevent.organizer,
        dtstamp: vevent.dtstamp,
        ...(vevent.rrule ? { rrule: vevent.rrule } : {}),
    };
};

const getBookingContentPartVevent = (vevent: VcalVeventComponent) => {
    return {
        component: 'vevent',
        uid: vevent.uid,
        'x-pm-BookingUID': vevent['x-pm-BookingUID'],
        summary: vevent.summary,
        ...(vevent.location ? vevent.location : {}),
        dtstamp: vevent.dtstamp,
        ...(vevent.description ? { description: vevent.description } : {}),
        // TODO this depends if we want to/can add video conference properties to the event
        // ...(vevent['x-pm-conference-id'] ? { 'x-pm-conference-id': vevent['x-pm-conference-id'] } : {}),
        // ...(vevent['x-pm-conference-url'] ? { 'x-pm-conference-url': vevent['x-pm-conference-url'] } : {}),
    };
};

const getBookingAttendeePartVevent = (vevent: VcalVeventComponent) => {
    return {
        component: 'vevent' as const,
        uid: vevent.uid,
        'x-pm-BookingUID': vevent['x-pm-BookingUID'],
        attendee: vevent.attendee,
        organizer: vevent.organizer,
        dtstamp: vevent.dtstamp,
    };
};

/**
 * Encrypts booking event parts for submission to the API
 * Returns the encrypted content and attendee parts, plus the unencrypted time part
 */
const encryptBookingParts = async (vevent: VcalVeventComponent, sharedSessionKey: SessionKey | undefined) => {
    const timePartVevent = getBookingTimePartVevent(vevent);
    const contentPartVevent = getBookingContentPartVevent(vevent);
    const attendeePartVevent = getBookingAttendeePartVevent(vevent);

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

    const [{ message: encryptedContentPartBytes }, { message: encryptedAttendeeDataBytes }] = await Promise.all([
        CryptoProxy.encryptMessage({
            textData: contentPartIcs,
            sessionKey: sharedSessionKey,
            format: 'binary',
        }),
        CryptoProxy.encryptMessage({
            textData: attendeePartIcs,
            sessionKey: sharedSessionKey,
            format: 'binary',
        }),
    ]);

    return {
        timePartIcsRaw,
        encryptedContentPart: uint8ArrayToBase64String(encryptedContentPartBytes),
        encryptedAttendeePart: uint8ArrayToBase64String(encryptedAttendeeDataBytes),
    };
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
    getVTimezonesMap,
}: PrepareBookingSubmissionParams) => {
    const sharedSessionKey = await decryptBookingSessionKey(
        bookingSecretBase64Url,
        bookingKeySalt,
        bookingDetails.calendarId,
        timeslot.bookingKeyPacket
    );
    const uid = generateProtonCalendarUID();

    const dtstart = getDateTimeProperty(
        convertTimestampToTimezone(timeslot.startTime, timeslot.timezone),
        timeslot.timezone
    );
    const dtend = getDateTimeProperty(
        convertTimestampToTimezone(timeslot.endTime, timeslot.timezone),
        timeslot.timezone
    );

    const attendeeToken = await generateAttendeeToken(attendeeEmail, uid);

    // Todo check if we need to update the location with meet link
    const generalProperties = modelToGeneralProperties({
        uid,
        title: bookingDetails.summary,
        location: bookingDetails.location,
    });
    const organizerProperties = modelToOrganizerProperties({ organizer: { email: organizerEmail, cn: organizerName } });
    const attendeeProperties = modelToAttendeeProperties({
        attendees: [
            {
                email: attendeeEmail,
                cn: attendeeName,
                rsvp: ICAL_ATTENDEE_RSVP.TRUE,
                role: ICAL_ATTENDEE_ROLE.REQUIRED,
                partstat: ICAL_ATTENDEE_STATUS.NEEDS_ACTION,
                token: attendeeToken,
            },
        ],
    });
    const descriptionProperties = await getBookingConferenceDescription(bookingDetails, timeslot, saveMeeting);

    const vevent: VcalVeventComponent = withDtstamp({
        ...generalProperties,
        ...organizerProperties,
        ...attendeeProperties,
        ...descriptionProperties,
        dtstart,
        dtend,
        component: 'vevent',
        'x-pm-BookingUID': { value: bookingDetails.bookingUid },
        sequence: { value: 0 },
        // TODO add frequencyProperties (rrule) once we support recurring events
        // TODO check if we need to support valarmComponents
    });

    const [{ timePartIcsRaw, encryptedContentPart, encryptedAttendeePart }, vtimezones] = await Promise.all([
        encryptBookingParts(vevent, sharedSessionKey),
        generateVtimezonesComponents(vevent, getVTimezonesMap),
    ]);

    const fullIcs = createInviteIcs({
        method: ICAL_METHOD.REQUEST,
        prodId,
        vevent: vevent,
        vtimezones,
        keepDtstamp: true,
    });

    return {
        contentPart: encryptedContentPart,
        timePart: timePartIcsRaw,
        attendeeData: encryptedAttendeePart,
        attendeeToken: attendeeToken,
        emailData: {
            name: attendeeName,
            email: attendeeEmail,
        },
        ics: fullIcs,
    };
};
