import { useState } from 'react';

import { c } from 'ttag';

import { changeMemberPassword } from '@proton/account/organizationKey/memberPasswordAction';
import { usePasswordPolicies } from '@proton/account/passwordPolicies/hooks';
import { Button } from '@proton/atoms/Button/Button';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import { usePasswordPolicyValidation } from '@proton/components/components/passwordPolicy';
import PasswordWithPolicyInputs from '@proton/components/components/passwordPolicy/PasswordWithPolicyInputs';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import AuthModal from '@proton/components/containers/password/AuthModal';
import useApi from '@proton/components/hooks/useApi';
import useBeforeUnload from '@proton/components/hooks/useBeforeUnload';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useDispatch } from '@proton/redux-shared-store';
import { revoke } from '@proton/shared/lib/api/auth';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { authMember } from '@proton/shared/lib/api/members';
import { lockSensitiveSettings } from '@proton/shared/lib/api/user';
import { withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { confirmPasswordValidator, passwordLengthValidator } from '@proton/shared/lib/helpers/formValidators';
import type { Member } from '@proton/shared/lib/interfaces/Member';
import noop from '@proton/utils/noop';

import GenericError from '../error/GenericError';

interface Inputs {
    newPassword: string;
    confirmPassword: string;
}

interface Props extends ModalProps {
    member: Member;
}

const ChangeMemberPasswordModal = ({ member, onClose, ...rest }: Props) => {
    const normalApi = useApi();
    const dispatch = useDispatch();
    const silentApi = getSilentApi(normalApi);
    const [memberAuthData, setMemberAuthData] = useState<{ UID: string }>();
    const handleError = useErrorHandler();

    const { createNotification } = useNotifications();
    const formErrors = useFormErrors();
    const { onFormSubmit } = formErrors;

    const lockAndClose = () => {
        if (memberAuthData?.UID) {
            Promise.all([
                silentApi(withUIDHeaders(memberAuthData.UID, revoke())),
                silentApi(lockSensitiveSettings()),
            ]).catch(noop);
        }
        onClose?.();
    };

    const [inputs, setInputs] = useState<Inputs>({
        newPassword: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState(false);

    useBeforeUnload(loading ? c('Info').t`By leaving now, changes may not be saved` : '');

    const setPartialInput = (object: Partial<Inputs>) => setInputs((oldState) => ({ ...oldState, ...object }));

    const newPasswordError = passwordLengthValidator(inputs.newPassword);
    const confirmPasswordError = confirmPasswordValidator(inputs.newPassword, inputs.confirmPassword);

    const passwordPolicyValidation = usePasswordPolicyValidation(inputs.newPassword, usePasswordPolicies());
    const passwordPolicyError = !passwordPolicyValidation.valid;

    if (!memberAuthData) {
        return (
            <AuthModal
                scope="password"
                config={authMember(member.ID, { Unlock: true })}
                {...rest}
                onCancel={onClose}
                onSuccess={async (result) => {
                    const { response } = result;

                    const data = await response.json();
                    const UID = data?.UID;
                    if (!UID) {
                        throw new Error('Failed to get auth data');
                    }
                    setMemberAuthData({ UID });
                }}
            />
        );
    }

    if (error) {
        const handleClose = () => {
            lockAndClose();
        };
        return (
            <Modal {...rest} onClose={handleClose}>
                <ModalHeader title={c('Title').t`Change password`} />
                <ModalContent>
                    <GenericError />
                </ModalContent>
                <ModalFooter>
                    <div />
                    <Button color="norm" onClick={handleClose}>
                        {c('Action').t`OK`}
                    </Button>
                </ModalFooter>
            </Modal>
        );
    }

    const onSubmit = async () => {
        if (!onFormSubmit()) {
            return;
        }
        if (newPasswordError || confirmPasswordError || passwordPolicyError) {
            return;
        }

        try {
            setLoading(true);

            await dispatch(
                changeMemberPassword({
                    api: silentApi,
                    memberUID: memberAuthData.UID,
                    password: inputs.newPassword,
                    member,
                })
            );

            createNotification({ text: c('Success').t`Password updated` });
            lockAndClose();
        } catch (e: any) {
            handleError(e);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = loading ? noop : lockAndClose;

    const userName = (
        <b key="user" className="text-break">
            {member.Name} ({(member?.Addresses || [])[0]?.Email ?? ''})
        </b>
    );

    return (
        <Modal as={Form} onClose={handleClose} {...rest} onSubmit={onSubmit}>
            <ModalHeader title={c('Title').t`Change password`} />
            <ModalContent>
                <div className="mb-4">{c('Info').jt`Enter new password for user ${userName}.`}</div>

                <PasswordWithPolicyInputs
                    loading={loading}
                    passwordPolicyValidation={passwordPolicyValidation}
                    passwordState={[inputs.newPassword, (value) => setPartialInput({ newPassword: value })]}
                    confirmPasswordState={[
                        inputs.confirmPassword,
                        (value) => setPartialInput({ confirmPassword: value }),
                    ]}
                    formErrors={formErrors}
                    formLabels={{
                        password: c('Label').t`User's new password`,
                        confirmPassword: c('Label').t`Confirm new password`,
                    }}
                    isAboveModal={true}
                    autoFocus={true}
                />
            </ModalContent>
            <ModalFooter>
                <Button onClick={handleClose} disabled={loading}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button loading={loading} type="submit" color="norm">
                    {c('Action').t`Change password`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default ChangeMemberPasswordModal;
