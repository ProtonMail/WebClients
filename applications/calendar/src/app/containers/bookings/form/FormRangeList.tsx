import { useLocation } from 'react-router';

import { addHours, addMinutes, isBefore, isSameDay, set } from 'date-fns';
import { c } from 'ttag';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Checkbox, Label, useNotifications } from '@proton/components/index';
import { addDays, isNextDay } from '@proton/shared/lib/date-fns-utc';
import useFlag from '@proton/unleash/useFlag';

import { fromUrlParams } from '../../calendar/getUrlHelper';
import { useBookings } from '../bookingsProvider/BookingsProvider';
import { BookingFormValidationReasons, type BookingRange } from '../bookingsProvider/interface';
import { validateFormData } from '../utils/form/formHelpers';
import { createBookingRange, createBookingRangeNextAvailableTime } from '../utils/range/rangeHelpers';
import { DisplayRecurringRanges } from './DisplayRecurringRanges';
import { DisplayRegularRanges } from './DisplayRegularRanges';

export const FormRangeList = () => {
    const location = useLocation();
    const [userSettings] = useUserSettings();

    const { removeBookingRange, updateBookingRange, addBookingRange, formData, updateFormData } = useBookings();
    const validation = validateFormData(formData);

    const { createNotification } = useNotifications();
    const { date } = fromUrlParams(location.pathname);

    const isRecurringEnabled = useFlag('RecurringCalendarBookings');

    if (!formData.bookingRanges) {
        return null;
    }

    const handleStartChange = (range: BookingRange, start: Date) => {
        updateBookingRange(range.id, start, range.end);
    };

    const handleEndChange = (range: BookingRange, end: Date) => {
        let tmpEnd = end;

        // If the end date is midnight, we add one day
        if (end.getHours() === 0) {
            tmpEnd = addDays(end, 1);
        }

        updateBookingRange(range.id, range.start, tmpEnd);
    };

    // No need to convert the start and end time here as they are already in UTC
    const handleDateChange = (id: string, range: BookingRange, date?: Date) => {
        if (!date) {
            return;
        }

        const newStart = set(date, { hours: range.start.getHours(), minutes: range.start.getMinutes() });
        const newEnd = set(date, { hours: range.end.getHours(), minutes: range.end.getMinutes() });

        const now = new Date();
        if (isBefore(newStart, now) || isBefore(newEnd, now)) {
            createNotification({ text: c('Info').t`Cannot create booking range in the past` });
            return;
        }

        updateBookingRange(id, newStart, newEnd);
    };

    const handleAddDateClick = () => {
        addBookingRange(
            createBookingRangeNextAvailableTime({
                bookingRanges: formData.bookingRanges,
                userSettings,
                timezone: formData.timezone,
                startDate: date,
            })
        );
    };

    const handlePlusClick = (range: BookingRange) => {
        const lastBookingOfDay = formData.bookingRanges
            .filter((r) => isSameDay(r.start, range.start))
            .sort((a, b) => a.start.getTime() - b.start.getTime())
            .at(-1);

        if (!lastBookingOfDay) {
            return;
        }

        const newStart = addHours(lastBookingOfDay.end, 1);
        const newEnd = addMinutes(newStart, formData.duration);

        if (isNextDay(lastBookingOfDay.start, newStart)) {
            createNotification({ text: c('Info').t`Cannot create booking range across days` });
            return;
        }

        const newBookingRange = {
            timezone: lastBookingOfDay.timezone,
            start: newStart,
            end: newEnd,
        };

        addBookingRange(newBookingRange);
    };

    const createRangeOnDate = (date: Date) => {
        addBookingRange(createBookingRange(date, formData.timezone));
    };

    return (
        <div>
            {isRecurringEnabled && (
                <div className="flex flex-row items-start mb-3">
                    <Checkbox
                        id="repeat-weekly"
                        className="mt-2 mr-2"
                        checked={formData.recurring}
                        onChange={() => updateFormData('recurring', !formData.recurring, date)}
                    />
                    <Label htmlFor="repeat-weekly" className="flex-1">
                        {c('Label').t`Repeat weekly`}
                    </Label>
                </div>
            )}

            {formData.recurring ? (
                <DisplayRecurringRanges
                    formData={formData}
                    userSettings={userSettings}
                    removeBookingRange={removeBookingRange}
                    onPlusClick={handlePlusClick}
                    onAddRange={createRangeOnDate}
                    onStartChange={handleStartChange}
                    onEndChange={handleEndChange}
                />
            ) : (
                <>
                    <DisplayRegularRanges
                        formData={formData}
                        removeBookingRange={removeBookingRange}
                        onStartChange={handleStartChange}
                        onEndChange={handleEndChange}
                        onDateChange={handleDateChange}
                        onPlusClick={handlePlusClick}
                    />

                    <Button
                        shape="underline"
                        color="norm"
                        className="mt-2"
                        size="small"
                        onClick={() => handleAddDateClick()}
                        disabled={validation?.reason === BookingFormValidationReasons.TIME_SLOT_LIMIT}
                    >{c('Action').t`Add a date`}</Button>
                </>
            )}
        </div>
    );
};
