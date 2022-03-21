import { ChangeEvent, useState } from 'react';
import { c } from 'ttag';
import { updateBackupKey } from '@proton/shared/lib/api/organization';
import { getBackupKeyData } from '@proton/shared/lib/keys';
import { noop } from '@proton/shared/lib/helpers/function';
import { OpenPGPKey } from 'pmcrypto';
import {
    Alert,
    Field,
    Form,
    Label,
    ModalProps,
    ModalTwo as Modal,
    ModalTwoHeader as ModalHeader,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    PasswordInput,
    Row,
    Button,
} from '../../components';
import { useEventManager, useLoading, useModals, useNotifications } from '../../hooks';
import AuthModal from '../password/AuthModal';

interface Props extends ModalProps {
    hasOtherAdmins: boolean;
    organizationKey: OpenPGPKey;
}
const ChangeOrganizationPasswordModal = ({ hasOtherAdmins, organizationKey, onClose, ...rest }: Props) => {
    const { call } = useEventManager();
    const { createModal } = useModals();
    const [loading, withLoading] = useLoading();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [confirmError, setConfirmError] = useState('');
    const { createNotification } = useNotifications();

    const handleSubmit = async () => {
        if (confirmPassword !== newPassword) {
            return setConfirmError(c('Error').t`Passwords do not match`);
        }
        setConfirmError('');

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
        <Modal as={Form} onSubmit={() => withLoading(handleSubmit())} onClose={handleClose} {...rest}>
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
                <Row>
                    <Label htmlFor="organizationPassword">{c('Label').t`New organization password`}</Label>
                    <Field>
                        <PasswordInput
                            id="organizationPassword"
                            value={newPassword}
                            onChange={({ target: { value } }: ChangeEvent<HTMLInputElement>) => setNewPassword(value)}
                            error={confirmError}
                            placeholder={c('Placeholder').t`Password`}
                            autoComplete="new-password"
                            required
                        />
                    </Field>
                </Row>
                <Row>
                    <Label htmlFor="confirmPassword">{c('Label').t`Confirm organization password`}</Label>
                    <Field>
                        <PasswordInput
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
                                setConfirmPassword(value)
                            }
                            error={confirmError}
                            placeholder={c('Placeholder').t`Confirm`}
                            autoComplete="new-password"
                            required
                        />
                    </Field>
                </Row>
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
