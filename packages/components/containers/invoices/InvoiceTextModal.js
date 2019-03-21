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
    useApiWithoutResult,
    useUserSettings
} from 'react-components';
import { updateInvoiceText } from 'proton-shared/lib/api/settings';

const InvoiceTextModal = ({ show, onClose }) => {
    const [{ InvoiceText }] = useUserSettings();
    const [invoiceText, setInvoiceText] = useState(InvoiceText);
    const handleChange = ({ target }) => setInvoiceText(target.value);
    const { request, loading } = useApiWithoutResult(() => updateInvoiceText(invoiceText));

    return (
        <Modal
            modalClassName="pm-modal--smaller"
            show={show}
            onClose={onClose}
            title={c('Title').t`Add invoice details`}
        >
            <ContentModal onSubmit={request} onReset={onClose}>
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
