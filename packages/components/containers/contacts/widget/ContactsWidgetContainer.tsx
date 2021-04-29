import React, { useState, useMemo, useRef } from 'react';
import { c, msgid } from 'ttag';
import { Recipient } from 'proton-shared/lib/interfaces';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { exportContacts } from 'proton-shared/lib/contacts/helpers/export';
import { extractMergeable } from 'proton-shared/lib/contacts/helpers/merge';

import { FullLoader, SearchInput } from '../../../components';
import { useApi, useModals, useNotifications, useUser, useUserKeys, useUserSettings } from '../../../hooks';
import MergeModal from '../merge/MergeModal';
import ContactsList from '../ContactsList';
import ContactDetailsModal from '../modals/ContactDetailsModal';
import useContactList from '../useContactList';
import ContactsWidgetToolbar from './ContactsWidgetToolbar';
import ContactDeleteModal from '../modals/ContactDeleteModal';
import ContactModal from '../modals/ContactModal';
import ContactsWidgetPlaceholder, { EmptyType } from './ContactsWidgetPlaceholder';
import MergeContactBanner from './MergeContactBanner';

interface Props {
    onClose: () => void;
    onImport: () => void;
    onCompose?: (recipients: Recipient[], attachments: File[]) => void;
}

const ContactsWidgetContainer = ({ onClose, onImport, onCompose }: Props) => {
    const [user, loadingUser] = useUser();
    const [userSettings, loadingUserSettings] = useUserSettings();
    const [userKeysList, loadingUserKeys] = useUserKeys();
    const [userKeys] = useUserKeys();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const api = useApi();
    const mergeContactBannerRef = useRef<HTMLDivElement>(null);

    const [search, setSearch] = useState('');

    // There is no contact "opened" in the widget
    const contactID = '';

    // To use when the widget will deal with groups
    const contactGroupID = '';

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
    } = useContactList({
        search,
        contactID,
        contactGroupID,
    });

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
                `Some contacts have no email address: ${noEmailsContactNamesList} `,
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
                ({ name, vcard }) => new File([vcard], name, { type: 'data:text/plain;charset=utf-8;' })
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
        createModal(<ContactDetailsModal contactID={contactID} />);
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
                contactID={contactID}
                userKeysList={userKeysList}
                onMerged={() => handleCheckAll(false)} // Unselect all contacts
            />
        );
    };

    const contactsCount = formattedContacts.length;
    const contactsLength = contacts ? contacts.length : 0;

    const loading = loadingContacts || loadingUser || loadingUserSettings || loadingUserKeys;
    const showPlaceholder = !loading && !contactsCount;
    const showList = !showPlaceholder;

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
                    selectedCount={selectedIDs.length}
                    noEmailsContactCount={noEmailsContactIDs.length}
                    onCheckAll={handleCheckAll}
                    onCompose={onCompose ? handleCompose : undefined}
                    onForward={handleForward}
                    onCreate={handleCreate}
                    onDelete={handleDelete}
                    onMerge={() => handleMerge(false)}
                />
            </div>
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
                        onImport={onImport}
                    />
                ) : null}
                {showList ? (
                    <>
                        {countMergeableContacts ? (
                            <MergeContactBanner
                                mergeContactBannerRef={mergeContactBannerRef}
                                onMerge={() => handleMerge(true)}
                            />
                        ) : null}
                        <ContactsList
                            contactID={contactID}
                            totalContacts={contactsLength}
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
                            mergeContactBannerRef={mergeContactBannerRef}
                        />
                    </>
                ) : null}
            </div>
        </div>
    );
};

export default ContactsWidgetContainer;
