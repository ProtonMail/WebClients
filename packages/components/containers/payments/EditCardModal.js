import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { FormModal, useNotifications, useApi, useLoading, useModals } from 'react-components';
import { setPaymentMethod } from 'proton-shared/lib/api/payments';
import { PAYMENT_METHOD_TYPES } from 'proton-shared/lib/constants';

import Card from './Card';
import useCard from './useCard';
import toDetails from './toDetails';
import { handlePaymentToken } from './paymentTokenHelper';

const EditCardModal = ({ card: existingCard, onClose, onChange, ...rest }) => {
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const title = existingCard ? c('Title').t`Edit credit/debit card` : c('Title').t`Add credit/debit card`;
    const { card, updateCard, errors, isValid } = useCard(existingCard);

    const handleSubmit = async (event) => {
        if (!isValid) {
            event.preventDefault();
            return;
        }

        const { Payment } = await handlePaymentToken({
            params: {
                Payment: {
                    Type: PAYMENT_METHOD_TYPES.CARD,
                    Details: toDetails(card)
                }
            },
            api,
            createModal
        });
        await api(setPaymentMethod(Payment));
        await onChange();
        onClose();
        createNotification({ text: c('Success').t`Payment method updated` });
    };

    return (
        <FormModal
            small
            onSubmit={(event) => withLoading(handleSubmit(event))}
            onClose={onClose}
            title={title}
            loading={loading}
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
