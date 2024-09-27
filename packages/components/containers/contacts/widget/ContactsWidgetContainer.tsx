import type { RefObject } from 'react';
import { useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import { useGetUserKeys } from '@proton/components';
import SearchInput from '@proton/components/components/input/SearchInput';
import { useApi, useNotifications, useUser } from '@proton/components/hooks';
import { useMailSettings } from '@proton/mail/mailSettings/hooks';
import { exportContacts } from '@proton/shared/lib/contacts/helpers/export';
import { extractMergeable } from '@proton/shared/lib/contacts/helpers/merge';
import type { Recipient } from '@proton/shared/lib/interfaces';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { ATTACHMENT_MAX_COUNT } from '@proton/shared/lib/mail/constants';
import { DEFAULT_MAILSETTINGS } from '@proton/shared/lib/mail/mailSettings';
import clsx from '@proton/utils/clsx';

import type { ContactEditProps } from '../edit/ContactEditModal';
import type { ContactGroupEditProps } from '../group/ContactGroupEditModal';
import useContactList from '../hooks/useContactList';
import ContactsList from '../lists/ContactsList';
import type { ContactMergeProps } from '../merge/ContactMergeModal';
import type { ContactDeleteProps } from '../modals/ContactDeleteModal';
import type { ContactGroupLimitReachedProps } from '../modals/ContactGroupLimitReachedModal';
import type { SelectEmailsProps } from '../modals/SelectEmailsModal';
import MergeContactBanner from '../widget/MergeContactBanner';
import ContactsWidgetPlaceholder, { EmptyType } from './ContactsWidgetPlaceholder';
import ContactsWidgetToolbar from './ContactsWidgetToolbar';
import type { CustomAction } from './types';

import './ContactsWidget.scss';

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
    onLimitReached: (props: ContactGroupLimitReachedProps) => void;
    onUpgrade: () => void;
    onSelectEmails: (props: SelectEmailsProps) => Promise<ContactEmail[]>;
    isDrawer?: boolean;
    searchInputRef?: RefObject<HTMLInputElement>;
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
    onLimitReached,
    onUpgrade,
    onSelectEmails,
    isDrawer = false,
    searchInputRef,
}: Props) => {
    const [mailSettings] = useMailSettings();
    const [user, loadingUser] = useUser();
    const getUserKeys = useGetUserKeys();
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
        const maxContacts = mailSettings?.RecipientLimit || DEFAULT_MAILSETTINGS.RecipientLimit;

        if (selectedIDs.length > maxContacts) {
            createNotification({
                type: 'error',
                text: c('Error').ngettext(
                    msgid`You can't send a mail to more than ${maxContacts} recipient`,
                    `You can't send a mail to more than ${maxContacts} recipients`,
                    maxContacts
                ),
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
        // We cannot attach more than 100 files to a message
        const maxAttachments = ATTACHMENT_MAX_COUNT;
        if (selectedIDs.length > maxAttachments) {
            createNotification({
                type: 'error',
                text: c('Action').ngettext(
                    msgid`You can't send vCard files of more than ${maxAttachments} contacts`,
                    `You can't send vCard files of more than ${maxAttachments} contacts`,
                    maxAttachments
                ),
            });
            return;
        }

        try {
            const userKeys = await getUserKeys();
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
    const selectedContactsLength = selectedIDs.length;

    const loading = loadingContacts || loadingUser;
    const showPlaceholder = !loading && !contactsCount;
    const showList = !loading && !showPlaceholder;

    return (
        <div className="flex flex-column flex-nowrap h-full">
            <div className="contacts-widget-search-container shrink-0">
                <label htmlFor="id_contact-widget-search" className="sr-only">{c('Placeholder')
                    .t`Search for name or email`}</label>
                <SearchInput
                    ref={searchInputRef}
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
            <div className="contacts-widget-toolbar py-3 border-bottom border-weak shrink-0">
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
                    onLimitReached={onLimitReached}
                    onClose={onClose}
                    onLock={onLock}
                    onGroupEdit={onGroupEdit}
                    onUpgrade={onUpgrade}
                    onSelectEmails={onSelectEmails}
                    isDrawer={isDrawer}
                />

                {contactsLength ? (
                    <p
                        className={clsx(
                            'text-sm font-semibold m-0 pt-3',
                            selectedContactsLength ? 'color-weak' : 'color-hint'
                        )}
                    >
                        {selectedContactsLength
                            ? // translator: Number of selected contacts out of total number of contacts, e.g. "1/10 contacts selected"
                              c('Info').ngettext(
                                  msgid`${selectedContactsLength}/${contactsLength} contact selected`,
                                  `${selectedContactsLength}/${contactsLength} contacts selected`,
                                  selectedContactsLength
                              )
                            : // translator: Total number of contact when none are selected, e.g. "10 contacts"
                              c('Info').ngettext(
                                  msgid`${contactsLength} contact`,
                                  `${contactsLength} contacts`,
                                  contactsLength
                              )}
                    </p>
                ) : null}
            </div>
            {showList && countMergeableContacts ? (
                <MergeContactBanner onMerge={() => handleMerge(true)} countMergeableContacts={countMergeableContacts} />
            ) : null}
            <div className="flex-1 w-full">
                {loading ? (
                    <div className="flex h-full">
                        <CircleLoader className="m-auto color-primary" size="large" />
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
                        isLargeViewport={false}
                        checkedIDs={checkedIDs}
                        onCheck={handleCheck}
                        onClick={onDetails}
                        activateDrag={false}
                        onGroupDetails={onGroupDetails}
                        isDrawer={isDrawer}
                        onCompose={onCompose}
                    />
                ) : null}
            </div>
        </div>
    );
};

export default ContactsWidgetContainer;
