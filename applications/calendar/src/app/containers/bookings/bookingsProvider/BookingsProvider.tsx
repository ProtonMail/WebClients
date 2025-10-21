import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { addMilliseconds } from 'date-fns';

import { useReadCalendarBootstrap } from '@proton/calendar/calendarBootstrap/hooks';
import { useCalendarUserSettings } from '@proton/calendar/calendarUserSettings/hooks';
import { getCalendarEventDefaultDuration } from '@proton/shared/lib/calendar/eventDefaults';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import type { CalendarViewBusyEvent, CalendarViewEvent } from '../../calendar/interface';
import { BOOKING_SLOT_ID, type BookingFormData, BookingState } from './interface';

interface BookingsContextValue {
    submitForm: () => Promise<void>;
    isBookingActive: boolean;
    changeBookingState: (state: BookingState) => void;
    addBookingSlot: (startDate: Date, eventDuration: number) => void;
    removeBookingSlot: (slotId: string) => void;
    convertSlotToCalendarViewEvents: (visualCalendar?: VisualCalendar) => CalendarViewEvent[];
    isBookingSlotEvent: (event: CalendarViewEvent | CalendarViewBusyEvent) => event is CalendarViewEvent;
    formData: BookingFormData;
    updateFormData: (field: keyof BookingFormData, value: any) => void;
}

const BookingsContext = createContext<BookingsContextValue | undefined>(undefined);

// TODO used as temporary value, will be replaced with value coming from the booking form.
// The value will be based on the even duration of the selected calendar.
const tmpEventDurationMinute = 120;
const tmpEventDurationMiliSeconds = tmpEventDurationMinute * 60 * 1000;

// TODO maybe a reset booking slot method might be useful
// TODO change the view to weekly view when starting a new booking page
export const BookingsProvider = ({ children }: { children: ReactNode }) => {
    const scheduleOptions = getCalendarEventDefaultDuration();

    const [bookingsState, setBookingsState] = useState<BookingState>(BookingState.OFF);

    const getCalendarSettings = useReadCalendarBootstrap();
    const [calendarUserSettings] = useCalendarUserSettings();

    const [formData, setFormData] = useState<BookingFormData>({
        title: '',
        selectedCalendar: null,
        duration: scheduleOptions[0].value,
        timeZone: calendarUserSettings?.PrimaryTimezone,
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

    // TODO what should happen if we add a slot in the past
    const addBookingSlot = (startDate: Date, eventDuration: number) => {
        const duration = Math.min(eventDuration, tmpEventDurationMiliSeconds);

        setFormData((prevFormData) => ({
            ...prevFormData,
            bookingSlots: [
                ...prevFormData.bookingSlots,
                {
                    id: `${BOOKING_SLOT_ID}-${startDate.getTime().toString()}`,
                    start: startDate,
                    end: addMilliseconds(startDate, duration),
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

        return formData.bookingSlots.map((slot: any) => ({
            uniqueId: slot.id,
            isAllDay: false,
            isAllPartDay: false,
            start: slot.start,
            end: slot.end,
            data: {
                // TODO change this to the selected visual calendar coming from the form
                calendarData: visualCalendar,
            },
        }));
    };

    const isBookingSlotEvent = (event: CalendarViewEvent | CalendarViewBusyEvent): event is CalendarViewEvent => {
        return event.uniqueId.startsWith(BOOKING_SLOT_ID);
    };

    const submitForm = async () => {
        setBookingsState(BookingState.OFF);
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
