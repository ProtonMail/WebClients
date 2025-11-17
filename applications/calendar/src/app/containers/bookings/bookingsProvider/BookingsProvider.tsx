import { createContext, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { areIntervalsOverlapping, isBefore, isWithinInterval } from 'date-fns';
import { c } from 'ttag';

import { useUserSettings } from '@proton/account/index';
import { useReadCalendarBootstrap } from '@proton/calendar/calendarBootstrap/hooks';
import { useGetCalendarKeys } from '@proton/calendar/calendarBootstrap/keys';
import { useCalendarUserSettings } from '@proton/calendar/calendarUserSettings/hooks';
import { useWriteableCalendars } from '@proton/calendar/calendars/hooks';
import useApi from '@proton/components/hooks/useApi';
import { useGetAddressKeysByUsage } from '@proton/components/hooks/useGetAddressKeysByUsage';
import useNotifications from '@proton/components/hooks/useNotifications';
import { createBookingPage } from '@proton/shared/lib/api/calendarBookings';
import { getPreferredActiveWritableCalendar } from '@proton/shared/lib/calendar/calendar';
import { getTimezone } from '@proton/shared/lib/date/timezone';

import { useCalendarDispatch } from '../../../store/hooks';
import { interalBookingActions } from '../../../store/internalBooking/interalBookingSlice';
import { useCalendarGlobalModals } from '../../GlobalModals/GlobalModalProvider';
import { ModalType } from '../../GlobalModals/interface';
import { encryptBookingPage } from '../utils/bookingCryptoUtils';
import { hasBookingFormChanged } from '../utils/bookingFormStateHelpers';
import {
    generateBookingRangeID,
    generateDefaultBookingRange,
    generateSlotsFromRange,
    roundToNextHalfHour,
    validateBookingRange,
} from '../utils/bookingHelpers';
import type { BookingRange, BookingsContextValue, Intersection, Slot } from './interface';
import { type BookingFormData, BookingLocation, BookingState, DEFAULT_EVENT_DURATION } from './interface';

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
    bookingRanges: BookingRange[];
}

const BookingsContext = createContext<BookingsContextValue | undefined>(undefined);

export const BookingsProvider = ({ children }: { children: ReactNode }) => {
    const [bookingsState, setBookingsState] = useState<BookingState>(BookingState.OFF);
    const [loading, setLoading] = useState(false);

    const [userSettings] = useUserSettings();
    const [bookingRanges, setBookingRanges] = useState<BookingRange[] | null>(null);
    const intersectionRef = useRef<Intersection | null>(null);

    const api = useApi();
    const { notify } = useCalendarGlobalModals();

    const [writeableCalendars = []] = useWriteableCalendars();
    const [calendarUserSettings] = useCalendarUserSettings();

    const preferredWritableCal = getPreferredActiveWritableCalendar(
        writeableCalendars,
        calendarUserSettings?.DefaultCalendarID
    );
    const readCalendarBootstrap = useReadCalendarBootstrap();

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
        const bookingRanges = generateDefaultBookingRange(userSettings, currentUTCDate, timezone, false);
        const bookingSlots = bookingRanges
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

        const defaultCalendarID = preferredWritableCal?.ID || writeableCalendars[0].ID;
        const calendarBootstrap = readCalendarBootstrap(defaultCalendarID);

        // Set the initial form data
        newFormData.bookingSlots = bookingSlots;
        newFormData.timezone = timezone;
        newFormData.duration = calendarBootstrap?.CalendarSettings.DefaultEventDuration || DEFAULT_EVENT_DURATION;
        newFormData.selectedCalendar = defaultCalendarID;

        setBookingRanges(bookingRanges);
        setFormData(newFormData);
        initialFormData.current = { formData: newFormData, bookingRanges };
    };

    const recomputeBookingSlots = (newDuration: number) => {
        const newSlots: Slot[] = [];
        bookingRanges?.forEach((range) => {
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

        // We update the duration of the form when the user changes the calendar and the duration was not changed before
        if (field === 'selectedCalendar' && formData.duration === initialFormData.current?.formData.duration) {
            const calBootstrap = readCalendarBootstrap(value);
            if (!calBootstrap || calBootstrap.CalendarSettings.DefaultEventDuration === formData.duration) {
                return;
            }

            updateFormData('duration', calBootstrap?.CalendarSettings.DefaultEventDuration);
        }

        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const updateBookingRange = (oldRangeId: string, start: Date, end: Date) => {
        const range = bookingRanges?.find((range) => range.id === oldRangeId);
        if (!range || !bookingRanges) {
            throw new Error(`Booking range with id ${oldRangeId} not found or no bookingRange`);
        }

        const newRangeId = generateBookingRangeID(start, end);
        const validateNewRange = validateBookingRange({
            newRangeId,
            start,
            end,
            existingRanges: bookingRanges,
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

        const newBookingRange = bookingRanges
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

        setBookingRanges(newBookingRange);
        setFormData(newFormData);
    };

    const removeBookingRange = (id: string) => {
        setBookingRanges((prev) => prev?.filter((range) => range.id !== id) || null);
        setFormData((prev) => ({
            ...prev,
            // Remove all the slots associated with the removed range
            bookingSlots: prev.bookingSlots.filter((slot) => slot.rangeID !== id),
        }));
    };

    const addBookingRange = (data: Omit<BookingRange, 'id'>) => {
        const now = new Date();

        // If we drag past the current time, we round to the next half hour
        const dateStart = isBefore(data.start, now) ? roundToNextHalfHour(now) : data.start;
        const start = intersectionRef.current?.start || dateStart;
        const end = intersectionRef.current?.end || data.end;

        if (isBefore(start, now)) {
            createNotification({ text: c('Info').t`Booking cannot be added in the past.` });
            return;
        }

        // We store the start and end time of the range for quick comparsion
        const dataId = generateBookingRangeID(start, end);
        const validateNewRange = validateBookingRange({
            newRangeId: dataId,
            start: start,
            end: end,
            existingRanges: bookingRanges || [],
        });
        if (validateNewRange) {
            createNotification({ text: validateNewRange });
            return;
        }

        const newBookingRange = [
            ...(bookingRanges || []),
            {
                id: dataId,
                start,
                end,
                timezone: data.timezone,
            },
        ].sort((a, b) => a.start.getTime() - b.start.getTime());

        const newSlots = generateSlotsFromRange({
            rangeID: dataId,
            start: start,
            end: end,
            duration: formData.duration,
            timezone: data.timezone,
        });

        const newFormData = formData;
        formData.bookingSlots = [...formData.bookingSlots, ...newSlots];

        setBookingRanges(newBookingRange);
        setFormData(newFormData);
        intersectionRef.current = null;
    };

    const openBookingSidebar = (currentDate: Date) => {
        initializeFormData(currentDate);
        setBookingsState(BookingState.CREATE_NEW);
    };

    const closeBookingSidebar = () => {
        const formWasTouched = hasBookingFormChanged({
            currentFormData: formData,
            currentBookingRanges: bookingRanges,
            initialFormData: initialFormData.current?.formData,
            initialBookingRanges: initialFormData.current?.bookingRanges,
        });

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

    const isIntersectingBookingRange = (start: Date, end: Date) => {
        const intersection = bookingRanges?.find((range) => {
            return areIntervalsOverlapping({ start, end }, { start: range.start, end: range.end });
        });

        if (!intersection) {
            return false;
        }

        if (!intersectionRef.current) {
            // The intersection is happening at the end of a range
            if (isWithinInterval(start, intersection)) {
                intersectionRef.current = { start: intersection.end, end };
            }

            // The intersection is happening at the start of a range
            if (isWithinInterval(end, intersection)) {
                intersectionRef.current = { start, end: intersection.start };
            }
        }

        return !!intersection;
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
        bookingRanges,
        addBookingRange,
        updateBookingRange,
        removeBookingRange,
        isIntersectingBookingRange,
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
