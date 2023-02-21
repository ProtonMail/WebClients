import { useState } from 'react';

import { addDays, endOfDay, endOfToday, isToday, startOfToday } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    DateInput,
    InputFieldTwo,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    TimeInput,
    useUserSettings,
} from '@proton/components';
import { getWeekStartsOn } from '@proton/shared/lib/settings/helper';

import { EXPIRATION_TIME_MAX_DAYS } from '../../../constants';
import { getMinScheduleTime } from '../../../helpers/schedule';

interface Props extends Omit<ModalProps, 'onSubmit'> {
    onSubmit: (expirationDate: Date) => void;
}

const CustomExpirationModal = ({ onSubmit, ...rest }: Props) => {
    const { onClose } = rest;
    const [userSettings] = useUserSettings();
    const tomorrow = addDays(new Date(), 1);
    const minDate = startOfToday();
    const maxDate = endOfDay(addDays(minDate, EXPIRATION_TIME_MAX_DAYS));
    const [date, setDate] = useState<Date>(tomorrow);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!date) {
            return;
        }

        onSubmit(date);
    };

    const handleDate = (newDate?: Date) => {
        if (!newDate) {
            return;
        }
        // keep the time
        newDate.setHours(date.getHours());
        newDate.setMinutes(date.getMinutes());
        setDate(newDate);
    };

    return (
        <ModalTwo
            size="small"
            as="form"
            onReset={onClose}
            onSubmit={handleSubmit}
            data-testid="message-expiration-time:modal"
            {...rest}
        >
            <ModalTwoHeader title={c('Title').t`Self-destruct message`} />
            <ModalTwoContent>
                <div className="mb1">{c('Info').t`When do you want your message to self-destruct?`}</div>
                <div className="flex flex-gap-0-5 flex-row flex-nowrap">
                    <InputFieldTwo
                        as={DateInput}
                        id="expiration-date"
                        label={c('Label').t`Date`}
                        onChange={handleDate}
                        value={date}
                        min={minDate}
                        weekStartsOn={getWeekStartsOn({ WeekStart: userSettings.WeekStart })}
                        max={maxDate}
                        preventValueReset
                        errorZoneClassName="hidden"
                        data-testid="message:expiration-date-input"
                        required
                    />
                    <InputFieldTwo
                        as={TimeInput}
                        id="expiration-time"
                        label={c('Label').t`Time`}
                        onChange={handleDate}
                        value={date}
                        min={getMinScheduleTime(date)}
                        max={isToday(date) ? endOfToday() : undefined}
                        data-testid="message:expiration-time-input"
                        required
                    />
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="reset">{c('Action').t`Cancel`}</Button>
                <Button color="norm" type="submit">{c('Action').t`Self-destruct message`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default CustomExpirationModal;
