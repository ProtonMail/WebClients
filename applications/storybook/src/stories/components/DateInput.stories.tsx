import React, { useMemo, useState } from 'react';
import { DateInput } from '@proton/components';
import { addDays } from '@proton/shared/lib/date-fns-utc';
import mdx from './DateInput.mdx';

export default {
    component: DateInput,
    title: 'Components / DateInput',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => {
    const currentDate = new Date();
    const [value, setValue] = useState<Date | undefined>(currentDate);

    const handleChange = (change: Date | undefined) => {
        setValue(change);
    };

    const sharedDateInputProps = {
        value,
        onChange: handleChange,
    };

    return (
        <div>
            <DateInput {...sharedDateInputProps} />
        </div>
    );
};

export const WithMinAndMax = () => {
    const currentDate = new Date();
    const [value, setValue] = useState<Date | undefined>(currentDate);
    const min = addDays(currentDate, -3);
    const max = addDays(currentDate, 3);

    const handleChange = (change: Date | undefined) => {
        setValue(change);
    };

    const sharedDateInputProps = {
        value,
        onChange: handleChange,
    };

    return (
        <div>
            <DateInput {...sharedDateInputProps} min={min} max={max} />
        </div>
    );
};

export const WithMinAndMaxAndPreventreset = () => {
    const currentDate = new Date();
    const [value, setValue] = useState<Date | undefined>(currentDate);
    const min = addDays(currentDate, -3);
    const max = addDays(currentDate, 3);

    const handleChange = (change: Date | undefined) => {
        setValue(change);
    };

    const error = useMemo(() => {
        if (value && value < min) {
            return 'Choose a date in the future';
        }
        if (value && value > max) {
            return 'Choose a date in the past';
        }
        return undefined;
    }, [value]);

    const sharedDateInputProps = {
        value,
        onChange: handleChange,
        error,
    };

    return (
        <div>
            <DateInput {...sharedDateInputProps} min={min} max={max} preventValueReset />
        </div>
    );
};
