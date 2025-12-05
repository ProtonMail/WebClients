import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { useGetAddresses } from '@proton/account/addresses/hooks';
import { useGetCalendarKeys } from '@proton/calendar/calendarBootstrap/keys';
import { useGetCalendarUserSettings } from '@proton/calendar/calendarUserSettings/hooks';
import { useApi, useNotifications } from '@proton/components';
import { useGetCanonicalEmailsMap } from '@proton/components/hooks/useGetCanonicalEmailsMap';
import { useGetVtimezonesMap } from '@proton/components/hooks/useGetVtimezonesMap';
import { useSaveMeeting } from '@proton/meet';
import { confirmBookingSlot } from '@proton/shared/lib/api/calendarBookings';
import { traceError } from '@proton/shared/lib/helpers/sentry';

import { extractBookingUidFromSecret } from '../containers/bookings/utils/crypto/bookingEncryption';
import { useBookingStore } from './booking.store';
import type { BookingTimeslot } from './booking.store';
import { prepareBookingSubmission } from './bookingSubmissionUtils';
import { useBookingsProvider } from './entryPoints/BookingsExternalProvider';
import { getAttendeeSharedKeyPacket } from './utils/attendeeKeyPacketHelper';

interface AttendeeInfo {
    name: string;
    email: string;
}

export const useExternalBookingActions = () => {
    const api = useApi();
    const location = useLocation();
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

    const bookingSecretBase64Url = location.hash.substring(1);

    const submitBooking = async (timeslot: BookingTimeslot, attendeeInfo: AttendeeInfo) => {
        if (!bookingDetails) {
            throw new Error('Booking details not available');
        }

        try {
            const bookingUidBase64Url = await extractBookingUidFromSecret(bookingSecretBase64Url);

            const submissionData = await prepareBookingSubmission({
                timeslot,
                bookingDetails,
                bookingSecretBase64Url,
                bookingKeySalt: bookingDetails.bookingKeySalt,
                attendeeName: attendeeInfo.name,
                attendeeEmail: attendeeInfo.email,
                organizerName: bookingDetails.inviterDisplayName || '',
                organizerEmail: bookingDetails.inviterEmail,
                saveMeeting,
                getCanonicalEmailsMap,
                getVTimezonesMap,
            });

            const attendeeSharedKeyPacketResult = await getAttendeeSharedKeyPacket({
                isGuest,
                attendeeEmail: attendeeInfo.email,
                sharedSessionKey: submissionData.sharedSessionKey,
                getCalendarUserSettings,
                getAddresses,
                getCalendarKeys,
            });

            if (attendeeSharedKeyPacketResult.type === 'disabled_address') {
                createNotification({
                    type: 'error',
                    text: c('Error').t`Cannot create a booking with a disabled address`,
                });
                return;
            }

            await api(
                confirmBookingSlot(bookingUidBase64Url, timeslot.id, {
                    ContentPart: submissionData.contentPart,
                    TimePart: submissionData.timePart,
                    AttendeeData: submissionData.attendeeData,
                    AttendeeToken: submissionData.attendeeToken,
                    AttendeeSharedKeyPacket: attendeeSharedKeyPacketResult.keyPacket,
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
            history.push('/bookings/success');
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
