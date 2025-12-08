import { createContext, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { isBefore, set } from 'date-fns';
import { c } from 'ttag';

import { useUserSettings } from '@proton/account/index';
import { useUser } from '@proton/account/user/hooks';
import { useReadCalendarBootstrap } from '@proton/calendar/calendarBootstrap/hooks';
import { useCalendarUserSettings } from '@proton/calendar/calendarUserSettings/hooks';
import { useWriteableCalendars } from '@proton/calendar/calendars/hooks';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import useAllowedProducts from '@proton/components/containers/organization/accessControl/useAllowedProducts';
import useNotifications from '@proton/components/hooks/useNotifications';
import { Product } from '@proton/shared/lib/ProductEnum';
import { getPreferredActiveWritableCalendar } from '@proton/shared/lib/calendar/calendar';
import useFlag from '@proton/unleash/useFlag';

import { splitTimeGridEventsPerDay } from '../../../components/calendar/splitTimeGridEventsPerDay';
import { useCalendarDispatch } from '../../../store/hooks';
import type { BookingPageEditData, InternalBookingPage } from '../../../store/internalBooking/interface';
import { createNewBookingPage, editBookingPage } from '../../../store/internalBooking/internalBookingActions';
import { useCalendarGlobalModals } from '../../GlobalModals/GlobalModalProvider';
import { ModalType } from '../../GlobalModals/interface';
import type { CalendarViewEvent } from '../../calendar/interface';
import type { BookingFormData, BookingRange, BookingsContextValue, Intersection } from '../interface';
import { BookingState, DEFAULT_EVENT_DURATION, DEFAULT_RECURRING, type InternalBookingFrom } from '../interface';
import { BookingsLimitReached } from '../upsells/BookingsLimitReached';
import { UpsellBookings } from '../upsells/UpsellBookings';
import { useBookingUpsell } from '../upsells/useBookingUpsell';
import { BookingErrorMessages } from '../utils/bookingCopy';
import { serializeFormData } from '../utils/form/formHelpers';
import {
    computeEditFormData,
    computeInitialFormData,
    getBookingPageCalendar,
    getInitialBookingFormState,
    recomputeSlotsForRanges,
    validateRangeOperation,
    wasBookingFormTouched,
} from '../utils/provider/providerHelper';
import {
    computeRangeErrors,
    computeRangesErrors,
    convertBookingRangesToCalendarViewEvents,
    generateBookingRangeID,
    generateDefaultBookingRange,
    getIsBookingsIntersection,
    getIsRecurringBookingsIntersection,
    getRangeDateStart,
    normalizeBookingRangeToTimeOfWeek,
    splitMidnightRecurringSpanningRange,
} from '../utils/range/rangeHelpers';

const BookingsContext = createContext<BookingsContextValue | undefined>(undefined);

export const BookingsProvider = ({ children }: { children: ReactNode }) => {
    const dispatch = useCalendarDispatch();
    const { notify } = useCalendarGlobalModals();
    const { createNotification } = useNotifications();

    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const [calendarUserSettings] = useCalendarUserSettings();
    const [writeableCalendars = []] = useWriteableCalendars();
    const readCalendarBootstrap = useReadCalendarBootstrap();

    const [allowedProducts] = useAllowedProducts();

    const [loading, setLoading] = useState(false);
    const [bookingsState, setBookingsState] = useState<BookingState>(BookingState.OFF);

    const isRecurringEnabled = useFlag('RecurringCalendarBookings');
    const isMeetVideoConferenceEnabled = useFlag('NewScheduleOption');

    const canUseMeetLocation = isMeetVideoConferenceEnabled && allowedProducts.has(Product.Meet);

    // Upsell modals
    const { shouldShowLimitModal, loadingLimits } = useBookingUpsell();
    const [upsellModalProps, setUpsellModalOpen, renderUpsellModal] = useModalState();
    const [limitModalProps, setLimitModalOpen, renderLimitModal] = useModalState();

    const intersectionRef = useRef<Intersection | null>(null);
    const initialFormData = useRef<InternalBookingFrom | undefined>(undefined);
    const touchedFormFields = useRef<Set<keyof InternalBookingFrom>>(new Set());

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
            canUseMeetLocation,
        });

        setInternalForm(formData);
        initialFormData.current = formData;
    };

    const updateFormData = (field: keyof InternalBookingFrom, value: any, currentDate?: Date) => {
        let updatedForm = { ...internalForm, [field]: value };

        // Auto-update duration when calendar changes (if user hasn't customized duration)
        if (field === 'selectedCalendar') {
            const calBootstrap = readCalendarBootstrap(value);
            const defaultDuration = calBootstrap?.CalendarSettings.DefaultEventDuration || DEFAULT_EVENT_DURATION;
            if (
                calBootstrap &&
                defaultDuration !== internalForm.duration &&
                !touchedFormFields.current.has('duration')
            ) {
                updatedForm = { ...updatedForm, duration: defaultDuration };
            }
        }

        // We generate the booking ranges each time we toggle the recurring option
        if (field === 'recurring') {
            const date = currentDate || new Date();
            const newRanges = generateDefaultBookingRange(
                userSettings,
                date,
                formData.timezone,
                formData.duration,
                value
            );
            updatedForm = { ...updatedForm, bookingRanges: newRanges };
        }

        if (field === 'duration') {
            const rangeErrorsComputation = computeRangesErrors(internalForm.bookingRanges, value);
            updatedForm = { ...updatedForm, bookingRanges: rangeErrorsComputation };
        }

        touchedFormFields.current.add(field);
        setInternalForm((prev) => ({ ...prev, ...updatedForm }));
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

        // In the recurring scenario, the user can try to add ranges in future weeks
        // To update the new range properly, dates needs to be normalized so that range is added to the current week
        const isRecurring = formData.recurring;
        const normalizedStart = isRecurring ? normalizeBookingRangeToTimeOfWeek(start, userSettings.WeekStart) : start;
        const normalizedEnd = isRecurring ? normalizeBookingRangeToTimeOfWeek(end, userSettings.WeekStart) : end;

        let newBookingRanges;
        // When moving a recurring slot to the end of the week with an overlap to the next day, we need to split it in 2 ranges
        // E.g. when moving a range on Sunday evening, we need it to end at midnight and create one on Monday
        if (isRecurring && isBefore(normalizedEnd, normalizedStart)) {
            const { firstRange, secondRange } = splitMidnightRecurringSpanningRange({
                oldRange,
                normalizedStart,
                normalizedEnd,
                originalStart: start,
            });

            const validationErrorFirstRange = validateRangeOperation({
                operation: 'update',
                start: firstRange.start,
                end: firstRange.end,
                timezone: oldRange.timezone,
                rangeId: firstRange.id,
                existingRanges: internalForm.bookingRanges,
                excludeRangeId: oldRangeId,
                recurring: formData.recurring,
            });
            if (validationErrorFirstRange) {
                createNotification({ text: validationErrorFirstRange });
                return;
            }

            const validationErrorSecondRange = validateRangeOperation({
                operation: 'update',
                start: secondRange.start,
                end: secondRange.end,
                timezone: oldRange.timezone,
                rangeId: secondRange.id,
                existingRanges: internalForm.bookingRanges,
                excludeRangeId: oldRangeId,
                recurring: formData.recurring,
            });

            if (validationErrorSecondRange) {
                createNotification({ text: validationErrorSecondRange });
                return;
            }

            // Add new ranges and remove the old one
            newBookingRanges = [...internalForm.bookingRanges, firstRange, secondRange]
                .filter((range) => range.id !== oldRangeId)
                .sort((a, b) => a.start.getTime() - b.start.getTime());
        } else {
            const updatedRange: BookingRange = {
                id: newRangeId,
                start: normalizedStart,
                end: normalizedEnd,
                timezone: oldRange.timezone,
            };

            newBookingRanges = internalForm.bookingRanges
                .map((range) => (range.id === oldRangeId ? updatedRange : range))
                .sort((a, b) => a.start.getTime() - b.start.getTime());
        }

        setInternalForm((prev) => ({ ...prev, bookingRanges: newBookingRanges }));
    };

    const removeBookingRange = (id: string) => {
        setInternalForm((prev) => ({
            ...prev,
            bookingRanges: prev.bookingRanges.filter((range) => range.id !== id),
        }));
    };

    const addBookingRange = (data: Omit<BookingRange, 'id'>) => {
        const start = intersectionRef.current?.start || getRangeDateStart(formData, data.start, data.timezone);

        const safeEnd = isBefore(data.end, start)
            ? set(data.end, {
                  month: start.getMonth(),
                  date: start.getDate(),
              })
            : data.end;

        const end = intersectionRef.current?.end || safeEnd;

        // In the recurring scenario, the user can try to add ranges in future weeks
        // To add the new range properly, dates needs to be normalized so that range is added to the current week
        const normalizedStart = formData.recurring
            ? normalizeBookingRangeToTimeOfWeek(start, userSettings.WeekStart)
            : start;
        const normalizedEnd = formData.recurring ? normalizeBookingRangeToTimeOfWeek(end, userSettings.WeekStart) : end;

        // Prevent adding timeslots with same start and end (and do not show an error in that case)
        if (normalizedStart.getTime() === normalizedEnd.getTime()) {
            intersectionRef.current = null;
            return;
        }

        const dataId = generateBookingRangeID(normalizedStart, normalizedEnd);

        const validationError = validateRangeOperation({
            operation: 'add',
            start: normalizedStart,
            end: normalizedEnd,
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
            start: normalizedStart,
            end: normalizedEnd,
            timezone: data.timezone,
        };

        const newBookingRanges = [...internalForm.bookingRanges, newRange]
            .sort((a, b) => a.start.getTime() - b.start.getTime())
            .map((range) => computeRangeErrors(range, internalForm.duration));

        setInternalForm((prev) => ({ ...prev, bookingRanges: newBookingRanges }));
        intersectionRef.current = null;
    };

    const openBookingSidebarCreation = (currentDate: Date) => {
        const userReachedBookingLimit = shouldShowLimitModal();

        if (userReachedBookingLimit.booking) {
            setLimitModalOpen(true);
            return;
        }

        if (userReachedBookingLimit.plan) {
            if (user.canPay) {
                setUpsellModalOpen(true);
            } else {
                setLimitModalOpen(true);
            }
            return;
        }

        initializeFormData(currentDate);
        setBookingsState(BookingState.CREATE_NEW);
    };

    const openBookingSidebarEdition = (bookingPage: InternalBookingPage, editData: BookingPageEditData) => {
        const bookingPageCalendar = getBookingPageCalendar({ writeableCalendars, bookingPage });
        if (!bookingPageCalendar) {
            createNotification({ text: BookingErrorMessages.NO_CALENDAR_AVAILABLE });
            return;
        }

        const form = computeEditFormData({
            bookingPageCalendar,
            bookingPage,
            editData,
            canUseMeetLocation,
            calendarUserSettings,
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
                        touchedFormFields.current.clear();
                    },
                },
            });
        } else {
            setBookingsState(BookingState.OFF);
            touchedFormFields.current.clear();
        }
    };

    const isIntersectingBookingRange = (start: Date, end: Date) => {
        if (intersectionRef.current) {
            return true;
        }

        const intersection = formData.recurring
            ? getIsRecurringBookingsIntersection({
                  start,
                  end,
                  bookingRanges: internalForm.bookingRanges,
                  weekStart: userSettings.WeekStart,
              })
            : getIsBookingsIntersection({
                  start,
                  end,
                  bookingRanges: internalForm.bookingRanges,
              });

        intersectionRef.current = intersection;
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

            if (bookingsState === BookingState.EDIT_EXISTING) {
                await dispatch(editBookingPage(serializedFormData));
                createNotification({ text: c('Info').t`Booking updated successfully` });
                setBookingsState(BookingState.OFF);
            }
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const getRangeAsCalendarViewEvents = (utcDate: Date, temporaryEvent?: CalendarViewEvent) => {
        const selectedCalendar = writeableCalendars?.find((calendar) => calendar.ID === formData.selectedCalendar);
        return convertBookingRangesToCalendarViewEvents(selectedCalendar!, formData, utcDate, userSettings)
            .map((event) => {
                if (event.uniqueId === temporaryEvent?.uniqueId) {
                    return temporaryEvent;
                }
                return event;
            })
            .sort((a, b) => a.start.getTime() - b.start.getTime());
    };

    const getRangesAsLayoutEvents = (utcDate: Date, days: Date[], temporaryEvent?: CalendarViewEvent) => {
        return splitTimeGridEventsPerDay({
            events: getRangeAsCalendarViewEvents(utcDate, temporaryEvent),
            min: days[0],
            max: days[days.length - 1],
            totalMinutes: 24 * 60,
        });
    };

    const value: BookingsContextValue = {
        canCreateBooking: writeableCalendars.length > 0 && !loadingLimits,
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

    return (
        <BookingsContext.Provider value={value}>
            {children}
            {renderUpsellModal && <UpsellBookings {...upsellModalProps} />}
            {renderLimitModal && <BookingsLimitReached {...limitModalProps} />}
        </BookingsContext.Provider>
    );
};

export const useBookings = () => {
    const context = useContext(BookingsContext);
    if (context === undefined) {
        throw new Error('useBookings must be used within a BookingsContext');
    }
    return context;
};
