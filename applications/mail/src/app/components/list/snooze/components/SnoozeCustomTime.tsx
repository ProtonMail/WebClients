import { MouseEvent, useEffect, useState } from 'react';

import { addDays, endOfToday, isToday, set } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { DateInputTwo, InputFieldTwo, PrimaryButton, TimeInput } from '@proton/components/components';
import { generateUID } from '@proton/components/helpers';
import { useUserSettings } from '@proton/components/hooks';
import { getWeekStartsOn } from '@proton/shared/lib/settings/helper';

import { SNOOZE_DURATION } from 'proton-mail/hooks/actions/useSnooze';

import { getMinScheduleTime } from '../../../../helpers/schedule';
import useFutureTimeDate from '../../../../hooks/message/useFutureTimeDate';
import SnoozeHeader from './SnoozeHeader';

interface Props {
    onClose: () => void;
    onLock?: (value: boolean) => void;
    handleSnooze: (event: MouseEvent, duration: SNOOZE_DURATION, snoozeTime: Date) => void;
}

const SnoozeCustomTime = ({ onClose, onLock, handleSnooze }: Props) => {
    const [userSettings] = useUserSettings();
    const [uid] = useState(generateUID('snooze-message-modal'));

    useEffect(() => {
        onLock?.(true);
    }, []);

    // default date is the next day at 9:00AM
    const defaultDate = set(addDays(new Date(), 1), { hours: 9, minutes: 0, seconds: 0 });
    const {
        date,
        time,
        scheduleDateTime,
        minDate,
        disabled,
        handleChangeDate,
        handleChangeTime,
        formatDateInput,
        errorDate,
        errorTime,
        updateDateAndTime,
    } = useFutureTimeDate({ defaultDate });

    const handleClose = () => {
        updateDateAndTime(defaultDate);
        onLock?.(false);
        onClose();
    };

    return (
        <div className="p-6" data-testid="snooze-custom-duration-form">
            <SnoozeHeader headerClasses="mb-4" />
            <div className="flex gap-2 flex-row flex-nowrap mb-6">
                <InputFieldTwo
                    as={DateInputTwo}
                    id={`snooze-message-${uid}`}
                    label={c('Label').t`Date`}
                    onChange={handleChangeDate}
                    value={date}
                    min={minDate}
                    weekStartsOn={getWeekStartsOn(userSettings)}
                    toFormatter={formatDateInput}
                    preventValueReset
                    error={errorDate}
                    data-testid="snooze-date-input"
                />
                <InputFieldTwo
                    as={TimeInput}
                    id={`snooze-message-${uid}`}
                    label={c('Label').t`Time`}
                    onChange={handleChangeTime}
                    value={time}
                    min={getMinScheduleTime(date)}
                    max={isToday(date) ? endOfToday() : undefined}
                    error={errorTime}
                    data-testid="snooze-time-input"
                />
            </div>
            <div className="flex flex-column gap-2">
                <PrimaryButton
                    disabled={disabled}
                    onClick={(event: MouseEvent) => handleSnooze(event, 'custom', scheduleDateTime)}
                >{c('Action').t`Save`}</PrimaryButton>
                <Button onClick={handleClose}>{c('Action').t`Cancel`}</Button>
            </div>
        </div>
    );
};

export default SnoozeCustomTime;
