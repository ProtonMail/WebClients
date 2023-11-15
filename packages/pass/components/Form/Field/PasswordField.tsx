import { type VFC, useCallback } from 'react';

import { PasswordGeneratorButton } from '@proton/pass/components/PasswordGenerator/PasswordGeneratorButton';
import clsx from '@proton/utils/clsx';

import { TextField, type TextFieldProps } from './TextField';

import './PasswordField.scss';

type Props = { onPasswordGenerated: (password: string) => void } & TextFieldProps;

export const PasswordField: VFC<Props> = (props) => {
    const { field, form, onPasswordGenerated, ...rest } = props;

    const handlePasswordGeneratorDone = useCallback(
        async (password: string) => {
            onPasswordGenerated?.(password);
            await form.setFieldValue(field.name, password);
        },
        [form, field.name, onPasswordGenerated]
    );

    const actions =
        rest.actions !== null ? (
            <PasswordGeneratorButton
                key="password-generator-button"
                onSubmit={handlePasswordGeneratorDone}
                tabIndex={-1}
            />
        ) : undefined;

    return (
        <TextField
            hidden
            field={field}
            form={form}
            {...rest}
            actions={actions}
            inputClassName={clsx('pass-password-field--input text-monospace', rest.inputClassName)}
        />
    );
};
