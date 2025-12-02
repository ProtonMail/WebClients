import { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { useApi } from '@proton/components';
import { useGetCanonicalEmailsMap } from '@proton/components/hooks/useGetCanonicalEmailsMap';
import { useGetVtimezonesMap } from '@proton/components/hooks/useGetVtimezonesMap';
import { useSaveMeeting } from '@proton/meet';
import { confirmBookingSlot } from '@proton/shared/lib/api/calendarBookings';
import { traceError } from '@proton/shared/lib/helpers/sentry';

import { extractBookingUidFromSecret } from '../containers/bookings/utils/crypto/bookingEncryption';
import { useBookingStore } from './booking.store';
import type { BookingTimeslot } from './booking.store';
import { prepareBookingSubmission } from './bookingSubmissionUtils';

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

    const history = useHistory();

    const bookingSecretBase64Url = location.hash.substring(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submitBooking = async (timeslot: BookingTimeslot, attendeeInfo: AttendeeInfo) => {
        if (!bookingDetails) {
            throw new Error('Booking details not available');
        }

        setIsSubmitting(true);
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

            const AttendeeSharedKeyPacket = undefined;

            await api(
                confirmBookingSlot(bookingUidBase64Url, timeslot.id, {
                    ContentPart: submissionData.contentPart,
                    TimePart: submissionData.timePart,
                    AttendeeData: submissionData.attendeeData,
                    AttendeeToken: submissionData.attendeeToken,
                    AttendeeSharedKeyPacket,
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
        } catch (error: unknown) {
            traceError(error);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        bookingSecretBase64Url,
        bookingDetails,
        submitBooking,
        isSubmitting,
    };
};
