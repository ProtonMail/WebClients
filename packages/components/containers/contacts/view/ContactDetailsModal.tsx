import { useEffect, useMemo, useRef } from 'react';
import { c } from 'ttag';
import { toMap } from '@proton/shared/lib/helpers/object';
import { ContactEmail, ContactProperties } from '@proton/shared/lib/interfaces/contacts';
import { VCardContact } from '@proton/shared/lib/interfaces/contacts/VCard';
import { useModals, useContactGroups, useAddresses, useUserKeys, useMailSettings } from '../../../hooks';
import useContactList from '../useContactList';
import useContact from '../useContact';
import useContactProperties from '../deprecated/useContactProperties';
import ErrorBoundary from '../../app/ErrorBoundary';
import GenericError from '../../error/GenericError';
import ContactModal from '../modals/ContactModal';
import { Button } from '../../../components/button';
import { useLinkHandler } from '../../../hooks/useLinkHandler';
import useVCardContact from '../hooks/useVCardContact';
import { ModalTwo, ModalTwoHeader, ModalTwoContent, ModalTwoFooter, ModalProps } from '../../../components/modalTwo';
import ContactView from './ContactView';
import { Loader } from '../../..';

export interface ContactDetailsProps {
    contactID: string;
    onMailTo?: (src: string) => void;
}

type Props = ContactDetailsProps & ModalProps;

const ContactDetailsModal = ({ contactID, onMailTo, ...rest }: Props) => {
    const { onClose } = rest;

    const { createModal } = useModals();
    const [mailSettings] = useMailSettings();
    const [contactGroups = [], loadingContactGroups] = useContactGroups();
    const [userKeysList, loadingUserKeys] = useUserKeys();
    const [addresses = [], loadingAddresses] = useAddresses();
    const { loading: loadingContacts, contactEmailsMap } = useContactList({});
    const [contact, loadingContact] = useContact(contactID);
    const modalRef = useRef<HTMLDivElement>(null);

    const { modal: linkModal } = useLinkHandler(modalRef, mailSettings, { onMailTo });

    const [{ properties }, onReload] = useContactProperties({ contact, userKeysList });

    const { vCardContact, isLoading: loadingVCard, errors, isVerified } = useVCardContact({ contact, userKeysList });

    // Close the modal on a click on a mailto, useLinkHandler will open the composer
    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            const link = (event.target as Element).closest('a');
            const src = link?.getAttribute('href');
            if (src?.startsWith('mailto:')) {
                onClose?.();
            }
        };

        modalRef.current?.addEventListener('click', handleClick);
        return () => modalRef.current?.removeEventListener('click', handleClick);
    }, []);

    const openContactModal = () => {
        createModal(<ContactModal properties={properties} contactID={contactID} />);
        onClose?.();
    };

    const ownAddresses = useMemo(() => addresses.map(({ Email }) => Email), [addresses]);
    const contactGroupsMap = useMemo(() => toMap(contactGroups), [contactGroups]);

    const isLoading =
        loadingContacts ||
        loadingContactGroups ||
        loadingUserKeys ||
        loadingAddresses ||
        loadingContact ||
        loadingVCard;

    return (
        <ModalTwo size="large" {...rest}>
            <ModalTwoHeader title={c('Title').t`Contact details`} />
            <ModalTwoContent>
                <ErrorBoundary
                    key={contactID}
                    component={<GenericError className="pt2 view-column-detail flex-item-fluid" />}
                >
                    <div ref={modalRef}>
                        {isLoading ? (
                            <Loader />
                        ) : (
                            <ContactView
                                vCardContact={vCardContact as VCardContact}
                                properties={properties as ContactProperties}
                                contactID={contactID}
                                contactEmails={contactEmailsMap[contactID] as ContactEmail[]}
                                contactGroupsMap={contactGroupsMap}
                                ownAddresses={ownAddresses}
                                userKeysList={userKeysList}
                                errors={errors}
                                isSignatureVerified={isVerified}
                                onDelete={() => onClose?.()}
                                onReload={onReload}
                            />
                        )}
                    </div>
                    {linkModal}
                </ErrorBoundary>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Close`}</Button>
                <Button color="norm" onClick={openContactModal} disabled={isLoading}>
                    {c('Action').t`Edit`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ContactDetailsModal;
