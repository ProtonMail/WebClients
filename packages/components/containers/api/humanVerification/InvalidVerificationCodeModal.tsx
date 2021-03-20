import React from 'react';
import { c } from 'ttag';
import { FormModal, Button, PrimaryButton, Alert } from '../../../components';

interface Props {
    edit?: string;
    request?: string;
    onEdit: () => void;
    onResend: () => void;
    onClose?: () => void;
}
const InvalidVerificationCodeModal = ({
    onEdit,
    onResend,
    edit = c('Action').t`Try another method`,
    request = c('Action').t`Request new code`,
    ...rest
}: Props) => {
    return (
        <FormModal
            title={c('Title').t`Invalid verification code`}
            footer={
                <>
                    <div className="flex flex-justify-space-between flex-nowrap on-tiny-mobile-flex-wrap w100 on-tiny-mobile-flex-column">
                        <Button
                            type="reset"
                            className="on-mobile-flex-align-self-end on-mobile-mt3-5 on-tiny-mobile-mb1"
                        >{c('Action').t`Cancel`}</Button>
                        <div className="flex on-mobile-flex-column on-mobile-ml1 on-tiny-mobile-ml0">
                            <Button
                                className="mr1 on-mobile-mb1"
                                onClick={() => {
                                    rest.onClose?.();
                                    onEdit();
                                }}
                            >
                                {edit}
                            </Button>
                            <PrimaryButton
                                onClick={() => {
                                    rest.onClose?.();
                                    onResend();
                                }}
                            >
                                {request}
                            </PrimaryButton>
                        </div>
                    </div>
                </>
            }
            {...rest}
        >
            <Alert type="error">
                {c('Info')
                    .t`Would you like to receive a new verification code or use an alternative verification method?`}
            </Alert>
        </FormModal>
    );
};

export default InvalidVerificationCodeModal;
