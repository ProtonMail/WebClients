import React, { useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { activateOrganizationKey, getOrganizationBackupKeys } from 'proton-shared/lib/api/organization';
import {
    useCache,
    useLoading,
    useNotifications,
    useAuthenticationStore,
    useApi,
    FormModal,
    LearnMore,
    Alert,
    Row,
    Label,
    Field,
    PasswordInput
} from 'react-components';
import { encryptPrivateKey } from 'pmcrypto';

import { decryptArmoredKey } from '../keys/reactivateKeys/ReactivateKeysModal';

const ReactivateOrganizationKeysModal = ({ onClose, mode, ...rest }) => {
    const cache = useCache();
    const { createNotification } = useNotifications();
    const authenticationStore = useAuthenticationStore();
    const api = useApi();

    const [loading, withLoading] = useLoading();
    const [backupPassword, setBackupPassword] = useState('');
    const [error, setError] = useState('');

    const { title, message, warning, success } = (() => {
        if (mode === 'activate') {
            return {
                title: c('Title').t`Activate organization key`,
                message: c('Info')
                    .t`You must activate your organization private key with the backup organization key password provided to you by your organization administrator.`,
                warning: c('Info')
                    .t`Without activation you will not be able to create new users, add addresses to existing users, or access non-private user accounts.`,
                success: c('Info').t`Organization keys activated`
            };
        }

        if (mode === 'reactivate') {
            const learnMore = (
                <LearnMore key={1} url="https://protonmail.com/support/knowledge-base/restore-administrator/" />
            );
            return {
                title: c('Title').t`Restore administrator privileges`,
                message: c('Info')
                    .jt`Enter the Organization Password to restore administrator privileges. ${learnMore}`,
                warning: c('Info')
                    .t`If another administrator changed this password, you will need to ask them for the new Organization Password.`,
                success: c('Info').t`Organization keys restored`
            };
        }

        throw new Error('Invalid mode');
    })();

    const handleSubmit = async () => {
        try {
            setError('');

            const { PrivateKey, KeySalt } = await api(getOrganizationBackupKeys());
            const decryptedPrivateKey = await decryptArmoredKey({
                armoredPrivateKey: PrivateKey,
                password: backupPassword,
                keySalt: KeySalt
            });
            const armoredPrivateKey = await encryptPrivateKey(decryptedPrivateKey, authenticationStore.getPassword());
            await api(activateOrganizationKey(armoredPrivateKey));

            // Warning: Since there is no event for this, the organization key cache is reset.
            cache.set('ORGANIZATION_KEY', { ...cache.get('ORGANIZATION_KEY'), value: decryptedPrivateKey });

            createNotification({ text: success });
            onClose();
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
                        onChange={({ target: { value } }) => setBackupPassword(value)}
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

ReactivateOrganizationKeysModal.propTypes = {
    onClose: PropTypes.func,
    mode: PropTypes.oneOf(['activate', 'reactivate']).isRequired
};

export default ReactivateOrganizationKeysModal;
