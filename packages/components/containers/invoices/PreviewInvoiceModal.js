import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Modal, ContentModal, FooterModal, ResetButton, useApiResult } from 'react-components';
import { getInvoice } from 'proton-shared/lib/api/payments';

const PreviewInvoiceModal = ({ show, onClose, invoice }) => {
    const { result: buffer } = useApiResult(() => getInvoice(invoice.ID), []);
    const filename = c('Title for PDF file').t`ProtonMail invoice` + ` ${invoice.ID}.pdf`;
    const blob = new Blob([buffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    return (
        <Modal show={show} onClose={onClose} title={c('Title').t`Add invoice details`}>
            <ContentModal onReset={onClose}>
                <object data={url} className="w100" type="application/pdf" height={500} title={filename}>
                    <embed src={url} type="application/pdf" />
                </object>
                <FooterModal>
                    <ResetButton>{c('Action').t`Close`}</ResetButton>
                </FooterModal>
            </ContentModal>
        </Modal>
    );
};

PreviewInvoiceModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    invoice: PropTypes.object.isRequired
};

export default PreviewInvoiceModal;
