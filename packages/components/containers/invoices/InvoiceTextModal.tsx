import { useState } from 'react';

import PropTypes from 'prop-types';
import { c } from 'ttag';

import { updateInvoiceText } from '@proton/shared/lib/api/settings';

import { Alert, Block, FormModal, Label, TextArea } from '../../components';
import { useApiWithoutResult, useEventManager, useNotifications, useUserSettings } from '../../hooks';

export interface Props {
    onClose: () => void;
}

const InvoiceTextModal = ({ onClose, ...rest }: Props) => {
    const [{ InvoiceText }] = useUserSettings();

    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const [invoiceText, setInvoiceText] = useState(InvoiceText);
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
            <Alert className="mb1">{c('Info message for custom invoice modal')
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
                onChange={({ target }) => setInvoiceText(target.value)}
                disabled={loading}
            />
        </FormModal>
    );
};

InvoiceTextModal.propTypes = {
    onClose: PropTypes.func,
};

export default InvoiceTextModal;
