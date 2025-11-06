import { fromUnixTime } from 'date-fns';

import { CryptoProxy, serverTime } from '@proton/crypto';
import { generateAttendeeToken } from '@proton/shared/lib/calendar/attendees';
import { generateProtonCalendarUID } from '@proton/shared/lib/calendar/helper';
import { serialize } from '@proton/shared/lib/calendar/vcal';
import { getProdId } from '@proton/shared/lib/calendar/vcalConfig';
import { dateTimeToProperty } from '@proton/shared/lib/calendar/vcalConverter';
import { withDtstamp } from '@proton/shared/lib/calendar/veventHelper';
import { convertUTCDateTimeToZone, fromUTCDate } from '@proton/shared/lib/date/timezone';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

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
}

const prodId = getProdId(config);

export const prepareBookingSubmission = async ({
    timeslot,
    bookingDetails,
    bookingSecretBase64Url,
    bookingKeySalt,
    attendeeName,
    attendeeEmail,
    organizerName,
    organizerEmail,
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
        description: { value: bookingDetails.description },
        dstamp: dateTimeToProperty(fromUTCDate(new Date(+serverTime())), true),
        location: { value: bookingDetails.location },
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
