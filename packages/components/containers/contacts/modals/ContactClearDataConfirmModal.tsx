import React, { useState } from 'react';
import { c } from 'ttag';
import { noop } from 'proton-shared/lib/helpers/function';
import { Key } from 'proton-shared/lib/interfaces';
import { Alert, ErrorButton, FormModal, Input, Row } from '../../../components';
import { useModals } from '../../../hooks';
import ContactClearDataExecutionModal from './ContactClearDataExecutionModal';

interface Props {
    errorKey: Key;
    onClose?: () => void;
}

const ContactClearDataConfirmModal = ({ onClose = noop, errorKey, ...rest }: Props) => {
    const { createModal } = useModals();
    const [dangerInput, setDangerInput] = useState('');
    const dangerWord = 'DANGER';

    const handleSubmit = () => {
        createModal(<ContactClearDataExecutionModal errorKey={errorKey} />);
        onClose?.();
    };

    const boldDanger = <strong key="danger">{dangerWord}</strong>;

    return (
        <FormModal
            title={c('Title').t`Warning`}
            onSubmit={handleSubmit}
            onClose={onClose}
            submit={
                <ErrorButton disabled={dangerInput !== dangerWord} type="submit">{c('Action')
                    .t`Clear data`}</ErrorButton>
            }
            {...rest}
        >
            <Alert type="info">{c('Warning')
                .t`If you don’t remember your password, it is impossible to re-activate your key. We can help you dismiss the alert banner but in the process you will permanently lose access to all the data encrypted with that key.`}</Alert>
            <Alert type="error">
                {c('Warning')
                    .jt`This action is irreversible. Please enter the word ${boldDanger} in the field to proceed.`}
            </Alert>
            <Row>
                <Input
                    value={dangerInput}
                    placeholder={dangerWord}
                    onChange={(event) => setDangerInput(event.target.value)}
                />
            </Row>
        </FormModal>
    );
};

export default ContactClearDataConfirmModal;
