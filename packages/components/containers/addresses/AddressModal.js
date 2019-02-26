import React from 'react';
import { c } from 'ttag';
import { Modal, ContentModal, ResetButton, FooterModal, ResetButton, PrimaryButton } from 'react-components';

const AddressModal = ({ show, onClose }) => {
    const handleSubmit = () => {};

    return (
        <Modal show={show} onClose={onClose}>
            <ContentModal onSubmit={handleSubmit} onReset={onClose}>
                <FooterModal>
                    <ResetButton>{c('Action').t`Cancel`}</ResetButton>
                    <PrimaryButton type="submit">{c('Action').t`Save`}</PrimaryButton>
                </FooterModal>
            </ContentModal>
        </Modal>
    );
};

export default AddressModal;