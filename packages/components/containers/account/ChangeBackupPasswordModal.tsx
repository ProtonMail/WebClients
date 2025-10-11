import { useState } from 'react';

import { c } from 'ttag';

import { usePasswordPolicies } from '@proton/account/passwordPolicies/hooks';
import { changeSSOUserBackupPassword } from '@proton/account/sso/passwordActions';
import { Button } from '@proton/atoms/Button/Button';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { usePasswordPolicyValidation } from '@proton/components/components/passwordPolicy';
import PasswordWithPolicyInputs from '@proton/components/components/passwordPolicy/PasswordWithPolicyInputs';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { AuthDeviceNonExistingError } from '@proton/shared/lib/keys/device';

interface Props extends ModalProps {}

const ChangeBackupPasswordModal = ({ ...rest }: Props) => {
    const dispatch = useDispatch();
    const formErrors = useFormErrors();
    const { onFormSubmit } = formErrors;
    const [loading, withLoading] = useLoading();
    const newBackupPasswordState = useState('');
    const [newBackupPassword] = newBackupPasswordState;
    const confirmPasswordState = useState('');
    const handleError = useErrorHandler();
    const { createNotification } = useNotifications();
    const passwordPolicyValidation = usePasswordPolicyValidation(newBackupPassword, usePasswordPolicies());
    const passwordPolicyError = !passwordPolicyValidation.valid;

    return (
        <ModalTwo
            as={Form}
            onClose={rest.onClose}
            {...rest}
            onSubmit={() => {
                if (!onFormSubmit() || passwordPolicyError) {
                    return;
                }
                withLoading(
                    dispatch(changeSSOUserBackupPassword({ newBackupPassword }))
                        .then(() => {
                            createNotification({ text: c('Success').t`Backup password updated` });
                            rest.onClose?.();
                        })
                        .catch((e) => {
                            if (e instanceof AuthDeviceNonExistingError) {
                                createNotification({
                                    text: c('sso').t`Sign out and in again to change your backup password`,
                                    type: 'error',
                                });
                                return;
                            }
                            handleError(e);
                        })
                );
            }}
        >
            <ModalTwoHeader title={c('sso').t`Change backup password`} />
            <ModalTwoContent>
                <div className="mb-6">
                    {c('Info')
                        .t`${BRAND_NAME}'s encryption technology means that nobody can access your password - not even us.`}
                    <br /> <br />
                    {c('sso')
                        .t`Make sure you save it somewhere safe so that you can get back into your account if you lose access to your Identity Provider credentials.`}
                </div>
                <PasswordWithPolicyInputs
                    passwordState={newBackupPasswordState}
                    confirmPasswordState={confirmPasswordState}
                    passwordPolicyValidation={passwordPolicyValidation}
                    formErrors={formErrors}
                    formLabels={{
                        password: c('sso').t`New backup password`,
                        confirmPassword: c('sso').t`Confirm backup password`,
                    }}
                    loading={loading}
                    isAboveModal={true}
                    autoFocus={true}
                />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>
                <Button loading={loading} type="submit" color="norm">
                    {c('Action').t`Save`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ChangeBackupPasswordModal;
