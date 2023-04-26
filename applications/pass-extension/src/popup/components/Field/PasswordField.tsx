import { type VFC, useCallback, useState } from 'react';

import { pipe } from '@proton/pass/utils/fp';

import { PasswordGeneratorButton } from '../PasswordGenerator/PasswordGeneratorButton';
import { TextField, TextFieldProps } from './TextField';

export const PasswordField: VFC<TextFieldProps> = ({ form, field, ...rest }) => {
    const [masked, setMasked] = useState<boolean>(true);

    const handlePasswordGeneratorDone = useCallback(
        (password: string) => form.setFieldValue(field.name, password),
        [form, field.name]
    );

    const actions =
        rest.actions !== null ? (
            <PasswordGeneratorButton key="password-generator-button" onSubmit={handlePasswordGeneratorDone} />
        ) : undefined;

    return (
        <TextField
            onFocus={() => setMasked(false)}
            onBlur={pipe(field.onBlur, () => setMasked(true))}
            form={form}
            field={field}
            actions={actions}
            {...rest}
            type={masked ? 'password' : 'text'}
        />
    );
};
