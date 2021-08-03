import { useState, useMemo } from 'react';
import {
    addDays,
    addMinutes,
    addSeconds,
    getHours,
    getMinutes,
    isToday,
    getUnixTime,
    format,
    startOfToday,
    endOfDay,
    isTomorrow,
    endOfToday,
} from 'date-fns';
import { c, msgid } from 'ttag';
import { Alert, DateInput, ErrorZone, generateUID, Label, TimeInput } from '@proton/components';

import ComposerInnerModal from './ComposerInnerModal';
import { SCHEDULED_MAX_DATE_DAYS } from '../../constants';

const formatDateInput = (value: Date, locale: Locale) => {
    if (isToday(value)) {
        return c('Date label').t`Today`;
    }

    if (isTomorrow(value)) {
        return c('Date label').t`Tomorrow`;
    }

    return format(value, 'PP', { locale });
};
interface Props {
    onClose: () => void;
    onSubmit: (timestamp: number) => void;
}

const ComposerScheduleSendModal = ({ onClose, onSubmit }: Props) => {
    const defaultDate = addDays(new Date(), 1);
    defaultDate.setHours(9, 0, 0, 0);

    const [date, setDate] = useState(defaultDate);
    const [time, setTime] = useState(defaultDate);

    const [uid] = useState(generateUID('schedule-send-modal'));

    const scheduleDateTime = useMemo(() => {
        const tmpDate = date;

        const hours = getHours(time);
        const minutes = getMinutes(time);

        tmpDate.setHours(hours, minutes, 0, 0);

        return tmpDate;
    }, [date, time]);

    const handleChangeDate = (selectedDate?: Date) => {
        if (!selectedDate) {
            return;
        }
        setDate(selectedDate);
    };

    const handleChangeTime = (selectedTime: Date) => {
        setTime(selectedTime);
    };

    const handleSubmit = () => {
        onSubmit(getUnixTime(scheduleDateTime));
        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    const minDate = startOfToday();
    const maxDate = addDays(minDate, SCHEDULED_MAX_DATE_DAYS);

    const getMinTime = () => {
        if (!isToday(date)) {
            return undefined;
        }

        const now = new Date();
        now.setMinutes(0, 0);

        const limit = addSeconds(now, 120);

        const nextIntervals = Array.from(Array(2)).map((_, i) => addMinutes(now, 30 * (i + 1)));

        return limit <= nextIntervals[0] ? nextIntervals[1] : nextIntervals[0];
    };

    const errorDate = useMemo(() => {
        if (date < minDate) {
            return c('Error').t`Choose a date in the future.`;
        }
        if (date > maxDate) {
            // translator : The variable is the number of days, written in digits
            return c('Error').ngettext(
                msgid`Choose a date within the next ${SCHEDULED_MAX_DATE_DAYS} day.`,
                `Choose a date within the next ${SCHEDULED_MAX_DATE_DAYS} days.`,
                SCHEDULED_MAX_DATE_DAYS
            );
        }
        return undefined;
    }, [date]);

    const errorTime = useMemo(() => {
        /* If the user chose a time (Hour + minutes) before the hour of the actual day, the time input returns the date for the next day
         * Ex : This is Jan, 1 2021 at 9:00AM. The user wants to send the scheduled today at 8:00PM, but in the time input he lets 'AM'
         * => The Time input is returning the date Jan, 2 2021 at 8:00AM
         * From our side we are using hour + minutes from the returned date of the time input to build the date when we want to send the scheduled
         * To check if the user is making an error, we need to compare the Time input value with the current date
         */
        const timeInputDate = startOfToday();
        timeInputDate.setHours(time.getHours(), time.getMinutes());

        return isToday(date) && timeInputDate <= new Date() ? c('Error').t`Choose a date in the future.` : undefined;
    }, [time, date]);

    const disabled = useMemo(() => {
        const min = addSeconds(new Date(), 120);
        return !date || !time || scheduleDateTime < min || scheduleDateTime > endOfDay(maxDate);
    }, [date, time, scheduleDateTime, minDate, maxDate]);

    return (
        <ComposerInnerModal
            title={c('Title').t`Schedule send`}
            disabled={disabled}
            submit={c('Action').t`Schedule message`}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
        >
            <Alert learnMore="https://protonmail.com/support/knowledge-base/schedule-email-send/">
                {c('Info').t`When do you want your message to be sent?`}
            </Alert>

            <div className="flex flex-nowrap mt2 flex-align-items-center on-mobile-flex-column">
                <Label htmlFor={`composer-schedule-date-${uid}`}>{c('Label').t`Date`}</Label>
                <div className="flex-item-fluid">
                    <DateInput
                        id={`composer-schedule-date-${uid}`}
                        onChange={handleChangeDate}
                        value={date}
                        min={minDate}
                        max={maxDate}
                        toFormatter={formatDateInput}
                        preventValueReset
                        error={errorDate}
                        errorZoneClassName="hidden"
                        data-testid="composer:schedule-date-input"
                    />
                    {errorDate && <ErrorZone>{errorDate}</ErrorZone>}
                </div>
            </div>

            <div className="flex flex-nowrap mt2 flex-align-items-center on-mobile-flex-column">
                <Label htmlFor={`composer-schedule-time-${uid}`}>{c('Label').t`Time`}</Label>
                <div className="flex-item-fluid">
                    <TimeInput
                        id={`composer-schedule-time-${uid}`}
                        onChange={handleChangeTime}
                        value={time}
                        min={getMinTime()}
                        max={isToday(date) ? endOfToday() : undefined}
                        error={errorTime}
                        errorZoneClassName="hidden"
                        isSubmitted
                        data-testid="composer:schedule-time-input"
                    />
                    {errorTime && <ErrorZone>{errorTime}</ErrorZone>}
                </div>
            </div>
        </ComposerInnerModal>
    );
};

export default ComposerScheduleSendModal;
