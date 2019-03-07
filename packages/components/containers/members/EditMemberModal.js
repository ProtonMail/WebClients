import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { c } from 'ttag';
import {
    Modal,
    ContentModal,
    FooterModal,
    ResetButton,
    PrimaryButton,
    Row,
    Label,
    Input,
    useApi
} from 'react-components';

import MemberStorageSelector from './MemberStorageSelector';
import MemberVPNSelector from './MemberVPNSelector';
import { createNotification } from 'proton-shared/lib/state/notifications/actions';
import { updateName, updateQuota, updateVPN } from 'proton-shared/lib/api/members';

const EditMemberModal = ({ show, onClose, member, organization, createNotification }) => {
    const [model, updateModel] = useState({ name: member.Name, storage: member.MaxSpace, vpn: member.MaxVPN });
    const { request: requestUpdateName } = useApi(updateName);
    const { request: requestUpdateQuota } = useApi(updateQuota);
    const { request: requestUpdateVPN } = useApi(updateVPN);
    const hasVPN = organization.MaxVPN;
    const handleChangeName = ({ target }) => updateModel({ ...model, name: target.value });
    const handleChangeStorage = (storage) => updateModel({ ...model, storage });
    const handleChangeVPN = (vpn) => updateModel({ ...model, vpn });
    const handleSubmit = async () => {
        await requestUpdateName(model.name);
        await requestUpdateQuota(model.storage);
        if (hasVPN) {
            await requestUpdateVPN(model.vpn);
        }
        // TODO call event manager
        onClose();
        createNotification({ text: c('Success').t`User updated` });
    };
    return (
        <Modal show={show} onClose={onClose} title={c('Title').t`Edit user`}>
            <ContentModal onSubmit={handleSubmit} onReset={onClose}>
                <Row>
                    <Label htmlFor="nameInput">{c('Label').t`Name`}</Label>
                    <Input
                        value={model.name}
                        id="nameInput"
                        placeholder="Thomas A. Anderson"
                        onChange={handleChangeName}
                        required
                    />
                </Row>
                <Row>
                    <Label>{c('Label').t`Account storage`}</Label>
                    <MemberStorageSelector organization={organization} member={member} onChange={handleChangeStorage} />
                </Row>
                {hasVPN ? (
                    <Row>
                        <Label>{c('Label').t`VPN connections`}</Label>
                        <MemberVPNSelector organization={organization} member={member} onChange={handleChangeVPN} />
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

EditMemberModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    member: PropTypes.object.isRequired,
    organization: PropTypes.object.isRequired,
    createNotification: PropTypes.func.isRequired
};

const mapStateToProps = ({ organization: { data: organization } }) => ({ organization });
const mapDispatchToProps = { createNotification };

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(EditMemberModal);
