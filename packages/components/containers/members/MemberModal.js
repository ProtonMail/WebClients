import React, { useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import {
    FormModal,
    Row,
    Field,
    Label,
    PasswordInput,
    Input,
    Checkbox,
    Select,
    useApi,
    useNotifications,
    useEventManager
} from 'react-components';

import MemberStorageSelector from './MemberStorageSelector';
import MemberVPNSelector from './MemberVPNSelector';
import { DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS, GIGA } from 'proton-shared/lib/constants';
import { createMember, createMemberAddress } from 'proton-shared/lib/api/members';
import { setupMemberKey } from './actionHelper';
import SelectEncryption from '../keys/addKey/SelectEncryption';
import { srpVerify } from 'proton-shared/lib/srp';

const FIVE_GIGA = 5 * GIGA;

const MemberModal = ({ onClose, organization, organizationKey, domains, ...rest }) => {
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const api = useApi();
    const [model, updateModel] = useState({
        name: '',
        private: false,
        password: '',
        confirm: '',
        address: '',
        domain: domains[0].DomainName,
        vpn: 1,
        storage: FIVE_GIGA
    });
    const update = (key, value) => updateModel({ ...model, [key]: value });

    const [encryptionType, setEncryptionType] = useState(DEFAULT_ENCRYPTION_CONFIG);
    const [loading, setLoading] = useState(false);

    const hasVPN = !!organization.MaxVPN;

    const domainOptions = domains.map(({ DomainName }) => ({ text: DomainName, value: DomainName }));

    const handleChange = (key) => ({ target }) => update(key, target.value);
    const handleChangePrivate = ({ target }) => update('private', target.checked);
    const handleChangeStorage = (value) => update('storage', value);
    const handleChangeVPN = (value) => update('vpn', value);

    const save = async () => {
        const { Member } = await srpVerify({
            api,
            credentials: { password: model.password },
            config: createMember({
                Name: model.name,
                Private: +model.private,
                MaxSpace: model.storage,
                MaxVPN: model.vpn
            })
        });

        const { Address } = await api(
            createMemberAddress(Member.ID, {
                Local: model.address,
                Domain: model.domain
            })
        );

        if (!model.private) {
            await setupMemberKey({
                api,
                Member,
                Address,
                organizationKey,
                encryptionConfig: ENCRYPTION_CONFIGS[encryptionType],
                password: model.password
            });
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
        const address = domain.addresses.find(({ Email }) => Email === `${model.address}@${model.domain}`);

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
            onClose();
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
            close={c('Action').t`Cancel`}
            submit={c('Action').t`Save`}
            {...rest}
        >
            <Row>
                <Label htmlFor="nameInput">{c('Label').t`Name`}</Label>
                <Field>
                    <Input id="nameInput" placeholder="Thomas A. Anderson" onChange={handleChange('name')} required />
                </Field>
                <div className="ml1 flex flex-nowrap flex-items-center">
                    <Checkbox checked={model.private} onChange={handleChangePrivate} />
                    {c('Label for new member').t`Private`}
                </div>
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
            <Row>
                <Label>{c('Label').t`Address`}</Label>
                <Field>
                    <Input onChange={handleChange('address')} placeholder={c('Placeholder').t`Address`} required />
                </Field>
                <div className="ml1 flex flex-nowrap flex-items-center">
                    {domainOptions.length === 1 ? (
                        `@${domainOptions[0].value}`
                    ) : (
                        <Select options={domainOptions} value={model.domain} onChange={handleChange('domain')} />
                    )}
                </div>
            </Row>
            <Row>
                <Label>{c('Label').t`Account storage`}</Label>
                <Field>
                    <MemberStorageSelector organization={organization} onChange={handleChangeStorage} />
                </Field>
            </Row>
            {hasVPN ? (
                <Row>
                    <Label>{c('Label').t`VPN connections`}</Label>
                    <Field>
                        <MemberVPNSelector organization={organization} onChange={handleChangeVPN} />
                    </Field>
                </Row>
            ) : null}
        </FormModal>
    );
};

MemberModal.propTypes = {
    onClose: PropTypes.func,
    organization: PropTypes.object.isRequired,
    organizationKey: PropTypes.object.isRequired,
    domains: PropTypes.array.isRequired
};

export default MemberModal;
