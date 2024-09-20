import { useMemo } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Loader from '@proton/components/components/loader/Loader';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import useContactList from '@proton/components/containers/contacts/hooks/useContactList';
import { toMap } from '@proton/shared/lib/helpers/object';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import noop from '@proton/utils/noop';

import { useAddresses, useContactGroups, useUserKeys } from '../../../hooks';
import useContact from '../hooks/useContact';
import useVCardContact from '../hooks/useVCardContact';
import ContactView from '../view/ContactView';

export interface ContactMergeDetailsModalProps {
    contactID: string;
}

type Props = ContactMergeDetailsModalProps & ModalProps;

const ContactMergeDetailsModal = ({ contactID, ...rest }: Props) => {
    const [userKeysList] = useUserKeys();
    const [contact] = useContact(contactID);
    const { vCardContact, isLoading, errors } = useVCardContact({ contact, userKeysList });
    const { loading: loadingContactEmails, contactEmailsMap } = useContactList({});

    const [addresses = [], loadingAddresses] = useAddresses();
    const ownAddresses = useMemo(() => addresses.map(({ Email }) => Email), [addresses]);

    const [contactGroups = [], loadingContactGroups] = useContactGroups();
    const contactGroupsMap = useMemo(() => toMap(contactGroups), [contactGroups]);

    if (!isLoading && !vCardContact && vCardContact === undefined) {
        return <>{null}</>;
    }

    return (
        <ModalTwo size="large" className="contacts-modal" {...rest}>
            <ModalTwoHeader title={c('Title').t`Contact Details`} />
            <ModalTwoContent>
                {isLoading || loadingContactEmails || loadingAddresses || loadingContactGroups ? (
                    <Loader />
                ) : (
                    <ContactView
                        vCardContact={vCardContact!}
                        errors={errors}
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
