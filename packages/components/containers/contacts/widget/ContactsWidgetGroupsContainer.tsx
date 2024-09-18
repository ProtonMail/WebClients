import { useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import { orderContactGroups } from '@proton/shared/lib/helpers/contactGroups';
import { normalize } from '@proton/shared/lib/helpers/string';
import type { Recipient } from '@proton/shared/lib/interfaces';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { DEFAULT_MAILSETTINGS } from '@proton/shared/lib/mail/mailSettings';

import { SearchInput } from '../../../components';
import { useContactEmails, useContactGroups, useMailSettings, useNotifications, useUser } from '../../../hooks';
import useItemsSelection from '../../items/useItemsSelection';
import type { ContactGroupDeleteProps } from '../group/ContactGroupDeleteModal';
import type { ContactGroupEditProps } from '../group/ContactGroupEditModal';
import ContactsGroupsList from '../lists/ContactsGroupsList';
import ContactsWidgetGroupsToolbar from './ContactsWidgetGroupsToolbar';
import ContactsWidgetPlaceholder, { EmptyType } from './ContactsWidgetPlaceholder';
import type { CustomAction } from './types';

interface Props {
    onClose?: () => void;
    onCompose?: (recipients: Recipient[], attachments: File[]) => void;
    onImport: () => void;
    customActions: CustomAction[];
    onDetails: (contactGroupID: string) => void;
    onDelete: (props: ContactGroupDeleteProps) => void;
    onEdit: (props: ContactGroupEditProps) => void;
    onUpgrade: () => void;
    isDrawer?: boolean;
}

const ContactsWidgetGroupsContainer = ({
    onClose,
    onCompose,
    onImport,
    customActions,
    onDetails,
    onDelete,
    onEdit,
    onUpgrade,
    isDrawer = false,
}: Props) => {
    const [mailSettings] = useMailSettings();
    const { createNotification } = useNotifications();
    const [user] = useUser();

    const [search, setSearch] = useState('');

    const [groups = [], loadingGroups] = useContactGroups();
    const orderedGroups = orderContactGroups(groups);
    const [contactEmails = [], loadingContactEmails] = useContactEmails();

    const normalizedSearch = normalize(search);

    const filteredGroups = useMemo(
        () => orderedGroups.filter(({ Name }) => normalize(Name).includes(normalizedSearch)),
        [orderedGroups, normalizedSearch]
    );

    const groupIDs = filteredGroups.map((group) => group.ID);

    const { checkedIDs, selectedIDs, handleCheckAll, handleCheckOne } = useItemsSelection({
        allIDs: groupIDs,
    });

    const allChecked = checkedIDs.length > 0 && checkedIDs.length === filteredGroups.length;

    const groupsEmailsMap = useMemo(
        () =>
            contactEmails.reduce<{ [groupID: string]: ContactEmail[] }>((acc, contactEmail) => {
                contactEmail.LabelIDs.forEach((labelID) => {
                    if (!acc[labelID]) {
                        acc[labelID] = [];
                    }
                    acc[labelID].push(contactEmail);
                });
                return acc;
            }, {}),
        [groups, contactEmails]
    );

    const recipients = selectedIDs
        .map((selectedID) => {
            const group = groups.find((group) => group.ID === selectedID);
            if (groupsEmailsMap[selectedID]) {
                return groupsEmailsMap[selectedID].map((email) => ({
                    Name: email.Name,
                    Address: email.Email,
                    Group: group?.Path,
                }));
            }
            return [];
        })
        .flat();

    const handleClearSearch = () => {
        // If done synchronously, button is removed from the dom and the dropdown considers a click outside
        setTimeout(() => setSearch(''));
    };

    const handleCompose = () => {
        const maxContacts = mailSettings?.RecipientLimit || DEFAULT_MAILSETTINGS.RecipientLimit;

        if (recipients.length > maxContacts) {
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

        const noContactGroupIDs = selectedIDs.filter((groupID) => !groupsEmailsMap[groupID]?.length);

        if (noContactGroupIDs.length) {
            const noContactsGroupNames = noContactGroupIDs.map(
                // Looping in all groups is no really performant but should happen rarely
                (groupID) => groups.find((group) => group.ID === groupID)?.Name
            );

            const noContactGroupCount = noContactsGroupNames.length;
            const noContactGroupList = noContactsGroupNames.join(', ');

            const text = c('Error').ngettext(
                msgid`One of the groups has no contacts: ${noContactGroupList}`,
                `Some groups have no contacts: ${noContactGroupList} `,
                noContactGroupCount
            );

            createNotification({ type: 'warning', text });
        }

        onCompose?.(recipients, []);
        onClose?.();
    };

    const handleDetails = (groupID: string) => {
        onDetails(groupID);
        onClose?.();
    };

    const handleDelete = () => {
        onDelete({
            groupIDs: selectedIDs,
            onDelete: () => {
                if (selectedIDs.length === filteredGroups.length) {
                    setSearch('');
                }
                handleCheckAll(false);
            },
        });
        onClose?.();
    };

    const handleCreate = () => {
        if (!user.hasPaidMail) {
            onUpgrade();
            onClose?.();
            return;
        }

        onEdit({});
        onClose?.();
    };

    const handleImport = () => {
        onImport();
        onClose?.();
    };

    const groupCounts = filteredGroups.length;

    const loading = loadingGroups || loadingContactEmails;
    const showPlaceholder = !loading && !groupCounts;
    const showList = !showPlaceholder;

    return (
        <div className="flex flex-column flex-nowrap h-full">
            <div className="contacts-widget-search-container shrink-0">
                <label htmlFor="id_contact-widget-search" className="sr-only">{c('Placeholder')
                    .t`Search for group name`}</label>
                <SearchInput
                    autoFocus
                    value={search}
                    onChange={setSearch}
                    id="id_contact-widget-group-search"
                    placeholder={c('Placeholder').t`Group name`}
                />
                <span className="sr-only" aria-atomic aria-live="assertive">
                    {c('Info').ngettext(msgid`${groupCounts} group found`, `${groupCounts} groups found`, groupCounts)}
                </span>
            </div>
            <div className="contacts-widget-toolbar py-4 border-bottom border-weak shrink-0">
                <ContactsWidgetGroupsToolbar
                    allChecked={allChecked}
                    selected={selectedIDs}
                    numberOfRecipients={recipients.length}
                    onCheckAll={handleCheckAll}
                    onCompose={onCompose ? handleCompose : undefined}
                    groupsEmailsMap={groupsEmailsMap}
                    recipients={recipients}
                    onClose={onClose}
                    customActions={customActions}
                    onCreate={handleCreate}
                    onDelete={handleDelete}
                    isDrawer={isDrawer}
                />
            </div>
            <div className="flex-1 w-full">
                {loading ? (
                    <div className="flex h-full">
                        <CircleLoader className="m-auto color-primary" size="large" />
                    </div>
                ) : null}
                {showPlaceholder ? (
                    <ContactsWidgetPlaceholder
                        type={groups.length ? EmptyType.Search : EmptyType.AllGroups}
                        onClearSearch={handleClearSearch}
                        onCreate={handleCreate}
                        onImport={handleImport}
                    />
                ) : null}
                {showList ? (
                    <ContactsGroupsList
                        groups={filteredGroups}
                        groupsEmailsMap={groupsEmailsMap}
                        onCheckOne={handleCheckOne}
                        isLargeViewport={false}
                        checkedIDs={checkedIDs}
                        onClick={handleDetails}
                        isDrawer={isDrawer}
                        onCompose={onCompose}
                    />
                ) : null}
            </div>
        </div>
    );
};

export default ContactsWidgetGroupsContainer;
