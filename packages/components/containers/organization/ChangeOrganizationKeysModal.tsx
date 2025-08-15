import { useState } from 'react';

import { c } from 'ttag';

import { organizationKeyThunk, rotateOrganizationKeys } from '@proton/account';
import { Button } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import PasswordInputTwo from '@proton/components/components/v2/input/PasswordInput';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import AuthModal from '@proton/components/containers/password/AuthModal';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { CacheType } from '@proton/redux-utilities';
import {
    confirmPasswordValidator,
    passwordLengthValidator,
    requiredValidator,
} from '@proton/shared/lib/helpers/formValidators';
import type { CachedOrganizationKey } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

interface Props extends ModalProps {
    hasOtherAdmins: boolean;
    organizationKey: CachedOrganizationKey;
    mode?: 'reset';
}

const ChangeOrganizationKeysModal = ({ onClose, mode, hasOtherAdmins, organizationKey, ...rest }: Props) => {
    const [authModalProps, setAuthModal, renderAuthModal] = useModalState();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const { validator, onFormSubmit } = useFormErrors();
    const [config, setConfig] = useState<any>();
    const errorHandler = useErrorHandler();

    const [loading, withLoading] = useLoading();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const title =
        mode === 'reset' ? c('passwordless').t`Reset organization key` : c('passwordless').t`Change organization key`;

    const handleClose = loading ? noop : onClose;

    const handleSubmit = async (password: string) => {
        setConfig(undefined);
        const config = await dispatch(rotateOrganizationKeys({ password }));
        setConfig(config);
        setAuthModal(true);
    };

    return (
        <>
            {renderAuthModal && config && (
                <AuthModal
                    scope="password"
                    {...authModalProps}
                    config={config}
                    onCancel={() => {
                        setAuthModal(false);
                    }}
                    onExit={() => setConfig(undefined)}
                    onSuccess={async () => {
                        await dispatch(organizationKeyThunk({ cache: CacheType.None }));
                        createNotification({ text: c('Success').t`Keys updated` });
                        onClose?.();
                    }}
                />
            )}
            <Modal
                as={Form}
                onSubmit={() => {
                    if (!onFormSubmit()) {
                        return;
                    }

                    void withLoading(handleSubmit(newPassword)).catch(errorHandler);
                }}
                onClose={handleClose}
                {...rest}
            >
                <ModalHeader title={title} />
                <ModalContent>
                    <>
                        {hasOtherAdmins && (
                            <Alert className="mb-4">{c('Info')
                                .t`Other administrators exist in your organization, you are responsible for communicating the new password to them.`}</Alert>
                        )}
                        <Alert className="mb-4" type="warning">
                            {c('Info')
                                .t`Do NOT forget this password. If you forget it, you will not be able to manage your organization.`}
                            <br />
                            {c('Info')
                                .t`Save your password somewhere safe. Click on icon to confirm that you have typed your password correctly.`}
                        </Alert>

                        <InputFieldTwo
                            id="organizationPassword"
                            as={PasswordInputTwo}
                            label={c('Label').t`New organization password`}
                            placeholder={c('Placeholder').t`Password`}
                            value={newPassword}
                            onValue={setNewPassword}
                            error={validator([requiredValidator(newPassword), passwordLengthValidator(newPassword)])}
                            autoComplete="new-password"
                            autoFocus
                        />

                        <InputFieldTwo
                            id="confirmPassword"
                            as={PasswordInputTwo}
                            label={c('Label').t`Confirm organization password`}
                            placeholder={c('Placeholder').t`Confirm`}
                            value={confirmPassword}
                            onValue={setConfirmPassword}
                            error={validator([
                                requiredValidator(confirmPassword),
                                confirmPasswordValidator(confirmPassword, newPassword),
                            ])}
                            autoComplete="new-password"
                        />
                    </>
                </ModalContent>
                <ModalFooter>
                    <Button onClick={handleClose} disabled={loading}>
                        {c('Action').t`Close`}
                    </Button>
                    <Button loading={loading} type="submit" color="norm">
                        {c('Action').t`Change keys`}
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
};
export default ChangeOrganizationKeysModal;
