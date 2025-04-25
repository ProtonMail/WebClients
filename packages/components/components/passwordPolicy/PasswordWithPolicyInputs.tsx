import { type ComponentProps, useRef } from 'react';

import { PasswordPolicySpotlight } from '@proton/components/components/passwordPolicy/index';
import type { PasswordPolicyValidationHookResult } from '@proton/components/components/passwordPolicy/usePasswordPolicyValidation';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import PasswordInputTwo from '@proton/components/components/v2/input/PasswordInput';
import type { FormErrorsHook } from '@proton/components/components/v2/useFormErrors';
import {
    confirmPasswordValidator,
    passwordLengthValidator,
    requiredValidator,
} from '@proton/shared/lib/helpers/formValidators';

interface Props {
    loading?: boolean;
    passwordState: [string, (value: string) => void];
    confirmPasswordState: [string, (value: string) => void];
    formErrors: FormErrorsHook;
    formLabels: { password: string; confirmPassword: string };
    passwordPolicyValidation: PasswordPolicyValidationHookResult;
    bigger?: ComponentProps<typeof InputFieldTwo>['bigger'];
    confirmRootClassName?: string;
    isAboveModal?: ComponentProps<typeof PasswordPolicySpotlight>['isAboveModal'];
    autoFocus?: boolean;
}

const PasswordWithPolicyInputs = ({
    passwordState: [newPassword, setNewPassword],
    confirmPasswordState: [confirmNewPassword, setConfirmNewPassword],
    passwordPolicyValidation,
    formErrors,
    loading,
    formLabels,
    bigger,
    confirmRootClassName,
    isAboveModal,
    autoFocus,
}: Props) => {
    const passwordContainerRef = useRef<HTMLDivElement | null>(null);
    const firstError = passwordPolicyValidation.result.find((result) => !result.valid)?.errorMessage || '';
    return (
        <>
            <PasswordPolicySpotlight
                anchorRef={passwordContainerRef}
                enabled={passwordPolicyValidation.enabled}
                validationResults={passwordPolicyValidation.result}
                wrapper={passwordPolicyValidation}
                password={newPassword}
                isAboveModal={isAboveModal}
            >
                <InputFieldTwo
                    containerRef={passwordContainerRef}
                    as={PasswordInputTwo}
                    id="password"
                    bigger={bigger}
                    label={formLabels.password}
                    error={formErrors.validator([
                        requiredValidator(newPassword),
                        // Don't display the password length error when the password policy validation is active
                        passwordPolicyValidation.enabled ? firstError : passwordLengthValidator(newPassword),
                    ])}
                    disableChange={loading}
                    autoFocus={autoFocus}
                    autoComplete="new-password"
                    value={newPassword}
                    onValue={setNewPassword}
                    onFocus={passwordPolicyValidation.handlers.onInputFocus}
                    onBlur={passwordPolicyValidation.handlers.onInputBlur}
                />
            </PasswordPolicySpotlight>
            <InputFieldTwo
                as={PasswordInputTwo}
                id="password-repeat"
                bigger={bigger}
                label={formLabels.confirmPassword}
                error={formErrors.validator([
                    requiredValidator(confirmNewPassword),
                    confirmPasswordValidator(confirmNewPassword, newPassword),
                ])}
                disableChange={loading}
                autoComplete="new-password"
                value={confirmNewPassword}
                onValue={setConfirmNewPassword}
                rootClassName={confirmRootClassName}
            />
        </>
    );
};

export default PasswordWithPolicyInputs;
