import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import type { PrivateKeyReference } from '@proton/crypto';
import { useLoading } from '@proton/hooks';
import { updateBackupKey } from '@proton/shared/lib/api/organization';
import { confirmPasswordValidator, passwordLengthValidator } from '@proton/shared/lib/helpers/formValidators';
import { getBackupKeyData } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import { InputFieldTwo, PasswordInputTwo, useFormErrors } from '../../components';
import { useEventManager, useNotifications } from '../../hooks';
import AuthModal from '../password/AuthModal';

interface Props extends ModalProps {
    hasOtherAdmins: boolean;
    organizationKey: PrivateKeyReference;
}

const ChangeOrganizationPasswordModal = ({ hasOtherAdmins, organizationKey, onClose, ...rest }: Props) => {
    const { call } = useEventManager();
    const [loadingPromise, withLoading] = useLoading();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { createNotification } = useNotifications();
    const { validator, onFormSubmit } = useFormErrors();
    const [config, setConfig] = useState<any>(undefined);
    const [authModal, setAuthModalOpen, renderAuthModal] = useModalState();

    const handleSubmit = async () => {
        const { backupKeySalt, backupArmoredPrivateKey } = await getBackupKeyData({
            backupPassword: newPassword,
            organizationKey,
        });
        const config = updateBackupKey({ PrivateKey: backupArmoredPrivateKey, KeySalt: backupKeySalt });
        setConfig(config);
        setAuthModalOpen(true);
    };

    const loading = loadingPromise || renderAuthModal;
    const handleClose = loading ? noop : onClose;

    return (
        <>
            {renderAuthModal && config && (
                <AuthModal
                    {...authModal}
                    onCancel={undefined}
                    onSuccess={async () => {
                        await call();
                        createNotification({ text: c('Success').t`Password updated` });
                        onClose?.();
                    }}
                    config={config}
                />
            )}
            <Modal
                as={Form}
                onSubmit={() => {
                    if (!onFormSubmit()) {
                        return;
                    }
                    void withLoading(handleSubmit());
                }}
                onClose={handleClose}
                {...rest}
            >
                <ModalHeader title={c('Title').t`Change organization password`} />
                <ModalContent>
                    {hasOtherAdmins && (
                        <div className="mb-4">
                            {c('Info')
                                .t`Other administrators exist in your organization, you are responsible for communicating the new password to them.`}
                        </div>
                    )}
                    <Alert className="mb-4" type="warning">
                        {c('Info')
                            .t`Do NOT forget this password. If you forget it, you will not be able to manage your organization.`}
                        <br />
                        {c('Info').t`Save your password somewhere safe.`}
                    </Alert>

                    <InputFieldTwo
                        id="organizationPassword"
                        as={PasswordInputTwo}
                        label={c('Label').t`New organization password`}
                        placeholder={c('Placeholder').t`Password`}
                        value={newPassword}
                        onValue={setNewPassword}
                        error={validator([passwordLengthValidator(newPassword)])}
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
                            passwordLengthValidator(newPassword),
                            confirmPasswordValidator(newPassword, confirmPassword),
                        ])}
                        autoComplete="new-password"
                    />
                </ModalContent>
                <ModalFooter>
                    <Button onClick={handleClose} disabled={loading}>
                        {c('Action').t`Close`}
                    </Button>
                    <Button loading={loading} type="submit" color="norm">
                        {c('Action').t`Save`}
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
};

export default ChangeOrganizationPasswordModal;
