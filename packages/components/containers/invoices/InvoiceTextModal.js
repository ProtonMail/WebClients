import { useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { updateInvoiceText } from '@proton/shared/lib/api/settings';
import { FormModal, Alert, Label, TextArea, Block } from '../../components';
import { useApiWithoutResult, useUserSettings, useEventManager, useNotifications } from '../../hooks';

const InvoiceTextModal = ({ onClose, ...rest }) => {
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
        <FormModal
            small
            onClose={onClose}
            onSubmit={handleSubmit}
            loading={loading}
            close={c('Action').t`Close`}
            submit={c('Action').t`Save`}
            title={c('Title').t`Add invoice details`}
            {...rest}
        >
            <Alert>{c('Info message for custom invoice modal')
                .t`Add your name (or company name) and address to your invoices.`}</Alert>
            <Block>
                <Label htmlFor="invoiceTextarea">{c('Label').t`Customize invoices`}</Label>
            </Block>
            <TextArea
                id="invoiceTextarea"
                autoFocus
                value={invoiceText}
                placeholder={c('Placeholder for custom invoice text')
                    .t`Add your name (or company name) and address to your invoices`}
                onChange={handleChange}
                disabled={loading}
            />
        </FormModal>
    );
};

InvoiceTextModal.propTypes = {
    onClose: PropTypes.func,
};

export default InvoiceTextModal;
