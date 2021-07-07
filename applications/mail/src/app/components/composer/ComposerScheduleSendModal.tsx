import React, { useState, useMemo } from 'react';
import {
    addDays,
    addMinutes,
    addSeconds,
    getHours,
    getMinutes,
    isToday,
    isTomorrow,
    format,
    getUnixTime,
    Locale,
    startOfToday,
    endOfDay,
} from 'date-fns';
import { c } from 'ttag';
import { Alert, DateInput, generateUID, Label, TimeInput } from '@proton/components';

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
    onClose: () => void;
    onSubmit: (date: Date) => void;
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
        console.log({
            DeliveryTime: getUnixTime(scheduleDateTime),
        });

        onSubmit(scheduleDateTime);
        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    const minDate = startOfToday();
    const maxDate = addDays(minDate, 30);

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

    const disabled = useMemo(() => {
        const min = addSeconds(new Date(), 120);
        return !date || !time || scheduleDateTime < min || scheduleDateTime > endOfDay(maxDate);
    }, [date, time, scheduleDateTime, minDate, maxDate]);

    return (
        <ComposerInnerModal
            title={c('Title').t`Schedule send`}
            disabled={disabled}
            submit={c('Action').t`Schedule send`}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
        >
            {/* @todo update learn more link */}
            <Alert learnMore="https://protonmail.com/support/knowledge-base/">
                {c('Info').t`Your email will be sent at a time defined below.`}
            </Alert>

            <div className="flex flex-nowrap mt2 flex-align-items-center on-mobile-flex-column">
                <Label htmlFor={`composer-schedule-date-${uid}`}>{c('Label').t`Date`}</Label>
                <DateInput
                    id={`composer-schedule-date-${uid}`}
                    onChange={handleChangeDate}
                    value={date}
                    min={minDate}
                    max={maxDate}
                    customInputFormat={formatDateInput}
                />
            </div>

            <div className="flex flex-nowrap mt2 flex-align-items-center on-mobile-flex-column">
                <Label htmlFor={`composer-schedule-time-${uid}`}>{c('Label').t`Time`}</Label>
                <TimeInput
                    id={`composer-schedule-time-${uid}`}
                    onChange={handleChangeTime}
                    value={time}
                    min={getMinTime()}
                    max={isToday(date) ? endOfDay(new Date()) : undefined}
                />
            </div>
        </ComposerInnerModal>
    );
};

export default ComposerScheduleSendModal;
