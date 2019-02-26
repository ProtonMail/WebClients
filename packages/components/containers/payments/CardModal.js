import React from 'react';
import { Modal, ContentModal, FooterModal, ResetButton, PrimaryButton } from 'react-components';
import PropTypes from 'prop-types';
import { c } from 'ttag';

import CardForm from './CardForm';
import useCard from './useCard';

const CardModal = ({ card: existingCard, show, onClose }) => {
    const { card, updateCard } = useCard(existingCard);

    const handleChangeCard = (card) => updateCard(card);

    const handleSubmit = () => {

    };

    return (
        <Modal show={show} onClose={onClose} title={c('Title').t`Payment method`}>
            <ContentModal onSubmit={handleSubmit} onReset={onClose}>
                <CardForm card={card} onChange={handleChangeCard} />
                <FooterModal className="flex flex-spacebetween">
                    <ResetButton>{c('Action').t`Close`}</ResetButton>
                    <PrimaryButton type="submit">{c('Action').t`Save`}</PrimaryButton>
                </FooterModal>
            </ContentModal>
        </Modal>
    );
};

CardModal.propTypes = {
    method: PropTypes.object,
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
};

export default CardModal;