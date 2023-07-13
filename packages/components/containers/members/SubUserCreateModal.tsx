import { FormEvent, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useLoading } from '@proton/hooks';
import {
    checkMemberAddressAvailability,
    createMember,
    createMemberAddress,
    updateRole,
} from '@proton/shared/lib/api/members';
import {
    DEFAULT_ENCRYPTION_CONFIG,
    ENCRYPTION_CONFIGS,
    GIGA,
    MEMBER_ROLE,
    VPN_CONNECTIONS,
} from '@proton/shared/lib/constants';
import {
    confirmPasswordValidator,
    passwordLengthValidator,
    requiredValidator,
} from '@proton/shared/lib/helpers/formValidators';
import { Address, CachedOrganizationKey, Domain, Member, Organization } from '@proton/shared/lib/interfaces';
import { setupMemberKeys } from '@proton/shared/lib/keys';
import { srpVerify } from '@proton/shared/lib/srp';
import clamp from '@proton/utils/clamp';

import {
    DropdownSizeUnit,
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
    useFormErrors,
} from '../../components';
import { useApi, useEventManager, useGetAddresses, useGetUser, useGetUserKeys, useNotifications } from '../../hooks';
import { useKTVerifier } from '../keyTransparency';
import SelectEncryption from '../keys/addKey/SelectEncryption';
import MemberStorageSelector, { getStorageRange, getTotalStorage } from './MemberStorageSelector';

interface Props extends ModalProps {
    organization: Organization;
    organizationKey: CachedOrganizationKey;
    domains: Domain[];
}

const SubUserCreateModal = ({ organization, organizationKey, domains, onClose, ...rest }: Props) => {
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const api = useApi();
    const getAddresses = useGetAddresses();
    const getUserKeys = useGetUserKeys();
    const storageSizeUnit = GIGA;
    const storageRange = getStorageRange({}, organization);

    const hasVPN = !!organization.MaxVPN;

    const [model, setModel] = useState({
        name: '',
        private: false,
        admin: false,
        password: '',
        confirm: '',
        address: '',
        domain: domains[0].DomainName,
        vpn: hasVPN && organization.MaxVPN - organization.UsedVPN >= VPN_CONNECTIONS,
        storage: clamp(5 * GIGA, storageRange.min, storageRange.max),
    });
    const { keyTransparencyVerify, keyTransparencyCommit } = useKTVerifier(api, useGetUser());

    const [encryptionType, setEncryptionType] = useState(DEFAULT_ENCRYPTION_CONFIG);
    const [submitting, withLoading] = useLoading();

    const { validator, onFormSubmit } = useFormErrors();

    const domainOptions = domains.map(({ DomainName }) => ({ text: DomainName, value: DomainName }));

    const handleChange = (key: keyof typeof model) => (value: (typeof model)[typeof key]) =>
        setModel({ ...model, [key]: value });

    const save = async () => {
        await api(
            checkMemberAddressAvailability({
                Local: model.address,
                Domain: model.domain,
            })
        );

        const userKeys = await getUserKeys();

        const { Member } = await srpVerify<{ Member: Member }>({
            api,
            credentials: { password: model.password },
            config: createMember({
                Name: model.name,
                Private: +model.private,
                MaxSpace: +model.storage,
                MaxVPN: model.vpn ? VPN_CONNECTIONS : 0,
            }),
        });

        const { Address } = await api<{ Address: Address }>(
            createMemberAddress(Member.ID, {
                Local: model.address,
                Domain: model.domain,
            })
        );

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
                encryptionConfig: ENCRYPTION_CONFIGS[encryptionType],
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
        if (!model.private && !organizationKey) {
            return c('Error').t`The organization key must be activated first.`;
        }
    };

    const handleSubmit = async () => {
        await save();
        await call();
        onClose?.();
        createNotification({ text: c('Success').t`User created` });
    };

    const handleClose = () => {
        if (!submitting) {
            onClose?.();
        }
    };

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
            <ModalHeader title={c('Title').t`Add user`} />
            <ModalContent>
                <p className="color-weak">{c('Info')
                    .t`Create a new account and share the email address and password with the user.`}</p>
                <InputFieldTwo
                    id="name"
                    autoFocus
                    value={model.name}
                    error={validator([requiredValidator(model.name)])}
                    onValue={handleChange('name')}
                    label={c('Label').t`Name`}
                    placeholder="Thomas A. Anderson"
                />

                <InputFieldTwo
                    id="address"
                    value={model.address}
                    error={validator([requiredValidator(model.address)])}
                    onValue={handleChange('address')}
                    label={c('Label').t`Address`}
                    placeholder={c('Placeholder').t`Address`}
                    suffix={
                        domainOptions.length === 1 ? (
                            <span className="text-ellipsis" title={`@${domainOptions[0].value}`}>
                                @{domainOptions[0].value}
                            </span>
                        ) : (
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
                        )
                    }
                />

                <InputFieldTwo
                    id="password"
                    as={PasswordInputTwo}
                    value={model.password}
                    error={validator([requiredValidator(model.password), passwordLengthValidator(model.password)])}
                    onValue={handleChange('password')}
                    label={c('Label').t`Password`}
                    placeholder={c('Placeholder').t`Password`}
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
                    placeholder={c('Placeholder').t`Confirm password`}
                />

                {model.private ? null : (
                    <div className="mb-6">
                        <div className="text-semibold mb-1">{c('Label').t`Key strength`}</div>
                        <SelectEncryption encryptionType={encryptionType} setEncryptionType={setEncryptionType} />
                    </div>
                )}

                <MemberStorageSelector
                    className="mb-5"
                    value={model.storage}
                    sizeUnit={storageSizeUnit}
                    range={storageRange}
                    totalStorage={getTotalStorage({}, organization)}
                    onChange={handleChange('storage')}
                />

                {hasVPN ? (
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
                ) : null}

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

                <div className="flex flex-align-center mb-6">
                    <label className="text-semibold mr-4" htmlFor="admin-toggle">
                        {c('Label for new member').t`Admin`}
                    </label>
                    <Toggle
                        id="admin-toggle"
                        checked={model.admin}
                        onChange={({ target }) => handleChange('admin')(target.checked)}
                    />
                </div>
            </ModalContent>
            <ModalFooter>
                <Button onClick={handleClose} disabled={submitting}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button loading={submitting} type="submit" color="norm">
                    {c('Action').t`Save`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default SubUserCreateModal;
