import { addHours, addMinutes, isSameDay, set } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import TimeInput from '@proton/components/components/input/TimeInput';
import { DateInputTwo, useNotifications } from '@proton/components/index';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { isNextDay } from '@proton/shared/lib/date-fns-utc';
import { fromLocalDate, fromUTCDate, toLocalDate, toUTCDate } from '@proton/shared/lib/date/timezone';

import { useBookings } from '../bookingsProvider/BookingsProvider';
import { BookingFormValidationReasons, type BookingRange } from '../bookingsProvider/interface';
import { createBookingRangeNextAvailableTime, validateFormData } from '../utils/bookingHelpers';

export const FormRangeList = () => {
    const { bookingRange, removeBookingRange, updateBookingRange, addBookingRange, formData } = useBookings();
    const validation = validateFormData(formData);

    const { createNotification } = useNotifications();

    if (!bookingRange) {
        return null;
    }

    // We need to convert the local time back to UTC before storing them
    const handleStartChange = (range: BookingRange, start: Date) => {
        const utcStart = toUTCDate(fromLocalDate(start));
        updateBookingRange(range.id, utcStart, range.end);
    };

    // We need to convert the local time back to UTC before storing them
    const handleEndChange = (range: BookingRange, end: Date) => {
        const utcEnd = toUTCDate(fromLocalDate(end));
        updateBookingRange(range.id, range.start, utcEnd);
    };

    // No need to convert the start and end time here as they are already in UTC
    const handleDateChange = (id: string, range: BookingRange, date?: Date) => {
        if (!date) {
            return;
        }

        const newStart = set(date, { hours: range.start.getHours(), minutes: range.start.getMinutes() });
        const newEnd = set(date, { hours: range.end.getHours(), minutes: range.end.getMinutes() });

        updateBookingRange(id, newStart, newEnd);
    };

    const handleAddDateClick = () => {
        if (!formData.timezone) {
            return;
        }

        addBookingRange(createBookingRangeNextAvailableTime(bookingRange, formData.timezone));
    };

    const handlePlusClick = (range: BookingRange) => {
        const lastBookingOfDay = bookingRange
            .filter((r) => isSameDay(r.start, range.start))
            .sort((a, b) => a.start.getTime() - b.start.getTime())
            .at(-1);

        if (!lastBookingOfDay) {
            return;
        }

        const newStart = addHours(lastBookingOfDay.end, 1);
        const newEnd = addHours(lastBookingOfDay.end, 2);

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

    // We need to convert the UTC time of the range to local time for select
    const toLocalDateTime = (date: Date) => {
        return toLocalDate(fromUTCDate(date));
    };

    // TODO handle the cases where the recurring is enabled and adapt the UI
    return (
        <div>
            {bookingRange.map((range) => (
                <div key={range.id} className="flex flex-nowrap gap-6 justify-space-between mb-0.5">
                    <div className="flex items-center gap-0.5">
                        <label htmlFor={`range-date-input-${range.id}`} className="sr-only">{c('label')
                            .t`Date of the booking range`}</label>
                        <DateInputTwo
                            id={`range-date-input-${range.id}`}
                            value={range.start}
                            onChange={(value) => handleDateChange(range.id, range, value)}
                        />
                        <label htmlFor={`range-start-input-${range.id}`} className="sr-only">{c('label')
                            .t`Start time of the booking range`}</label>
                        <TimeInput
                            id={`range-start-time-${range.id}`}
                            value={toLocalDateTime(range.start)}
                            onChange={(value) => handleStartChange(range, value)}
                        />
                        -
                        <label htmlFor={`range-end-time-${range.id}`} className="sr-only">{c('label')
                            .t`End time of the booking range`}</label>
                        <TimeInput
                            id={`range-end-time-${range.id}`}
                            value={toLocalDateTime(range.end)}
                            min={addMinutes(toLocalDateTime(range.start), formData.duration)}
                            onChange={(value) => handleEndChange(range, value)}
                        />
                    </div>
                    <div className="flex flex-nowrap shrink-0">
                        <Button icon shape="ghost" onClick={() => handlePlusClick(range)}>
                            <IcPlus
                                name="plus"
                                className="color-primary"
                                alt={c('Action').t`Split current booking range`}
                            />
                        </Button>
                        <Button icon shape="ghost" onClick={() => removeBookingRange(range.id)}>
                            <IcTrash className="color-weak" alt={c('Action').t`Remove the booking range`} />
                        </Button>
                    </div>
                </div>
            ))}
            <Button
                shape="underline"
                color="norm"
                className="mt-2"
                size="small"
                onClick={handleAddDateClick}
                disabled={validation?.reason === BookingFormValidationReasons.TIME_SLOT_LIMIT}
            >{c('Action').t`Add a date`}</Button>
        </div>
    );
};
