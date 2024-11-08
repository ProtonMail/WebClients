import { useMemo, useRef, useState } from 'react';

import { addDays, endOfDay, endOfToday, isBefore, isToday, startOfToday } from 'date-fns';
import { c } from 'ttag';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components';
import {
    DateInput,
    InputFieldTwo,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    TimeInput,
} from '@proton/components';
import { getWeekStartsOn } from '@proton/shared/lib/settings/helper';

import { getMinExpirationTime } from 'proton-mail/helpers/expiration';

import { EXPIRATION_TIME_MAX_DAYS } from '../../../constants';
import { getChooseDateText } from '../../composer/modals/helper';

interface Props extends Omit<ModalProps, 'onSubmit'> {
    onSubmit: (expirationDate: Date) => void;
}

const CustomExpirationModal = ({ onSubmit, ...rest }: Props) => {
    const { onClose } = rest;
    const [userSettings] = useUserSettings();
    const tomorrow = useRef<Date>(addDays(new Date(), 1));
    const minDate = startOfToday();
    const maxDate = endOfDay(addDays(minDate, EXPIRATION_TIME_MAX_DAYS));
    const [date, setDate] = useState<Date>(tomorrow.current);

    const errorDate = useMemo(() => {
        if (date < minDate) {
            return c('Error').t`Choose a date in the future.`;
        }
        if (date > maxDate) {
            // translator : The variable is the number of days, written in digits
            return getChooseDateText(EXPIRATION_TIME_MAX_DAYS);
        }
        return undefined;
    }, [date]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!date) {
            return;
        }

        onSubmit(date);
    };

    const handleDate = (newDate?: Date, keepExistingTime?: boolean) => {
        if (!newDate) {
            return;
        }

        if (isBefore(newDate, startOfToday())) {
            return;
        }

        if (keepExistingTime) {
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const seconds = date.getSeconds();
            newDate.setHours(hours, minutes, seconds);
        }

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
                <div className="mb-4">{c('Info').t`When do you want your message to self-destruct?`}</div>
                <div className="flex gap-2 flex-row flex-nowrap">
                    <InputFieldTwo
                        as={DateInput}
                        id="expiration-date"
                        label={c('Label attach to date input to select a date').t`Date`}
                        onChange={(newDate?: Date) => newDate && handleDate(newDate, true)}
                        value={date}
                        min={minDate}
                        weekStartsOn={getWeekStartsOn({ WeekStart: userSettings.WeekStart })}
                        max={maxDate}
                        error={errorDate}
                        preventValueReset
                        data-testid="message:expiration-date-input"
                        required
                    />
                    <InputFieldTwo
                        as={TimeInput}
                        id="expiration-time"
                        label={c('Label attach to time input to select hours').t`Time`}
                        onChange={handleDate}
                        value={date}
                        min={getMinExpirationTime(date)}
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
