import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Modal, ContentModal, FooterModal, ResetButton, PrimaryButton } from 'react-components';

const MemberModal = ({ show, onClose, member }) => {
    const isUpdate = !!member;
    const title = isUpdate ? c('Title').t`Update user` : c('Title').t`Add user`;

    const handleSubmit = () => {

    };

    return (
        <Modal show={show} onClose={onClose} title={title}>
            <ContentModal onSubmit={handleSubmit} onReset={onClose}>
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

export default MemberModal;