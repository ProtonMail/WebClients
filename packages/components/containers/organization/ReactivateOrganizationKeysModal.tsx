import { useState } from 'react';

import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import { CryptoProxy, PrivateKeyReference } from '@proton/crypto';
import { useLoading } from '@proton/hooks';
import { activateOrganizationKey, getOrganizationBackupKeys } from '@proton/shared/lib/api/organization';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { decryptPrivateKeyWithSalt } from '@proton/shared/lib/keys';
import { OrganizationModel } from '@proton/shared/lib/models';
import noop from '@proton/utils/noop';

import {
    Alert,
    Form,
    InputFieldTwo,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
    PasswordInputTwo,
    useFormErrors,
} from '../../components';
import { useApi, useAuthentication, useCache, useEventManager, useNotifications } from '../../hooks';

interface Props extends ModalProps {
    mode: 'reactivate' | 'activate';
    onResetKeys?: () => void;
}

const ReactivateOrganizationKeysModal = ({ onResetKeys, mode, onClose, ...rest }: Props) => {
    const cache = useCache();
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
                success: c('Info').t`Organization keys activated`,
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
                success: c('Info').t`Organization keys restored`,
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
            // Warning: The organization model is deleted because there is no event manager notification for when the
            // organization key gets reactivated. Thus the organization is deleted from the cache which would trigger
            // the organizationKeys hook to re-run.
            cache.delete(OrganizationModel.key);

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
