import React from 'react';
import { c } from 'ttag';
import { Location } from 'history';
import {
    Loader,
    useMailSettings,
    useLabels,
    useFolders,
    useConversationCounts,
    useMessageCounts,
    useLocalState,
    useUser,
    SidebarList,
    SimpleSidebarListItemHeader,
    SidebarListItemHeaderLink
} from 'react-components';
import { SHOW_MOVED, MAILBOX_LABEL_IDS, APPS } from 'proton-shared/lib/constants';

import { getCounterMap } from '../../helpers/elements';
import { isConversationMode } from '../../helpers/mailSettings';
import SidebarItem from './SidebarItem';
import SidebarFolders from './SidebarFolders';
import SidebarLabels from './SidebarLabels';
import { useDeepMemo } from '../../hooks/useDeepMemo';

export type UnreadCounts = { [labelID: string]: number | undefined };

interface Props {
    labelID: string;
    location: Location;
}

const MailSidebarList = ({ labelID: currentLabelID, location }: Props) => {
    const [user] = useUser();
    const [conversationCounts, actualLoadingConversationCounts] = useConversationCounts();
    const [messageCounts, actualLoadingMessageCounts] = useMessageCounts();
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const [displayFolders, toggleFolders] = useLocalState(true, `${user.ID}-display-folders`);
    const [displayLabels, toggleLabels] = useLocalState(true, `${user.ID}-display-labels`);
    const [labels, loadingLabels] = useLabels();
    const [folders, loadingFolders] = useFolders();

    // We want to show the loader only at inital loading, not on updates
    const loadingConversationCounts = actualLoadingConversationCounts && conversationCounts.length === 0;
    const loadingMessageCounts = actualLoadingMessageCounts && messageCounts.length === 0;

    const { ShowMoved } = mailSettings || {};

    const isConversation = isConversationMode(currentLabelID, mailSettings, location);

    const counterMap = useDeepMemo(() => {
        if (!mailSettings || !labels || !folders || !conversationCounts || !messageCounts) {
            return {};
        }

        const all = [...labels, ...folders];
        const labelCounterMap = getCounterMap(all, conversationCounts, messageCounts, mailSettings, location);
        const unreadCounterMap = Object.entries(labelCounterMap).reduce<UnreadCounts>((acc, [id, labelCount]) => {
            acc[id] = labelCount?.Unread;
            return acc;
        }, {});
        return unreadCounterMap;
    }, [mailSettings, labels, folders, conversationCounts, messageCounts]);

    if (loadingMailSettings || loadingLabels || loadingFolders || loadingConversationCounts || loadingMessageCounts) {
        return <Loader />;
    }

    const getCommonProps = (labelID: string) => ({
        currentLabelID,
        labelID,
        isConversation,
        unreadCount: counterMap[labelID]
    });

    return (
        <SidebarList>
            <SidebarItem
                {...getCommonProps(MAILBOX_LABEL_IDS.INBOX)}
                icon="inbox"
                text={c('Link').t`Inbox`}
                isFolder={true}
                data-test-id="inbox"
            />
            <SidebarItem
                {...getCommonProps(
                    ShowMoved & SHOW_MOVED.DRAFTS ? MAILBOX_LABEL_IDS.ALL_DRAFTS : MAILBOX_LABEL_IDS.DRAFTS
                )}
                icon="drafts"
                text={c('Link').t`Drafts`}
                isFolder={true}
                data-test-id="drafts"
            />
            <SidebarItem
                {...getCommonProps(ShowMoved & SHOW_MOVED.SENT ? MAILBOX_LABEL_IDS.ALL_SENT : MAILBOX_LABEL_IDS.SENT)}
                icon="sent"
                text={c('Link').t`Sent`}
                isFolder={true}
                data-test-id="sent"
            />
            <SidebarItem
                {...getCommonProps(MAILBOX_LABEL_IDS.STARRED)}
                icon="star"
                text={c('Link').t`Starred`}
                isFolder={false}
                data-test-id="starred"
            />
            <SidebarItem
                {...getCommonProps(MAILBOX_LABEL_IDS.ARCHIVE)}
                icon="archive"
                text={c('Link').t`Archive`}
                isFolder={true}
                data-test-id="archive"
            />
            <SidebarItem
                {...getCommonProps(MAILBOX_LABEL_IDS.SPAM)}
                icon="spam"
                text={c('Link').t`Spam`}
                isFolder={true}
                data-test-id="spam"
            />
            <SidebarItem
                {...getCommonProps(MAILBOX_LABEL_IDS.TRASH)}
                icon="trash"
                text={c('Link').t`Trash`}
                isFolder={true}
                data-test-id="trash"
            />
            <SidebarItem
                {...getCommonProps(MAILBOX_LABEL_IDS.ALL_MAIL)}
                icon="all-emails"
                text={c('Link').t`All mail`}
                isFolder={true}
                data-test-id="allmail"
            />
            <SimpleSidebarListItemHeader
                toggle={displayFolders}
                onToggle={() => toggleFolders(!displayFolders)}
                text={c('Link').t`Folders`}
                title={c('Link').t`Folders`}
                right={
                    <SidebarListItemHeaderLink
                        to="/labels"
                        toApp={APPS.PROTONMAIL_SETTINGS}
                        icon="settings-singular"
                        title={c('Info').t`Manage your folders`}
                        info={c('Link').t`Manage your folders`}
                    />
                }
            />
            {displayFolders && <SidebarFolders currentLabelID={currentLabelID} counterMap={counterMap} />}
            <SimpleSidebarListItemHeader
                toggle={displayLabels}
                onToggle={() => toggleLabels(!displayLabels)}
                text={c('Link').t`Labels`}
                title={c('Link').t`Labels`}
                right={
                    <SidebarListItemHeaderLink
                        to="/labels"
                        toApp={APPS.PROTONMAIL_SETTINGS}
                        icon="settings-singular"
                        title={c('Info').t`Manage your labels`}
                        info={c('Link').t`Manage your labels`}
                    />
                }
            />
            {displayLabels && <SidebarLabels currentLabelID={currentLabelID} counterMap={counterMap} />}
        </SidebarList>
    );
};

export default MailSidebarList;
