import { createContext, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { isBefore } from 'date-fns';
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
import { fromUTCDateToLocalFakeUTCDate, getTimezone } from '@proton/shared/lib/date/timezone';

import { useCalendarDispatch } from '../../../store/hooks';
import { interalBookingActions } from '../../../store/internalBooking/interalBookingSlice';
import { useCalendarGlobalModals } from '../../GlobalModals/GlobalModalProvider';
import { ModalType } from '../../GlobalModals/interface';
import { encryptBookingPage } from '../utils/bookingCryptoUtils';
import {
    generateBookingRangeID,
    generateDefaultBookingRange,
    generateSlotsFromRange,
    validateBookingRange,
} from '../utils/bookingHelpers';
import type { BookingRange, Slot } from './interface';
import { type BookingFormData, BookingLocation, BookingState, DEFAULT_EVENT_DURATION } from './interface';

interface BookingsContextValue {
    submitForm: () => Promise<void>;
    isBookingActive: boolean;
    canCreateBooking: boolean;
    openBookingSidebar: (date: Date) => void;
    closeBookingSidebar: () => void;
    formData: BookingFormData;
    updateFormData: (field: keyof BookingFormData, value: any) => void;
    loading: boolean;
    bookingRange: BookingRange[] | null;
    addBookingRange: (data: Omit<BookingRange, 'id'>) => void;
    updateBookingRange: (id: string, start: Date, end: Date) => void;
    removeBookingRange: (id: string) => void;
}

const getInitialBookingFormState = (): BookingFormData => {
    const localTimeZone = getTimezone();

    return {
        summary: '',
        selectedCalendar: null,
        locationType: BookingLocation.MEET,
        duration: DEFAULT_EVENT_DURATION,
        timezone: localTimeZone,
        bookingSlots: [],
    };
};

interface InitialData {
    formData: BookingFormData;
    bookingRange: BookingRange[];
}

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

    const initialFormData = useRef<InitialData | undefined>(undefined);
    const [formData, setFormData] = useState<BookingFormData>(getInitialBookingFormState());

    const { createNotification } = useNotifications();

    const dispatch = useCalendarDispatch();

    const initializeFormData = (currentUTCDate: Date) => {
        // Get the initial form data

        const newFormData = getInitialBookingFormState();
        const timezone =
            calendarUserSettings?.PrimaryTimezone || calendarUserSettings?.SecondaryTimezone || getTimezone();

        // Generate the initial form data
        const bookingRange = generateDefaultBookingRange(userSettings, currentUTCDate, timezone, false);
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
        newFormData.timezone = timezone;
        newFormData.duration = CalendarSettings?.DefaultEventDuration || DEFAULT_EVENT_DURATION;
        newFormData.selectedCalendar = preferredWritableCal?.ID || writeableCalendars[0].ID;

        setBookingRange(bookingRange);
        setFormData(newFormData);
        initialFormData.current = { formData: newFormData, bookingRange };
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

    const updateBookingRange = (oldRangeId: string, start: Date, end: Date) => {
        const range = bookingRange?.find((range) => range.id === oldRangeId);
        if (!range || !bookingRange) {
            throw new Error(`Booking range with id ${oldRangeId} not found or no bookingRange`);
        }

        const newRangeId = generateBookingRangeID(start, end);
        const validateNewRange = validateBookingRange({
            newRangeId,
            start,
            end,
            existingRanges: bookingRange,
            excludeRangeId: oldRangeId,
        });
        if (validateNewRange) {
            createNotification({ text: validateNewRange });
            return;
        }

        const newRange = {
            id: newRangeId,
            start,
            end,
            timezone: range.timezone,
        };

        const newBookingRange = bookingRange
            .map((range) => (range.id === oldRangeId ? newRange : range))
            .sort((a, b) => a.start.getTime() - b.start.getTime());

        const newSlots = generateSlotsFromRange({
            rangeID: newRangeId,
            start,
            end,
            duration: formData.duration,
            timezone: range.timezone,
        });

        const newFormData = formData;
        newFormData.bookingSlots = [
            ...formData.bookingSlots.filter((slot) => slot.rangeID !== oldRangeId),
            ...newSlots,
        ];

        setBookingRange(newBookingRange);
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
        const now = new Date();
        const nowWithTz = fromUTCDateToLocalFakeUTCDate(now, false, data.timezone);
        if (isBefore(data.start, nowWithTz)) {
            createNotification({ text: c('Info').t`Booking cannot be added in the past.` });
            return;
        }

        // We store the start and end time of the range for quick comparsion
        const dataId = generateBookingRangeID(data.start, data.end);
        const validateNewRange = validateBookingRange({
            newRangeId: dataId,
            start: data.start,
            end: data.end,
            existingRanges: bookingRange || [],
        });
        if (validateNewRange) {
            createNotification({ text: validateNewRange });
            return;
        }

        const newBookingRange = [...(bookingRange || []), { ...data, id: dataId }].sort(
            (a, b) => a.start.getTime() - b.start.getTime()
        );

        const newSlots = generateSlotsFromRange({
            rangeID: dataId,
            start: data.start,
            end: data.end,
            duration: formData.duration,
            timezone: data.timezone,
        });

        const newFormData = formData;
        formData.bookingSlots = [...formData.bookingSlots, ...newSlots];

        setBookingRange(newBookingRange);
        setFormData(newFormData);
    };

    const openBookingSidebar = (currentDate: Date) => {
        initializeFormData(currentDate);
        setBookingsState(BookingState.CREATE_NEW);
    };

    const closeBookingSidebar = () => {
        const intialForm = initialFormData.current?.formData;
        const initialRange = initialFormData.current?.bookingRange;

        const formWasTouched =
            formData.summary !== intialForm?.summary ||
            formData.description !== intialForm?.description ||
            formData.duration !== intialForm?.duration ||
            formData.selectedCalendar !== intialForm?.selectedCalendar ||
            formData.location !== intialForm?.location ||
            formData.bookingSlots.length !== intialForm?.bookingSlots.length ||
            bookingRange?.length !== initialRange?.length;

        if (formWasTouched) {
            notify({
                type: ModalType.BookingPageConfirmClose,
                value: {
                    onClose: () => {
                        setBookingsState(BookingState.OFF);
                    },
                },
            });
        } else {
            setBookingsState(BookingState.OFF);
        }
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

            const response = await api<{ BookingPage: { ID: string }; Code: number }>(
                createBookingPage({ ...apiPayload, CalendarID: selectedCalendar.ID })
            );

            dispatch(
                interalBookingActions.addBookingPage({
                    id: response.BookingPage.ID,
                    bookingUID: data.BookingUID,
                    calendarID: selectedCalendar.ID,
                    summary: formData.summary,
                    description: formData?.description,
                    location: formData?.location,
                    withProtonMeetLink: formData.location === BookingLocation.MEET,
                    link: bookingLink,
                })
            );

            notify({
                type: ModalType.BookingPageCreation,
                value: {
                    bookingLink,
                    onClose: () => {
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
        canCreateBooking: writeableCalendars.length > 0,
        isBookingActive: bookingsState === BookingState.CREATE_NEW || bookingsState === BookingState.EDIT_EXISTING,
        openBookingSidebar,
        closeBookingSidebar,
        formData,
        updateFormData,
        submitForm,
        loading,
        // Range management
        bookingRange,
        addBookingRange,
        updateBookingRange,
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
