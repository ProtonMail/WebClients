import { createContext, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { areIntervalsOverlapping, isWithinInterval } from 'date-fns';

import { useUserSettings } from '@proton/account/index';
import { useReadCalendarBootstrap } from '@proton/calendar/calendarBootstrap/hooks';
import { useCalendarUserSettings } from '@proton/calendar/calendarUserSettings/hooks';
import { useWriteableCalendars } from '@proton/calendar/calendars/hooks';
import useNotifications from '@proton/components/hooks/useNotifications';
import { getPreferredActiveWritableCalendar } from '@proton/shared/lib/calendar/calendar';
import useFlag from '@proton/unleash/useFlag';

import { splitTimeGridEventsPerDay } from '../../../components/calendar/splitTimeGridEventsPerDay';
import { useCalendarDispatch } from '../../../store/hooks';
import type { BookingPageEditData, InternalBookingPage } from '../../../store/internalBooking/interface';
import { createNewBookingPage } from '../../../store/internalBooking/internalBookingActions';
import { useCalendarGlobalModals } from '../../GlobalModals/GlobalModalProvider';
import { ModalType } from '../../GlobalModals/interface';
import { serializeFormData } from '../utils/form/formHelpers';
import {
    computeEditFormData,
    computeInitialFormData,
    getInitialBookingFormState,
    recomputeSlotsForRanges,
    validateRangeOperation,
    wasBookingFormTouched,
} from '../utils/provider/providerHelper';
import {
    convertBookingRangesToCalendarViewEvents,
    generateBookingRangeID,
    generateDefaultBookingRange,
    getRangeDateStart,
} from '../utils/range/rangeHelpers';
import type { BookingRange, BookingsContextValue, InternalBookingFrom, Intersection } from './interface';
import { type BookingFormData, BookingState, DEFAULT_RECURRING } from './interface';

const BookingsContext = createContext<BookingsContextValue | undefined>(undefined);

export const BookingsProvider = ({ children }: { children: ReactNode }) => {
    const dispatch = useCalendarDispatch();
    const { notify } = useCalendarGlobalModals();
    const { createNotification } = useNotifications();

    const [userSettings] = useUserSettings();
    const [calendarUserSettings] = useCalendarUserSettings();
    const [writeableCalendars = []] = useWriteableCalendars();
    const readCalendarBootstrap = useReadCalendarBootstrap();

    const [loading, setLoading] = useState(false);
    const [bookingsState, setBookingsState] = useState<BookingState>(BookingState.OFF);

    const isRecurringEnabled = useFlag('RecurringCalendarBookings');

    const intersectionRef = useRef<Intersection | null>(null);
    const initialFormData = useRef<InternalBookingFrom | undefined>(undefined);

    const [internalForm, setInternalForm] = useState<InternalBookingFrom>(
        getInitialBookingFormState(isRecurringEnabled)
    );

    const bookingSlots = useMemo(() => {
        return recomputeSlotsForRanges(internalForm.bookingRanges, internalForm.duration);
    }, [internalForm.bookingRanges, internalForm.duration]);

    const formData: BookingFormData = useMemo(() => {
        return { ...internalForm, bookingSlots };
    }, [internalForm, bookingSlots]);

    const initializeFormData = (currentUTCDate: Date) => {
        const preferredWritableCal = getPreferredActiveWritableCalendar(
            writeableCalendars,
            calendarUserSettings?.DefaultCalendarID
        );

        const defaultCalendarID = preferredWritableCal?.ID || writeableCalendars[0].ID;
        const calendarBootstrap = readCalendarBootstrap(defaultCalendarID);

        const formData = computeInitialFormData({
            userSettings,
            calendarUserSettings,
            calendarBootstrap,
            currentUTCDate,
            preferredCalendarID: defaultCalendarID,
            recurring: isRecurringEnabled ? DEFAULT_RECURRING : false,
        });

        setInternalForm(formData);
        initialFormData.current = formData;
    };

    const updateFormData = (field: keyof InternalBookingFrom, value: any, currentDate?: Date) => {
        // Auto-update duration when calendar changes (if user hasn't customized duration)
        if (field === 'selectedCalendar') {
            const calBootstrap = readCalendarBootstrap(value);
            if (calBootstrap && calBootstrap.CalendarSettings.DefaultEventDuration !== internalForm.duration) {
                updateFormData('duration', calBootstrap.CalendarSettings.DefaultEventDuration);
            }
        }

        // We generate the booking ranges each time we toggle the recurring option
        if (field === 'recurring') {
            const date = currentDate || new Date();
            const newRanges = generateDefaultBookingRange(userSettings, date, formData.timezone, value);
            updateFormData('bookingRanges', newRanges);
        }

        setInternalForm((prev) => ({ ...prev, [field]: value }));
    };

    const updateBookingRange = (oldRangeId: string, start: Date, end: Date) => {
        const oldRange = internalForm.bookingRanges.find((r) => r.id === oldRangeId);
        if (!oldRange) {
            throw new Error(`Booking range with id ${oldRangeId} not found`);
        }

        const newRangeId = generateBookingRangeID(start, end);
        const validationError = validateRangeOperation({
            operation: 'update',
            start,
            end,
            timezone: oldRange.timezone,
            rangeId: newRangeId,
            existingRanges: internalForm.bookingRanges,
            excludeRangeId: oldRangeId,
            recurring: formData.recurring,
        });

        if (validationError) {
            createNotification({ text: validationError });
            return;
        }

        const updatedRange: BookingRange = {
            id: newRangeId,
            start,
            end,
            timezone: oldRange.timezone,
        };

        const newBookingRanges = internalForm.bookingRanges
            .map((range) => (range.id === oldRangeId ? updatedRange : range))
            .sort((a, b) => a.start.getTime() - b.start.getTime());

        setInternalForm((prev) => ({ ...prev, bookingRanges: newBookingRanges }));
    };

    const removeBookingRange = (id: string) => {
        setInternalForm((prev) => ({
            ...prev,
            bookingRanges: prev.bookingRanges.filter((range) => range.id !== id),
        }));
    };

    const addBookingRange = (data: Omit<BookingRange, 'id'>) => {
        const start = intersectionRef.current?.start || getRangeDateStart(formData, data.start);
        const end = intersectionRef.current?.end || data.end;

        const dataId = generateBookingRangeID(start, end);

        // Validate the operation using pure function
        const validationError = validateRangeOperation({
            operation: 'add',
            start,
            end,
            timezone: data.timezone,
            rangeId: dataId,
            existingRanges: internalForm.bookingRanges,
            recurring: formData.recurring,
        });

        if (validationError) {
            createNotification({ text: validationError });
            intersectionRef.current = null;
            return;
        }

        const newRange: BookingRange = {
            id: dataId,
            start,
            end,
            timezone: data.timezone,
        };

        const newBookingRanges = [...internalForm.bookingRanges, newRange].sort(
            (a, b) => a.start.getTime() - b.start.getTime()
        );

        setInternalForm((prev) => ({ ...prev, bookingRanges: newBookingRanges }));
        intersectionRef.current = null;
    };

    const openBookingSidebarCreation = (currentDate: Date) => {
        initializeFormData(currentDate);
        setBookingsState(BookingState.CREATE_NEW);
    };

    const openBookingSidebarEdition = (bookingPage: InternalBookingPage, editData: BookingPageEditData) => {
        const form = computeEditFormData({
            bookingPage,
            editData,
        });
        setInternalForm(form);
        setBookingsState(BookingState.EDIT_EXISTING);
    };

    const closeBookingSidebar = () => {
        const formWasTouched = wasBookingFormTouched({
            currentFormData: formData,
            initialFormData: initialFormData.current,
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
        const intersection = internalForm.bookingRanges?.find((range) => {
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

            const serializedFormData = serializeFormData(formData);

            if (bookingsState === BookingState.CREATE_NEW) {
                const data = (await dispatch(createNewBookingPage(serializedFormData))) as any;
                if (!data?.payload?.bookingLink) {
                    return;
                }

                notify({
                    type: ModalType.BookingPageCreation,
                    value: {
                        bookingLink: data.payload.bookingLink,
                        onClose: () => {
                            setBookingsState(BookingState.OFF);
                        },
                    },
                });
            }
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const getRangeAsCalendarViewEvents = (utcDate: Date) => {
        const selectedCalendar = writeableCalendars?.find((calendar) => calendar.ID === formData.selectedCalendar);
        return convertBookingRangesToCalendarViewEvents(selectedCalendar!, formData, utcDate);
    };

    const getRangesAsLayoutEvents = (utcDate: Date, days: Date[]) => {
        return splitTimeGridEventsPerDay({
            events: getRangeAsCalendarViewEvents(utcDate),
            min: days[0],
            max: days[days.length - 1],
            totalMinutes: 24 * 60,
        });
    };

    const value: BookingsContextValue = {
        canCreateBooking: writeableCalendars.length > 0,
        isBookingActive: bookingsState === BookingState.CREATE_NEW || bookingsState === BookingState.EDIT_EXISTING,
        bookingsState,
        openBookingSidebarCreation,
        openBookingSidebarEdition,
        closeBookingSidebar,
        formData,
        updateFormData,
        submitForm,
        loading,
        addBookingRange,
        updateBookingRange,
        removeBookingRange,
        isIntersectingBookingRange,
        getRangeAsCalendarViewEvents,
        getRangesAsLayoutEvents,
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
