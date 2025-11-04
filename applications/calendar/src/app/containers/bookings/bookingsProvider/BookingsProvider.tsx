import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

import { areIntervalsOverlapping, isBefore } from 'date-fns';
import { c } from 'ttag';

import { useUserSettings } from '@proton/account/index';
import { useCalendarBootstrap } from '@proton/calendar/calendarBootstrap/hooks';
import { useGetCalendarKeys } from '@proton/calendar/calendarBootstrap/keys';
import { useCalendarUserSettings } from '@proton/calendar/calendarUserSettings/hooks';
import { useWriteableCalendars } from '@proton/calendar/calendars/hooks';
import useApi from '@proton/components/hooks/useApi';
import { useGetAddressKeysByUsage } from '@proton/components/hooks/useGetAddressKeysByUsage';
import useNotifications from '@proton/components/hooks/useNotifications';
import { createBookingPage } from '@proton/shared/lib/api/calendarBookings';
import { getPreferredActiveWritableCalendar } from '@proton/shared/lib/calendar/calendar';
import { getTimezone } from '@proton/shared/lib/date/timezone';

import { useCalendarGlobalModals } from '../../GlobalModals/GlobalModalProvider';
import { ModalType } from '../../GlobalModals/interface';
import { encryptBookingPage } from '../bookingCryptoUtils';
import { generateBookingRangeID, generateDefaultBookingRange, generateSlotsFromRange } from '../bookingHelpers';
import type { BookingRange, Slot } from './interface';
import { type BookingFormData, BookingLocation, BookingState, DEFAULT_EVENT_DURATION } from './interface';

interface BookingsContextValue {
    submitForm: () => Promise<void>;
    isBookingActive: boolean;
    changeBookingState: (state: BookingState) => void;
    formData: BookingFormData;
    updateFormData: (field: keyof BookingFormData, value: any) => void;
    loading: boolean;
    bookingRange: BookingRange[] | null;
    addBookingRange: (data: Omit<BookingRange, 'id'>) => void;
    removeBookingRange: (id: string) => void;
}

const getInitialBookingFormState = (): BookingFormData => {
    const localTimeZone = getTimezone();

    return {
        title: '',
        selectedCalendar: null,
        locationType: BookingLocation.MEET,
        duration: DEFAULT_EVENT_DURATION,
        timezone: localTimeZone,
        bookingSlots: [],
    };
};

const BookingsContext = createContext<BookingsContextValue | undefined>(undefined);

export const BookingsProvider = ({ children }: { children: ReactNode }) => {
    const [bookingsState, setBookingsState] = useState<BookingState>(BookingState.OFF);
    const [loading, setLoading] = useState(false);

    const [userSettings] = useUserSettings();
    const [bookingRange, setBookingRange] = useState<BookingRange[] | null>(null);

    const api = useApi();
    const { notify } = useCalendarGlobalModals();

    const [writeableCalendars = []] = useWriteableCalendars();
    const [calendarUserSettings] = useCalendarUserSettings();

    const preferredWritableCal = getPreferredActiveWritableCalendar(
        writeableCalendars,
        calendarUserSettings?.DefaultCalendarID
    );
    const [{ CalendarSettings } = {}] = useCalendarBootstrap(preferredWritableCal?.ID || undefined);

    const getAddressKeysByUsage = useGetAddressKeysByUsage();
    const getCalendarKeys = useGetCalendarKeys();

    const [formData, setFormData] = useState<BookingFormData>(getInitialBookingFormState());

    const { createNotification } = useNotifications();

    const initializeFormData = () => {
        // Get the initial form data
        const newFormData = getInitialBookingFormState();

        // Generate the initial form data
        const bookingRange = generateDefaultBookingRange(userSettings, '');
        const bookingSlots = bookingRange
            .map((range) =>
                generateSlotsFromRange({
                    rangeID: range.id,
                    start: range.start,
                    end: range.end,
                    duration: formData.duration,
                    timezone: range.timezone,
                })
            )
            .flat();

        // Set the initial form data
        newFormData.bookingSlots = bookingSlots;
        newFormData.duration = CalendarSettings?.DefaultEventDuration || DEFAULT_EVENT_DURATION;
        newFormData.selectedCalendar = preferredWritableCal?.ID || writeableCalendars[0].ID;

        setBookingRange(bookingRange);
        setFormData(newFormData);
    };

    const recomputeBookingSlots = (newDuration: number) => {
        const newSlots: Slot[] = [];
        bookingRange?.forEach((range) => {
            const slots = generateSlotsFromRange({
                rangeID: range.id,
                start: range.start,
                end: range.end,
                duration: newDuration,
                timezone: range.timezone,
            });

            newSlots.push(...slots);
        });

        setFormData((prev) => ({ ...prev, bookingSlots: newSlots }));
    };

    const updateFormData = (field: keyof BookingFormData, value: any) => {
        // We need to recompute the bookings when the duration change
        if (field === 'duration' && typeof value === 'number' && value > 0) {
            recomputeBookingSlots(value);
        }

        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const resetBookingState = () => {
        const newFormData = getInitialBookingFormState();

        setBookingRange([]);
        setFormData(newFormData);
    };

    const removeBookingRange = (id: string) => {
        setBookingRange((prev) => prev?.filter((range) => range.id !== id) || null);
        setFormData((prev) => ({
            ...prev,
            // Remove all the slots associated with the removed range
            bookingSlots: prev.bookingSlots.filter((slot) => slot.rangeID !== id),
        }));
    };

    const addBookingRange = (data: Omit<BookingRange, 'id'>) => {
        if (isBefore(data.start, new Date())) {
            createNotification({ text: c('Info').t`Booking cannot be added in the past.` });
            return;
        }

        // We store the start and end time of the range for quick comparsion
        const dataId = generateBookingRangeID(data.start, data.end);

        for (const range of bookingRange || []) {
            if (range.id === dataId) {
                createNotification({
                    text: c('Info').t`Booking already exists.`,
                });
                return;
            }

            if (areIntervalsOverlapping({ start: data.start, end: data.end }, { start: range.start, end: range.end })) {
                createNotification({
                    text: c('Info').t`Booking overlaps with an existing booking.`,
                });
                return;
            }
        }

        // Create booking slots that fits inside the booking range and store them in the formData
        const slots = generateSlotsFromRange({
            rangeID: dataId,
            start: data.start,
            end: data.end,
            duration: formData.duration,
            timezone: data.timezone,
        });
        setFormData((prev) => ({ ...prev, bookingSlots: [...prev.bookingSlots, ...slots] }));
        setBookingRange((prev) => [...(prev || []), { ...data, id: dataId }]);
    };

    const changeBookingState = (state: BookingState) => {
        if (state === BookingState.OFF) {
            resetBookingState();
        } else if (state === BookingState.CREATE_NEW) {
            initializeFormData();
        }

        setBookingsState(state);
    };

    const submitForm = async () => {
        try {
            setLoading(true);
            const selectedCalendar = writeableCalendars.find((cal) => cal.ID === formData.selectedCalendar);

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
                        setBookingsState(BookingState.OFF);
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
        formData,
        updateFormData,
        submitForm,
        loading,
        // Range management
        bookingRange,
        addBookingRange,
        removeBookingRange,
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
