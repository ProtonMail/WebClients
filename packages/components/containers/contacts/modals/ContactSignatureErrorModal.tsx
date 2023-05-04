import { c } from 'ttag';

import { Button } from '@proton/atoms';

import { Alert, ModalProps, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '../../../components';

export interface ContactSignatureErrorProps {
    contactID: string;
}

export interface ContactSignatureErrorModalProps {
    onResign: () => void;
}

type Props = ContactSignatureErrorProps & ContactSignatureErrorModalProps & ModalProps;

const ContactSignatureErrorModal = ({ contactID, onResign, ...rest }: Props) => {
    const handleSubmit = () => {
        onResign();
        rest.onClose?.();
    };

    return (
        <ModalTwo size="small" {...rest}>
            <ModalTwoHeader title={c('Title').t`Re-sign all contacts`} />
            <ModalTwoContent>
                <Alert className="mb-4" type="info">{c('Info')
                    .t`To re-sign your contacts, we need to check every contact against the list of encryption keys available in your account. If no match is found, your contact will be re-signed with the primary encryption key.`}</Alert>
                <Alert className="mb-4" type="info">{c('Info')
                    .t`Please note that this process may take some time depending on the size of your address book.`}</Alert>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose}>{c('Action').t`Close`}</Button>
                <Button color="norm" onClick={handleSubmit}>{c('Action').t`Re-sign`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ContactSignatureErrorModal;
