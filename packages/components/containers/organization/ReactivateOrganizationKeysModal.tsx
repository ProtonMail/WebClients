import React, { ChangeEvent, useState } from 'react';
import { c } from 'ttag';
import { encryptPrivateKey } from 'pmcrypto';

import { activateOrganizationKey, getOrganizationBackupKeys } from '@proton/shared/lib/api/organization';
import { OrganizationModel } from '@proton/shared/lib/models';
import { decryptPrivateKeyWithSalt } from '@proton/shared/lib/keys';
import { FormModal, LearnMore, Alert, Row, Label, Field, PasswordInput } from '../../components';
import { useCache, useLoading, useNotifications, useAuthentication, useEventManager, useApi } from '../../hooks';

export enum MODES {
    ACTIVATE,
    REACTIVATE,
}

interface Props {
    onClose?: () => void;
    mode: MODES;
}
const ReactivateOrganizationKeysModal = ({ onClose, mode, ...rest }: Props) => {
    const cache = useCache();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const authentication = useAuthentication();
    const api = useApi();

    const [loading, withLoading] = useLoading();
    const [backupPassword, setBackupPassword] = useState('');
    const [error, setError] = useState('');

    const { title, message, warning, success } = (() => {
        if (mode === MODES.ACTIVATE) {
            return {
                title: c('Title').t`Activate organization key`,
                message: c('Info')
                    .t`You must activate your organization private key with the backup organization key password provided to you by your organization administrator.`,
                warning: c('Info')
                    .t`Without activation you will not be able to create new users, add addresses to existing users, or access non-private user accounts.`,
                success: c('Info').t`Organization keys activated`,
            };
        }

        if (mode === MODES.REACTIVATE) {
            const learnMore = (
                <LearnMore key={1} url="https://protonmail.com/support/knowledge-base/restore-administrator/" />
            );
            return {
                title: c('Title').t`Restore administrator privileges`,
                message: c('Info')
                    .jt`Enter the Organization Password to restore administrator privileges. ${learnMore}`,
                warning: c('Info')
                    .t`If another administrator changed this password, you will need to ask them for the new Organization Password.`,
                success: c('Info').t`Organization keys restored`,
            };
        }

        throw new Error('Invalid mode');
    })();

    const handleSubmit = async () => {
        try {
            setError('');

            const { PrivateKey, KeySalt } = await api(getOrganizationBackupKeys());
            const decryptedPrivateKey = await decryptPrivateKeyWithSalt({
                PrivateKey,
                password: backupPassword,
                keySalt: KeySalt,
            });
            const armoredPrivateKey = await encryptPrivateKey(decryptedPrivateKey, authentication.getPassword());
            await api(activateOrganizationKey(armoredPrivateKey));
            await call();
            // Warning: The organization model is deleted because there is no event manager notification for when the
            // organization key gets reactivated. Thus the organization is deleted from the cache which would trigger
            // the organizationKeys hook to re-run.
            cache.delete(OrganizationModel.key);

            createNotification({ text: success });
            onClose?.();
        } catch (e) {
            setError(e.message);
        }
    };

    return (
        <FormModal
            title={title}
            close={c('Action').t`Close`}
            submit={c('Action').t`Submit`}
            onClose={onClose}
            loading={loading}
            onSubmit={() => withLoading(handleSubmit())}
            {...rest}
        >
            <Alert>{message}</Alert>
            <Row>
                <Label htmlFor="organizationPassword">{c('Label').t`Organization password`}</Label>
                <Field>
                    <PasswordInput
                        id="organizationPassword"
                        value={backupPassword}
                        onChange={({ target: { value } }: ChangeEvent<HTMLInputElement>) => setBackupPassword(value)}
                        error={error}
                        placeholder={c('Placeholder').t`Password`}
                        autoComplete="off"
                        required
                    />
                </Field>
            </Row>
            <Alert type="warning">{warning}</Alert>
        </FormModal>
    );
};

export default ReactivateOrganizationKeysModal;
