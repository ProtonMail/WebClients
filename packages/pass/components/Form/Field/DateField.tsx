import type { ForwardRefRenderFunction } from 'react';
import { forwardRef, useMemo } from 'react';

import formatISO from 'date-fns/formatISO';
import { type FieldProps } from 'formik';

import { type Input } from '@proton/atoms';
import { DateInputTwo, InputFieldTwo } from '@proton/components';
import { type InputFieldProps } from '@proton/components/components/v2/field/InputField';
import { useFieldControl } from '@proton/pass/hooks/useFieldControl';
import { type Maybe } from '@proton/pass/types/utils';
import clsx from '@proton/utils/clsx';

export type Props = FieldProps<string> & InputFieldProps<typeof Input>;

export const formatDate = (date: Date) => new Intl.DateTimeFormat(navigator.language, { timeZone: 'UTC' }).format(date);

const DateFieldRender: ForwardRefRenderFunction<HTMLInputElement, Props> = (
    { field, form, meta, inputClassName, labelContainerClassName, placeholder, disabled },
    ref
) => {
    const { value, onChange } = field;
    const { error } = useFieldControl({ field, form, meta });

    const dateValue = useMemo<Maybe<Date>>(() => {
        if (value) {
            const date = new Date(value);
            if (isFinite(date.getTime())) return date;
        }
    }, [value]);

    const handleDateChange = (date: Maybe<Date>): void => {
        const stringValue = date ? formatISO(date).split('T')[0] : '';
        onChange?.(stringValue);
    };

    return (
        <InputFieldTwo
            as={DateInputTwo}
            unstyled
            placeholder={placeholder}
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
            toFormatter={formatDate}
        />
    );
};

export const DateField = forwardRef(DateFieldRender);
