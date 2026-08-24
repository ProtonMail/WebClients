import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';
import type { Key } from '@proton/shared/lib/interfaces';

import Alert from '../../../components/alert/Alert';
import Row from '../../../components/container/Row';
import type { ModalProps } from '../../../components/modalTwo/Modal';
import ModalTwo from '../../../components/modalTwo/Modal';
import ModalTwoContent from '../../../components/modalTwo/ModalContent';
import ModalTwoFooter from '../../../components/modalTwo/ModalFooter';
import ModalTwoHeader from '../../../components/modalTwo/ModalHeader';
import type { ContactClearDataExecutionProps } from './ContactClearDataExecutionModal';

export interface ContactClearDataConfirmProps {
    errorKey: Key;
}

export interface ContactClearDataConfirmModalProps {
    onClearData: (props: ContactClearDataExecutionProps) => void;
}

type Props = ContactClearDataConfirmProps & ContactClearDataConfirmModalProps & ModalProps;

const ContactClearDataConfirmModal = ({ errorKey, onClearData, ...rest }: Props) => {
    const [dangerInput, setDangerInput] = useState('');
    const dangerWord = 'DANGER';

    const handleSubmit = () => {
        onClearData({ errorKey });
        rest.onClose?.();
    };

    const boldDanger = <strong key="danger">{dangerWord}</strong>;

    return (
        <ModalTwo {...rest}>
            <ModalTwoHeader title={c('Title').t`Warning`} />
            <ModalTwoContent>
                <Alert className="mb-4" type="info">{c('Warning')
                    .t`If you don’t remember your password, it is impossible to re-activate your key. We can help you dismiss the alert banner but in the process you will permanently lose access to all the data encrypted with that key.`}</Alert>
                <Alert className="mb-4" type="error">
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
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>
                <Button color="danger" disabled={dangerInput !== dangerWord} onClick={handleSubmit}>{c('Action')
                    .t`Clear data`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ContactClearDataConfirmModal;
