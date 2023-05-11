import { useEffect, useMemo, useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { singleExport } from '@proton/shared/lib/contacts/helpers/export';
import { toMap } from '@proton/shared/lib/helpers/object';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { VCardContact } from '@proton/shared/lib/interfaces/contacts/VCard';

import { Loader } from '../../../components';
import { ModalProps, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '../../../components/modalTwo';
import { useAddresses, useContactGroups, useMailSettings, useUserKeys } from '../../../hooks';
import { useLinkHandler } from '../../../hooks/useLinkHandler';
import ErrorBoundary from '../../app/ErrorBoundary';
import GenericError from '../../error/GenericError';
import { ContactEditProps } from '../edit/ContactEditModal';
import { ContactEmailSettingsProps } from '../email/ContactEmailSettingsModal';
import { ContactGroupEditProps } from '../group/ContactGroupEditModal';
import useContact from '../hooks/useContact';
import useContactList from '../hooks/useContactList';
import useVCardContact from '../hooks/useVCardContact';
import { ContactDeleteProps } from '../modals/ContactDeleteModal';
import ContactView from './ContactView';

export interface ContactDetailsProps {
    contactID: string;
    onMailTo?: (src: string) => void;
    onEdit: (props: ContactEditProps) => void;
    onDelete: (props: ContactDeleteProps) => void;
    onEmailSettings: (props: ContactEmailSettingsProps) => void;
    onGroupDetails: (contactGroupID: string, onCloseContactDetailsModal?: () => void) => void;
    onGroupEdit: (props: ContactGroupEditProps) => void;
    onUpgrade: () => void;
    onSignatureError: (contactID: string) => void;
    onDecryptionError: (contactID: string) => void;
}

type Props = ContactDetailsProps & ModalProps;

const ContactDetailsModal = ({
    contactID,
    onMailTo,
    onEdit,
    onDelete,
    onEmailSettings,
    onGroupDetails,
    onGroupEdit,
    onUpgrade,
    onSignatureError,
    onDecryptionError,
    ...rest
}: Props) => {
    const { onClose } = rest;

    const [mailSettings] = useMailSettings();
    const [contactGroups = [], loadingContactGroups] = useContactGroups();
    const [userKeysList, loadingUserKeys] = useUserKeys();
    const [addresses = [], loadingAddresses] = useAddresses();
    const { loading: loadingContacts, contactEmailsMap } = useContactList({});
    const [contact, loadingContact] = useContact(contactID);
    const modalRef = useRef<HTMLDivElement>(null);

    const { modal: linkModal } = useLinkHandler(modalRef, mailSettings, { onMailTo });

    const {
        vCardContact,
        isLoading: loadingVCard,
        errors,
        isVerified,
        onReload,
    } = useVCardContact({ contact, userKeysList });

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

    const handleEdit = (newField?: string) => {
        onEdit({ contactID, vCardContact, newField });
    };

    const handleDelete = () => {
        onDelete({ contactIDs: [contactID] });
        onClose?.();
    };

    const handleExport = () => singleExport(vCardContact as VCardContact);

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
        <ModalTwo size="large" className="contacts-modal" data-testid="contact-details-modal" {...rest}>
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
                                contactID={contactID}
                                contactEmails={contactEmailsMap[contactID] as ContactEmail[]}
                                contactGroupsMap={contactGroupsMap}
                                ownAddresses={ownAddresses}
                                errors={errors}
                                isSignatureVerified={isVerified}
                                onDelete={handleDelete}
                                onReload={onReload}
                                onEdit={handleEdit}
                                onEmailSettings={onEmailSettings}
                                onExport={handleExport}
                                onGroupDetails={onGroupDetails}
                                onGroupEdit={onGroupEdit}
                                onUpgrade={onUpgrade}
                                onSignatureError={onSignatureError}
                                onDecryptionError={onDecryptionError}
                                onCloseModal={onClose}
                            />
                        )}
                    </div>
                    {linkModal}
                </ErrorBoundary>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Close`}</Button>
                <Button color="norm" onClick={() => handleEdit()} disabled={isLoading}>
                    {c('Action').t`Edit`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ContactDetailsModal;
