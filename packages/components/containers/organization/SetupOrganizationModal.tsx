import { useState } from 'react';
import { c } from 'ttag';
import { GIGA, DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS, VPN_CONNECTIONS } from '@proton/shared/lib/constants';
import {
    updateOrganizationName,
    updateOrganizationKeysLegacy,
    updateOrganizationKeysV2,
} from '@proton/shared/lib/api/organization';
import { updateQuota, updateVPN } from '@proton/shared/lib/api/members';
import noop from '@proton/util/noop';
import {
    passwordLengthValidator,
    confirmPasswordValidator,
    getMinPasswordLengthMessage,
    requiredValidator,
} from '@proton/shared/lib/helpers/formValidators';
import clamp from '@proton/util/clamp';

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
    PasswordInputTwo,
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
import MemberStorageSelector, { getStorageRange, getTotalStorage } from '../members/MemberStorageSelector';

enum STEPS {
    NAME,
    KEYS,
    PASSWORD,
    STORAGE,
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
    const [organization] = useOrganization();
    const [step, setStep] = useState<STEPS>(STEPS.NAME);
    const storageSizeUnit = GIGA;
    const [{ hasPaidVpn }] = useUser();
    const selfMember = members.find(({ Self }) => !!Self);
    const storageRange = getStorageRange(selfMember, organization);
    const [model, setModel] = useState({
        name: '',
        password: '',
        confirm: '',
        storage: -1,
    });
    const { validator, onFormSubmit, reset } = useFormErrors();

    const handleChange = (key: keyof typeof model) => {
        return (value: any) => setModel({ ...model, [key]: value });
    };

    const selfMemberID = selfMember?.ID;
    // Storage can be undefined in the beginning because org is undefined. So we keep it floating until it's set.
    const storageValue = model.storage === -1 ? clamp(5 * GIGA, storageRange.min, storageRange.max) : model.storage;

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
                    if (!selfMemberID) {
                        throw new Error('Missing member id');
                    }
                    // NOTE: By default the admin gets allocated all of the VPN connections. Here we artificially set the admin to the default value
                    // So that other users can get connections allocated.
                    await (hasPaidVpn && api(updateVPN(selfMemberID, VPN_CONNECTIONS)));
                    await Promise.all([api(updateOrganizationName(model.name))]);
                    setStep(STEPS.KEYS);
                },
            };
        }

        if (step === STEPS.KEYS) {
            return {
                title: c('Title').t`Set organization keys`,
                section: (
                    <>
                        <div className="mb1">
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
                        <MemberStorageSelector
                            className="mb1"
                            value={storageValue}
                            sizeUnit={storageSizeUnit}
                            totalStorage={getTotalStorage(selfMember, organization)}
                            range={storageRange}
                            onChange={handleChange('storage')}
                            mode="init"
                        />
                    </>
                ),
                async onSubmit() {
                    if (!selfMemberID) {
                        throw new Error('Missing member id');
                    }
                    await api(updateQuota(selfMemberID, storageValue));

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
