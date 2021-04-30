import React, { ChangeEvent, useState } from 'react';
import { c } from 'ttag';
import { GIGA, DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS } from 'proton-shared/lib/constants';
import { range } from 'proton-shared/lib/helpers/array';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { updateOrganizationName, updateOrganizationKeys } from 'proton-shared/lib/api/organization';
import { updateVPN, updateQuota } from 'proton-shared/lib/api/members';

import { generateOrganizationKeys } from 'proton-shared/lib/keys';
import { FormModal, Button, Row, Label, Input, PasswordInput, Alert, Select } from '../../components';
import {
    useUser,
    useOrganization,
    useApi,
    useMembers,
    useEventManager,
    useAuthentication,
    useLoading,
    useNotifications,
} from '../../hooks';

import SelectEncryption from '../keys/addKey/SelectEncryption';

enum STEPS {
    NAME,
    KEYS,
    PASSWORD,
    STORAGE,
    VPN,
}

interface Props {
    onClose?: () => void;
}
const SetupOrganizationModal = ({ onClose = () => undefined, ...rest }: Props) => {
    const api = useApi();
    const authentication = useAuthentication();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const [members = []] = useMembers();
    const [loading, withLoading] = useLoading();
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [encryptionType, setEncryptionType] = useState(DEFAULT_ENCRYPTION_CONFIG);
    const [{ MaxSpace, MaxVPN }] = useOrganization();
    const [step, setStep] = useState<STEPS>(STEPS.NAME);
    const storageOptions = range(0, MaxSpace, GIGA).map((value) => ({ text: `${humanSize(value, 'GB')}`, value }));
    const vpnOptions = range(0, MaxVPN).map((value) => ({ text: value, value }));
    const [{ hasPaidVpn }] = useUser();
    const [model, setModel] = useState({
        name: '',
        password: '',
        confirm: '',
        storage: Math.min(storageOptions[storageOptions.length - 1].value ?? 0, 5 * GIGA),
        vpn: Math.min(vpnOptions[vpnOptions.length - 1]?.value ?? 0, 3),
    });

    const handleChange = (key: string) => {
        return ({ target }: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
            setModel({ ...model, [key]: target.value });
    };

    const { ID: currentMemberID } = members.find(({ Self }) => Self) || {};

    const { title, onSubmit, section } = (() => {
        if (step === STEPS.NAME) {
            return {
                title: c('Title').t`Set organization name`,
                section: (
                    <Row>
                        <Label>{c('Label').t`Organization name`}</Label>
                        <Input
                            placeholder={c('Placeholder').t`Choose a name`}
                            value={model.name}
                            onChange={handleChange('name')}
                            required
                        />
                    </Row>
                ),
                async onSubmit() {
                    await api(updateOrganizationName(model.name));
                    setStep(STEPS.KEYS);
                },
            };
        }

        if (step === STEPS.KEYS) {
            return {
                title: c('Title').t`Set organization keys`,
                section: (
                    <>
                        <Alert>{c('Info')
                            .t`This will create an encryption key for your organization. 4096-bit keys only work on high performance computers, for most users, we recommend using 2048-bit keys.`}</Alert>
                        <SelectEncryption encryptionType={encryptionType} setEncryptionType={setEncryptionType} />
                    </>
                ),
                async onSubmit() {
                    setStep(STEPS.PASSWORD);
                },
            };
        }

        if (step === STEPS.PASSWORD) {
            return {
                title: c('Title').t`Set organization password`,
                section: (
                    <>
                        <Alert>{c('Info')
                            .t`Your organization password can be shared with other users you wish to give administrative privileges. It is also an emergency recovery code to gain access to your organization in case you lose access to your account. Please save this password and keep it safe.`}</Alert>
                        <Alert type="warning">
                            {c('Info')
                                .t`Do NOT forget this password. If you forget it, you will not be able to login or decrypt your messages.`}
                            <br />
                            {c('Info')
                                .t`Save your password somewhere safe. Click on icon to confirm you that have typed your password correctly.`}
                        </Alert>
                        <Row>
                            <Label htmlFor="orgPassword">{c('Label').t`Organization password`}</Label>
                            <PasswordInput
                                id="orgPassword"
                                placeholder={c('Placeholder').t`Password`}
                                error={confirmPasswordError}
                                value={model.password}
                                onChange={handleChange('password')}
                                autoComplete="new-password"
                                required
                            />
                        </Row>
                        <Row>
                            <Label htmlFor="confirmPassword">{c('Label').t`Confirm password`}</Label>
                            <PasswordInput
                                id="confirmPassword"
                                placeholder={c('Placeholder').t`Confirm`}
                                value={model.confirm}
                                error={confirmPasswordError}
                                onChange={handleChange('confirm')}
                                autoComplete="new-password"
                                required
                            />
                        </Row>
                    </>
                ),
                async onSubmit() {
                    if (model.password !== model.confirm) {
                        return setConfirmPasswordError(c('Error').t`Passwords do not match`);
                    }
                    setConfirmPasswordError('');

                    const {
                        privateKeyArmored,
                        backupKeySalt,
                        backupArmoredPrivateKey,
                    } = await generateOrganizationKeys({
                        keyPassword: authentication.getPassword(),
                        backupPassword: model.password,
                        encryptionConfig: ENCRYPTION_CONFIGS[encryptionType],
                    });

                    await api(
                        updateOrganizationKeys({
                            PrivateKey: privateKeyArmored,
                            BackupPrivateKey: backupArmoredPrivateKey,
                            BackupKeySalt: backupKeySalt,
                            Tokens: [],
                        })
                    );

                    setStep(STEPS.STORAGE);
                },
            };
        }

        if (step === STEPS.STORAGE) {
            return {
                title: c('Title').t`Allocate storage`,
                section: (
                    <>
                        <Alert>{c('Info')
                            .t`Currently all available storage is allocated to the administrator account. Please reduce the admin account allocation to free up space for additional users. You can increase the total storage at any time by upgrading your account.`}</Alert>
                        <Row>
                            <Label htmlFor="storage">{c('Label').t`Account storage`}</Label>
                            <Select
                                id="storage"
                                options={storageOptions}
                                value={model.storage}
                                onChange={handleChange('storage')}
                                required
                            />
                        </Row>
                    </>
                ),
                async onSubmit() {
                    await api(updateQuota(currentMemberID, +model.storage));

                    if (hasPaidVpn) {
                        setStep(STEPS.VPN);
                        return;
                    }

                    await call();
                    createNotification({ text: c('Success').t`Organization activated` });
                    onClose();
                },
            };
        }

        if (step === STEPS.VPN) {
            return {
                title: c('Title').t`Allocate VPN connections`,
                section: (
                    <>
                        <Alert>{c('Info')
                            .t`Currently all available VPN connections are allocated to the administrator account. Please select the number of connections you want to reserve for additional users.`}</Alert>
                        <Row>
                            <Label htmlFor="vpn">{c('Label').t`VPN Connections`}</Label>
                            <Select
                                id="vpn"
                                options={vpnOptions}
                                value={model.vpn}
                                onChange={handleChange('vpn')}
                                required
                            />
                        </Row>
                    </>
                ),
                async onSubmit() {
                    await api(updateVPN(currentMemberID, +model.vpn));
                    await call();

                    createNotification({ text: c('Success').t`Organization activated` });
                    onClose();
                },
            };
        }

        throw new Error('Unknown step');
    })();

    return (
        <FormModal
            title={title}
            submit={c('Action').t`Submit`}
            onClose={onClose}
            onSubmit={() => withLoading(onSubmit())}
            loading={loading}
            close={
                step ? <Button onClick={() => setStep(step - 1)}>{c('Action').t`Back`}</Button> : c('Action').t`Close`
            }
            {...rest}
        >
            {section}
        </FormModal>
    );
};

export default SetupOrganizationModal;
