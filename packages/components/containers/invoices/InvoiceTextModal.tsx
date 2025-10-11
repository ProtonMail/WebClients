import { useState } from 'react';

import { c } from 'ttag';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Button } from '@proton/atoms/Button/Button';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import TextAreaTwo from '@proton/components/components/v2/input/TextArea';
import useApi from '@proton/components/hooks/useApi';
import useEventManager from '@proton/components/hooks/useEventManager';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { updateInvoiceText } from '@proton/shared/lib/api/settings';

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
            <ModalTwoHeader title={c('Title').t`Edit invoice note`} />
            <ModalTwoContent>
                <div className="mb-4">
                    {c('Info message for custom invoice modal')
                        .t`Enter a note for the invoices. These details will be added to both personal and organizational invoices. They will appear only on invoices issued in the future.`}
                </div>
                <InputFieldTwo
                    as={TextAreaTwo}
                    rows={3}
                    autoFocus
                    value={invoiceText}
                    onValue={setInvoiceText}
                    label={c('Label').t`Note`}
                />
            </ModalTwoContent>

            <ModalTwoFooter>
                <Button onClick={props.onClose}>{c('Action').t`Cancel`}</Button>
                <Button
                    color="norm"
                    onClick={() => {
                        void withLoading(handleSubmit());
                    }}
                    loading={loading}
                >{c('Action').t`Save`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default InvoiceTextModal;
