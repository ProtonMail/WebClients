import { useState } from 'react';

import { c } from 'ttag';

import { changeSSOUserBackupPassword } from '@proton/account/sso/passwordActions';
import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components';
import {
    Form,
    InputFieldTwo,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PasswordInputTwo,
    useErrorHandler,
} from '@proton/components';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import {
    confirmPasswordValidator,
    passwordLengthValidator,
    requiredValidator,
} from '@proton/shared/lib/helpers/formValidators';
import { AuthDeviceNonExistingError } from '@proton/shared/lib/keys/device';

import useNotifications from '../../hooks/useNotifications';

interface Props extends ModalProps {}

const ChangeBackupPasswordModal = ({ ...rest }: Props) => {
    const dispatch = useDispatch();
    const { validator, onFormSubmit } = useFormErrors();
    const [loading, withLoading] = useLoading();
    const [newBackupPassword, setNewPassword] = useState('');
    const [confirmBackupPassword, setConfirmBackupPassword] = useState('');
    const handleError = useErrorHandler();
    const { createNotification } = useNotifications();

    return (
        <ModalTwo
            as={Form}
            onClose={rest.onClose}
            {...rest}
            onSubmit={() => {
                if (!onFormSubmit()) {
                    return;
                }
                withLoading(
                    dispatch(changeSSOUserBackupPassword({ newBackupPassword })).catch((e) => {
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
                <InputFieldTwo
                    id="newPassword"
                    label={c('sso').t`New backup password`}
                    error={validator([
                        requiredValidator(newBackupPassword),
                        passwordLengthValidator(newBackupPassword),
                    ])}
                    as={PasswordInputTwo}
                    autoFocus
                    autoComplete="new-password"
                    value={newBackupPassword}
                    onValue={setNewPassword}
                    disabled={loading}
                />

                <InputFieldTwo
                    id="confirmPassword"
                    label={c('sso').t`Confirm backup password`}
                    error={validator([
                        requiredValidator(confirmBackupPassword),
                        passwordLengthValidator(confirmBackupPassword),
                        confirmPasswordValidator(newBackupPassword, confirmBackupPassword),
                    ])}
                    as={PasswordInputTwo}
                    autoComplete="new-password"
                    value={confirmBackupPassword}
                    onValue={setConfirmBackupPassword}
                    disabled={loading}
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
