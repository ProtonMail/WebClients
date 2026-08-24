import { useState } from 'react';

import { c } from 'ttag';

import { changeMemberPassword } from '@proton/account/organizationKey/memberPasswordAction';
import { usePasswordPolicies } from '@proton/account/passwordPolicies/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { revoke } from '@proton/shared/lib/api/auth';
import { authMember } from '@proton/shared/lib/api/members';
import { lockSensitiveSettings } from '@proton/shared/lib/api/user';
import { withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { confirmPasswordValidator, passwordLengthValidator } from '@proton/shared/lib/helpers/formValidators';
import type { Member } from '@proton/shared/lib/interfaces/Member';
import noop from '@proton/utils/noop';

import Form from '../../components/form/Form';
import type { ModalProps } from '../../components/modalTwo/Modal';
import Modal from '../../components/modalTwo/Modal';
import ModalContent from '../../components/modalTwo/ModalContent';
import ModalFooter from '../../components/modalTwo/ModalFooter';
import ModalHeader from '../../components/modalTwo/ModalHeader';
import PasswordWithPolicyInputs from '../../components/passwordPolicy/PasswordWithPolicyInputs';
import { usePasswordPolicyValidation } from '../../components/passwordPolicy/index';
import useFormErrors from '../../components/v2/useFormErrors';
import useBeforeUnload from '../../hooks/useBeforeUnload';
import useErrorHandler from '../../hooks/useErrorHandler';
import useNotifications from '../../hooks/useNotifications';
import { useSilentApi } from '../../hooks/useSilentApi';
import GenericError from '../error/GenericError';
import AuthModal from '../password/AuthModal';

interface Inputs {
    newPassword: string;
    confirmPassword: string;
}

interface Props extends ModalProps {
    member: Member;
}

const ChangeMemberPasswordModal = ({ member, onClose, ...rest }: Props) => {
    const dispatch = useDispatch();
    const silentApi = useSilentApi();
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
