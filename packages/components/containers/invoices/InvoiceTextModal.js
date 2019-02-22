import React, { useContext, useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Modal, Alert, HeaderModal, ContentModal, FooterModal, Button, PrimaryButton, Label, TextArea } from 'react-components';
import ContextApi from 'proton-shared/lib/context/api';
import { updateInvoiceText } from 'proton-shared/lib/api/settings';

const InvoiceTextModal = ({ show, onClose }) => {
    const { api } = useContext(ContextApi);
    const [invoiceText, setInvoiceText] = useState(''); // TODO get it from settings model
    const handleChange = (event) => setInvoiceText(event.target.value);

    const handleSubmit = async () => {
        await api(updateInvoiceText(invoiceText));
        onClose();
    };

    return (
        <Modal show={show} onClose={onClose}>
            <HeaderModal onClose={onClose}>{c('Title').t`Add invoice details`}</HeaderModal>
            <ContentModal onSubmit={handleSubmit}>
                <Alert>{c('Info message for custom invoice modal').t`Add your name (or company name) and address to your invoices.`}</Alert>
                <Label htmlFor="invoiceTextarea">{c('Label').t`Customize invoices`}</Label>
                <TextArea id="invoiceTextarea" value={invoiceText} onChange={handleChange} />
                <FooterModal>
                    <Button onClick={onClose}>{c('Action').t`Close`}</Button>
                    <PrimaryButton type="submit">{c('Action').t`Save`}</PrimaryButton>
                </FooterModal>
            </ContentModal>
        </Modal>
    );
};

InvoiceTextModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
};

export default InvoiceTextModal;