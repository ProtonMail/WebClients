import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import useContactList from '@proton/components/containers/contacts/hooks/useContactList';
import { useLoading } from '@proton/hooks';
import { getContact } from '@proton/shared/lib/api/contacts';
import { CRYPTO_PROCESSING_TYPES } from '@proton/shared/lib/contacts/constants';
import { CryptoProcessingError, prepareVCardContact } from '@proton/shared/lib/contacts/decrypt';
import { toMap } from '@proton/shared/lib/helpers/object';
import { Contact, ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { VCardContact } from '@proton/shared/lib/interfaces/contacts/VCard';
import { splitKeys } from '@proton/shared/lib/keys/keys';
import noop from '@proton/utils/noop';

import { Loader, ModalProps, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '../../../components';
import { useAddresses, useApi, useContactGroups, useUserKeys } from '../../../hooks';
import ContactView from '../view/ContactView';

export interface ContactMergeDetailsModalProps {
    contactID: string;
}

type Props = ContactMergeDetailsModalProps & ModalProps;

const ContactMergeDetailsModal = ({ contactID, ...rest }: Props) => {
    const api = useApi();
    const [userKeysList] = useUserKeys();
    const [loading, withLoading] = useLoading(true);
    const [model, setModel] = useState<{
        vCardContact: VCardContact;
        errors: (CryptoProcessingError | Error)[];
    }>({
        vCardContact: { fn: [] },
        errors: [],
    });

    const { loading: loadingContactEmails, contactEmailsMap } = useContactList({});

    const [addresses = [], loadingAddresses] = useAddresses();
    const ownAddresses = useMemo(() => addresses.map(({ Email }) => Email), [addresses]);

    const [contactGroups = [], loadingContactGroups] = useContactGroups();
    const contactGroupsMap = useMemo(() => toMap(contactGroups), [contactGroups]);

    useEffect(() => {
        const request = async () => {
            const { Contact } = await api<{ Contact: Contact }>(getContact(contactID));
            const keys = splitKeys(userKeysList);
            const { vCardContact, errors } = await prepareVCardContact(Contact, keys);
            setModel({ vCardContact, errors });
        };

        try {
            void withLoading(request());
        } catch (error: any) {
            setModel({ ...model, errors: [{ type: CRYPTO_PROCESSING_TYPES.FAIL_TO_LOAD, error }] });
        }
    }, []);

    return (
        <ModalTwo size="large" className="contacts-modal" {...rest}>
            <ModalTwoHeader title={c('Title').t`Contact Details`} />
            <ModalTwoContent>
                {loading || loadingContactEmails || loadingAddresses || loadingContactGroups ? (
                    <Loader />
                ) : (
                    <ContactView
                        vCardContact={model.vCardContact}
                        errors={model.errors}
                        contactID={contactID}
                        isPreview
                        contactEmails={contactEmailsMap[contactID] as ContactEmail[]}
                        contactGroupsMap={contactGroupsMap}
                        ownAddresses={ownAddresses}
                        onReload={noop}
                        onEdit={noop}
                        onEmailSettings={noop}
                        onGroupDetails={noop}
                        onGroupEdit={noop}
                        onUpgrade={noop}
                        onSignatureError={noop}
                        onDecryptionError={noop}
                    />
                )}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button color="norm" className="ml-auto" onClick={rest.onClose}>{c('Action').t`Close`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ContactMergeDetailsModal;
