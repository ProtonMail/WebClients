import { useState } from 'react';

import PropTypes from 'prop-types';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { updateInvoiceText } from '@proton/shared/lib/api/settings';

import {
    Form,
    InputFieldTwo,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PrimaryButton,
    TextAreaTwo,
} from '../../components';
import { useApiWithoutResult, useEventManager, useNotifications, useUserSettings } from '../../hooks';

export interface Props {
    onClose?: () => void;
}

const InvoiceTextModal = (props: ModalProps) => {
    const [{ InvoiceText }] = useUserSettings();

    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const [invoiceText, setInvoiceText] = useState(InvoiceText);
    const { request, loading } = useApiWithoutResult(() => updateInvoiceText(invoiceText));

    const handleSubmit = async () => {
        await request();
        await call();
        props.onClose?.();
        createNotification({ text: c('Success').t`Invoice customized` });
    };

    return (
        <ModalTwo as={Form} onSubmit={handleSubmit} {...props}>
            <ModalTwoHeader title={c('Title').t`Add invoice details`} />
            <ModalTwoContent>
                <div className="mb1">{c('Info message for custom invoice modal')
                    .t`Add your name (or company name) and address to your invoices.`}</div>
                <InputFieldTwo
                    as={TextAreaTwo}
                    rows={3}
                    autoFocus
                    value={invoiceText}
                    onValue={setInvoiceText}
                    label={c('Label').t`Customize invoices`}
                    placeholder={c('Placeholder for custom invoice text')
                        .t`Add your name (or company name) and address to your invoices`}
                />
            </ModalTwoContent>

            <ModalTwoFooter>
                <Button onClick={props.onClose}>{c('Action').t`Close`}</Button>
                <PrimaryButton onClick={handleSubmit} loading={loading}>{c('Action').t`Save`}</PrimaryButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

InvoiceTextModal.propTypes = {
    onClose: PropTypes.func,
};

export default InvoiceTextModal;
