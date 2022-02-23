import { FormEvent, useState } from 'react';
import { c } from 'ttag';
import {
    ADDRESS_STATUS,
    DEFAULT_ENCRYPTION_CONFIG,
    ENCRYPTION_CONFIGS,
    GIGA,
    MEMBER_ROLE,
} from '@proton/shared/lib/constants';
import {
    checkMemberAddressAvailability,
    createMember,
    createMemberAddress,
    updateRole,
} from '@proton/shared/lib/api/members';
import {
    confirmPasswordValidator,
    passwordLengthValidator,
    requiredValidator,
} from '@proton/shared/lib/helpers/formValidators';
import { noop } from '@proton/shared/lib/helpers/function';
import { srpVerify } from '@proton/shared/lib/srp';
import { Domain, Organization, Address, CachedOrganizationKey } from '@proton/shared/lib/interfaces';
import { setupMemberKey } from '@proton/shared/lib/keys';
import { useApi, useNotifications, useEventManager, useGetAddresses } from '../../hooks';
import {
    Button,
    InputFieldTwo,
    ModalProps,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    Option,
    PasswordInputTwo,
    SelectTwo,
    Toggle,
    useFormErrors,
} from '../../components';

import MemberStorageSelector, { getStorageRange } from './MemberStorageSelector';
import MemberVPNSelector, { getVPNRange } from './MemberVPNSelector';
import SelectEncryption from '../keys/addKey/SelectEncryption';

const FIVE_GIGA = 5 * GIGA;

interface Props {
    organization: Organization;
    organizationKey: CachedOrganizationKey;
    domains: Domain[];
    domainsAddressesMap: { [domainID: string]: Address[] };
    open: ModalProps['open'];
    onClose: ModalProps['onClose'];
    onExit: ModalProps['onExit'];
}

const MemberModal = ({ organization, organizationKey, domains, domainsAddressesMap, open, onClose, onExit }: Props) => {
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const api = useApi();
    const getAddresses = useGetAddresses();
    const storageRange = getStorageRange({}, organization);
    const vpnRange = getVPNRange({}, organization);
    const [model, setModel] = useState({
        name: '',
        private: false,
        admin: false,
        password: '',
        confirm: '',
        address: '',
        domain: domains[0].DomainName,
        vpn: vpnRange[0],
        storage: Math.min(storageRange[1], FIVE_GIGA),
    });

    const [encryptionType, setEncryptionType] = useState(DEFAULT_ENCRYPTION_CONFIG);
    const [submitting, setSubmitting] = useState(false);

    const { validator, onFormSubmit } = useFormErrors();

    const hasVPN = !!organization.MaxVPN;

    const domainOptions = domains.map(({ DomainName }) => ({ text: DomainName, value: DomainName }));

    const handleChange = (key: keyof typeof model) => (value: typeof model[typeof key]) =>
        setModel({ ...model, [key]: value });

    const save = async () => {
        await api(
            checkMemberAddressAvailability({
                Local: model.address,
                Domain: model.domain,
            })
        );

        const { Member } = await srpVerify({
            api,
            credentials: { password: model.password },
            config: createMember({
                Name: model.name,
                Private: +model.private,
                MaxSpace: +model.storage,
                MaxVPN: model.vpn,
            }),
        });

        const { Address } = await api(
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
            await setupMemberKey({
                api,
                ownerAddresses,
                member: Member,
                address: Address,
                organizationKey: organizationKey.privateKey,
                encryptionConfig: ENCRYPTION_CONFIGS[encryptionType],
                password: model.password,
            });
        }

        if (model.admin) {
            await api(updateRole(Member.ID, MEMBER_ROLE.ORGANIZATION_ADMIN));
        }
    };

    const validate = () => {
        const domain = domains.find(({ DomainName }) => DomainName === model.domain);
        const nonDisabledCustomAddressExists = domainsAddressesMap[domain?.ID || ''].some?.((address) => {
            return (
                address.Email === `${model.address}@${model.domain}` &&
                address.Status !== ADDRESS_STATUS.STATUS_DISABLED
            );
        });

        // A non disabled custom address is validated to not exist because the user and address creation are in 2
        // different calls. So while the user creation may succeed, the address creation could fail leading to
        // creating the user in an inconsistent state.
        if (nonDisabledCustomAddressExists) {
            return c('Error').t`Address already associated to a user`;
        }

        if (!model.private && !organizationKey) {
            return c('Error').t`The organization key must be activated first.`;
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!onFormSubmit()) {
            return;
        }

        const error = validate();
        if (error) {
            return createNotification({ type: 'error', text: error });
        }

        try {
            setSubmitting(true);
            await save();
            await call();
            onClose?.();
            createNotification({ text: c('Success').t`User created` });
        } catch (e: any) {
            setSubmitting(false);
        }
    };

    const handleClose = submitting ? noop : onClose;

    return (
        <Modal as="form" open={open} onClose={handleClose} onExit={onExit} onSubmit={handleSubmit}>
            <ModalHeader title={c('Title').t`Add user`} />
            <ModalContent>
                <InputFieldTwo
                    autoFocus
                    required
                    id="name"
                    value={model.name}
                    error={validator([requiredValidator(model.name)])}
                    onValue={handleChange('name')}
                    label={c('Label').t`Name`}
                    placeholder="Thomas A. Anderson"
                />

                <div className="flex on-mobile-flex-column">
                    <InputFieldTwo
                        rootClassName="flex-item-fluid"
                        required
                        id="address"
                        value={model.address}
                        error={validator([requiredValidator(model.address)])}
                        onValue={handleChange('address')}
                        label={c('Label').t`Address`}
                        placeholder={c('Placeholder').t`Address`}
                    />
                    <div className="ml1 on-mobile-ml0 on-mobile-mb1-25 flex flex-nowrap flex-align-items-center">
                        {domainOptions.length === 1 ? (
                            <span className="text-ellipsis" title={`@${domainOptions[0].value}`}>
                                @{domainOptions[0].value}
                            </span>
                        ) : (
                            <SelectTwo value={model.domain} onChange={({ value }) => handleChange('domain')(value)}>
                                {domainOptions.map((option) => (
                                    <Option key={option.value} value={option.value} title={option.text}>
                                        @{option.text}
                                    </Option>
                                ))}
                            </SelectTwo>
                        )}
                    </div>
                </div>

                <InputFieldTwo
                    required
                    id="password"
                    as={PasswordInputTwo}
                    value={model.password}
                    error={validator([requiredValidator(model.password), passwordLengthValidator(model.password)])}
                    onValue={handleChange('password')}
                    label={c('Label').t`Password`}
                    placeholder={c('Placeholder').t`Password`}
                />

                <InputFieldTwo
                    required
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
                    <div className="mb1-5">
                        <div className="text-semibold mb0-25">{c('Label').t`Key strength`}</div>
                        <SelectEncryption encryptionType={encryptionType} setEncryptionType={setEncryptionType} />
                    </div>
                )}

                <div className="mb1-5">
                    <div className="text-semibold mb0-25">{c('Label').t`Account storage`}</div>
                    <MemberStorageSelector
                        value={model.storage}
                        step={GIGA}
                        range={storageRange}
                        onChange={handleChange('storage')}
                    />
                </div>

                {hasVPN ? (
                    <div className="mb1-5">
                        <div className="text-semibold mb0-25">{c('Label').t`VPN connections`}</div>
                        <MemberVPNSelector value={model.vpn} step={1} range={vpnRange} onChange={handleChange('vpn')} />
                    </div>
                ) : null}

                <div className="flex flex-align-center mb1-5">
                    <label className="text-semibold mr1" htmlFor="private-toggle">
                        {c('Label for new member').t`Private`}
                    </label>
                    <Toggle
                        id="private-toggle"
                        checked={model.private}
                        onChange={({ target }) => handleChange('private')(target.checked)}
                    />
                </div>

                <div className="flex flex-align-center mb1-5">
                    <label className="text-semibold mr1" htmlFor="admin-toggle">
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

export default MemberModal;
