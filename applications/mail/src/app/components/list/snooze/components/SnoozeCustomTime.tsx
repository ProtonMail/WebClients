import type { MouseEvent } from 'react';
import { useEffect, useState } from 'react';

import { addDays, endOfToday, fromUnixTime, isToday, set } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import generateUID from '@proton/atoms/generateUID';
import { DateInputTwo, InputFieldTwo, PrimaryButton, TimeInput } from '@proton/components/components';
import { useUserSettings } from '@proton/components/hooks';
import { getWeekStartsOn } from '@proton/shared/lib/settings/helper';

import { getSnoozeTimeFromSnoozeLabel } from 'proton-mail/helpers/snooze';
import type { Element } from 'proton-mail/models/element';

import { getMinScheduleTime } from '../../../../helpers/schedule';
import type { SNOOZE_DURATION } from '../../../../hooks/actions/useSnooze';
import useFutureTimeDate from '../../../../hooks/message/useFutureTimeDate';
import SnoozeHeader from './SnoozeHeader';

interface Props {
    onClose: () => void;
    onLock?: (value: boolean) => void;
    handleSnooze: (event: MouseEvent, duration: SNOOZE_DURATION, snoozeTime: Date) => void;
    element?: Element; // Used to initialize the time on element already snoozed
}

const SnoozeCustomTime = ({ onClose, onLock, handleSnooze, element }: Props) => {
    const [userSettings] = useUserSettings();
    const [uid] = useState(generateUID('snooze-message-modal'));

    useEffect(() => {
        onLock?.(true);
    }, []);

    const elementTime = getSnoozeTimeFromSnoozeLabel(element);

    // default date is the current snooze time if item is already snoozed or the next day at 9:00AM
    const defaultDate = elementTime
        ? fromUnixTime(elementTime)
        : set(addDays(new Date(), 1), { hours: 9, minutes: 0, seconds: 0 });

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
                    data-testid="snooze-time-confirm"
                    disabled={disabled}
                    onClick={(event: MouseEvent) => handleSnooze(event, 'custom', scheduleDateTime)}
                >{c('Action').t`Snooze`}</PrimaryButton>
                <Button onClick={handleClose}>{c('Action').t`Cancel`}</Button>
            </div>
        </div>
    );
};

export default SnoozeCustomTime;
