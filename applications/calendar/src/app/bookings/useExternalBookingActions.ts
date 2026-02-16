import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { useGetAddresses } from '@proton/account/addresses/hooks';
import { useGetCalendarKeys } from '@proton/calendar/calendarBootstrap/keys';
import { useGetCalendarUserSettings } from '@proton/calendar/calendarUserSettings/hooks';
import useApi from '@proton/components/hooks/useApi';
import { useGetCanonicalEmailsMap } from '@proton/components/hooks/useGetCanonicalEmailsMap';
import { useGetVtimezonesMap } from '@proton/components/hooks/useGetVtimezonesMap';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useSaveMeeting } from '@proton/meet';
import { confirmBookingSlot } from '@proton/shared/lib/api/calendarBookings';
import { traceError } from '@proton/shared/lib/helpers/sentry';

import { extractBookingUidFromSecret } from '../containers/bookings/utils/crypto/bookingEncryption';
import { useBookingStore } from './booking.store';
import type { BookingTimeslot } from './booking.store';
import { prepareBookingSubmission } from './bookingSubmissionUtils';
import { useBookingsProvider } from './entryPoints/BookingsExternalProvider';
import { getBookingSharedKeyPacket } from './utils/attendeeSharedKeyPacketHelper';

interface AttendeeInfo {
    name: string;
    email: string;
}

export const useExternalBookingActions = () => {
    const api = useApi();
    const bookingDetails = useBookingStore((state) => state.bookingDetails);
    const setSelectedBookingSlot = useBookingStore((state) => state.setSelectedBookingSlot);
    const saveMeeting = useSaveMeeting();
    const getVTimezonesMap = useGetVtimezonesMap();
    const getCanonicalEmailsMap = useGetCanonicalEmailsMap();
    const { createNotification } = useNotifications();

    const history = useHistory();
    const { isGuest } = useBookingsProvider();

    const getCalendarKeys = useGetCalendarKeys();
    const getAddresses = useGetAddresses();
    const getCalendarUserSettings = useGetCalendarUserSettings();

    const bookingSecretBase64Url = history.location.hash.substring(1);

    const submitBooking = async (timeslot: BookingTimeslot, attendeeInfo: AttendeeInfo) => {
        if (!bookingDetails) {
            throw new Error('Booking details not available');
        }

        try {
            const bookingUidBase64Url = await extractBookingUidFromSecret(bookingSecretBase64Url);

            const attendeeSharedKey = await getBookingSharedKeyPacket({
                isGuest,
                bookingDetails,
                getAddresses,
                getCalendarUserSettings,
                getCalendarKeys,
                attendeeEmail: attendeeInfo.email,
            });

            if (!attendeeSharedKey) {
                throw new Error('Failed to generate attendee shared key');
            }

            if (attendeeSharedKey.attendeeSharedKeyPacket.type === 'disabled_address') {
                createNotification({
                    type: 'error',
                    text: c('Error').t`Cannot create a booking with a disabled address`,
                });
                return;
            }

            const attendeeSharedKeyPacket =
                attendeeSharedKey.attendeeSharedKeyPacket.type === 'success'
                    ? attendeeSharedKey.attendeeSharedKeyPacket.keyPacket
                    : undefined;

            const submissionData = await prepareBookingSubmission({
                timeslot,
                bookingDetails,
                attendeeName: attendeeInfo.name,
                attendeeEmail: attendeeInfo.email,
                organizerName: bookingDetails.inviterDisplayName || '',
                organizerEmail: bookingDetails.inviterEmail,
                saveMeeting,
                getCanonicalEmailsMap,
                getVTimezonesMap,
                sharedSessionKey: attendeeSharedKey.sharedSessionKey,
            });

            await api(
                confirmBookingSlot(bookingUidBase64Url, timeslot.id, {
                    ContentPart: submissionData.contentPart,
                    TimePart: submissionData.timePart,
                    AttendeeData: submissionData.attendeeData,
                    AttendeeToken: submissionData.attendeeToken,
                    AttendeeSharedKeyPacket: attendeeSharedKeyPacket,
                    SharedKeyPacket: attendeeSharedKey.sharedKeyPacket,
                    EmailData: {
                        Name: submissionData.emailData.name,
                        Email: submissionData.emailData.email,
                        Subject: submissionData.emailData.subject,
                        Body: submissionData.emailData.body,
                        Ics: submissionData.ics,
                        Type: 'external',
                    },
                })
            );

            setSelectedBookingSlot(timeslot);
            history.push(`/bookings/success#${bookingSecretBase64Url}`);
            return 'success';
        } catch (error: unknown) {
            traceError(error);
            throw error;
        }
    };

    return {
        bookingSecretBase64Url,
        bookingDetails,
        submitBooking,
    };
};
