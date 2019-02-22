import React from 'react';
import { Modal, HeaderModal, ContentModal, FooterModal, Button, PrimaryButton } from 'react-components';
import PropTypes from 'prop-types';
import { c } from 'ttag/types';

const PaymentMethodModal = ({ method, show, onConfirm, onClose}) => {
    const card = toCard(method);
    const handleChangeCard = () => {

    };
    return (
        <Modal show={show} onClose={onClose}>
            <HeaderModal onClose={onClose}>{c('Title').t`Payment method`}</HeaderModal>
            <ContentModal onSubmit={onConfirm}>
                <PaymentForm card={card} onChange={handleChangeCard} />
                <FooterModal>
                    <Button onClick={onClose}>{c('Action').t`Close`}</Button>
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