import type { ReactNode } from 'react';
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
    children?: ReactNode;
    type?: 'backup';
}

const getPasswordData = () => {
    return {
        formName: 'setPasswordForm',
        passwordLabel: c('Label').t`New password`,
        confirmPasswordLabel: c('Label').t`Confirm password`,
        cta: c('Action').t`Confirm`,
    };
};

const getBackupPasswordData = () => {
    return {
        formName: 'setBackupPasswordForm',
        passwordLabel: c('Label').t`Backup password`,
        confirmPasswordLabel: c('Label').t`Repeat backup password`,
        cta: c('Action').t`Continue`,
    };
};

const SetPasswordForm = ({ onSubmit, children, type }: Props) => {
    const [loading, withLoading] = useLoading();
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const { validator, onFormSubmit } = useFormErrors();

    const data = type === 'backup' ? getBackupPasswordData() : getPasswordData();

    return (
        <form
            name={data.formName}
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
                label={data.passwordLabel}
                assistiveText={getMinPasswordLengthMessage()}
                error={validator([passwordLengthValidator(newPassword)])}
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
                label={data.confirmPasswordLabel}
                error={validator([
                    passwordLengthValidator(confirmNewPassword),
                    confirmPasswordValidator(confirmNewPassword, newPassword),
                ])}
                disableChange={loading}
                autoComplete="new-password"
                value={confirmNewPassword}
                onValue={setConfirmNewPassword}
            />
            <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt-6">
                {data.cta}
            </Button>
        </form>
    );
};

export default SetPasswordForm;
