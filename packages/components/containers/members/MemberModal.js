import React, { useState, useContext } from 'react';
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
    Input
} from 'react-components';
import ContextApi from 'proton-shared/lib/context/api';

import MemberStorageSelector from './MemberStorageSelector';
import MemberVPNSelector from './MemberVPNSelector';

const MemberModal = ({ show, onClose, member }) => {
    const { api } = useContext(ContextApi);
    const { ID, Name = '' } = member;
    const isUpdate = ID;
    const title = isUpdate ? c('Title').t`Update user` : c('Title').t`Add user`;
    const [model, updateModel] = useState({ name: Name, password: '', confirm: '', address: '', domain: '' });

    const handleSubmit = async () => {
        await api();
        onClose();
    };

    const handleChangePassword = (event) => updateModel({ password: event.target.value });
    const handleChangeConfirmPassword = (event) => updateModel({ confirm: event.target.value });
    const handleChangeName = (event) => updateModel({ name: event.target.value });
    const handleChangeAddress = (event) => updateModel({ address: event.target.value });
    const handleChangeStorage = () => {};
    const handleChangeVPN = () => {};

    return (
        <Modal show={show} onClose={onClose} title={title}>
            <ContentModal onSubmit={handleSubmit} onReset={onClose}>
                <Row>
                    <Label htmlFor="nameInput">{c('Label').t`Name`}</Label>
                    <Input id="nameInput" placeholder="Thomas A. Anderson" onChange={handleChangeName} />
                </Row>
                <Row>
                    <Label>{c('Label').t`Password`}</Label>
                    <div className="flex-autogrid">
                        <Password
                            className="flex-autogrid-item mb1"
                            onChange={handleChangePassword}
                            placeholder={c('Placeholder').t`Password`}
                        />
                        <Password
                            className="flex-autogrid-item"
                            onChange={handleChangeConfirmPassword}
                            placeholder={c('Placeholder').t`Confirm Password`}
                        />
                    </div>
                </Row>
                <Row>
                    <Label>{c('Label').t`Address`}</Label>
                    <div>
                        <Input onChange={handleChangeAddress} placeholder={c('Placeholder').t`Address`} />
                        <span>{model.domain}</span>
                    </div>
                </Row>
                <MemberStorageSelector member={member} onChange={handleChangeStorage} />
                <MemberVPNSelector member={member} onChange={handleChangeVPN} />
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
    member: PropTypes.object
};

MemberModal.defaultProps = {
    member: {}
};

export default MemberModal;
