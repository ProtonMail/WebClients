import { type VFC, useCallback, useState } from 'react';

import { pipe } from '@proton/pass/utils/fp';

import type { Props as TextInputControlProps } from '../Controls/TextInputControl';
import { PasswordGeneratorButton } from '../PasswordGenerator/PasswordGeneratorButton';
import { type AbstractFieldProps } from './AbstractField';
import { TextField } from './TextField';

export const PasswordField: VFC<AbstractFieldProps<TextInputControlProps>> = ({ form, field, ...rest }) => {
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
