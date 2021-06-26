import React from 'react';
import { c } from 'ttag';
import { noop } from '@proton/shared/lib/helpers/function';
import { Alert, FormModal } from '../../../components';
import { useModals } from '../../../hooks';
import ContactResignExecutionModal from './ContactResignExecutionModal';

interface Props {
    contactID: string;
    onClose?: () => void;
}

const ContactSignatureErrorModal = ({ onClose = noop, contactID, ...rest }: Props) => {
    const { createModal } = useModals();

    const handleSubmit = () => {
        createModal(<ContactResignExecutionModal />);
        onClose();
    };

    return (
        <FormModal
            title={c('Title').t`Re-sign all contacts`}
            onSubmit={handleSubmit}
            onClose={onClose}
            submit={c('Action').t`Re-sign`}
            close={c('Action').t`Close`}
            className="pm-modal--smaller"
            {...rest}
        >
            <Alert type="info">{c('Info')
                .t`To re-sign your contacts, we need to check every contact against the list of encryption keys available in your account. If no match is found, your contact will be re-signed with the primary encryption key.`}</Alert>
            <Alert type="info">{c('Info')
                .t`Please note that this process may take some time depending on the size of your address book.`}</Alert>
        </FormModal>
    );
};

export default ContactSignatureErrorModal;
