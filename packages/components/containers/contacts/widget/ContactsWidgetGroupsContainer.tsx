import React, { useMemo, useState } from 'react';
import { c, msgid } from 'ttag';
import { Recipient } from '@proton/shared/lib/interfaces';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { normalize } from '@proton/shared/lib/helpers/string';
import { noop } from '@proton/shared/lib/helpers/function';
import { orderContactGroups } from '@proton/shared/lib/helpers/contactGroups';

import { ContactUpgradeModal, FullLoader, SearchInput } from '../../../components';
import {
    useContactEmails,
    useContactGroups,
    useModals,
    useNotifications,
    useUser,
    useUserSettings,
} from '../../../hooks';
import ContactsWidgetGroupsToolbar from './ContactsWidgetGroupsToolbar';
import ContactsGroupsList from '../ContactsGroupsList';
import { useItemsSelection } from '../../items';
import ContactGroupModal from '../modals/ContactGroupModal';
import ContactGroupDetailsModal from '../modals/ContactGroupDetailsModal';
import ContactsWidgetPlaceholder, { EmptyType } from './ContactsWidgetPlaceholder';
import ContactGroupDeleteModal from '../modals/ContactGroupDeleteModal';
import { CustomAction } from './types';

interface Props {
    onClose: () => void;
    onCompose?: (recipients: Recipient[], attachments: File[]) => void;
    customActions: CustomAction[];
}

const ContactsWidgetGroupsContainer = ({ onClose, onCompose, customActions }: Props) => {
    const [userSettings, loadingUserSettings] = useUserSettings();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const [user] = useUser();

    const [search, setSearch] = useState('');

    const [groups = [], loadingGroups] = useContactGroups();
    const orderedGroups = orderContactGroups(groups);
    const [contactEmails = [], loadingContactEmails] = useContactEmails() as [ContactEmail[], boolean, any];

    const normalizedSearch = normalize(search);

    const filteredGroups = useMemo(
        () => orderedGroups.filter(({ Name }) => normalize(Name).includes(normalizedSearch)),
        [orderedGroups, normalizedSearch]
    );

    const groupIDs = filteredGroups.map((group) => group.ID);

    const { checkedIDs, selectedIDs, handleCheckAll, handleCheckOne } = useItemsSelection(undefined, groupIDs, []);

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
        if (recipients.length > 100) {
            createNotification({
                type: 'error',
                text: c('Error').t`You can't send a mail to more than 100 recipients`,
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
        onClose();
    };

    const showUpgradeModal = () => createModal(<ContactUpgradeModal />);

    const handleDetails = (groupID: string) => {
        createModal(<ContactGroupDetailsModal contactGroupID={groupID} />);
        onClose();
    };

    const handleDelete = () => {
        createModal(
            <ContactGroupDeleteModal
                groupIDs={selectedIDs}
                onDelete={() => {
                    if (selectedIDs.length === filteredGroups.length) {
                        setSearch('');
                    }
                    handleCheckAll(false);
                }}
            />
        );
        onClose();
    };

    const handleCreate = () => {
        if (!user.hasPaidMail) {
            showUpgradeModal();
            onClose();
            return;
        }

        createModal(<ContactGroupModal />);
        onClose();
    };

    const groupCounts = filteredGroups.length;

    const loading = loadingGroups || loadingContactEmails || loadingUserSettings;
    const showPlaceholder = !loading && !groupCounts;
    const showList = !showPlaceholder;

    return (
        <div className="flex flex-column flex-nowrap h100">
            <div className="contacts-widget-search-container flex-item-noshrink">
                <label htmlFor="id_contact-widget-search" className="sr-only">{c('Placeholder')
                    .t`Search for group name`}</label>
                <SearchInput
                    autoFocus
                    value={search}
                    onChange={setSearch}
                    id="id_contact-widget-group-search"
                    placeholder={c('Placeholder').t`Search for group name`}
                />
                <span className="sr-only" aria-atomic aria-live="assertive">
                    {c('Info').ngettext(msgid`${groupCounts} group found`, `${groupCounts} groups found`, groupCounts)}
                </span>
            </div>
            <div className="contacts-widget-toolbar pt1 pb1 border-bottom flex-item-noshrink">
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
                        type={groups.length ? EmptyType.Search : EmptyType.AllGroups}
                        onClearSearch={handleClearSearch}
                        onCreate={handleCreate}
                        onImport={noop}
                    />
                ) : null}
                {showList ? (
                    <ContactsGroupsList
                        groups={filteredGroups}
                        groupsEmailsMap={groupsEmailsMap}
                        userSettings={userSettings}
                        onCheckOne={handleCheckOne}
                        isDesktop={false}
                        checkedIDs={checkedIDs}
                        onClick={handleDetails}
                    />
                ) : null}
            </div>
        </div>
    );
};

export default ContactsWidgetGroupsContainer;
