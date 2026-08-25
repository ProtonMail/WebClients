import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useLoading } from '@proton/hooks';
import { INVOICE_EMAIL_STATE } from '@proton/shared/lib/constants';
import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { InvoiceEmailSettings } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import Form from '../../../components/form/Form';
import type { ModalProps } from '../../../components/modalTwo/Modal';
import ModalTwo from '../../../components/modalTwo/Modal';
import ModalTwoContent from '../../../components/modalTwo/ModalContent';
import ModalTwoFooter from '../../../components/modalTwo/ModalFooter';
import ModalTwoHeader from '../../../components/modalTwo/ModalHeader';
import Toggle from '../../../components/toggle/Toggle';
import InputFieldTwo from '../../../components/v2/field/InputField';
import useFormErrors from '../../../components/v2/useFormErrors';

type Props = ModalProps & {
    initialInvoiceEmail: InvoiceEmailSettings;
    onSave: (invoiceEmail: InvoiceEmailSettings) => Promise<void>;
};

export const SetInvoiceEmailModal = (props: Props) => {
    const { initialInvoiceEmail, onSave, ...rest } = props;

    const { validator, onFormSubmit } = useFormErrors();
    const [loading, withLoading] = useLoading();

    const initialEmail = initialInvoiceEmail.InvoiceEmail ?? '';
    // BOUNCED still means emailing is on, it's just failing, so the toggle stays on for it.
    const initialSendEmailInvoice = initialInvoiceEmail.InvoiceEmailState !== INVOICE_EMAIL_STATE.DISABLED;

    const [invoiceEmail, setInvoiceEmail] = useState(initialEmail);
    const [sendEmailInvoice, setSendEmailInvoice] = useState(initialSendEmailInvoice);

    const hasChanges = invoiceEmail !== initialEmail || sendEmailInvoice !== initialSendEmailInvoice;

    // A bounced state is cleared by re-submitting, so allow saving the same address to retry it.
    const isBounced = initialInvoiceEmail.InvoiceEmailState === INVOICE_EMAIL_STATE.BOUNCED;
    const canSubmit = hasChanges || isBounced;

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.stopPropagation();

        if (!onFormSubmit()) {
            return;
        }

        void withLoading(
            onSave({
                InvoiceEmail: invoiceEmail || null,
                InvoiceEmailState: sendEmailInvoice ? INVOICE_EMAIL_STATE.ENABLED : INVOICE_EMAIL_STATE.DISABLED,
            })
                .then(() => rest.onClose?.())
                .catch(noop)
        );
    };

    return (
        <ModalTwo as={Form} onSubmit={handleSubmit} {...rest}>
            <ModalTwoHeader title={c('Title').t`Set invoice email`} />
            <ModalTwoContent>
                <p className="mb-6 color-weak">
                    {c('Set invoice email form note')
                        .t`Turn on automatic invoicing to receive bills via email. Enter the email address where you want to receive invoices.`}
                </p>
                <div className="mb-6 flex items-center flex-nowrap gap-4">
                    <Toggle
                        id="sendEmailInvoice"
                        className="shrink-0"
                        data-testid="send-email-invoice"
                        checked={sendEmailInvoice}
                        onChange={({ target }) => setSendEmailInvoice(target.checked)}
                    />
                    <label htmlFor="sendEmailInvoice" className="flex-1">
                        {c('Label').t`Send invoices by email`}
                    </label>
                </div>
                <InputFieldTwo
                    type="email"
                    label={c('Label').t`Email address`}
                    placeholder={c('Placeholder').t`billing@company.com`}
                    autoFocus
                    name="invoiceEmail"
                    data-testid="invoice-email"
                    error={validator(
                        sendEmailInvoice ? [requiredValidator(invoiceEmail), emailValidator(invoiceEmail)] : []
                    )}
                    value={invoiceEmail}
                    onValue={setInvoiceEmail}
                />
            </ModalTwoContent>

            <ModalTwoFooter>
                <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" type="submit" loading={loading} disabled={!canSubmit}>{c('Action')
                    .t`Save`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
