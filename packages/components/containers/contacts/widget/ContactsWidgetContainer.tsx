import { useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import { SearchInput } from '@proton/components';
import { useApi, useNotifications, useUser, useUserKeys } from '@proton/components/hooks';
import { exportContacts } from '@proton/shared/lib/contacts/helpers/export';
import { extractMergeable } from '@proton/shared/lib/contacts/helpers/merge';
import { Recipient } from '@proton/shared/lib/interfaces';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

import { ContactEditProps } from '../edit/ContactEditModal';
import { ContactGroupEditProps } from '../group/ContactGroupEditModal';
import useContactList from '../hooks/useContactList';
import ContactsList from '../lists/ContactsList';
import { ContactMergeProps } from '../merge/ContactMergeModal';
import { ContactDeleteProps } from '../modals/ContactDeleteModal';
import { SelectEmailsProps } from '../modals/SelectEmailsModal';
import MergeContactBanner from '../widget/MergeContactBanner';
import ContactsWidgetPlaceholder, { EmptyType } from './ContactsWidgetPlaceholder';
import ContactsWidgetToolbar from './ContactsWidgetToolbar';
import { CustomAction } from './types';

interface Props {
    onClose?: () => void;
    onCompose?: (recipients: Recipient[], attachments: File[]) => void;
    onLock?: (lock: boolean) => void;
    customActions: CustomAction[];
    onDetails: (contactID: string) => void;
    onEdit: (props: ContactEditProps) => void;
    onDelete: (props: ContactDeleteProps) => void;
    onImport: () => void;
    onMerge: (props: ContactMergeProps) => void;
    onGroupDetails: (contactGroupID: string) => void;
    onGroupEdit: (props: ContactGroupEditProps) => void;
    onUpgrade: () => void;
    onSelectEmails: (props: SelectEmailsProps) => Promise<ContactEmail[]>;
    isDrawer?: boolean;
}

const ContactsWidgetContainer = ({
    onClose,
    onCompose,
    onLock,
    customActions,
    onDetails,
    onEdit,
    onDelete,
    onImport,
    onMerge,
    onGroupDetails,
    onGroupEdit,
    onUpgrade,
    onSelectEmails,
    isDrawer = false,
}: Props) => {
    const [user, loadingUser] = useUser();
    const [userKeys] = useUserKeys();
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
        onClose?.();
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
        onClose?.();
    };

    const handleDelete = () => {
        const deleteAll = selectedIDs.length === contacts.length;
        onDelete({
            contactIDs: selectedIDs,
            deleteAll,
            onDelete: () => {
                if (selectedIDs.length === filteredContacts.length) {
                    setSearch('');
                }
                handleCheckAll(false);
            },
        });
        onClose?.();
    };

    const handleCreate = () => {
        onEdit({});
        onClose?.();
    };

    const handleImport = () => {
        onImport();
        onClose?.();
    };

    const handleMerge = (mergeContactsDetected?: boolean) => {
        const selectedContacts = formattedContacts.filter((contact) => selectedIDs.includes(contact.ID));
        const contacts = mergeContactsDetected ? mergeableContacts : [selectedContacts];

        const onMerged = () => handleCheckAll(false);
        onMerge({ contacts, onMerged });
        onClose?.();
    };

    const contactsCount = formattedContacts.length;
    const contactsLength = contacts ? contacts.length : 0;

    const loading = loadingContacts || loadingUser;
    const showPlaceholder = !loading && !contactsCount;
    const showList = !loading && !showPlaceholder;

    return (
        <div className="flex flex-column flex-nowrap h100">
            <div className="contacts-widget-search-container flex-item-noshrink">
                <label htmlFor="id_contact-widget-search" className="sr-only">{c('Placeholder')
                    .t`Search for name or email`}</label>
                <SearchInput
                    autoFocus={!isDrawer}
                    value={search}
                    onChange={setSearch}
                    id="id_contact-widget-search"
                    placeholder={c('Placeholder').t`Name or email address`}
                />
                <span className="sr-only" aria-atomic aria-live="assertive">
                    {c('Info').ngettext(
                        msgid`${contactsCount} contact found`,
                        `${contactsCount} contacts found`,
                        contactsCount
                    )}
                </span>
            </div>
            <div className="contacts-widget-toolbar py1 border-bottom border-weak flex-item-noshrink">
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
                    onLock={onLock}
                    onGroupEdit={onGroupEdit}
                    onUpgrade={onUpgrade}
                    onSelectEmails={onSelectEmails}
                    isDrawer={isDrawer}
                />
            </div>
            {showList && countMergeableContacts ? (
                <MergeContactBanner onMerge={() => handleMerge(true)} countMergeableContacts={countMergeableContacts} />
            ) : null}
            <div className="flex-item-fluid w100">
                {loading ? (
                    <div className="flex h100">
                        <CircleLoader className="mauto color-primary" size="large" />
                    </div>
                ) : null}
                {showPlaceholder ? (
                    <ContactsWidgetPlaceholder
                        type={contactsLength ? EmptyType.Search : EmptyType.All}
                        onClearSearch={handleClearSearch}
                        onCreate={handleCreate}
                        onImport={handleImport}
                    />
                ) : null}
                {showList ? (
                    <ContactsList
                        contacts={formattedContacts}
                        contactGroupsMap={contactGroupsMap}
                        user={user}
                        onCheckOne={handleCheckOne}
                        isDesktop={false}
                        checkedIDs={checkedIDs}
                        onCheck={handleCheck}
                        onClick={onDetails}
                        activateDrag={false}
                        onGroupDetails={onGroupDetails}
                        isDrawer={isDrawer}
                    />
                ) : null}
            </div>
        </div>
    );
};

export default ContactsWidgetContainer;
