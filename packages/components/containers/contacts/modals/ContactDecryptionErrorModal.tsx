import { useEffect, useState } from 'react';
import { c } from 'ttag';
import { Contact } from '@proton/shared/lib/interfaces/contacts';
import { getKeyUsedForContact } from '@proton/shared/lib/contacts/keyVerifications';
import { Key } from '@proton/shared/lib/interfaces';
import { APPS } from '@proton/shared/lib/constants';
import {
    Alert,
    Button,
    Copy,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    UnderlineButton,
    useSettingsLink,
} from '../../../components';
import { useNotifications, useUser } from '../../../hooks';
import { ContactClearDataConfirmProps } from './ContactClearDataConfirmModal';
import useContact from '../hooks/useContact';

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
                <Alert className="mb1" type="info">
                    {c('Info')
                        .t`To recover your data, you need to re-activate the contact encryption key used at the time when the data was created. This will require you to remember the password used when the key was generated.`}
                </Alert>
                {errorKey && (
                    <div className="flex flex-align-items-center mb1">
                        <span className="mr1">{c('Info').t`Key fingerprint`}</span>
                        <span className="flex-item-fluid text-ellipsis mr1">{errorKey.Fingerprint}</span>
                        <Copy
                            value={errorKey.Fingerprint}
                            onCopy={() => {
                                createNotification({ text: c('Success').t`Fingerprint copied to clipboard` });
                            }}
                        />
                    </div>
                )}
                <Alert className="mb1" type="info">
                    {c('Info')
                        .t`Cannot remember your password? We can help you clear the encrypted data of all contacts encrypted with this key and in the process dismiss the alert.`}
                    <UnderlineButton className="ml0-5" onClick={handleClear} disabled={!errorKey}>
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
