import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { CryptoProxy } from '@proton/crypto';
import { useLoading } from '@proton/hooks';
import { updateOrganizationKeysLegacy, updateOrganizationKeysV2 } from '@proton/shared/lib/api/organization';
import { ENCRYPTION_CONFIGS, ENCRYPTION_TYPES } from '@proton/shared/lib/constants';
import { confirmPasswordValidator, passwordLengthValidator } from '@proton/shared/lib/helpers/formValidators';
import { CachedOrganizationKey, Member } from '@proton/shared/lib/interfaces';
import {
    generateOrganizationKeys,
    getHasMigratedAddressKeys,
    getReEncryptedPublicMemberTokensPayloadLegacy,
    getReEncryptedPublicMemberTokensPayloadV2,
} from '@proton/shared/lib/keys';
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
import { useApi, useAuthentication, useEventManager, useGetAddresses, useModals, useNotifications } from '../../hooks';
import AuthModal from '../password/AuthModal';

interface Props extends ModalProps {
    hasOtherAdmins: boolean;
    publicMembers: Member[];
    organizationKey: CachedOrganizationKey;
    mode?: 'reset';
}

const ChangeOrganizationKeysModal = ({
    onClose,
    mode,
    hasOtherAdmins,
    publicMembers,
    organizationKey,
    ...rest
}: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const authentication = useAuthentication();
    const { validator, onFormSubmit } = useFormErrors();

    const getAddresses = useGetAddresses();
    const [loading, withLoading] = useLoading();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = async () => {
        const { privateKey, privateKeyArmored, backupKeySalt, backupArmoredPrivateKey } =
            await generateOrganizationKeys({
                keyPassword: authentication.getPassword(),
                backupPassword: newPassword,
                encryptionConfig: ENCRYPTION_CONFIGS[ENCRYPTION_TYPES.CURVE25519],
            });

        // Check this case for safety.
        if (publicMembers.length >= 1 && !organizationKey.privateKey) {
            throw new Error('Private members received without an existing organization key.');
        }

        const addresses = await getAddresses();
        const publicKey = await CryptoProxy.importPublicKey({ armoredKey: privateKeyArmored });

        let apiConfig: any;
        if (getHasMigratedAddressKeys(addresses)) {
            apiConfig = updateOrganizationKeysV2({
                PrivateKey: privateKeyArmored,
                BackupPrivateKey: backupArmoredPrivateKey,
                BackupKeySalt: backupKeySalt,
                Members: organizationKey.privateKey
                    ? await getReEncryptedPublicMemberTokensPayloadV2({
                          api,
                          publicMembers,
                          oldOrganizationKey: organizationKey,
                          newOrganizationKey: { privateKey, publicKey },
                      })
                    : [],
            });
        } else {
            apiConfig = updateOrganizationKeysLegacy({
                PrivateKey: privateKeyArmored,
                BackupPrivateKey: backupArmoredPrivateKey,
                BackupKeySalt: backupKeySalt,
                Tokens: organizationKey.privateKey
                    ? await getReEncryptedPublicMemberTokensPayloadLegacy({
                          api,
                          publicMembers,
                          oldOrganizationKey: organizationKey,
                          newOrganizationKey: { privateKey, publicKey },
                      })
                    : [],
            });
        }

        await new Promise((resolve, reject) => {
            createModal(<AuthModal onCancel={reject} onSuccess={resolve} config={apiConfig} />);
        });

        await call();
        createNotification({ text: c('Success').t`Keys updated` });
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
            <ModalHeader
                title={
                    mode === 'reset' ? c('Title').t`Reset organization keys` : c('Title').t`Change organization keys`
                }
            />
            <ModalContent>
                {
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
                    </>
                }
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

export default ChangeOrganizationKeysModal;
