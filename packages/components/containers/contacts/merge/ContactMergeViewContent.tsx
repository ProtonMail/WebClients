import { useMemo } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Loader from '@proton/components/components/loader/Loader';
import { toMap } from '@proton/shared/lib/helpers/object';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import type { VCardContact } from '@proton/shared/lib/interfaces/contacts/VCard';
import noop from '@proton/utils/noop';

import { ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '../../../components';
import { useAddresses, useContactGroups } from '../../../hooks';
import useContactList from '../hooks/useContactList';
import ContactView from '../view/ContactView';

interface Props {
    contact?: VCardContact;
    loading: boolean;
    beMergedIDs: string[];
    onSubmit: () => void;
    onClose?: () => void;
}

const ContactMergeViewContent = ({ contact, loading: loadingContact, beMergedIDs, onSubmit, onClose }: Props) => {
    const [addresses = [], loadingAddresses] = useAddresses();
    const ownAddresses = useMemo(() => addresses.map(({ Email }) => Email), [addresses]);

    const { loading: loadingContacts, contactEmailsMap } = useContactList({});
    const contactEmails = beMergedIDs.flatMap((contactID) => contactEmailsMap[contactID] as ContactEmail[]);

    const [contactGroups = [], loadingContactGroups] = useContactGroups();
    const contactGroupsMap = useMemo(() => toMap(contactGroups), [contactGroups]);

    const loading = loadingContact || loadingAddresses || loadingContacts || loadingContactGroups;

    return (
        <>
            <ModalTwoHeader title={c('Title').t`Contact Details`} />
            <ModalTwoContent>
                {loading ? (
                    <Loader />
                ) : (
                    <ContactView
                        vCardContact={contact as VCardContact}
                        contactID=""
                        contactEmails={contactEmails}
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
                        isPreview
                    />
                )}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Close`}</Button>
                <Button color="norm" disabled={!contact} onClick={onSubmit}>
                    {c('Action').t`Merge`}
                </Button>
            </ModalTwoFooter>
        </>
    );
};

export default ContactMergeViewContent;
