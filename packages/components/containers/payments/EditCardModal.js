import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Modal, ContentModal, FooterModal, ResetButton, PrimaryButton, useLoading } from 'react-components';
import ContextApi from 'proton-shared/lib/context/api';
import { setPaymentMethod } from 'proton-shared/lib/api/payments';

import CardForm from './CardForm';
import useCard from './useCard';
import toDetails from './toDetails';

const EditCardModal = ({ card: existingCard, show, onClose }) => {
    const { api } = useContext(ContextApi);
    const { loading, loaded, load } = useLoading(false);
    const title = existingCard ? c('Title').t`Edit credit card` : c('Title').t`Add credit card`;
    const { card, updateCard, errors, isValid } = useCard(existingCard);

    const handleSubmit = async (event) => {
        if (!isValid) {
            event.preventDefault();
            return;
        }

        try {
            load();
            await api(setPaymentMethod({ Type: 'card', Details: toDetails(card) }));
            onClose();
        } catch (error) {
            loaded();
            throw error;
        }
    };

    return (
        <Modal show={show} onClose={onClose} title={title}>
            <ContentModal onSubmit={handleSubmit} onReset={onClose}>
                <CardForm card={card} errors={errors} onChange={updateCard} loading={loading} />
                <FooterModal>
                    <ResetButton disabled={loading}>{c('Action').t`Close`}</ResetButton>
                    <PrimaryButton loading={loading} type="submit">{c('Action').t`Save`}</PrimaryButton>
                </FooterModal>
            </ContentModal>
        </Modal>
    );
};

EditCardModal.propTypes = {
    card: PropTypes.object,
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
};

export default EditCardModal;