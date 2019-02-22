import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { SmallButton, useModal, ConfirmModal, Alert } from 'react-components';
import ContextApi from 'proton-shared/lib/context/api';
import { deletePaymentMethod } from 'proton-shared/lib/api/payments';

const PaymentMethodActions = ({ method, onChange }) => {
    const { api } = useContext(ContextApi);
    const { isOpen: deleteModal, open: openDeleteModal, close: closeDeleteModal } = useModal();
    const { isOpen: editModal, open: openEditModal, close: closeEditModal } = useModal();

    const deleteMethod = async () => {
        await api(deletePaymentMethod(method.ID));
        onChange();
    };

    const editMethod = async () => {
        onChange();
    };

    return (
        <>
            <SmallButton onClick={openEditModal}>{c('Action').t`Edit`}</SmallButton>
            <PaymentMethodModal method={method} show={editModal} onConfirm={editMethod} onClose={closeEditModal} />
            <SmallButton onClick={openDeleteModal}>{c('Action').t`Delete`}</SmallButton>
            <ConfirmModal show={deleteModal} onClose={closeDeleteModal} onConfirm={deleteMethod} title={c('Confirmation title').t`Delete payment method`}>
                <Alert>{c('Confirmation message to delete payment method').t`Are you sure you want to delete this payment method?`}</Alert>
            </ConfirmModal>
        </>
    );
};

PaymentMethodActions.propTypes = {
    method: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
};

export default PaymentMethodActions;