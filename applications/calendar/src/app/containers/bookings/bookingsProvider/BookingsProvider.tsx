import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { addMinutes, isBefore } from 'date-fns';
import { c } from 'ttag';

import { useReadCalendarBootstrap } from '@proton/calendar/calendarBootstrap/hooks';
import { useGetCalendarKeys } from '@proton/calendar/calendarBootstrap/keys';
import { useCalendarUserSettings } from '@proton/calendar/calendarUserSettings/hooks';
import { useCalendars } from '@proton/calendar/calendars/hooks';
import { useGetAddressKeysByUsage } from '@proton/components/hooks/useGetAddressKeysByUsage';
import { useApi, useNotifications } from '@proton/components/index';
import { createBookingPage } from '@proton/shared/lib/api/calendarBookings';
import { getVisualCalendar } from '@proton/shared/lib/calendar/calendar';
import { getCalendarEventDefaultDuration } from '@proton/shared/lib/calendar/eventDefaults';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import { useCalendarGlobalModals } from '../../GlobalModals/GlobalModalProvider';
import { ModalType } from '../../GlobalModals/interface';
import type { CalendarViewBusyEvent, CalendarViewEvent } from '../../calendar/interface';
import { encryptBookingPage } from '../bookingCryptoUtils';
import { BOOKING_SLOT_ID, type BookingFormData, BookingState } from './interface';

interface BookingsContextValue {
    submitForm: () => Promise<void>;
    isBookingActive: boolean;
    changeBookingState: (state: BookingState) => void;
    addBookingSlot: (startDate: Date) => void;
    removeBookingSlot: (slotId: string) => void;
    convertSlotToCalendarViewEvents: (visualCalendar?: VisualCalendar) => CalendarViewEvent[];
    isBookingSlotEvent: (event: CalendarViewEvent | CalendarViewBusyEvent) => event is CalendarViewEvent;
    formData: BookingFormData;
    updateFormData: (field: keyof BookingFormData, value: any) => void;
    loading: boolean;
}

const BookingsContext = createContext<BookingsContextValue | undefined>(undefined);

export const BookingsProvider = ({ children }: { children: ReactNode }) => {
    const scheduleOptions = getCalendarEventDefaultDuration();

    const [bookingsState, setBookingsState] = useState<BookingState>(BookingState.OFF);
    const [loading, setLoading] = useState(false);

    const api = useApi();
    const { notify } = useCalendarGlobalModals();

    const [calendars = []] = useCalendars();
    const getCalendarSettings = useReadCalendarBootstrap();
    const [calendarUserSettings] = useCalendarUserSettings();

    const getAddressKeysByUsage = useGetAddressKeysByUsage();
    const getCalendarKeys = useGetCalendarKeys();

    const { createNotification } = useNotifications();

    const [formData, setFormData] = useState<BookingFormData>({
        title: '',
        selectedCalendar: null,
        duration: scheduleOptions[0].value,
        timezone: calendarUserSettings?.PrimaryTimezone,
        bookingSlots: [],
    });

    const updateFormData = (field: keyof BookingFormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // Used to set the default duration and selected calendar
    useEffect(() => {
        if (formData.selectedCalendar !== null || !calendarUserSettings?.DefaultCalendarID) {
            return;
        }

        const calendarSettings = getCalendarSettings(calendarUserSettings.DefaultCalendarID);
        if (!calendarSettings) {
            return;
        }

        updateFormData('selectedCalendar', calendarUserSettings.DefaultCalendarID);
        updateFormData('duration', calendarSettings.CalendarSettings.DefaultEventDuration);
    }, [formData.selectedCalendar, calendarUserSettings?.DefaultCalendarID, getCalendarSettings]);

    const changeBookingState = (state: BookingState) => {
        if (state === BookingState.OFF) {
            setFormData((prevFormData) => ({
                ...prevFormData,
                bookingSlots: [],
            }));
        }

        setBookingsState(state);
    };

    const addBookingSlot = (startDate: Date) => {
        if (isBefore(startDate, new Date())) {
            createNotification({ text: c('Info').t`A booking slot cannot be added in the past.` });
            return;
        }

        setFormData((prevFormData) => ({
            ...prevFormData,
            bookingSlots: [
                ...prevFormData.bookingSlots,
                {
                    id: `${BOOKING_SLOT_ID}-${startDate.getTime().toString()}`,
                    start: startDate,
                    end: addMinutes(startDate, formData.duration),
                },
            ],
        }));
    };

    const removeBookingSlot = (slotId: string) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            bookingSlots: prevFormData.bookingSlots.filter((slot) => slot.id !== slotId),
        }));
    };

    const convertSlotToCalendarViewEvents = (visualCalendar?: VisualCalendar): CalendarViewEvent[] => {
        if (!visualCalendar) {
            return [];
        }

        const calendar = calendars.find((cal) => cal.ID === formData.selectedCalendar);
        if (!calendar) {
            return [];
        }

        return formData.bookingSlots.map((slot: any) => ({
            uniqueId: slot.id,
            isAllDay: false,
            isAllPartDay: false,
            start: slot.start,
            end: slot.end,
            data: {
                calendarData: getVisualCalendar(calendar),
            },
        }));
    };

    const isBookingSlotEvent = (event: CalendarViewEvent | CalendarViewBusyEvent): event is CalendarViewEvent => {
        return event.uniqueId.startsWith(BOOKING_SLOT_ID);
    };

    const resetBookingState = () => {
        setFormData({
            title: '',
            selectedCalendar: null,
            duration: scheduleOptions[0].value,
            timezone: calendarUserSettings?.PrimaryTimezone,
            bookingSlots: [],
        });
    };

    const submitForm = async () => {
        try {
            setLoading(true);
            const selectedCalendar = calendars.find((cal) => cal.ID === formData.selectedCalendar);

            if (!selectedCalendar) {
                return;
            }

            const ownerEmail = selectedCalendar.Owner.Email;
            const ownerAddressId = selectedCalendar.Members.find((member) => member.Email === ownerEmail)?.AddressID;

            if (!ownerAddressId) {
                throw new Error('Owner address ID not found');
            }

            const { encryptionKey, signingKeys } = await getAddressKeysByUsage({
                AddressID: ownerAddressId,
                withV6SupportForEncryption: true,
                withV6SupportForSigning: false,
            });

            const calendarKeys = await getCalendarKeys(selectedCalendar.ID);
            const data = await encryptBookingPage({
                formData,
                calendarKeys,
                encryptionKey,
                signingKeys,
                calendarID: selectedCalendar.ID,
            });

            const { BookingLink: bookingLink, ...apiPayload } = data;

            await api(createBookingPage({ ...apiPayload, CalendarID: selectedCalendar.ID }));

            notify({
                type: ModalType.BookingPageCreation,
                value: {
                    bookingLink,
                    onClose: () => {
                        resetBookingState();
                    },
                },
            });
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const value: BookingsContextValue = {
        isBookingActive: bookingsState === BookingState.CREATE_NEW || bookingsState === BookingState.EDIT_EXISTING,
        changeBookingState,
        addBookingSlot,
        removeBookingSlot,
        convertSlotToCalendarViewEvents,
        isBookingSlotEvent,
        formData,
        updateFormData,
        submitForm,
        loading,
    };

    return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>;
};

export const useBookings = () => {
    const context = useContext(BookingsContext);
    if (context === undefined) {
        throw new Error('useBookings must be used within a BookingsContext');
    }
    return context;
};
