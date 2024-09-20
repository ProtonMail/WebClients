import { useState } from 'react';

import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { PrivateKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { useLoading } from '@proton/hooks';
import { CacheType } from '@proton/redux-utilities';
import { activateOrganizationKey, getOrganizationBackupKeys } from '@proton/shared/lib/api/organization';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { decryptPrivateKeyWithSalt } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import { InputFieldTwo, PasswordInputTwo, useFormErrors } from '../../components';
import { useApi, useAuthentication, useEventManager, useGetOrganizationKey, useNotifications } from '../../hooks';

interface Props extends ModalProps {
    mode: 'reactivate' | 'activate';
    onResetKeys?: () => void;
}

const ReactivateOrganizationKeysModal = ({ onResetKeys, mode, onClose, ...rest }: Props) => {
    const getOrganizationKey = useGetOrganizationKey();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const authentication = useAuthentication();
    const api = useApi();
    const { validator, onFormSubmit } = useFormErrors();

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
                success: c('passwordless').t`Organization key activated`,
            };
        }

        if (mode === 'reactivate') {
            const learnMore = (
                <Href key={1} href={getKnowledgeBaseUrl('/restore-administrator')}>
                    {c('Link').t`Learn more`}
                </Href>
            );
            return {
                title: c('Title').t`Restore administrator privileges`,
                message: c('Info')
                    .jt`Enter the Organization Password to restore administrator privileges. ${learnMore}`,
                warning: c('Info')
                    .t`If another administrator changed this password, you will need to ask them for the new Organization Password.`,
                success: c('passwordless').t`Organization key restored`,
            };
        }

        throw new Error('Invalid mode');
    })();

    const handleSubmit = async () => {
        try {
            setError('');

            const { PrivateKey, KeySalt } = await api(getOrganizationBackupKeys());
            let decryptedPrivateKey: PrivateKeyReference;

            try {
                decryptedPrivateKey = await decryptPrivateKeyWithSalt({
                    PrivateKey,
                    password: backupPassword,
                    keySalt: KeySalt,
                });
            } catch (e) {
                throw new Error(c('Error').t`Incorrect password`);
            }

            const armoredPrivateKey = await CryptoProxy.exportPrivateKey({
                privateKey: decryptedPrivateKey,
                passphrase: authentication.getPassword(),
            });
            await api(activateOrganizationKey(armoredPrivateKey));
            await call();
            // Warning: Force a refetch of the org key because it's not present in the event manager.
            await getOrganizationKey({ cache: CacheType.None });

            createNotification({ text: success });
            onClose?.();
        } catch (e: any) {
            setError(e.message);
        }
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
            <ModalHeader title={title} />
            <ModalContent>
                <div className="mb-4">{message}</div>
                <Alert className="mb-4" type="warning">
                    {warning}
                </Alert>
                <InputFieldTwo
                    id="organizationPassword"
                    as={PasswordInputTwo}
                    label={c('Label').t`Organization password`}
                    placeholder={c('Placeholder').t`Password`}
                    value={backupPassword}
                    onValue={(value: string) => {
                        setError('');
                        setBackupPassword(value);
                    }}
                    error={validator([requiredValidator(backupPassword), error])}
                    autoComplete="off"
                    autoFocus
                />
            </ModalContent>
            <ModalFooter>
                <Button onClick={handleClose} disabled={loading}>
                    {c('Action').t`Close`}
                </Button>
                <div>
                    {onResetKeys && (
                        <Button
                            className="mr-4"
                            onClick={() => {
                                onClose?.();
                                onResetKeys();
                            }}
                        >{c('Action').t`Reset keys`}</Button>
                    )}
                    <Button loading={loading} type="submit" color="norm">
                        {c('Action').t`Save`}
                    </Button>
                </div>
            </ModalFooter>
        </Modal>
    );
};

export default ReactivateOrganizationKeysModal;
