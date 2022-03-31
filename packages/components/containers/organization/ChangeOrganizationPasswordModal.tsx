import { useState } from 'react';
import { c } from 'ttag';
import { updateBackupKey } from '@proton/shared/lib/api/organization';
import { getBackupKeyData } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';
import { PrivateKeyReference } from '@proton/crypto';
import { confirmPasswordValidator, passwordLengthValidator } from '@proton/shared/lib/helpers/formValidators';
import {
    Alert,
    Form,
    InputFieldTwo,
    ModalProps,
    ModalTwo as Modal,
    ModalTwoHeader as ModalHeader,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    PasswordInputTwo,
    Button,
    useFormErrors,
} from '../../components';
import { useEventManager, useLoading, useModals, useNotifications } from '../../hooks';
import AuthModal from '../password/AuthModal';

interface Props extends ModalProps {
    hasOtherAdmins: boolean;
    organizationKey: PrivateKeyReference;
}
const ChangeOrganizationPasswordModal = ({ hasOtherAdmins, organizationKey, onClose, ...rest }: Props) => {
    const { call } = useEventManager();
    const { createModal } = useModals();
    const [loading, withLoading] = useLoading();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { createNotification } = useNotifications();
    const { validator, onFormSubmit } = useFormErrors();

    const handleSubmit = async () => {
        const { backupKeySalt, backupArmoredPrivateKey } = await getBackupKeyData({
            backupPassword: newPassword,
            organizationKey,
        });
        await new Promise((resolve, reject) => {
            createModal(
                <AuthModal
                    onClose={reject}
                    onSuccess={resolve}
                    config={updateBackupKey({ PrivateKey: backupArmoredPrivateKey, KeySalt: backupKeySalt })}
                />
            );
        });
        await call();

        createNotification({ text: c('Success').t`Password updated` });
        onClose?.();
    };

    const handleClose = loading ? noop : onClose;

    return (
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
                    <div className="mb1">
                        {c('Info')
                            .t`Other administrators exist in your organization, you are responsible for communicating the new password to them.`}
                    </div>
                )}
                <Alert className="mb1" type="warning">
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
    );
};

export default ChangeOrganizationPasswordModal;
