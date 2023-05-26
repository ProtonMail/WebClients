import { type VFC, useCallback } from 'react';

import { PasswordGeneratorButton } from '../PasswordGenerator/PasswordGeneratorButton';
import { FieldBox } from './Layout/FieldBox';
import { BaseMaskedTextField, type TextFieldProps } from './TextField';

export const PasswordField: VFC<TextFieldProps> = (props) => {
    const { actionsContainerClassName, className, icon, field, form, ...rest } = props;

    const handlePasswordGeneratorDone = useCallback(
        (password: string) => form.setFieldValue(field.name, password),
        [form, field.name]
    );

    const actions =
        rest.actions !== null ? (
            <PasswordGeneratorButton key="password-generator-button" onSubmit={handlePasswordGeneratorDone} />
        ) : undefined;

    return (
        <FieldBox
            actions={actions}
            actionsContainerClassName={actionsContainerClassName}
            className={className}
            icon={icon}
        >
            <BaseMaskedTextField field={field} form={form} {...rest} />
        </FieldBox>
    );
};
