import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import {
    DropdownActions,
    useModals,
    ConfirmModal,
    Alert,
    EditCardModal,
    useApi,
    useNotifications
} from 'react-components';
import { deletePaymentMethod, orderPaymentMethods } from 'proton-shared/lib/api/payments';

const toCard = ({ Details }) => {
    return {
        fullname: Details.Name,
        month: Details.ExpMonth,
        number: `•••• •••• •••• ${Details.Last4}`,
        year: Details.ExpYear,
        cvc: '•••',
        zip: Details.ZIP,
        country: Details.Country
    };
};

const PaymentMethodActions = ({ method, onChange, methods, index }) => {
    const card = toCard(method);
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const api = useApi();

    const deleteMethod = async () => {
        await api(deletePaymentMethod(method.ID));
        await onChange();
        createNotification({ text: c('Success').t`Payment method deleted` });
    };

    const markAsDefault = async () => {
        const IDs = methods.map(({ ID }) => ID);

        IDs.splice(index, 1);
        IDs.unshift(method.ID);

        await orderPaymentMethods(IDs);
        await onChange();
        createNotification({ text: c('Success').t`Payment method updated` });
    };

    const list = [
        method.Type === 'card' && {
            text: c('Action').t`Edit`,
            onClick: () => createModal(<EditCardModal card={card} onChange={onChange} />)
        },
        index > 0 && {
            text: c('Action').t`Mark as default`,
            onClick: markAsDefault
        },
        {
            text: c('Action').t`Delete`,
            onClick: () => {
                createModal(
                    <ConfirmModal onConfirm={deleteMethod} title={c('Confirmation title').t`Delete payment method`}>
                        <Alert>{c('Confirmation message to delete payment method')
                            .t`Are you sure you want to delete this payment method?`}</Alert>
                    </ConfirmModal>
                );
            }
        }
    ].filter(Boolean);

    return <DropdownActions className="pm-button--small" list={list} />;
};

PaymentMethodActions.propTypes = {
    method: PropTypes.object.isRequired,
    methods: PropTypes.array.isRequired,
    index: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired
};

export default PaymentMethodActions;
