import { useEffect, useMemo, useState } from 'react';

import {
    addDays,
    addSeconds,
    endOfDay,
    format,
    getHours,
    getMinutes,
    isBefore,
    isToday,
    isTomorrow,
    set,
    startOfToday,
} from 'date-fns';
import { c } from 'ttag';

import { FUTURE_MESSAGES_BUFFER } from '../../constants';
import { getMinScheduleTime } from '../../helpers/schedule';

interface Props {
    defaultDate: Date;
    maxDaysAllowed?: number;
    maxDateErrorMessage?: string;
}

const useFutureTimeDate = ({ defaultDate, maxDaysAllowed, maxDateErrorMessage }: Props) => {
    const [date, setDate] = useState(defaultDate);
    const [time, setTime] = useState(defaultDate);
    const [errorTime, setErrorTime] = useState<string>();

    // Refresh error time each second so that the user cannot send a message in the past
    // If we don't refresh it, a user can create a schedule message, select a date in the future.
    // If he waits too much, the sending will still be possible, but the date will become from the past
    // Leading to a not user-friendly error
    useEffect(() => {
        const updateErrorTime = () => {
            /* If the user chose a time (Hour + minutes) before the hour of the actual day, the time input returns the date for the next day
             * Ex : This is Jan, 1 2021 at 9:00AM. The user wants to send the scheduled today at 8:00PM, but in the time input he lets 'AM'
             * => The Time input is returning the date Jan, 2 2021 at 8:00AM
             * From our side we are using hour + minutes from the returned date of the time input to build the date when we want to send the scheduled
             * To check if the user is making an error, we need to compare the Time input value with the current date
             */
            const timeInputDate = startOfToday();
            timeInputDate.setHours(time.getHours(), time.getMinutes());

            // It should be impossible to schedule a message within the next 120s
            const limit = addSeconds(new Date(), FUTURE_MESSAGES_BUFFER);

            // If the scheduled date is in the past or within the next 120s, we need to disable the schedule button
            const isDateToEarly = isToday(date) && timeInputDate <= limit;
            const error = isDateToEarly ? c('Error').t`Choose a date in the future.` : undefined;

            setErrorTime(error);
        };

        const handle = setInterval(updateErrorTime, 1000);
        return () => {
            clearInterval(handle);
        };
    }, [date, time]);

    const minDate = startOfToday();
    const maxDate = maxDaysAllowed ? addDays(minDate, maxDaysAllowed) : undefined;

    const scheduleDateTime = useMemo(() => {
        const tmpDate = date;

        const hours = getHours(time);
        const minutes = getMinutes(time);

        tmpDate.setHours(hours, minutes, 0, 0);

        return tmpDate;
    }, [date, time]);

    const errorDate = useMemo(() => {
        if (date < minDate) {
            return c('Error').t`Choose a date in the future.`;
        }
        if (maxDate && date > maxDate) {
            return maxDateErrorMessage;
        }
        return undefined;
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-A106BB
    }, [date]);

    const disabled = useMemo(() => {
        const min = addSeconds(Date.now(), FUTURE_MESSAGES_BUFFER);
        return !date || !time || scheduleDateTime < min || (maxDate && scheduleDateTime > endOfDay(maxDate));
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-45CF38
    }, [date, time, scheduleDateTime, minDate, maxDate]);

    const handleChangeDate = (selectedDate?: Date) => {
        if (!selectedDate) {
            return;
        }

        // It's possible that the selected time is in the past when changing date to today.
        // In this case, we need to update the time to the next available time
        const newTime = set(selectedDate, { hours: getHours(time), minutes: getMinutes(time) });
        const nextAvailableTime = getMinScheduleTime(newTime);
        if (isToday(selectedDate) && isBefore(selectedDate, new Date()) && nextAvailableTime) {
            setTime(nextAvailableTime);
        }

        setDate(selectedDate);
    };

    const handleChangeTime = (selectedTime: Date) => {
        setTime(selectedTime);
    };

    const formatDateInput = (value: Date, locale: Locale) => {
        if (isToday(value)) {
            return c('Date label').t`Today`;
        }

        if (isTomorrow(value)) {
            return c('Date label').t`Tomorrow`;
        }

        return format(value, 'PP', { locale });
    };

    const updateDateAndTime = (date: Date) => {
        setDate(date);
        setTime(date);
    };

    return {
        date,
        time,
        disabled,
        handleChangeDate,
        handleChangeTime,
        scheduleDateTime,
        minDate,
        maxDate,
        formatDateInput,
        errorDate,
        errorTime,
        updateDateAndTime,
    };
};

export default useFutureTimeDate;
