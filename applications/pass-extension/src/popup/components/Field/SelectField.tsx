import { type FC } from 'react';

import { type FieldProps } from 'formik';

import { InputFieldTwo, SelectTwo } from '@proton/components';
import { type InputFieldProps } from '@proton/components/components/v2/field/InputField';

import { useFieldControl } from '../../hooks/useFieldControl';
import { FieldBox, type FieldBoxProps } from './Layout/FieldBox';

export type SelectFieldProps = FieldProps &
    InputFieldProps<typeof SelectTwo> &
    Omit<FieldBoxProps, 'actions' | 'actionsContainerClassName'>;

export const SelectField: FC<SelectFieldProps> = ({
    field,
    form,
    meta,
    children,
    icon,
    loading,
    onValue,
    ...props
}) => {
    const { error } = useFieldControl({ field, form, meta });

    return (
        <FieldBox icon={icon}>
            <InputFieldTwo<typeof SelectTwo>
                unstyled
                as={SelectTwo}
                assistContainerClassName="hidden-empty"
                caretIconName="chevron-down"
                error={error}
                labelContainerClassName="increase-click-surface color-weak text-normal text-sm"
                renderSelected={loading ? () => <div className="pass-skeleton pass-skeleton--select" /> : undefined}
                rootClassName="static"
                {...field}
                {...props}
                onChange={undefined}
                onValue={(value: unknown) => {
                    onValue?.(value);
                    form.setFieldValue(field.name, value);
                }}
            >
                {children}
            </InputFieldTwo>
        </FieldBox>
    );
};
