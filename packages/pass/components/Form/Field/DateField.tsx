import type { ForwardRefRenderFunction } from 'react';
import { forwardRef, useMemo } from 'react';

import { type Locale, parse } from 'date-fns';
import { type FieldProps } from 'formik';

import { type Input } from '@proton/atoms';
import { DateInputTwo, InputFieldTwo } from '@proton/components';
import { type InputFieldProps } from '@proton/components/components/v2/field/InputField';
import { type Maybe } from '@proton/pass/types/utils';
import { dateFromYYYYMMDD, formatISODate, formatPlaceholder } from '@proton/pass/utils/time/format';
import clsx from '@proton/utils/clsx';

export type Props = FieldProps<string> & InputFieldProps<typeof Input>;

const DATE_FORMATS = ['PP', 'P'];

const fromFormatter = (value: string, locale: Locale) => {
    const now = new Date();

    for (const format of DATE_FORMATS) {
        try {
            const parsed = parse(value, format, now, { locale });
            if (!isNaN(parsed.getTime())) return parsed;
        } catch {}
    }

    return now;
};

const DateFieldRender: ForwardRefRenderFunction<HTMLInputElement, Props> = (
    { field, inputClassName, labelContainerClassName, placeholder, disabled, error },
    ref
) => {
    const { value, onChange } = field;

    const formattedPlaceholder = useMemo(formatPlaceholder, []);

    const dateValue = useMemo<Maybe<Date>>(() => {
        if (value) return dateFromYYYYMMDD(value);
    }, [value]);

    const handleDateChange = (date: Maybe<Date>): void => {
        const stringValue = date ? formatISODate(date) : '';
        onChange?.(stringValue);
    };

    return (
        <InputFieldTwo
            as={DateInputTwo}
            unstyled
            placeholder={placeholder ?? formattedPlaceholder}
            assistContainerClassName="empty:hidden"
            error={error}
            inputClassName={clsx('p-0 rounded-none', disabled ? 'color-disabled' : 'color-norm', inputClassName)}
            labelContainerClassName={clsx(
                'm-0 text-normal text-sm',
                error ? 'color-danger' : 'color-weak',
                labelContainerClassName
            )}
            onChange={handleDateChange}
            ref={ref}
            value={dateValue}
            fromFormatter={fromFormatter}
        />
    );
};

export const DateField = forwardRef(DateFieldRender);
