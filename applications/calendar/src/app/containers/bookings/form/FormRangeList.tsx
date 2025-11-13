import { useLocation } from 'react-router';

import { addHours, addMinutes, isBefore, isSameDay, set, startOfDay, startOfToday, subMinutes } from 'date-fns';
import { c } from 'ttag';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Button } from '@proton/atoms/Button/Button';
import TimeInput from '@proton/components/components/input/TimeInput';
import { DateInputTwo, useNotifications } from '@proton/components/index';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { addDays, isNextDay } from '@proton/shared/lib/date-fns-utc';

import { fromUrlParams } from '../../calendar/getUrlHelper';
import { useBookings } from '../bookingsProvider/BookingsProvider';
import { BookingFormValidationReasons, type BookingRange } from '../bookingsProvider/interface';
import { createBookingRangeNextAvailableTime, validateFormData } from '../utils/bookingHelpers';

export const FormRangeList = () => {
    const location = useLocation();
    const [userSettings] = useUserSettings();

    const { bookingRange, removeBookingRange, updateBookingRange, addBookingRange, formData } = useBookings();
    const validation = validateFormData(formData);

    const { createNotification } = useNotifications();

    if (!bookingRange) {
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
        if (!formData.timezone) {
            return;
        }

        const { date } = fromUrlParams(location.pathname);
        addBookingRange(
            createBookingRangeNextAvailableTime({
                bookingRange,
                userSettings,
                timezone: formData.timezone,
                startDate: date,
            })
        );
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
                            min={startOfToday()}
                            onChange={(value) => handleDateChange(range.id, range, value)}
                        />
                        <label htmlFor={`range-start-input-${range.id}`} className="sr-only">{c('label')
                            .t`Start time of the booking range`}</label>
                        <TimeInput
                            id={`range-start-time-${range.id}`}
                            value={range.start}
                            onChange={(value) => handleStartChange(range, value)}
                            min={startOfDay(range.start)}
                            max={subMinutes(range.end, formData.duration)}
                        />
                        -
                        <label htmlFor={`range-end-time-${range.id}`} className="sr-only">{c('label')
                            .t`End time of the booking range`}</label>
                        <TimeInput
                            id={`range-end-time-${range.id}`}
                            value={range.end}
                            min={addMinutes(range.start, formData.duration)}
                            onChange={(value) => handleEndChange(range, value)}
                            preventNextDayOverflow
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
