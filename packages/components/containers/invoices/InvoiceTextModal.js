import React, { useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import {
    Modal,
    Alert,
    ContentModal,
    InnerModal,
    FooterModal,
    PrimaryButton,
    Label,
    TextArea,
    Block,
    ResetButton,
    useApiWithoutResult,
    useUserSettings,
    useEventManager,
    useNotifications
} from 'react-components';
import { updateInvoiceText } from 'proton-shared/lib/api/settings';

const InvoiceTextModal = ({ onClose }) => {
    const [{ InvoiceText }] = useUserSettings();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const [invoiceText, setInvoiceText] = useState(InvoiceText);
    const handleChange = ({ target }) => setInvoiceText(target.value);
    const { request, loading } = useApiWithoutResult(() => updateInvoiceText(invoiceText));

    const handleSubmit = async () => {
        await request();
        await call();
        onClose();
        createNotification({ text: c('Success').t`Invoice customized` });
    };

    return (
        <Modal type="small" onClose={onClose} title={c('Title').t`Add invoice details`}>
            <ContentModal onSubmit={handleSubmit} onReset={onClose}>
                <InnerModal>
                    <Alert>{c('Info message for custom invoice modal')
                        .t`Add your name (or company name) and address to your invoices.`}</Alert>
                    <Block>
                        <Label htmlFor="invoiceTextarea">{c('Label').t`Customize invoices`}</Label>
                    </Block>
                    <TextArea
                        id="invoiceTextarea"
                        autoFocus
                        required
                        value={invoiceText}
                        placeholder={c('Placeholder for custom invoice text')
                            .t`Add your name (or company name) and address to your invoices`}
                        onChange={handleChange}
                        disabled={loading}
                    />
                </InnerModal>
                <FooterModal>
                    <ResetButton disabled={loading}>{c('Action').t`Close`}</ResetButton>
                    <PrimaryButton loading={loading} type="submit">{c('Action').t`Save`}</PrimaryButton>
                </FooterModal>
            </ContentModal>
        </Modal>
    );
};

InvoiceTextModal.propTypes = {
    onClose: PropTypes.func.isRequired
};

export default InvoiceTextModal;
