import { FormEvent, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { vpnB2bAdminTooltipTitle } from '@proton/components/containers/members/constants';
import { useLoading } from '@proton/hooks';
import {
    checkMemberAddressAvailability,
    createMember,
    createMemberAddress,
    updateRole,
} from '@proton/shared/lib/api/members';
import {
    APP_NAMES,
    DEFAULT_ENCRYPTION_CONFIG,
    ENCRYPTION_CONFIGS,
    GIGA,
    MEMBER_ROLE,
    VPN_CONNECTIONS,
} from '@proton/shared/lib/constants';
import { getEmailParts, validateEmailAddress } from '@proton/shared/lib/helpers/email';
import {
    confirmPasswordValidator,
    passwordLengthValidator,
    requiredValidator,
} from '@proton/shared/lib/helpers/formValidators';
import { Address, CachedOrganizationKey, Domain, Member, Organization } from '@proton/shared/lib/interfaces';
import { setupMemberKeys } from '@proton/shared/lib/keys';
import { srpVerify } from '@proton/shared/lib/srp';
import clamp from '@proton/utils/clamp';
import isTruthy from '@proton/utils/isTruthy';

import {
    DropdownSizeUnit,
    Icon,
    InputFieldTwo,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
    Option,
    PasswordInputTwo,
    SelectTwo,
    Toggle,
    Tooltip,
    useFormErrors,
    useModalState,
} from '../../components';
import { useApi, useEventManager, useGetAddresses, useGetUser, useGetUserKeys, useNotifications } from '../../hooks';
import { useKTVerifier } from '../keyTransparency';
import MemberStorageSelector, { getStorageRange, getTotalStorage } from './MemberStorageSelector';
import SubUserBulkCreateModal from './SubUserBulkCreateModal';
import SubUserCreateHint from './SubUserCreateHint';
import { UserManagementMode } from './types';
import validateAddUser from './validateAddUser';

enum Step {
    SINGLE,
    BULK,
}

interface Props extends ModalProps {
    organization: Organization;
    organizationKey: CachedOrganizationKey;
    verifiedDomains: Domain[];
    mode?: UserManagementMode;
    app: APP_NAMES;
}

const SubUserCreateModal = ({
    organization,
    organizationKey,
    verifiedDomains,
    mode = UserManagementMode.DEFAULT,
    onClose,
    app,
    ...rest
}: Props) => {
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const api = useApi();
    const getAddresses = useGetAddresses();
    const getUserKeys = useGetUserKeys();
    const storageSizeUnit = GIGA;
    const storageRange = getStorageRange({}, organization);

    const [step, setStep] = useState<Step>(Step.SINGLE);

    const hasVPN = !!organization.MaxVPN;

    const [model, setModel] = useState({
        name: '',
        private: false,
        admin: false,
        password: '',
        confirm: '',
        address: '',
        domain: verifiedDomains[0]?.DomainName ?? null,
        vpn: hasVPN && organization.MaxVPN - organization.UsedVPN >= VPN_CONNECTIONS,
        storage: clamp(5 * GIGA, storageRange.min, storageRange.max),
    });
    const { keyTransparencyVerify, keyTransparencyCommit } = useKTVerifier(api, useGetUser());

    const [submitting, withLoading] = useLoading();

    const { validator, onFormSubmit } = useFormErrors();

    const [bulkUserCreateModalProps, setBulkUserModalOpen] = useModalState();

    const domainOptions = verifiedDomains.map(({ DomainName }) => ({ text: DomainName, value: DomainName }));

    const handleChange = (key: keyof typeof model) => (value: (typeof model)[typeof key]) =>
        setModel({ ...model, [key]: value });

    const getNormalizedAddress = () => {
        if (model.domain) {
            return { Local: model.address, Domain: model.domain };
        }

        const [Local, Domain] = getEmailParts(model.address);

        return { Local, Domain };
    };

    const save = async () => {
        const normalizedAddress = getNormalizedAddress();
        await api(checkMemberAddressAvailability(normalizedAddress));

        const userKeys = await getUserKeys();

        const { Member } = await srpVerify<{ Member: Member }>({
            api,
            credentials: { password: model.password },
            config: createMember({
                Name: model.name || model.address,
                Private: +model.private,
                MaxSpace: +model.storage,
                MaxVPN: model.vpn ? VPN_CONNECTIONS : 0,
            }),
        });

        const { Address } = await api<{ Address: Address }>(createMemberAddress(Member.ID, normalizedAddress));

        if (!model.private) {
            if (!organizationKey.privateKey) {
                throw new Error('Organization key is not decrypted');
            }
            const ownerAddresses = await getAddresses();
            await setupMemberKeys({
                api,
                ownerAddresses,
                member: Member,
                memberAddresses: [Address],
                organizationKey: organizationKey.privateKey,
                encryptionConfig: ENCRYPTION_CONFIGS[DEFAULT_ENCRYPTION_CONFIG],
                password: model.password,
                keyTransparencyVerify,
            });
            await keyTransparencyCommit(userKeys);
        }

        if (model.admin) {
            await api(updateRole(Member.ID, MEMBER_ROLE.ORGANIZATION_ADMIN));
        }
    };

    const validate = () => {
        const error = validateAddUser({
            privateUser: model.private,
            organization,
            organizationKey,
            verifiedDomains,
            mode,
        });
        if (error) {
            return error;
        }

        const normalizedAddress = getNormalizedAddress();
        if (!validateEmailAddress(`${normalizedAddress.Local}@${normalizedAddress.Domain}`)) {
            return c('Error').t`Email address is invalid`;
        }
    };

    const handleSubmit = async () => {
        await save();
        await call();
        onClose?.();
        createNotification({ text: c('Success').t`User created` });
    };

    const setBulkStep = () => {
        setBulkUserModalOpen(true);
        setStep(Step.BULK);
    };
    const setSingleStep = () => {
        setBulkUserModalOpen(false);
        setStep(Step.SINGLE);
    };

    const handleClose = () => {
        if (!submitting) {
            onClose?.();
            setSingleStep();
        }
    };

    const isVpnB2B = mode === UserManagementMode.VPN_B2B;
    const isDefault = mode === UserManagementMode.DEFAULT;

    if (step === Step.BULK) {
        return (
            <SubUserBulkCreateModal
                verifiedDomains={verifiedDomains}
                {...bulkUserCreateModalProps}
                onBack={setSingleStep}
                onClose={handleClose}
                app={app}
            />
        );
    }

    const addressSuffix = (() => {
        if (domainOptions.length === 0) {
            // there is no domains for vpn-b2b mode
            return null;
        }

        if (domainOptions.length === 1) {
            return (
                <span className="text-ellipsis" title={`@${domainOptions[0].value}`}>
                    @{domainOptions[0].value}
                </span>
            );
        }

        return (
            <SelectTwo
                unstyled
                originalPlacement="bottom-end"
                size={{ width: DropdownSizeUnit.Static }}
                value={model.domain}
                onChange={({ value }) => handleChange('domain')(value)}
            >
                {domainOptions.map((option) => (
                    <Option key={option.value} value={option.value} title={option.text}>
                        @{option.text}
                    </Option>
                ))}
            </SelectTwo>
        );
    })();

    return (
        <Modal
            as="form"
            {...rest}
            onClose={handleClose}
            onSubmit={(event: FormEvent) => {
                event.preventDefault();
                event.stopPropagation();
                if (!onFormSubmit()) {
                    return;
                }
                const error = validate();
                if (error) {
                    return createNotification({ type: 'error', text: error });
                }
                void withLoading(handleSubmit());
            }}
        >
            <ModalHeader title={c('Title').t`Add new user`} />
            <ModalContent>
                {mode !== UserManagementMode.VPN_B2B && (
                    <p className="color-weak">
                        {c('Info').t`Create a new account and share the email address and password with the user.`}
                    </p>
                )}
                <InputFieldTwo
                    id="name"
                    autoFocus
                    value={model.name}
                    hint={isVpnB2B ? c('Info').t`Optional` : undefined}
                    error={validator([isDefault && requiredValidator(model.name)].filter(isTruthy))}
                    onValue={handleChange('name')}
                    label={c('Label').t`Name`}
                />
                <InputFieldTwo
                    id="address"
                    value={model.address}
                    error={validator([requiredValidator(model.address)])}
                    onValue={handleChange('address')}
                    label={isVpnB2B ? c('Label').t`Email` : c('Label').t`Address`}
                    suffix={addressSuffix}
                />
                <InputFieldTwo
                    id="password"
                    as={PasswordInputTwo}
                    value={model.password}
                    error={validator([requiredValidator(model.password), passwordLengthValidator(model.password)])}
                    onValue={handleChange('password')}
                    label={c('Label').t`Create password`}
                />

                <InputFieldTwo
                    id="confirm-password"
                    as={PasswordInputTwo}
                    value={model.confirm}
                    error={validator([
                        requiredValidator(model.confirm),
                        confirmPasswordValidator(model.password, model.confirm),
                    ])}
                    onValue={handleChange('confirm')}
                    label={c('Label').t`Confirm password`}
                />

                {!isVpnB2B && (
                    <>
                        <MemberStorageSelector
                            className="mb-5"
                            value={model.storage}
                            sizeUnit={storageSizeUnit}
                            range={storageRange}
                            totalStorage={getTotalStorage({}, organization)}
                            onChange={handleChange('storage')}
                        />

                        {hasVPN && (
                            <div className="flex flex-align-center mb-5">
                                <label className="text-semibold mr-4" htmlFor="vpn-toggle">
                                    {c('Label for new member').t`VPN connections`}
                                </label>
                                <Toggle
                                    id="vpn-toggle"
                                    checked={model.vpn}
                                    onChange={({ target }) => handleChange('vpn')(target.checked)}
                                />
                            </div>
                        )}

                        <div className="flex flex-align-center mb-6">
                            <label className="text-semibold mr-4" htmlFor="private-toggle">
                                {c('Label for new member').t`Private`}
                            </label>
                            <Toggle
                                id="private-toggle"
                                checked={model.private}
                                onChange={({ target }) => handleChange('private')(target.checked)}
                            />
                        </div>
                    </>
                )}

                <div className="flex flex-align-items-center mb-6">
                    <label className="text-semibold mr-1" htmlFor="admin-toggle">
                        {c('Label for new member').t`Admin`}
                    </label>
                    {isVpnB2B && (
                        <Tooltip title={vpnB2bAdminTooltipTitle}>
                            <Icon name="info-circle" className="color-primary" />
                        </Tooltip>
                    )}
                    <Toggle
                        id="admin-toggle"
                        className="ml-2"
                        checked={model.admin}
                        onChange={({ target }) => handleChange('admin')(target.checked)}
                    />
                </div>
                {isVpnB2B && <SubUserCreateHint className="mt-8" />}
            </ModalContent>
            <ModalFooter>
                {isVpnB2B ? (
                    <Button onClick={setBulkStep} disabled={submitting}>
                        {c('Action').t`Add multiple users`}
                    </Button>
                ) : (
                    <Button onClick={handleClose} disabled={submitting}>
                        {c('Action').t`Cancel`}
                    </Button>
                )}
                <Button loading={submitting} type="submit" color="norm">
                    {c('Action').t`Create user`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};
export default SubUserCreateModal;
