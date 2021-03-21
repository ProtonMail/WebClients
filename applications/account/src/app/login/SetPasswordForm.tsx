import { c } from 'ttag';
import React, { useState } from 'react';
import { PasswordInputTwo, Button, useLoading, useFormErrors, InputFieldTwo } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';
import { confirmPasswordValidator, requiredValidator } from 'proton-shared/lib/helpers/formValidators';

import ButtonSpacer from '../public/ButtonSpacer';

interface Props {
    onSubmit: (newPassword: string) => Promise<void>;
}

const SetPasswordForm = ({ onSubmit }: Props) => {
    const [loading, withLoading] = useLoading();
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const { validator, onFormSubmit } = useFormErrors();

    return (
        <form
            name="setPasswordForm"
            className="signup-form"
            onSubmit={(event) => {
                event.preventDefault();
                if (loading || !onFormSubmit()) {
                    return;
                }
                withLoading(onSubmit(newPassword)).catch(noop);
            }}
            method="post"
        >
            <InputFieldTwo
                as={PasswordInputTwo}
                id="password"
                bigger
                label={c('Label').t`New password`}
                error={validator([requiredValidator(newPassword)])}
                disableChange={loading}
                autoFocus
                autoComplete="new-password"
                value={newPassword}
                onValue={setNewPassword}
            />
            <InputFieldTwo
                as={PasswordInputTwo}
                id="password-repeat"
                bigger
                label={c('Label').t`Confirm password`}
                error={validator([
                    requiredValidator(confirmNewPassword),
                    confirmPasswordValidator(confirmNewPassword, newPassword),
                ])}
                disableChange={loading}
                autoComplete="new-password"
                value={confirmNewPassword}
                onValue={setConfirmNewPassword}
            />
            <ButtonSpacer>
                <Button size="large" color="norm" type="submit" fullWidth loading={loading}>
                    {c('Action').t`Confirm`}
                </Button>
            </ButtonSpacer>
        </form>
    );
};

export default SetPasswordForm;
