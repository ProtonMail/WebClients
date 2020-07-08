import React from 'react';
import { c } from 'ttag';

import { Alert, FormModal, PrimaryButton, Button, ResetButton } from '../../../index';

interface Props {
    email?: string;
    phone?: string;
    onEdit: () => void;
    onResend: () => void;
    [key: string]: any;
}

const RequestNewCodeModal = ({ email, phone, onEdit, onResend, ...rest }: Props) => {
    const strongEmail = <strong key="email">{email}</strong>;
    const strongPhone = <strong key="phone">{phone}</strong>;
    return (
        <FormModal
            title={c('Title').t`Request new verification code`}
            footer={
                <>
                    <ResetButton className="ontinymobile-flex-self-start">{c('Action').t`Cancel`}</ResetButton>
                    <div className="flex ontinymobile-flex-column ontinymobile-ml1">
                        <Button
                            className="mr1 ontinymobile-mb1"
                            onClick={() => {
                                rest.onClose();
                                onEdit();
                            }}
                        >{c('Action').t`Edit`}</Button>
                        <PrimaryButton
                            onClick={() => {
                                rest.onClose();
                                onResend();
                            }}
                        >{c('Action').t`Request new code`}</PrimaryButton>
                    </div>
                </>
            }
            {...rest}
        >
            {email ? (
                <Alert>{c('Info')
                    .jt`Click "Request new code" to have a new verification code sent to ${strongEmail}. If this email address is incorrect, click "Edit" to correct it.`}</Alert>
            ) : null}
            {phone ? (
                <Alert>{c('Info')
                    .jt`Click "Request new code" to have a new verification code sent to ${strongPhone}. If this phone number is incorrect, click "Edit" to correct it.`}</Alert>
            ) : null}
        </FormModal>
    );
};

export default RequestNewCodeModal;
