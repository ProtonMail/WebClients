import React, { useState } from 'react';
import { c } from 'ttag';
import { DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS, GIGA, MEMBER_ROLE } from 'proton-shared/lib/constants';
import { createMember, createMemberAddress, updateRole } from 'proton-shared/lib/api/members';
import { srpVerify } from 'proton-shared/lib/srp';
import { Domain, Organization, Address, CachedOrganizationKey } from 'proton-shared/lib/interfaces';
import { setupMemberKey } from 'proton-shared/lib/keys';
import { useApi, useNotifications, useEventManager, useGetAddresses } from '../../hooks';
import { FormModal, Row, Field, Label, PasswordInput, Input, Toggle, SelectTwo, Option } from '../../components';

import MemberStorageSelector, { getStorageRange } from './MemberStorageSelector';
import MemberVPNSelector, { getVPNRange } from './MemberVPNSelector';
import SelectEncryption from '../keys/addKey/SelectEncryption';

const FIVE_GIGA = 5 * GIGA;

interface Props {
    onClose?: () => void;
    organization: Organization;
    organizationKey: CachedOrganizationKey;
    domains: Domain[];
    domainsAddressesMap: any; // TODO: better typing
}

const MemberModal = ({ onClose, organization, organizationKey, domains, domainsAddressesMap, ...rest }: Props) => {
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const api = useApi();
    const getAddresses = useGetAddresses();
    const storageRange = getStorageRange({}, organization);
    const vpnRange = getVPNRange({}, organization);
    const [model, updateModel] = useState({
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
    const update = (key: string, value: any) => updateModel({ ...model, [key]: value });

    const [encryptionType, setEncryptionType] = useState(DEFAULT_ENCRYPTION_CONFIG);
    const [loading, setLoading] = useState(false);

    const hasVPN = !!organization.MaxVPN;

    const domainOptions = domains.map(({ DomainName }) => ({ text: DomainName, value: DomainName }));

    // TODO: better typings
    const handleChange = (key: string) => ({ target }: any) => update(key, target.value);
    const handleChangePrivate = ({ target }: any) => update('private', target.checked);
    const handleChangeAdmin = ({ target }: any) => update('admin', target.checked);
    const handleChangeStorage = (value: any) => update('storage', value);
    const handleChangeVPN = (value: any) => update('vpn', value);

    const save = async () => {
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
            await api(updateRole(Member.ID, MEMBER_ROLE.ORGANIZATION_OWNER));
        }
    };

    const validate = () => {
        if (!model.name.length) {
            return c('Error').t`Invalid name`;
        }

        if (!model.private && model.password !== model.confirm) {
            return c('Error').t`Invalid password`;
        }

        if (!model.address.length) {
            return c('Error').t`Invalid address`;
        }

        const domain = domains.find(({ DomainName }) => DomainName === model.domain);
        const address = (domainsAddressesMap[domain?.ID || ''] || []).find(
            ({ Email }: Address) => Email === `${model.address}@${model.domain}`
        );

        if (address) {
            return c('Error').t`Address already associated to a user`;
        }

        if (!model.private && !organizationKey) {
            return c('Error').t`The organization key must be activated first.`;
        }
    };

    const handleSubmit = async () => {
        const error = validate();
        if (error) {
            return createNotification({ type: 'error', text: error });
        }

        try {
            setLoading(true);
            await save();
            await call();
            onClose?.();
            createNotification({ text: c('Success').t`User created` });
        } catch (e) {
            setLoading(false);
        }
    };

    return (
        <FormModal
            title={c('Title').t`Add user`}
            loading={loading}
            onSubmit={handleSubmit}
            onClose={onClose}
            submit={c('Action').t`Save`}
            {...rest}
        >
            <Row>
                <Label htmlFor="nameInput">{c('Label').t`Name`}</Label>
                <Field>
                    <Input
                        id="nameInput"
                        placeholder="Thomas A. Anderson"
                        onChange={handleChange('name')}
                        value={model.name}
                        required
                    />
                </Field>
            </Row>
            <Row>
                <Label htmlFor="address-input">{c('Label').t`Address`}</Label>
                <Field>
                    <Input
                        id="address-input"
                        value={model.address}
                        onChange={handleChange('address')}
                        placeholder={c('Placeholder').t`Address`}
                        required
                    />
                </Field>
                <div className="ml1 on-mobile-ml0 flex flex-nowrap flex-align-items-center">
                    {domainOptions.length === 1 ? (
                        <span className="text-ellipsis" title={`@${domainOptions[0].value}`}>
                            @{domainOptions[0].value}
                        </span>
                    ) : (
                        <>
                            <SelectTwo value={model.domain} onChange={({ value }) => update('domain', value)}>
                                {domainOptions.map((option) => (
                                    <Option value={option.value} title={option.text}>
                                        @{option.text}
                                    </Option>
                                ))}
                            </SelectTwo>
                        </>
                    )}
                </div>
            </Row>
            <Row>
                <Label>{c('Label').t`Password`}</Label>
                <Field>
                    <div className="mb1">
                        <PasswordInput
                            value={model.password}
                            onChange={handleChange('password')}
                            placeholder={c('Placeholder').t`Password`}
                            required
                        />
                    </div>
                    <div>
                        <PasswordInput
                            value={model.confirm}
                            onChange={handleChange('confirm')}
                            placeholder={c('Placeholder').t`Confirm password`}
                            required
                        />
                    </div>
                </Field>
            </Row>
            {model.private ? null : (
                <Row>
                    <Label>{c('Label').t`Key strength`}</Label>
                    <div>
                        <SelectEncryption encryptionType={encryptionType} setEncryptionType={setEncryptionType} />
                    </div>
                </Row>
            )}
            <Row>
                <Label>{c('Label').t`Account storage`}</Label>
                <Field>
                    <MemberStorageSelector
                        value={model.storage}
                        step={GIGA}
                        range={storageRange}
                        onChange={handleChangeStorage}
                    />
                </Field>
            </Row>
            {hasVPN ? (
                <Row>
                    <Label>{c('Label').t`VPN connections`}</Label>
                    <Field>
                        <MemberVPNSelector value={model.vpn} step={1} range={vpnRange} onChange={handleChangeVPN} />
                    </Field>
                </Row>
            ) : null}

            <Row>
                <Label htmlFor="private-toggle">{c('Label for new member').t`Private`}</Label>
                <Field>
                    <Toggle id="private-toggle" checked={model.private} onChange={handleChangePrivate} />
                </Field>
            </Row>

            <Row>
                <Label htmlFor="admin-toggle">{c('Label for new member').t`Admin`}</Label>
                <Field>
                    <Toggle id="admin-toggle" checked={model.admin} onChange={handleChangeAdmin} />
                </Field>
            </Row>
        </FormModal>
    );
};

export default MemberModal;
