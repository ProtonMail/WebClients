import { type FC, useCallback, useRef } from 'react';

import { PasswordGeneratorButton } from '@proton/pass/components/Password/PasswordGeneratorButton';
import clsx from '@proton/utils/clsx';

import { TextField, type TextFieldProps } from './TextField';

import './PasswordField.scss';

type Props = { onPasswordGenerated?: (password: string) => void } & TextFieldProps;

export const PasswordField: FC<Props> = (props) => {
    const { field, form, onPasswordGenerated, ...rest } = props;
    const passwordFieldRef = useRef<HTMLInputElement>(null);

    const focusPasswordField = () => {
        setTimeout(() => passwordFieldRef.current?.focus(), 300);
    };

    const handlePasswordGeneratorDone = useCallback(
        async (password: string) => {
            onPasswordGenerated?.(password);
            await form.setFieldValue(field.name, password);
            focusPasswordField();
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
            ref={passwordFieldRef}
        />
    );
};
