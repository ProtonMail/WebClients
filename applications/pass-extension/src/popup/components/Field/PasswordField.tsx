import { type VFC, useCallback } from 'react';

import { PasswordGeneratorButton } from '../PasswordGenerator/PasswordGeneratorButton';
import { TextField, type TextFieldProps } from './TextField';

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
            <PasswordGeneratorButton key="password-generator-button" onSubmit={handlePasswordGeneratorDone} />
        ) : undefined;

    return <TextField hidden field={field} form={form} {...rest} actions={actions} />;
};
