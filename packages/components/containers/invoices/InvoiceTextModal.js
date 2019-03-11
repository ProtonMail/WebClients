import React, { useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import {
    Modal,
    Alert,
    ContentModal,
    FooterModal,
    PrimaryButton,
    Label,
    TextArea,
    Block,
    ResetButton,
    useLoading
} from 'react-components';
import { updateInvoiceText } from 'proton-shared/lib/api/settings';

import useApi from '../../hooks/useApi';

const InvoiceTextModal = ({ show, onClose }) => {
    const api = useApi();
    const { loading, loaded, load } = useLoading(false);
    const [invoiceText, setInvoiceText] = useState(''); // TODO get it from settings model
    const handleChange = (event) => setInvoiceText(event.target.value);

    const handleSubmit = async () => {
        try {
            load();
            await api(updateInvoiceText(invoiceText));
            onClose();
        } catch (error) {
            loaded();
            throw error;
        }
    };

    return (
        <Modal show={show} onClose={onClose} title={c('Title').t`Add invoice details`}>
            <ContentModal modalClassName="pm-modal--smaller" onSubmit={handleSubmit} onReset={onClose}>
                <Alert>{c('Info message for custom invoice modal')
                    .t`Add your name (or company name) and address to your invoices.`}</Alert>
                <Block>
                    <Label htmlFor="invoiceTextarea">{c('Label').t`Customize invoices`}</Label>
                </Block>
                <TextArea
                    id="invoiceTextarea"
                    value={invoiceText}
                    placeholder={c('Placeholder for custom invoice text')
                        .t`Add your name (or company name) and address to your invoices`}
                    onChange={handleChange}
                    disabled={loading}
                />
                <FooterModal>
                    <ResetButton disabled={loading}>{c('Action').t`Close`}</ResetButton>
                    <PrimaryButton loading={loading} type="submit">{c('Action').t`Save`}</PrimaryButton>
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
