import { type VFC, useCallback } from 'react';

import { PasswordGeneratorButton } from '../PasswordGenerator/PasswordGeneratorButton';
import { TextField, type TextFieldProps } from './TextField';

export const PasswordField: VFC<TextFieldProps> = (props) => {
    const { field, form, ...rest } = props;

    const handlePasswordGeneratorDone = useCallback(
        (password: string) => form.setFieldValue(field.name, password),
        [form, field.name]
    );

    const actions =
        rest.actions !== null ? (
            <PasswordGeneratorButton key="password-generator-button" onSubmit={handlePasswordGeneratorDone} />
        ) : undefined;

    return <TextField masked field={field} form={form} {...rest} actions={actions} />;
};
