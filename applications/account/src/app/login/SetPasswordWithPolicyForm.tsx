import type { ReactNode } from 'react';
import { useState } from 'react';

import { Button } from '@proton/atoms/Button/Button';
import { useFormErrors } from '@proton/components';
import { usePasswordPolicyValidation } from '@proton/components/components/passwordPolicy';
import PasswordWithPolicyInputs from '@proton/components/components/passwordPolicy/PasswordWithPolicyInputs';
import useLoading from '@proton/hooks/useLoading';
import type { PasswordPolicies } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import {
    getBackupPasswordFormLabels,
    getChangePasswordFormLabels,
    getCreatePasswordFormLabels,
} from './passwordFormHelper';

type PasswordPolicyFormType = 'backup' | 'create';

interface Props {
    children?: ReactNode;
    type?: PasswordPolicyFormType;
    onSubmit: (data: { password: string }) => Promise<void>;
    passwordPolicies: PasswordPolicies;
}

const getPasswordFormLabels = (type?: PasswordPolicyFormType) => {
    if (type === 'backup') {
        return getBackupPasswordFormLabels();
    } else if (type === 'create') {
        return getCreatePasswordFormLabels();
    } else {
        return getChangePasswordFormLabels();
    }
};

const SetPasswordWithPolicyForm = ({ type, onSubmit, children, passwordPolicies }: Props) => {
    const [loading, withLoading] = useLoading();
    const formErrors = useFormErrors();
    const passwordState = useState('');
    const confirmPasswordState = useState('');

    const [password] = passwordState;
    const passwordPolicyValidation = usePasswordPolicyValidation(password, passwordPolicies);

    const passwordPolicyError = !passwordPolicyValidation.valid;

    const formLabels = getPasswordFormLabels(type);

    return (
        <form
            name="loginForm"
            onSubmit={(event) => {
                event.preventDefault();
                if (!formErrors.onFormSubmit() || passwordPolicyError) {
                    return;
                }
                withLoading(onSubmit({ password })).catch(noop);
            }}
            method="post"
        >
            {children}
            <PasswordWithPolicyInputs
                passwordState={passwordState}
                confirmPasswordState={confirmPasswordState}
                passwordPolicyValidation={passwordPolicyValidation}
                formErrors={formErrors}
                formLabels={{ password: formLabels.passwordLabel, confirmPassword: formLabels.confirmPasswordLabel }}
                bigger
                confirmRootClassName="mt-2"
                autoFocus={true}
            />
            <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt-6">
                {formLabels.cta}
            </Button>
        </form>
    );
};

export default SetPasswordWithPolicyForm;
