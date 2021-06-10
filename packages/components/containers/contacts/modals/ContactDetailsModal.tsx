import React, { useEffect, useMemo, useRef } from 'react';
import { c } from 'ttag';
import { toMap } from 'proton-shared/lib/helpers/object';
import { noop } from 'proton-shared/lib/helpers/function';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import ContactContainer from '../ContactContainer';
import { useModals, useContactGroups, useAddresses, useUserKeys } from '../../../hooks';
import useContactList from '../useContactList';
import useContact from '../useContact';
import useContactProperties from '../useContactProperties';
import ErrorBoundary from '../../app/ErrorBoundary';
import GenericError from '../../error/GenericError';
import FormModal from '../../../components/modal/FormModal';
import ContactModal from './ContactModal';
import { PrimaryButton } from '../../../components/button';

interface Props {
    contactID: string;
    onClose?: () => void;
}

const ContactDetailsModal = ({ contactID, onClose = noop, ...rest }: Props) => {
    const { createModal } = useModals();
    const [contactGroups = [], loadingContactGroups] = useContactGroups();
    const [userKeysList, loadingUserKeys] = useUserKeys();
    const [addresses = [], loadingAddresses] = useAddresses();
    const { loading: loadingContacts, contactEmailsMap } = useContactList({});
    const [contact, loadingContact] = useContact(contactID);
    const modalRef = useRef<HTMLDivElement>(null);

    const [{ properties }] = useContactProperties({ contact, userKeysList });

    // Close the modal on a click on a mailto, useLinkHandler will open the composer
    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            const link = (event.target as Element).closest('a');
            const src = link?.getAttribute('href');
            if (src?.startsWith('mailto:')) {
                onClose();
            }
        };

        modalRef.current?.addEventListener('click', handleClick);
        return () => modalRef.current?.removeEventListener('click', handleClick);
    }, []);

    const openContactModal = () => {
        createModal(<ContactModal properties={properties} contactID={contactID} />);
        onClose();
    };

    const ownAddresses = useMemo(() => addresses.map(({ Email }) => Email), [addresses]);
    const contactGroupsMap = useMemo(() => toMap(contactGroups), [contactGroups]);

    const isLoading = loadingContacts || loadingContactGroups || loadingUserKeys || loadingAddresses || loadingContact;

    return (
        <FormModal
            title={c(`Title`).t`Contact details`}
            loading={isLoading}
            close={c('Action').t`Close`}
            submit={<PrimaryButton onClick={openContactModal}>{c('Action').t`Edit`}</PrimaryButton>}
            disabled
            onClose={onClose}
            {...rest}
        >
            <ErrorBoundary
                key={contactID}
                component={<GenericError className="pt2 view-column-detail flex-item-fluid" />}
            >
                <div ref={modalRef}>
                    <ContactContainer
                        contactID={contactID}
                        contactEmails={contactEmailsMap[contactID] as ContactEmail[]}
                        contactGroupsMap={contactGroupsMap}
                        ownAddresses={ownAddresses}
                        userKeysList={userKeysList}
                        onDelete={onClose}
                        isModal
                    />
                </div>
            </ErrorBoundary>
        </FormModal>
    );
};

export default ContactDetailsModal;
