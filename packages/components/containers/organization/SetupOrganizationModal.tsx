import { useState } from 'react';
import { c } from 'ttag';
import { GIGA, DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS } from '@proton/shared/lib/constants';
import { range } from '@proton/shared/lib/helpers/array';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import {
    updateOrganizationName,
    updateOrganizationKeysLegacy,
    updateOrganizationKeysV2,
} from '@proton/shared/lib/api/organization';
import { updateVPN, updateQuota } from '@proton/shared/lib/api/members';
import { noop } from '@proton/shared/lib/helpers/function';
import {
    passwordLengthValidator,
    confirmPasswordValidator,
    getMinPasswordLengthMessage,
    requiredValidator,
} from '@proton/shared/lib/helpers/formValidators';

import { generateOrganizationKeys, getHasMigratedAddressKeys } from '@proton/shared/lib/keys';
import {
    Alert,
    Button,
    InputFieldTwo,
    ModalProps,
    ModalTwo as Modal,
    ModalTwoHeader as ModalHeader,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    Option,
    PasswordInputTwo,
    SelectTwo,
    Form,
    useFormErrors,
} from '../../components';
import {
    useUser,
    useOrganization,
    useApi,
    useMembers,
    useEventManager,
    useAuthentication,
    useLoading,
    useNotifications,
    useAddresses,
} from '../../hooks';

import SelectEncryption from '../keys/addKey/SelectEncryption';

enum STEPS {
    NAME,
    KEYS,
    PASSWORD,
    STORAGE,
    VPN,
}

const SetupOrganizationModal = ({ onClose, ...rest }: ModalProps) => {
    const api = useApi();
    const authentication = useAuthentication();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const [addresses] = useAddresses();
    const [members = []] = useMembers();
    const [loading, withLoading] = useLoading();
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
    const { validator, onFormSubmit, reset } = useFormErrors();

    const handleChange = (key: keyof typeof model) => {
        return (value: any) => setModel({ ...model, [key]: value });
    };

    const { ID: currentMemberID } = members.find(({ Self }) => Self) || {};

    const { title, onSubmit, section } = (() => {
        if (step === STEPS.NAME) {
            return {
                title: c('Title').t`Set organization name`,
                section: (
                    <InputFieldTwo
                        id="organization-name"
                        label={c('Label').t`Organization name`}
                        placeholder={c('Placeholder').t`Choose a name`}
                        error={validator([requiredValidator(model.name)])}
                        autoFocus
                        disableChange={loading}
                        value={model.name}
                        onValue={handleChange('name')}
                    />
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
                        <div>
                            {c('Info')
                                .t`This will create an encryption key for your organization. 4096-bit keys only work on high performance computers, for most users, we recommend using 2048-bit keys.`}
                        </div>
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
                        <div className="mb1">
                            {c('Info')
                                .t`Your organization password can be shared with other users you wish to give administrative privileges. It is also an emergency recovery code to gain access to your organization in case you lose access to your account. Please save this password and keep it safe.`}
                        </div>
                        <Alert className="mb1" type="warning">
                            {c('Info')
                                .t`Do NOT forget this password. If you forget it, you will not be able to login or decrypt your messages.`}
                            <br />
                            {c('Info')
                                .t`Save your password somewhere safe. Click on icon to confirm that you have typed your password correctly.`}
                        </Alert>

                        <InputFieldTwo
                            autoFocus
                            id="orgPassword"
                            as={PasswordInputTwo}
                            label={c('Label').t`Organization password`}
                            placeholder={c('Placeholder').t`Password`}
                            value={model.password}
                            onValue={handleChange('password')}
                            assistiveText={getMinPasswordLengthMessage()}
                            error={validator([passwordLengthValidator(model.password)])}
                            autoComplete="new-password"
                        />

                        <InputFieldTwo
                            id="confirmPassword"
                            as={PasswordInputTwo}
                            label={c('Label').t`Confirm password`}
                            placeholder={c('Placeholder').t`Confirm`}
                            value={model.confirm}
                            onValue={handleChange('confirm')}
                            error={validator([
                                passwordLengthValidator(model.confirm),
                                confirmPasswordValidator(model.confirm, model.password),
                            ])}
                            autoComplete="new-password"
                        />
                    </>
                ),
                async onSubmit() {
                    const { privateKeyArmored, backupKeySalt, backupArmoredPrivateKey } =
                        await generateOrganizationKeys({
                            keyPassword: authentication.getPassword(),
                            backupPassword: model.password,
                            encryptionConfig: ENCRYPTION_CONFIGS[encryptionType],
                        });

                    if (getHasMigratedAddressKeys(addresses)) {
                        await api(
                            updateOrganizationKeysV2({
                                PrivateKey: privateKeyArmored,
                                BackupPrivateKey: backupArmoredPrivateKey,
                                BackupKeySalt: backupKeySalt,
                                Members: [],
                            })
                        );
                    } else {
                        await api(
                            updateOrganizationKeysLegacy({
                                PrivateKey: privateKeyArmored,
                                BackupPrivateKey: backupArmoredPrivateKey,
                                BackupKeySalt: backupKeySalt,
                                Tokens: [],
                            })
                        );
                    }

                    setStep(STEPS.STORAGE);
                },
            };
        }

        if (step === STEPS.STORAGE) {
            return {
                title: c('Title').t`Allocate storage`,
                section: (
                    <>
                        <div className="mb1">
                            {c('Info')
                                .t`Currently all available storage is allocated to the administrator account. Please reduce the admin account allocation to free up space for additional users. You can increase the total storage at any time by upgrading your account.`}
                        </div>
                        <InputFieldTwo
                            id="storage"
                            as={SelectTwo}
                            label={c('Label').t`Account storage`}
                            value={model.storage}
                            onValue={handleChange('storage')}
                            error={validator([requiredValidator(model.storage)])}
                        >
                            {storageOptions.map(({ value, text }) => (
                                <Option key={value} value={value} title={text} />
                            ))}
                        </InputFieldTwo>
                    </>
                ),
                async onSubmit() {
                    if (!currentMemberID) {
                        throw new Error('Missing member id');
                    }
                    await api(updateQuota(currentMemberID, +model.storage));

                    if (hasPaidVpn) {
                        setStep(STEPS.VPN);
                        return;
                    }

                    await call();
                    createNotification({ text: c('Success').t`Organization activated` });
                    onClose?.();
                },
            };
        }

        if (step === STEPS.VPN) {
            return {
                title: c('Title').t`Allocate VPN connections`,
                section: (
                    <>
                        <div className="mb1">
                            {c('Info')
                                .t`Currently all available VPN connections are allocated to the administrator account. Please select the number of connections you want to reserve for additional users.`}
                        </div>
                        <InputFieldTwo
                            id="vpn"
                            as={SelectTwo}
                            label={c('Label').t`VPN Connections`}
                            value={model.vpn}
                            onValue={handleChange('vpn')}
                            error={validator([requiredValidator(model.vpn)])}
                        >
                            {vpnOptions.map(({ value, text }) => (
                                <Option key={value} value={value} title={`${text}`} />
                            ))}
                        </InputFieldTwo>
                    </>
                ),
                async onSubmit() {
                    if (!currentMemberID) {
                        throw new Error('Missing member id');
                    }
                    await api(updateVPN(currentMemberID, +model.vpn));
                    await call();

                    createNotification({ text: c('Success').t`Organization activated` });
                    onClose?.();
                },
            };
        }

        throw new Error('Unknown step');
    })();

    const handleClose = loading ? noop : onClose;

    return (
        <Modal
            as={Form}
            onSubmit={() => {
                if (!onFormSubmit()) {
                    return;
                }
                void withLoading(onSubmit()).then(reset);
            }}
            onClose={handleClose}
            size="large"
            {...rest}
        >
            <ModalHeader title={title} />
            <ModalContent>{section}</ModalContent>
            <ModalFooter>
                {step ? (
                    <Button onClick={() => setStep(step - 1)} disabled={loading}>
                        {c('Action').t`Back`}
                    </Button>
                ) : (
                    <Button onClick={handleClose} disabled={loading}>
                        {c('Action').t`Close`}
                    </Button>
                )}
                <Button loading={loading} type="submit" color="norm">
                    {c('Action').t`Submit`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default SetupOrganizationModal;
