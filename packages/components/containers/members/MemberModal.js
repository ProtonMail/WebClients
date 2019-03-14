import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import {
    Modal,
    ContentModal,
    FooterModal,
    ResetButton,
    PrimaryButton,
    Row,
    Label,
    Password,
    Input,
    Checkbox,
    Select,
    Text,
    useNotifications,
    useEventManager
} from 'react-components';

import MemberStorageSelector from './MemberStorageSelector';
import MemberVPNSelector from './MemberVPNSelector';
import useMemberModal from './useMemberModal';

const MemberModal = ({ show, onClose, organization, domains }) => {
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const { model, update, hasVPN, save, check } = useMemberModal(organization, domains);
    const domainOptions = domains.map(({ DomainName }) => ({ text: DomainName, value: DomainName }));
    const handleChange = (key) => ({ target }) => update(key, target.value);
    const handleChangePrivate = ({ target }) => update('private', target.checked);
    const handleChangeStorage = (value) => update('storage', value);
    const handleChangeVPN = (value) => update('vpn', value);

    const handleSubmit = async () => {
        try {
            check();
        } catch (error) {
            createNotification({ type: 'error', text: error.message });
        }

        await save();
        await call();
        onClose();
        createNotification({ text: c('Success').t`User created` });
    };

    return (
        <Modal show={show} onClose={onClose} title={c('Title').t`Add user`}>
            <ContentModal onSubmit={handleSubmit} onReset={onClose}>
                <Row>
                    <Label htmlFor="nameInput">{c('Label').t`Name`}</Label>
                    <div className="flex-autogrid">
                        <Input
                            id="nameInput"
                            className="flex-autogrid-item"
                            placeholder="Thomas A. Anderson"
                            onChange={handleChange('name')}
                            required
                        />
                        <Label className="flex-autogrid-item">
                            <Checkbox checked={model.private} onChange={handleChangePrivate} />{' '}
                            {c('Label for new member').t`Private`}
                        </Label>
                    </div>
                </Row>
                {model.private ? null : (
                    <Row>
                        <Label>{c('Label').t`Key strength`}</Label>
                    </Row>
                )}
                <Row>
                    <Label>{c('Label').t`Password`}</Label>
                    <div className="flex-autogrid">
                        <Password
                            value={model.password}
                            className="flex-autogrid-item mb1"
                            onChange={handleChange('password')}
                            placeholder={c('Placeholder').t`Password`}
                            required
                        />
                        <Password
                            value={model.confirm}
                            className="flex-autogrid-item"
                            onChange={handleChange('confirm')}
                            placeholder={c('Placeholder').t`Confirm Password`}
                            required
                        />
                    </div>
                </Row>
                <Row>
                    <Label>{c('Label').t`Address`}</Label>
                    <div className="flex-autogrid">
                        <Input onChange={handleChange('address')} placeholder={c('Placeholder').t`Address`} required />
                        {domainOptions.length === 1 ? (
                            <Text>{`@${domainOptions[0].value}`}</Text>
                        ) : (
                            <Select options={domainOptions} value={model.domain} onChange={handleChange('domain')} />
                        )}
                    </div>
                </Row>
                <Row>
                    <Label>{c('Label').t`Account storage`}</Label>
                    <MemberStorageSelector organization={organization} onChange={handleChangeStorage} />
                </Row>
                {hasVPN ? (
                    <Row>
                        <Label>{c('Label').t`VPN connections`}</Label>
                        <MemberVPNSelector organization={organization} onChange={handleChangeVPN} />
                    </Row>
                ) : null}
                <FooterModal>
                    <ResetButton>{c('Action').t`Cancel`}</ResetButton>
                    <PrimaryButton type="submit">{c('Action').t`Save`}</PrimaryButton>
                </FooterModal>
            </ContentModal>
        </Modal>
    );
};

MemberModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    organization: PropTypes.object.isRequired,
    domains: PropTypes.array.isRequired
};

export default MemberModal;
