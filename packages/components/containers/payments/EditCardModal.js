import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { connect } from 'react-redux';
import { Modal, ContentModal, FooterModal, ResetButton, PrimaryButton, useApiWithoutResult } from 'react-components';
import { setPaymentMethod } from 'proton-shared/lib/api/payments';
import { createNotification } from 'proton-shared/lib/state/notifications/actions';

import CardForm from './CardForm';
import useCard from './useCard';
import toDetails from './toDetails';

const EditCardModal = ({ card: existingCard, show, onClose, onChange, createNotification }) => {
    const { loading, request } = useApiWithoutResult(setPaymentMethod);
    const title = existingCard ? c('Title').t`Edit credit card` : c('Title').t`Add credit card`;
    const { card, updateCard, errors, isValid } = useCard(existingCard);

    const handleSubmit = async (event) => {
        if (!isValid) {
            event.preventDefault();
            return;
        }

        await request({ Type: 'card', Details: toDetails(card) });
        await onChange();
        onClose();
        createNotification({ text: c('Success').t`Payment method updated` });
    };

    return (
        <Modal modalClassName="pm-modal--smaller" show={show} onClose={onClose} title={title}>
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
    onClose: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    createNotification: PropTypes.func.isRequired
};

const mapDispatchToProps = { createNotification };

export default connect(
    null,
    mapDispatchToProps
)(EditCardModal);
