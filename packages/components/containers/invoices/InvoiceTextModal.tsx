import { useState } from 'react';

import PropTypes from 'prop-types';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useLoading } from '@proton/hooks';
import { updateInvoiceText } from '@proton/shared/lib/api/settings';

import type { ModalProps } from '../../components';
import {
    Form,
    InputFieldTwo,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PrimaryButton,
    TextAreaTwo,
} from '../../components';
import { useApi, useEventManager, useNotifications, useUserSettings } from '../../hooks';

export interface Props {
    onClose?: () => void;
}

const InvoiceTextModal = (props: ModalProps) => {
    const [{ InvoiceText }] = useUserSettings();

    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const [invoiceText, setInvoiceText] = useState(InvoiceText);
    const api = useApi();
    const [loading, withLoading] = useLoading();

    const handleSubmit = async () => {
        await api(updateInvoiceText(invoiceText));
        await call();
        props.onClose?.();
        createNotification({ text: c('Success').t`Invoice customized` });
    };

    return (
        <ModalTwo as={Form} onSubmit={handleSubmit} {...props}>
            <ModalTwoHeader title={c('Title').t`Edit invoice details`} />
            <ModalTwoContent>
                <div className="mb-4">
                    {c('Info message for custom invoice modal')
                        .t`Enter a name and address for yourself or your organization. These details will be added to both personal and organizational invoices.`}
                </div>
                <InputFieldTwo
                    as={TextAreaTwo}
                    rows={3}
                    autoFocus
                    value={invoiceText}
                    onValue={setInvoiceText}
                    label={c('Label').t`Name and address`}
                />
            </ModalTwoContent>

            <ModalTwoFooter>
                <Button onClick={props.onClose}>{c('Action').t`Cancel`}</Button>
                <PrimaryButton
                    onClick={() => {
                        withLoading(handleSubmit());
                    }}
                    loading={loading}
                >{c('Action').t`Save`}</PrimaryButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

InvoiceTextModal.propTypes = {
    onClose: PropTypes.func,
};

export default InvoiceTextModal;
