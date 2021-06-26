import React, { ChangeEvent, useState } from 'react';
import { c } from 'ttag';
import { updateOrganizationKeys } from '@proton/shared/lib/api/organization';
import { OpenPGPKey } from 'pmcrypto';
import { DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS } from '@proton/shared/lib/constants';
import { generateOrganizationKeys, reEncryptOrganizationTokens } from '@proton/shared/lib/keys';
import { queryAddresses } from '@proton/shared/lib/api/members';
import { Address, Member } from '@proton/shared/lib/interfaces';
import { FormModal, Alert, Row, Label, Field, PasswordInput } from '../../components';
import {
    useEventManager,
    useLoading,
    useModals,
    useNotifications,
    useAuthentication,
    useStep,
    useApi,
} from '../../hooks';
import AuthModal from '../password/AuthModal';

import SelectEncryption from '../keys/addKey/SelectEncryption';

interface Props {
    onClose?: () => void;
    hasOtherAdmins: boolean;
    nonPrivateMembers: Member[];
    organizationKey: OpenPGPKey;
}

const ChangeOrganizationKeysModal = ({
    onClose,
    hasOtherAdmins,
    nonPrivateMembers,
    organizationKey,
    ...rest
}: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const authentication = useAuthentication();

    const { step, next, previous } = useStep();
    const [loading, withLoading] = useLoading();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [confirmError, setConfirmError] = useState('');
    const [encryptionType, setEncryptionType] = useState(DEFAULT_ENCRYPTION_CONFIG);

    const handleSubmit = async () => {
        if (confirmPassword !== newPassword) {
            return setConfirmError(c('Error').t`Passwords do not match`);
        }
        setConfirmError('');

        const { privateKey, privateKeyArmored, backupKeySalt, backupArmoredPrivateKey } =
            await generateOrganizationKeys({
                keyPassword: authentication.getPassword(),
                backupPassword: newPassword,
                encryptionConfig: ENCRYPTION_CONFIGS[encryptionType],
            });

        // Check this case for safety.
        if (nonPrivateMembers.length >= 1 && !organizationKey) {
            throw new Error('Private members received without an existing organization key.');
        }

        const nonPrivateMembersAddresses = await Promise.all(
            nonPrivateMembers.map((member) =>
                api<{ Addresses: Address[] }>(queryAddresses(member.ID)).then(({ Addresses = [] }) => Addresses)
            )
        );

        const tokens = await reEncryptOrganizationTokens({
            nonPrivateMembers,
            nonPrivateMembersAddresses,
            oldOrganizationKey: organizationKey,
            newOrganizationKey: privateKey,
        });

        const apiConfig = updateOrganizationKeys({
            PrivateKey: privateKeyArmored,
            BackupPrivateKey: backupArmoredPrivateKey,
            BackupKeySalt: backupKeySalt,
            Tokens: tokens,
        });

        await new Promise((resolve, reject) => {
            createModal(<AuthModal onClose={reject} onSuccess={resolve} config={apiConfig} />);
        });

        await call();
        createNotification({ text: c('Success').t`Keys updated` });
        onClose?.();
    };

    const { section, ...modalProps } = (() => {
        if (step === 0) {
            return {
                submit: c('Action').t`Next`,
                section: (
                    <>
                        <Alert>{c('Info')
                            .t`This will create an encryption key for your organization. 4096-bit keys only work on high performance computers, for most users, we recommend using 2048-bit keys.`}</Alert>
                        <SelectEncryption encryptionType={encryptionType} setEncryptionType={setEncryptionType} />
                    </>
                ),
                onSubmit() {
                    next();
                },
            };
        }

        if (step === 1) {
            return {
                close: c('Action').t`Back`,
                onClose: previous,
                section: (
                    <>
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
                                    onChange={({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
                                        setNewPassword(value)
                                    }
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
                        <Alert type="warning">
                            {c('Info')
                                .t`Do NOT forget this password. If you forget it, you will not be able to manage your organization.`}
                            <br />
                            {c('Info')
                                .t`Save your password somewhere safe. Click on icon to confirm you that have typed your password correctly.`}
                        </Alert>
                    </>
                ),
                onSubmit() {
                    withLoading(handleSubmit());
                },
            };
        }

        throw new Error('Unknown step');
    })();

    return (
        <FormModal
            title={c('Title').t`Change organization keys`}
            close={c('Action').t`Close`}
            submit={c('Action').t`Save`}
            onClose={onClose}
            loading={loading}
            {...modalProps}
            {...rest}
        >
            {section}
        </FormModal>
    );
};

export default ChangeOrganizationKeysModal;
