import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { c } from 'ttag';
import { Location } from 'history';
import {
    Loader,
    useMailSettings,
    useLabels,
    useFolders,
    useModals,
    useConversationCounts,
    useMessageCounts,
    useLocalState,
    useUser,
    SidebarList,
    SimpleSidebarListItemHeader,
    SidebarListItemHeaderLink,
    useHotkeys,
    HotkeyTuple,
    LabelModal,
    Icon,
} from 'react-components';
import { SHOW_MOVED, MAILBOX_LABEL_IDS, APPS } from 'proton-shared/lib/constants';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { buildTreeview } from 'proton-shared/lib/helpers/folder';
import { Folder, FolderWithSubFolders } from 'proton-shared/lib/interfaces/Folder';
import { setItem, getItem } from 'proton-shared/lib/helpers/storage';
import { scrollIntoView } from 'proton-shared/lib/helpers/dom';

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

const formatFolderID = (folderID: string): string => `folder_expanded_state_${folderID}`;

const MailSidebarList = ({ labelID: currentLabelID, location }: Props) => {
    const [user] = useUser();
    const [conversationCounts, actualLoadingConversationCounts] = useConversationCounts();
    const [messageCounts, actualLoadingMessageCounts] = useMessageCounts();
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const [displayFolders, toggleFolders] = useLocalState(true, `${user.ID}-display-folders`);
    const [displayLabels, toggleLabels] = useLocalState(true, `${user.ID}-display-labels`);
    const [labels, loadingLabels] = useLabels();
    const [folders, loadingFolders] = useFolders();
    const { createModal } = useModals();

    const sidebarRef = useRef<HTMLDivElement>(null);

    const [focusedItem, setFocusedItem] = useState<string | null>(null);

    const [foldersUI, setFoldersUI] = useState<Folder[]>([]);

    const foldersTreeview = useMemo(() => buildTreeview(foldersUI), [foldersUI]);

    useEffect(() => {
        if (folders) {
            setFoldersUI(
                folders.map((folder) => ({
                    ...folder,
                    Expanded: getItem(formatFolderID(folder.ID)) === 'false' ? 0 : 1,
                }))
            );
        }
    }, [folders]);

    const handleToggleFolder = useCallback(
        (folder: Folder, expanded: boolean) => {
            // Update view
            setFoldersUI(
                foldersUI.map((folderItem: Folder) => {
                    if (folderItem.ID === folder.ID) {
                        return {
                            ...folderItem,
                            Expanded: expanded ? 1 : 0,
                        };
                    }
                    return folderItem;
                })
            );

            // Save expanded state locally
            setItem(formatFolderID(folder.ID), `${expanded}`);
        },
        [foldersUI]
    );

    const treeviewReducer = (acc: string[], folder: FolderWithSubFolders) => {
        acc.push(folder.ID);

        if (folder.Expanded) {
            folder.subfolders?.forEach((folder) => treeviewReducer(acc, folder));
        }

        return acc;
    };

    const reduceFolderTreeview = useMemo(
        () => foldersTreeview.reduce((acc: string[], folder: FolderWithSubFolders) => treeviewReducer(acc, folder), []),
        [foldersTreeview]
    );

    const updateFocusItem = (item: string) => {
        setFocusedItem(item);
        const element = sidebarRef?.current?.querySelector(`[data-shortcut-target~="${item}"]`) as HTMLElement;
        element?.focus();
        scrollIntoView(element, { block: 'nearest' });
    };

    const sidebarListItems = useMemo(() => {
        const foldersArray = folders?.length ? reduceFolderTreeview : ['add-folder'];
        const labelsArray = labels?.length ? labels.map((f) => f.ID) : ['add-label'];

        return [
            'inbox',
            'drafts',
            'sent',
            'starred',
            'archive',
            'spam',
            'trash',
            'allmail',
            'toggle-folders',
            displayFolders && foldersArray,
            'toggle-labels',
            displayLabels && labelsArray,
        ]
            .flat(1)
            .filter(isTruthy);
    }, [reduceFolderTreeview, folders, labels, displayFolders, displayLabels]);

    const shortcutHandlers: HotkeyTuple[] = [
        [
            'ArrowUp',
            (e) => {
                e.preventDefault();
                const currentIndex = sidebarListItems.indexOf(focusedItem);
                const previousIndex =
                    currentIndex !== null ? Math.max(0, currentIndex - 1) : sidebarListItems.length - 1;
                updateFocusItem(sidebarListItems[previousIndex]);
            },
        ],
        [
            ['Meta', 'ArrowUp'],
            (e) => {
                e.preventDefault();
                updateFocusItem(sidebarListItems[0]);
            },
        ],
        [
            'ArrowDown',
            (e) => {
                e.preventDefault();
                const currentIndex = sidebarListItems.indexOf(focusedItem);
                const nextIndex = currentIndex !== null ? Math.min(sidebarListItems.length - 1, currentIndex + 1) : 0;
                updateFocusItem(sidebarListItems[nextIndex]);
            },
        ],
        [
            ['Meta', 'ArrowDown'],
            (e) => {
                e.preventDefault();
                updateFocusItem(sidebarListItems[sidebarListItems.length - 1]);
            },
        ],
        [
            'ArrowRight',
            () => {
                const element =
                    (document.querySelector(
                        '[data-shortcut-target="item-container"][data-shortcut-target-selected="true"]'
                    ) as HTMLElement) ||
                    (document.querySelector('[data-shortcut-target="item-container"]') as HTMLElement);
                element?.focus();
            },
        ],
    ];

    useHotkeys(sidebarRef, shortcutHandlers);

    // We want to show the loader only at inital loading, not on updates
    const loadingConversationCounts = actualLoadingConversationCounts && conversationCounts?.length === 0;
    const loadingMessageCounts = actualLoadingMessageCounts && messageCounts?.length === 0;

    const { ShowMoved } = mailSettings || { ShowMoved: 0 };

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
        unreadCount: counterMap[labelID],
    });

    return (
        <div ref={sidebarRef} tabIndex={-1} className="no-outline">
            <SidebarList>
                <SidebarItem
                    {...getCommonProps(MAILBOX_LABEL_IDS.INBOX)}
                    icon="inbox"
                    text={c('Link').t`Inbox`}
                    shortcutText="[G] [I]"
                    isFolder
                    id="inbox"
                    onFocus={() => setFocusedItem('inbox')}
                />
                <SidebarItem
                    {...getCommonProps(
                        ShowMoved & SHOW_MOVED.DRAFTS ? MAILBOX_LABEL_IDS.ALL_DRAFTS : MAILBOX_LABEL_IDS.DRAFTS
                    )}
                    icon="drafts"
                    text={c('Link').t`Drafts`}
                    shortcutText="[G] [D]"
                    isFolder
                    id="drafts"
                    onFocus={() => setFocusedItem('drafts')}
                />
                <SidebarItem
                    {...getCommonProps(
                        ShowMoved & SHOW_MOVED.SENT ? MAILBOX_LABEL_IDS.ALL_SENT : MAILBOX_LABEL_IDS.SENT
                    )}
                    icon="sent"
                    text={c('Link').t`Sent`}
                    shortcutText="[G] [E]"
                    isFolder
                    id="sent"
                    onFocus={() => setFocusedItem('sent')}
                />
                <SidebarItem
                    {...getCommonProps(MAILBOX_LABEL_IDS.STARRED)}
                    icon="star"
                    text={c('Link').t`Starred`}
                    shortcutText="[G] [*]"
                    isFolder={false}
                    id="starred"
                    onFocus={() => setFocusedItem('starred')}
                />
                <SidebarItem
                    {...getCommonProps(MAILBOX_LABEL_IDS.ARCHIVE)}
                    icon="archive"
                    text={c('Link').t`Archive`}
                    shortcutText="[G] [A]"
                    isFolder
                    id="archive"
                    onFocus={() => setFocusedItem('archive')}
                />
                <SidebarItem
                    {...getCommonProps(MAILBOX_LABEL_IDS.SPAM)}
                    icon="spam"
                    text={c('Link').t`Spam`}
                    shortcutText="[G] [S]"
                    isFolder
                    id="spam"
                    onFocus={() => setFocusedItem('spam')}
                />
                <SidebarItem
                    {...getCommonProps(MAILBOX_LABEL_IDS.TRASH)}
                    icon="trash"
                    text={c('Link').t`Trash`}
                    shortcutText="[G] [T]"
                    isFolder
                    id="trash"
                    onFocus={() => setFocusedItem('trash')}
                />
                <SidebarItem
                    {...getCommonProps(MAILBOX_LABEL_IDS.ALL_MAIL)}
                    icon="all-emails"
                    text={c('Link').t`All mail`}
                    shortcutText="[G] [M]"
                    isFolder
                    id="allmail"
                    onFocus={() => setFocusedItem('allmail')}
                />
                <SimpleSidebarListItemHeader
                    toggle={displayFolders}
                    onToggle={(display: boolean) => toggleFolders(display)}
                    text={c('Link').t`Folders`}
                    title={c('Link').t`Folders`}
                    id="toggle-folders"
                    onFocus={() => setFocusedItem('toggle-folders')}
                    right={
                        <div className="flex flex-align-items-center">
                            {folders?.length ? (
                                <button
                                    type="button"
                                    className="flex navigation-link-header-group-control flex-item-noshrink"
                                    onClick={() => createModal(<LabelModal type="folder" />)}
                                    title={c('Title').t`Create a new folder`}
                                    data-testid="navigation-link:add-folder"
                                >
                                    <Icon name="plus" />
                                </button>
                            ) : null}
                            <SidebarListItemHeaderLink
                                to="/mail/folders-labels"
                                toApp={APPS.PROTONACCOUNT}
                                icon="settings-singular"
                                title={c('Info').t`Manage your folders`}
                                info={c('Link').t`Manage your folders`}
                                target="_self"
                                data-testid="navigation-link:folders-settings"
                            />
                        </div>
                    }
                />
                {displayFolders && (
                    <SidebarFolders
                        currentLabelID={currentLabelID}
                        counterMap={counterMap}
                        folders={folders || []}
                        loadingFolders={loadingFolders}
                        updateFocusItem={updateFocusItem}
                        handleToggleFolder={handleToggleFolder}
                        foldersTreeview={foldersTreeview}
                    />
                )}
                <SimpleSidebarListItemHeader
                    toggle={displayLabels}
                    onToggle={(display: boolean) => toggleLabels(display)}
                    text={c('Link').t`Labels`}
                    title={c('Link').t`Labels`}
                    id="toggle-labels"
                    onFocus={() => setFocusedItem('toggle-labels')}
                    right={
                        <div className="flex flex-align-items-center">
                            {labels?.length ? (
                                <button
                                    type="button"
                                    className="flex navigation-link-header-group-control flex-item-noshrink"
                                    onClick={() => createModal(<LabelModal />)}
                                    title={c('Title').t`Create a new label`}
                                    data-testid="navigation-link:add-label"
                                >
                                    <Icon name="plus" />
                                </button>
                            ) : null}
                            <SidebarListItemHeaderLink
                                to="/mail/folders-labels"
                                toApp={APPS.PROTONACCOUNT}
                                icon="settings-singular"
                                title={c('Info').t`Manage your labels`}
                                info={c('Link').t`Manage your labels`}
                                target="_self"
                                data-testid="navigation-link:labels-settings"
                            />
                        </div>
                    }
                />
                {displayLabels && (
                    <SidebarLabels
                        currentLabelID={currentLabelID}
                        counterMap={counterMap}
                        labels={labels || []}
                        updateFocusItem={updateFocusItem}
                    />
                )}
            </SidebarList>
        </div>
    );
};

export default MailSidebarList;
