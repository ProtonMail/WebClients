import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { InputFieldTwo, PasswordInputTwo, useFormErrors } from '@proton/components';
import { useLoading } from '@proton/hooks';
import {
    confirmPasswordValidator,
    getMinPasswordLengthMessage,
    passwordLengthValidator,
} from '@proton/shared/lib/helpers/formValidators';
import noop from '@proton/utils/noop';

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
                assistiveText={getMinPasswordLengthMessage()}
                error={validator([passwordLengthValidator(newPassword)])}
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
                    passwordLengthValidator(confirmNewPassword),
                    confirmPasswordValidator(confirmNewPassword, newPassword),
                ])}
                disableChange={loading}
                autoComplete="new-password"
                value={confirmNewPassword}
                onValue={setConfirmNewPassword}
                rootClassName="mt-2"
            />
            <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt-6">
                {c('Action').t`Confirm`}
            </Button>
        </form>
    );
};

export default SetPasswordForm;
