import React, { ChangeEvent, useState } from 'react';
import { c } from 'ttag';
import { updateBackupKey } from '@proton/shared/lib/api/organization';
import { getBackupKeyData } from '@proton/shared/lib/keys';
import { OpenPGPKey } from 'pmcrypto';
import { FormModal, Alert, Row, Label, Field, PasswordInput } from '../../components';
import { useEventManager, useLoading, useModals, useNotifications } from '../../hooks';
import AuthModal from '../password/AuthModal';

interface Props {
    onClose?: () => void;
    hasOtherAdmins: boolean;
    organizationKey: OpenPGPKey;
}
const ChangeOrganizationPasswordModal = ({ onClose, hasOtherAdmins, organizationKey, ...rest }: Props) => {
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

        createNotification({ text: c('Success').t`Keys updated` });
        onClose?.();
    };

    return (
        <FormModal
            title={c('Title').t`Change organization password`}
            close={c('Action').t`Close`}
            submit={c('Action').t`Save`}
            onClose={onClose}
            loading={loading}
            onSubmit={() => withLoading(handleSubmit())}
            {...rest}
        >
            {hasOtherAdmins && (
                <Alert>{c('Info')
                    .t`Other administrators exist in your organization, you are responsible for communicating the new password to them.`}</Alert>
            )}
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
                        onChange={({ target: { value } }: ChangeEvent<HTMLInputElement>) => setConfirmPassword(value)}
                        error={confirmError}
                        placeholder={c('Placeholder').t`Confirm`}
                        autoComplete="new-password"
                        required
                    />
                </Field>
            </Row>
            <Alert type="warning">
                {c('Info')
                    .t`Do NOT forget this password. If you forget it, you will not be able to manage your organization.`}
                <br />
                {c('Info').t`Save your password somewhere safe.`}
            </Alert>
        </FormModal>
    );
};

export default ChangeOrganizationPasswordModal;
