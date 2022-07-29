import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import {
    addDays,
    addMinutes,
    addSeconds,
    endOfDay,
    endOfToday,
    format,
    getHours,
    getMinutes,
    getUnixTime,
    isToday,
    isTomorrow,
    startOfToday,
} from 'date-fns';
import { c, msgid } from 'ttag';

import { DateInput, ErrorZone, Href, Label, TimeInput, generateUID } from '@proton/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { SCHEDULED_MAX_DATE_DAYS } from '../../../constants';
import { updateScheduled } from '../../../logic/messages/draft/messagesDraftActions';
import { MessageState } from '../../../logic/messages/messagesTypes';
import ComposerInnerModal from './ComposerInnerModal';

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
    message: MessageState;
    onClose: () => void;
    onSubmit: (timestamp: number) => void;
}

const ComposerScheduleSendModal = ({ message, onClose, onSubmit }: Props) => {
    const dispatch = useDispatch();

    const defaultDate =
        message && message.draftFlags?.scheduledAt
            ? new Date(message.draftFlags?.scheduledAt * 1000)
            : addDays(new Date(), 1);

    if (!message || (message && !message.draftFlags?.scheduledAt)) {
        defaultDate.setHours(9, 0, 0, 0);
    }

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

    // Save scheduled date in the cache so that the user can have the date fields completed
    // if he cancel scheduling to re-schedule it later or if he edits the message and re-schedules it
    useEffect(() => {
        dispatch(updateScheduled({ ID: message.localID, scheduledAt: getUnixTime(scheduleDateTime) }));
    }, [scheduleDateTime]);

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
    const maxDate = endOfDay(addDays(minDate, SCHEDULED_MAX_DATE_DAYS));

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
        const min = addSeconds(Date.now(), 120);
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
            <div className="mb1 flex">
                <span>{c('Info').t`When do you want your message to be sent?`}</span>
                <Href className="underline inline-block" url={getKnowledgeBaseUrl('/schedule-email-send')}>{c('Link')
                    .t`Learn more`}</Href>
            </div>
            <div className="flex flex-gap-0-5 flex-row flex">
                <div className="flex-item-fluid flex flex-column flex-nowrap">
                    <Label htmlFor={`composer-schedule-date-${uid}`} className="text-semibold">{c('Label')
                        .t`Date`}</Label>
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
                <div className="flex-item-fluid flex flex-column flex-nowrap">
                    <Label htmlFor={`composer-schedule-time-${uid}`} className="text-semibold">{c('Label')
                        .t`Time`}</Label>
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
