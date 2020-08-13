import React from 'react';
import { c } from 'ttag';
import { FormModal, ResetButton, Button, PrimaryButton, Alert } from '../../../components';

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
                    <div className="flex flex-spacebetween flex-nowrap ontinymobile-flex-wrap w100 ontinymobile-flex-column">
                        <ResetButton className="onmobile-flex-self-end onmobile-mt3-5 ontinymobile-mb1">{c('Action')
                            .t`Cancel`}</ResetButton>
                        <div className="flex onmobile-flex-column onmobile-ml1 ontinymobile-ml0">
                            <Button
                                className="mr1 onmobile-mb1"
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
