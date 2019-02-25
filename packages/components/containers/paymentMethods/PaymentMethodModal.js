import React from 'react';
import { Modal, HeaderModal, ContentModal, FooterModal, ResetButton, PrimaryButton } from 'react-components';
import PropTypes from 'prop-types';
import { c } from 'ttag/types';

const PaymentMethodModal = ({ method, show, onConfirm, onClose}) => {
    const card = toCard(method);
    const handleChangeCard = () => {

    };
    return (
        <Modal show={show} onClose={onClose}>
            <HeaderModal onClose={onClose}>{c('Title').t`Payment method`}</HeaderModal>
            <ContentModal onSubmit={onConfirm} onReset={onClose}>
                <PaymentForm card={card} onChange={handleChangeCard} />
                <FooterModal>
                    <ResetButton>{c('Action').t`Close`}</ResetButton>
                    <PrimaryButton type="submit">{c('Action').t`Save`}</PrimaryButton>
                </FooterModal>
            </ContentModal>
        </Modal>
    );
};

PaymentMethodModal.propTypes = {
    method: PropTypes.object.isRequired,
    show: PropTypes.bool.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired
};

export default PaymentMethodModal;