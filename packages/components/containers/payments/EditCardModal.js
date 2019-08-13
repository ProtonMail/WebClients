import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { FormModal, useApiWithoutResult, useNotifications } from 'react-components';
import { setPaymentMethod } from 'proton-shared/lib/api/payments';
import { PAYMENT_METHOD_TYPES } from 'proton-shared/lib/constants';

import Card from './Card';
import useCard from './useCard';
import toDetails from './toDetails';

const EditCardModal = ({ card: existingCard, onClose, onChange, ...rest }) => {
    const { loading, request } = useApiWithoutResult(setPaymentMethod);
    const { createNotification } = useNotifications();
    const title = existingCard ? c('Title').t`Edit credit/debit card` : c('Title').t`Add credit/debit card`;
    const { card, updateCard, errors, isValid } = useCard(existingCard);

    const handleSubmit = async (event) => {
        if (!isValid) {
            event.preventDefault();
            return;
        }

        await request({ Type: PAYMENT_METHOD_TYPES.CARD, Details: toDetails(card) });
        await onChange();
        onClose();
        createNotification({ text: c('Success').t`Payment method updated` });
    };

    return (
        <FormModal
            small
            onSubmit={handleSubmit}
            onClose={onClose}
            title={title}
            loading={loading}
            close={c('Action').t`Close`}
            submit={c('Action').t`Save`}
            {...rest}
        >
            <Card card={card} errors={errors} onChange={updateCard} loading={loading} />
        </FormModal>
    );
};

EditCardModal.propTypes = {
    card: PropTypes.object,
    onClose: PropTypes.func,
    onChange: PropTypes.func.isRequired
};

export default EditCardModal;
