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
    useNotifications,
    useEventManager,
} from 'react-components';
import { deletePaymentMethod, orderPaymentMethods } from 'proton-shared/lib/api/payments';
import { isExpired } from 'proton-shared/lib/helpers/card';
import { PAYMENT_METHOD_TYPES } from 'proton-shared/lib/constants';

const toCard = ({ Details = {}, Type }) => {
    if (Type === 'card') {
        return {
            fullname: Details.Name,
            month: Details.ExpMonth,
            number: '',
            year: Details.ExpYear.slice(-2),
            cvc: '',
            zip: Details.ZIP,
            country: Details.Country,
        };
    }
    return Details;
};

const PaymentMethodActions = ({ method, methods, index }) => {
    const card = toCard(method);
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const api = useApi();
    const { call } = useEventManager();

    const deleteMethod = async () => {
        await api(deletePaymentMethod(method.ID));
        await call();
        createNotification({ text: c('Success').t`Payment method deleted` });
    };

    const markAsDefault = async () => {
        const IDs = methods.map(({ ID }) => ID);

        IDs.splice(index, 1);
        IDs.unshift(method.ID);
        await api(orderPaymentMethods(IDs));
        await call();
        createNotification({ text: c('Success').t`Payment method updated` });
    };

    const list = [
        method.Type === PAYMENT_METHOD_TYPES.CARD && {
            text: c('Action').t`Edit`,
            onClick: () => createModal(<EditCardModal card={card} />),
        },
        index > 0 &&
            !isExpired(method.Details) && {
                text: c('Action').t`Mark as default`,
                onClick: markAsDefault,
            },
        {
            text: c('Action').t`Delete`,
            actionType: 'delete',
            onClick: () => {
                createModal(
                    <ConfirmModal onConfirm={deleteMethod} title={c('Confirmation title').t`Delete payment method`}>
                        <Alert type="warning">{c('Confirmation message to delete payment method')
                            .t`Are you sure you want to delete this payment method?`}</Alert>
                    </ConfirmModal>
                );
            },
        },
    ].filter(Boolean);

    return <DropdownActions className="pm-button--small" list={list} />;
};

PaymentMethodActions.propTypes = {
    method: PropTypes.object.isRequired,
    methods: PropTypes.array.isRequired,
    index: PropTypes.number.isRequired,
};

export default PaymentMethodActions;
