import { useState } from 'react';
import { fromUnixTime, getUnixTime, getYear, getMonth, getDate, getHours, getMinutes } from 'date-fns';
import { DateInput, TimeInput } from '@proton/components';
import { c } from 'ttag';

interface Props {
    expiration: number | null;
    handleExpirationChange: (exp: number) => void;
    disabled?: boolean;
    allowTime?: boolean;
}

const getMaxDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 90);
    return date;
};

const ExpirationTimeDatePicker = ({ expiration, handleExpirationChange, disabled, allowTime }: Props) => {
    const initialValue = expiration ? fromUnixTime(expiration) : undefined;
    const [expDate, setExpDate] = useState<Date | undefined>(initialValue);
    const [expTime, setExpTime] = useState<Date | undefined>(initialValue);

    const MIN_DATE = new Date();
    const date = getMaxDate();
    const MAX_DATE = date;

    const [maxTime, setMaxTime] = useState<Date | undefined>(expTime ? date : undefined);

    const handleChangeDate = (value: Date | undefined) => {
        if (value) {
            setExpDate(value);

            const year = getYear(value);
            const month = getMonth(value);
            const day = getDate(value);

            if (!expTime) {
                setExpTime(value);
            }

            if (year === getYear(MAX_DATE) && month === getMonth(MAX_DATE) && day === getDate(MAX_DATE)) {
                const date = getMaxDate();
                setMaxTime(date);
                setExpTime(value);
            } else {
                setMaxTime(undefined);
            }

            let tempDate = value;
            if (expiration) {
                tempDate = fromUnixTime(expiration);
                tempDate.setFullYear(year);
                tempDate.setMonth(month);
                tempDate.setDate(day);
            }
            handleExpirationChange(getUnixTime(tempDate));
        }
    };

    const handleChangeTime = (value: Date) => {
        setExpTime(value);

        const hours = getHours(value);
        const minutes = getMinutes(value);

        if (expiration) {
            const tempDate = fromUnixTime(expiration);
            tempDate.setHours(hours);
            tempDate.setMinutes(minutes);
            handleExpirationChange(getUnixTime(tempDate));
        }
    };

    return (
        <>
            <DateInput
                id="epirationDateInputId"
                className="flex-item-fluid flex-item-grow-2"
                disabled={disabled}
                value={expDate}
                onChange={handleChangeDate}
                displayWeekNumbers={false}
                min={MIN_DATE}
                max={MAX_DATE}
                placeholder={c('Title').t`Date`}
                title={c('Title').t`Select link expiration date`}
                data-testid="epirationDateInputId"
            />
            {allowTime && expTime && (
                <TimeInput
                    id="epirationTimeInputId"
                    className="ml0-5 flex-item-fluid"
                    disabled={disabled}
                    value={expTime}
                    onChange={handleChangeTime}
                    max={maxTime}
                    title={c('Title').t`Select link expiration time`}
                    data-testid="epirationTimeInputId"
                />
            )}
        </>
    );
};
export default ExpirationTimeDatePicker;
