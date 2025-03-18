import type { ForwardRefRenderFunction } from 'react';
import { forwardRef } from 'react';

import formatISO from 'date-fns/formatISO';
import { type FieldProps } from 'formik';

import { type Input } from '@proton/atoms/index';
import { DateInputTwo, InputFieldTwo } from '@proton/components';
import { type InputFieldProps } from '@proton/components/components/v2/field/InputField';
import { type Maybe } from '@proton/pass/types/utils';
import clsx from '@proton/utils/clsx';

import { useFieldControl } from '../../../hooks/useFieldControl';
import { FieldBox, type FieldBoxProps } from './Layout/FieldBox';

export type BaseDateFieldProps = FieldProps & InputFieldProps<typeof Input>;

export const formatDate = (date: Date) => new Intl.DateTimeFormat(navigator.language, { timeZone: 'UTC' }).format(date);

const BaseDateFieldRender: ForwardRefRenderFunction<HTMLInputElement, BaseDateFieldProps> = (
    { field, form, meta, inputClassName, labelContainerClassName, placeholder, disabled },
    ref
) => {
    const { value, onChange } = field;
    const { error } = useFieldControl({ field, form, meta });

    const dateValue: Maybe<Date> = (() => {
        if (!value) return undefined;
        const date = new Date(value);
        if (isFinite(date.getTime())) return date;
        return undefined;
    })();

    const handleDateChange = (date: Date | undefined) => {
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

export const BaseDateField = forwardRef(BaseDateFieldRender);

export type DateFieldProps = FieldBoxProps & BaseDateFieldProps;

export const DateFieldRender: ForwardRefRenderFunction<HTMLInputElement, DateFieldProps> = (
    { actions, actionsContainerClassName, className, icon, ...rest },
    ref
) => {
    return (
        <FieldBox
            actions={actions}
            actionsContainerClassName={actionsContainerClassName}
            className={className}
            icon={icon}
        >
            <BaseDateField {...rest} ref={ref} />
        </FieldBox>
    );
};

export const DateField = forwardRef(DateFieldRender);
