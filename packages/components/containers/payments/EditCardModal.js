import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { setPaymentMethod } from '@proton/shared/lib/api/payments';
import { PAYMENT_METHOD_TYPES, ADD_CARD_MODE } from '@proton/shared/lib/constants';
import { FormModal } from '../../components';
import { useNotifications, useApi, useLoading, useModals, useEventManager } from '../../hooks';

import CreditCard from './CreditCard';
import useCard from './useCard';
import toDetails from './toDetails';
import { handlePaymentToken } from './paymentTokenHelper';

const EditCardModal = ({ card: existingCard, onClose, ...rest }) => {
    const api = useApi();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const title = existingCard ? c('Title').t`Edit credit/debit card` : c('Title').t`Add credit/debit card`;
    const { card, setCard, errors, isValid } = useCard(existingCard);

    const handleSubmit = async (event) => {
        if (!isValid) {
            event.preventDefault();
            return;
        }

        const { Payment } = await handlePaymentToken({
            params: {
                Payment: {
                    Type: PAYMENT_METHOD_TYPES.CARD,
                    Details: toDetails(card),
                },
            },
            mode: ADD_CARD_MODE,
            api,
            createModal,
        });
        await api(setPaymentMethod(Payment));
        await call();
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
            <CreditCard card={card} errors={errors} onChange={setCard} loading={loading} />
        </FormModal>
    );
};

EditCardModal.propTypes = {
    card: PropTypes.object,
    onClose: PropTypes.func,
};

export default EditCardModal;
