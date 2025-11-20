import { createContext, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { areIntervalsOverlapping, isWithinInterval } from 'date-fns';

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
import useFlag from '@proton/unleash/useFlag';

import { useCalendarDispatch } from '../../../store/hooks';
import { internalBookingActions } from '../../../store/internalBooking/interalBookingSlice';
import { useCalendarGlobalModals } from '../../GlobalModals/GlobalModalProvider';
import { ModalType } from '../../GlobalModals/interface';
import { encryptBookingPage } from '../utils/crypto/bookingEncryption';
import {
    computeInitialFormData,
    getInitialBookingFormState,
    recomputeSlotsForRanges,
    validateRangeOperation,
    wasBookingFormTouched,
} from '../utils/provider/providerHelper';
import { generateBookingRangeID, generateDefaultBookingRange, getRangeDateStart } from '../utils/range/rangeHelpers';
import type { BookingRange, BookingsContextValue, InternalBookingFrom, Intersection } from './interface';
import { type BookingFormData, BookingLocation, BookingState, DEFAULT_RECURRING } from './interface';

const BookingsContext = createContext<BookingsContextValue | undefined>(undefined);

export const BookingsProvider = ({ children }: { children: ReactNode }) => {
    const api = useApi();
    const dispatch = useCalendarDispatch();
    const { notify } = useCalendarGlobalModals();
    const { createNotification } = useNotifications();

    const [userSettings] = useUserSettings();
    const [calendarUserSettings] = useCalendarUserSettings();
    const [writeableCalendars = []] = useWriteableCalendars();
    const readCalendarBootstrap = useReadCalendarBootstrap();

    const getCalendarKeys = useGetCalendarKeys();
    const getAddressKeysByUsage = useGetAddressKeysByUsage();

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

    const openBookingSidebar = (currentDate: Date) => {
        initializeFormData(currentDate);
        setBookingsState(BookingState.CREATE_NEW);
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
            const selectedCalendar = writeableCalendars.find((cal) => cal.ID === internalForm.selectedCalendar);

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
                internalBookingActions.addBookingPage({
                    id: response.BookingPage.ID,
                    bookingUID: data.BookingUID,
                    calendarID: selectedCalendar.ID,
                    summary: internalForm.summary,
                    description: internalForm?.description,
                    location: internalForm?.location,
                    withProtonMeetLink: internalForm.location === BookingLocation.MEET,
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
