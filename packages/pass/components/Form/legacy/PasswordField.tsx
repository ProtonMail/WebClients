/**
 * TODO: this component is still used in the Exporter
 * and the ImportForm components. Disabled password
 * generation on this component for now.. It was used
 * in the Exporter to generate a password for PGP
 * encryption but we can do without for now..
 */
import type { FC } from 'react';

import type { FieldProps } from 'formik';
import type { PolymorphicPropsWithoutRef } from 'packages/react-polymorphic-types';

import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import type { InputFieldOwnProps } from '@proton/components/components/v2/field/InputField';
import PasswordInputTwo from '@proton/components/components/v2/input/PasswordInput';
import { useFieldControl } from '@proton/pass/hooks/useFieldControl';

type PasswordFieldProps = FieldProps & PolymorphicPropsWithoutRef<InputFieldOwnProps, typeof PasswordInputTwo>;

export const PasswordField: FC<PasswordFieldProps> = (fieldProps) => {
    const { field, form, ...rest } = fieldProps;
    const { error } = useFieldControl(fieldProps);

    return (
        <div className="flex flex-nowrap items-end mb-3 w-full">
            <InputFieldTwo dense as={PasswordInputTwo} error={error} {...field} {...rest} />
        </div>
    );
};
