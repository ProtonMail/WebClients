import type { ReactNode } from 'react';
import { useState } from 'react';

import { Button } from '@proton/atoms/Button/Button';
import type { ThemeColorUnion } from '@proton/colors/types';
import { usePasswordPolicyValidation } from '@proton/components/components/passwordPolicy';
import PasswordWithPolicyInputs from '@proton/components/components/passwordPolicy/PasswordWithPolicyInputs';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import type { PasswordPolicies } from '@proton/shared/lib/interfaces';

import {
    getBackupPasswordFormLabels,
    getChangePasswordFormLabels,
    getCreatePasswordFormLabels,
} from './passwordFormHelper';

type PasswordPolicyFormType = 'backup' | 'create';

interface Props {
    children?: ReactNode;
    type?: PasswordPolicyFormType;
    onSubmit: (data: { password: string }) => void;
    submitting: boolean;
    passwordPolicies: PasswordPolicies;
    submitButtonColor?: ThemeColorUnion;
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

const SetPasswordWithPolicyForm = ({
    type,
    onSubmit,
    submitting,
    children,
    passwordPolicies,
    submitButtonColor = 'norm',
}: Props) => {
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
                if (submitting || !formErrors.onFormSubmit() || passwordPolicyError) {
                    return;
                }
                onSubmit({ password });
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
            <Button
                size="large"
                color={submitButtonColor}
                type="submit"
                fullWidth
                loading={submitting}
                className="mt-6"
            >
                {formLabels.cta}
            </Button>
        </form>
    );
};

export default SetPasswordWithPolicyForm;
