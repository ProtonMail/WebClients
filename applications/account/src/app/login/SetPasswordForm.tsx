import type { ReactNode } from 'react';
import { useState } from 'react';

import { Button } from '@proton/atoms';
import { InputFieldTwo, PasswordInputTwo, useFormErrors } from '@proton/components';
import { useLoading } from '@proton/hooks';
import {
    confirmPasswordValidator,
    getMinPasswordLengthMessage,
    passwordLengthValidator,
    requiredValidator,
} from '@proton/shared/lib/helpers/formValidators';
import noop from '@proton/utils/noop';

import { getBackupPasswordFormLabels, getPasswordFormLabels } from './passwordFormHelper';

interface Props {
    onSubmit: (newPassword: string) => Promise<void>;
    children?: ReactNode;
    type?: 'backup';
}

const SetPasswordForm = ({ onSubmit, children, type }: Props) => {
    const [loading, withLoading] = useLoading();
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const { validator, onFormSubmit } = useFormErrors();

    const formLabels = type === 'backup' ? getBackupPasswordFormLabels() : getPasswordFormLabels();

    return (
        <form
            name={formLabels.formName}
            onSubmit={(event) => {
                event.preventDefault();
                if (loading || !onFormSubmit()) {
                    return;
                }
                withLoading(onSubmit(newPassword)).catch(noop);
            }}
            method="post"
        >
            {children}
            <InputFieldTwo
                as={PasswordInputTwo}
                id="password"
                bigger
                label={formLabels.passwordLabel}
                assistiveText={getMinPasswordLengthMessage()}
                error={validator([requiredValidator(newPassword), passwordLengthValidator(newPassword)])}
                disableChange={loading}
                autoFocus
                autoComplete="new-password"
                value={newPassword}
                onValue={setNewPassword}
                rootClassName="mb-2"
            />
            <InputFieldTwo
                as={PasswordInputTwo}
                id="password-repeat"
                bigger
                label={formLabels.confirmPasswordLabel}
                error={validator([
                    requiredValidator(confirmNewPassword),
                    confirmPasswordValidator(confirmNewPassword, newPassword),
                ])}
                disableChange={loading}
                autoComplete="new-password"
                value={confirmNewPassword}
                onValue={setConfirmNewPassword}
            />
            <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt-6">
                {formLabels.cta}
            </Button>
        </form>
    );
};

export default SetPasswordForm;
