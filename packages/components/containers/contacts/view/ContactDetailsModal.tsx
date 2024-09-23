import { useEffect, useMemo, useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import Loader from '@proton/components/components/loader/Loader';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import { APPS } from '@proton/shared/lib/constants';
import { CRYPTO_PROCESSING_TYPES } from '@proton/shared/lib/contacts/constants';
import { singleExport } from '@proton/shared/lib/contacts/helpers/export';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { toMap } from '@proton/shared/lib/helpers/object';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import type { VCardContact } from '@proton/shared/lib/interfaces/contacts/VCard';

import {
    useAddresses,
    useConfig,
    useContactGroups,
    useMailSettings,
    useNotifications,
    useUserKeys,
} from '../../../hooks';
import { useLinkHandler } from '../../../hooks/useLinkHandler';
import ErrorBoundary from '../../app/ErrorBoundary';
import GenericError from '../../error/GenericError';
import type { ContactEditProps } from '../edit/ContactEditModal';
import type { ContactEmailSettingsProps } from '../email/ContactEmailSettingsModal';
import type { ContactGroupEditProps } from '../group/ContactGroupEditModal';
import useContact from '../hooks/useContact';
import useContactList from '../hooks/useContactList';
import useVCardContact from '../hooks/useVCardContact';
import type { ContactDeleteProps } from '../modals/ContactDeleteModal';
import ContactView from './ContactView';

export interface ContactDetailsProps {
    contactID: string;
    onMailTo?: (src: string) => void;
    onEdit: (props: ContactEditProps) => void;
    onDelete: (props: ContactDeleteProps) => void;
    onEmailSettings: (props: ContactEmailSettingsProps) => void;
    onGroupDetails: (contactGroupID: string) => void;
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
    const { createNotification } = useNotifications();

    const { APP_NAME } = useConfig();

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
                if (APP_NAME === APPS.PROTONMAIL) {
                    onClose?.();
                } else {
                    textToClipboard(src?.replace('mailto:', ''));
                    createNotification({
                        text: c('Success').t`Email address copied to clipboard`,
                    });
                }
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

    const handleExport = () => {
        const hasError = errors?.some(
            (error) => error instanceof Error || error.type !== CRYPTO_PROCESSING_TYPES.SIGNATURE_NOT_VERIFIED
        );

        if (hasError) {
            createNotification({ text: c('Error').t`Cannot export this contact`, type: 'error' });
            return;
        }

        return singleExport(vCardContact as VCardContact);
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
        <ModalTwo size="large" className="contacts-modal" data-testid="contact-details-modal" {...rest}>
            <ModalTwoHeader
                actions={[
                    <Tooltip title={c('Action').t`Edit`}>
                        <Button
                            color="weak"
                            shape="ghost"
                            icon
                            onClick={() => handleEdit()}
                            className="inline-flex ml-2"
                            data-testid="contact-details:edit"
                        >
                            <Icon name="pen" alt={c('Action').t`Edit`} />
                        </Button>
                    </Tooltip>,
                    <Tooltip title={c('Action').t`Export`}>
                        <Button
                            color="weak"
                            shape="ghost"
                            icon
                            onClick={handleExport}
                            className="inline-flex ml-2"
                            data-testid="contact-details:export"
                        >
                            <Icon name="arrow-up-from-square" alt={c('Action').t`Export`} />
                        </Button>
                    </Tooltip>,
                    <Tooltip title={c('Action').t`Delete`}>
                        <Button
                            color="weak"
                            shape="ghost"
                            icon
                            onClick={handleDelete}
                            className="inline-flex ml-2"
                            data-testid="contact-details:delete"
                        >
                            <Icon name="trash" alt={c('Action').t`Delete`} />
                        </Button>
                    </Tooltip>,
                ]}
            />
            <ModalTwoContent>
                <ErrorBoundary key={contactID} component={<GenericError className="pt-7 view-column-detail flex-1" />}>
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
                                onReload={onReload}
                                onEdit={handleEdit}
                                onEmailSettings={onEmailSettings}
                                onGroupDetails={onGroupDetails}
                                onGroupEdit={onGroupEdit}
                                onUpgrade={onUpgrade}
                                onSignatureError={onSignatureError}
                                onDecryptionError={onDecryptionError}
                            />
                        )}
                    </div>
                    {linkModal}
                </ErrorBoundary>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Close`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ContactDetailsModal;
