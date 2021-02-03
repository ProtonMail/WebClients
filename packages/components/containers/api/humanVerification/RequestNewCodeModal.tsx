import React from 'react';
import { c } from 'ttag';

import { FormModal, PrimaryButton, Button, ResetButton } from '../../../components';

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
                    <div className="flex flex-justify-space-between flex-nowrap on-tiny-mobile-flex-wrap w100 on-tiny-mobile-flex-column">
                        <ResetButton className="on-mobile-flex-align-self-end on-mobile-mt3-5 on-tiny-mobile-mb1">{c(
                            'Action'
                        ).t`Cancel`}</ResetButton>
                        <div className="flex on-mobile-flex-column on-mobile-ml1 on-tiny-mobile-ml0">
                            <Button
                                className="mr1 on-mobile-mb1"
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
                    </div>
                </>
            }
            {...rest}
        >
            {email ? (
                <p>{c('Info')
                    .jt`Click "Request new code" to have a new verification code sent to ${strongEmail}. If this email address is incorrect, click "Edit" to correct it.`}</p>
            ) : null}
            {phone ? (
                <p>{c('Info')
                    .jt`Click "Request new code" to have a new verification code sent to ${strongPhone}. If this phone number is incorrect, click "Edit" to correct it.`}</p>
            ) : null}
        </FormModal>
    );
};

export default RequestNewCodeModal;
