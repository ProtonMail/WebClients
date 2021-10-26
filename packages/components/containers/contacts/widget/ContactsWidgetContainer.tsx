import { useState, useMemo } from 'react';
import { c, msgid } from 'ttag';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { exportContacts } from '@proton/shared/lib/contacts/helpers/export';
import { extractMergeable } from '@proton/shared/lib/contacts/helpers/merge';
import { Recipient } from '@proton/shared/lib/interfaces';
import { FullLoader, SearchInput } from '@proton/components';
import { useApi, useModals, useNotifications, useUser, useUserKeys, useUserSettings } from '@proton/components/hooks';

import MergeModal from '../merge/MergeModal';
import ContactsList from '../ContactsList';
import ContactDetailsModal from '../modals/ContactDetailsModal';
import useContactList from '../useContactList';
import ContactsWidgetToolbar from './ContactsWidgetToolbar';
import ContactDeleteModal from '../modals/ContactDeleteModal';
import ContactModal from '../modals/ContactModal';

import ContactsWidgetPlaceholder, { EmptyType } from './ContactsWidgetPlaceholder';
import MergeContactBanner from './MergeContactBanner';
import { CustomAction } from './types';

interface Props {
    onClose: () => void;
    onCompose?: (recipients: Recipient[], attachments: File[]) => void;
    onMailTo?: (src: string) => void;
    customActions: CustomAction[];
}

const ContactsWidgetContainer = ({ onClose, onCompose, onMailTo, customActions }: Props) => {
    const [user, loadingUser] = useUser();
    const [userSettings, loadingUserSettings] = useUserSettings();
    const [userKeysList, loadingUserKeys] = useUserKeys();
    const [userKeys] = useUserKeys();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const api = useApi();

    const [search, setSearch] = useState('');

    const contactList = useContactList({
        search,
    });

    const {
        formattedContacts,
        checkedIDs,
        contacts,
        contactGroupsMap,
        handleCheck,
        handleCheckOne,
        contactEmailsMap,
        selectedIDs,
        handleCheckAll,
        filteredContacts,
        hasCheckedAllFiltered,
        loading: loadingContacts,
    } = contactList;

    const mergeableContacts = useMemo(() => extractMergeable(formattedContacts), [formattedContacts]);
    const countMergeableContacts = mergeableContacts.reduce(
        (acc, mergeableContact) => acc + mergeableContact.length,
        0
    );

    const noEmailsContactIDs = selectedIDs.filter((contactID) => !contactEmailsMap[contactID]?.length);

    const handleClearSearch = () => {
        // If done synchronously, button is removed from the dom and the dropdown considers a click outside
        setTimeout(() => setSearch(''));
    };

    const handleCompose = () => {
        if (selectedIDs.length > 100) {
            createNotification({
                type: 'error',
                text: c('Error').t`You can't send a mail to more than 100 recipients`,
            });
            return;
        }

        const contactWithEmailIDs = selectedIDs.filter((contactID) => contactEmailsMap[contactID]?.length);

        if (noEmailsContactIDs.length) {
            const noEmailsContactNames = noEmailsContactIDs.map(
                // Looping in all contacts is no really performant but should happen rarely
                (contactID) => contacts.find((contact) => contact.ID === contactID)?.Name
            );

            const noEmailsContactNamesCount = noEmailsContactNames.length;
            const noEmailsContactNamesList = noEmailsContactNames.join(', ');

            const text = c('Error').ngettext(
                msgid`One of the contacts has no email address: ${noEmailsContactNamesList}`,
                `Some contacts have no email addresses: ${noEmailsContactNamesList} `,
                noEmailsContactNamesCount
            );

            createNotification({ type: 'warning', text });
        }

        const contactEmailsOfContacts = contactWithEmailIDs.map(
            (contactID) => contactEmailsMap[contactID]
        ) as ContactEmail[][];
        const recipients = contactEmailsOfContacts.map((contactEmails) => {
            const contactEmail = contactEmails[0];
            return { Name: contactEmail.Name, Address: contactEmail.Email };
        });

        onCompose?.(recipients, []);
        onClose();
    };

    const handleForward = async () => {
        if (selectedIDs.length > 100) {
            createNotification({
                type: 'error',
                text: c('Error').t`You can't send vCards of more than 10 contacts`,
            });
            return;
        }

        try {
            const exportedContacts = await exportContacts(selectedIDs, userKeys, api);

            const files = exportedContacts.map(
                ({ name, vcard }) => new File([vcard], name, { type: 'text/plain;charset=utf-8' })
            );

            onCompose?.([], files);
        } catch {
            createNotification({
                type: 'error',
                text: c('Error').t`There was an error when exporting the contacts vCards`,
            });
        }
        onClose();
    };

    const handleDetails = (contactID: string) => {
        createModal(<ContactDetailsModal contactID={contactID} onMailTo={onMailTo} />);
        onClose();
    };

    const handleDelete = () => {
        const deleteAll = selectedIDs.length === contacts.length;
        createModal(
            <ContactDeleteModal
                contactIDs={selectedIDs}
                deleteAll={deleteAll}
                onDelete={() => {
                    if (selectedIDs.length === filteredContacts.length) {
                        setSearch('');
                    }
                    handleCheckAll(false);
                }}
            />
        );
        onClose();
    };

    const handleCreate = () => {
        createModal(<ContactModal />);
        onClose();
    };

    const handleMerge = (mergeContactsDetected?: boolean) => {
        const selectedContacts = formattedContacts.filter((contact) => selectedIDs.includes(contact.ID));
        const contacts = mergeContactsDetected ? mergeableContacts : [selectedContacts];

        createModal(
            <MergeModal
                contacts={contacts}
                userKeysList={userKeysList}
                onMerged={() => handleCheckAll(false)} // Unselect all contacts
            />
        );
    };

    const contactsCount = formattedContacts.length;
    const contactsLength = contacts ? contacts.length : 0;

    const loading = loadingContacts || loadingUser || loadingUserSettings || loadingUserKeys;
    const showPlaceholder = !loading && !contactsCount;
    const showList = !loading && !showPlaceholder;

    return (
        <div className="flex flex-column flex-nowrap h100">
            <div className="contacts-widget-search-container flex-item-noshrink">
                <label htmlFor="id_contact-widget-search" className="sr-only">{c('Placeholder')
                    .t`Search for name or email`}</label>
                <SearchInput
                    autoFocus
                    value={search}
                    onChange={setSearch}
                    id="id_contact-widget-search"
                    placeholder={c('Placeholder').t`Search for name or email`}
                />
                <span className="sr-only" aria-atomic aria-live="assertive">
                    {c('Info').ngettext(
                        msgid`${contactsCount} contact found`,
                        `${contactsCount} contacts found`,
                        contactsCount
                    )}
                </span>
            </div>
            <div className="contacts-widget-toolbar pt1 pb1 border-bottom flex-item-noshrink">
                <ContactsWidgetToolbar
                    allChecked={hasCheckedAllFiltered}
                    selected={selectedIDs}
                    noEmailsContactCount={noEmailsContactIDs.length}
                    onCheckAll={handleCheckAll}
                    onCompose={onCompose ? handleCompose : undefined}
                    customActions={customActions}
                    contactList={contactList}
                    onForward={handleForward}
                    onCreate={handleCreate}
                    onDelete={handleDelete}
                    onMerge={() => handleMerge(false)}
                    onClose={onClose}
                />
            </div>
            {showList && countMergeableContacts ? <MergeContactBanner onMerge={() => handleMerge(true)} /> : null}
            <div className="flex-item-fluid w100">
                {loading ? (
                    <div className="flex h100">
                        <FullLoader className="mauto color-primary" />
                    </div>
                ) : null}
                {showPlaceholder ? (
                    <ContactsWidgetPlaceholder
                        type={contactsLength ? EmptyType.Search : EmptyType.All}
                        onClearSearch={handleClearSearch}
                        onCreate={handleCreate}
                        onClose={onClose}
                    />
                ) : null}
                {showList ? (
                    <ContactsList
                        contacts={formattedContacts}
                        contactGroupsMap={contactGroupsMap}
                        user={user}
                        userSettings={userSettings}
                        onCheckOne={handleCheckOne}
                        isDesktop={false}
                        checkedIDs={checkedIDs}
                        onCheck={handleCheck}
                        onClick={handleDetails}
                        activateDrag={false}
                    />
                ) : null}
            </div>
        </div>
    );
};

export default ContactsWidgetContainer;
