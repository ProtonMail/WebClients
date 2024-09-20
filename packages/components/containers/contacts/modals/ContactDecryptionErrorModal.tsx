import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import Copy from '@proton/components/components/button/Copy';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { APPS } from '@proton/shared/lib/constants';
import { getKeyUsedForContact } from '@proton/shared/lib/contacts/keyVerifications';
import type { Key } from '@proton/shared/lib/interfaces';
import type { Contact } from '@proton/shared/lib/interfaces/contacts';

import { UnderlineButton, useSettingsLink } from '../../../components';
import { useNotifications, useUser } from '../../../hooks';
import useContact from '../hooks/useContact';
import type { ContactClearDataConfirmProps } from './ContactClearDataConfirmModal';

export interface ContactDecryptionErrorProps {
    contactID: string;
}

export interface ContactDecryptionErrorModalProps {
    onClearDataConfirm: (props: ContactClearDataConfirmProps) => void;
}

type Props = ContactDecryptionErrorProps & ContactDecryptionErrorModalProps & ModalProps;

const ContactDecryptionErrorModal = ({ contactID, onClearDataConfirm, ...rest }: Props) => {
    const { createNotification } = useNotifications();
    const [user] = useUser();
    const [contact] = useContact(contactID) as [Contact | undefined, boolean, Error];
    const [errorKey, setErrorKey] = useState<Key>();
    const goToSettings = useSettingsLink();

    useEffect(() => {
        const findKey = async () => {
            const key = await getKeyUsedForContact(contact as Contact, user.Keys, true);
            setErrorKey(key);
        };

        if (user && contact) {
            void findKey();
        }
    }, [user, contact]);

    const handleSubmit = () => {
        goToSettings('/encryption-keys', APPS.PROTONMAIL);
    };

    const handleClear = () => {
        onClearDataConfirm({ errorKey: errorKey as Key });
        rest.onClose?.();
    };

    return (
        <ModalTwo {...rest}>
            <ModalTwoHeader title={c('Title').t`Recover data`} />
            <ModalTwoContent>
                <Alert className="mb-4" type="info">
                    {c('Info')
                        .t`To recover your data, you need to re-activate the account key used at the time when the data was created. This will require you to remember the password used when the key was generated.`}
                </Alert>
                {errorKey && (
                    <div className="flex items-center mb-4">
                        <span className="mr-4">{c('Info').t`Key fingerprint`}</span>
                        <span className="flex-1 text-ellipsis mr-4">{errorKey.Fingerprint}</span>
                        <Copy
                            value={errorKey.Fingerprint}
                            onCopy={() => {
                                createNotification({ text: c('Success').t`Fingerprint copied to clipboard` });
                            }}
                        />
                    </div>
                )}
                <Alert className="mb-4" type="info">
                    {c('Info')
                        .t`Cannot remember your password? We can help you clear the encrypted data of all contacts encrypted with this key and in the process dismiss the alert.`}
                    <UnderlineButton className="ml-2" onClick={handleClear} disabled={!errorKey}>
                        {c('Action').t`Click here.`}
                    </UnderlineButton>
                </Alert>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose}>{c('Action').t`Close`}</Button>
                <Button color="norm" onClick={handleSubmit}>{c('Action').t`Recover data`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ContactDecryptionErrorModal;
