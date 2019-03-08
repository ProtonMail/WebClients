import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { SmallButton, useModal, ConfirmModal, Alert, EditCardModal, useApiWithoutResult } from 'react-components';
import { deletePaymentMethod } from 'proton-shared/lib/api/payments';
import { createNotification } from 'proton-shared/lib/state/notifications/actions';

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

const PaymentMethodActions = ({ method, createNotification, onChange }) => {
    const card = toCard(method);
    const { request } = useApiWithoutResult(deletePaymentMethod);
    const { isOpen: deleteModal, open: openDeleteModal, close: closeDeleteModal } = useModal();
    const { isOpen: editModal, open: openEditModal, close: closeEditModal } = useModal();

    const deleteMethod = async () => {
        await request(method.ID);
        await onChange();
        closeDeleteModal();
        createNotification({ text: c('Success').t`Payment method deleted` });
    };

    return (
        <>
            {method.Type === 'card' ? <SmallButton onClick={openEditModal}>{c('Action').t`Edit`}</SmallButton> : null}
            <EditCardModal card={card} show={editModal} onClose={closeEditModal} onChange={onChange} />
            <SmallButton onClick={openDeleteModal}>{c('Action').t`Delete`}</SmallButton>
            <ConfirmModal
                show={deleteModal}
                onClose={closeDeleteModal}
                onConfirm={deleteMethod}
                title={c('Confirmation title').t`Delete payment method`}
            >
                <Alert>{c('Confirmation message to delete payment method')
                    .t`Are you sure you want to delete this payment method?`}</Alert>
            </ConfirmModal>
        </>
    );
};

PaymentMethodActions.propTypes = {
    method: PropTypes.object.isRequired,
    createNotification: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired
};

const mapDispatchToProps = { createNotification };

export default connect(
    null,
    mapDispatchToProps
)(PaymentMethodActions);
