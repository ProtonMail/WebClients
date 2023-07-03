import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import {
    HotkeyTuple,
    SidebarList,
    SimpleSidebarListItemHeader,
    useConversationCounts,
    useFolders,
    useHotkeys,
    useLabels,
    useLocalState,
    useMailSettings,
    useMessageCounts,
    useSystemFolders,
    useUser,
} from '@proton/components';
import { MAILBOX_LABEL_IDS, SHOW_MOVED } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { scrollIntoView } from '@proton/shared/lib/helpers/dom';
import { buildTreeview } from '@proton/shared/lib/helpers/folder';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';
import { Folder, FolderWithSubFolders } from '@proton/shared/lib/interfaces/Folder';
import isTruthy from '@proton/utils/isTruthy';

import { LABEL_IDS_TO_HUMAN } from '../../constants';
import { getCounterMap } from '../../helpers/elements';
import { useDeepMemo } from '../../hooks/useDeepMemo';
import { LabelActionsContextProvider } from './EditLabelContext';
import MailSidebarListActions from './MailSidebarListActions';
import MailSidebarSystemFolders from './MailSidebarSystemFolders';
import SidebarFolders from './SidebarFolders';
import SidebarLabels from './SidebarLabels';

export type UnreadCounts = { [labelID: string]: number | undefined };

interface Props {
    labelID: string;
}

const formatFolderID = (folderID: string): string => `folder_expanded_state_${folderID}`;

const MailSidebarList = ({ labelID: currentLabelID }: Props) => {
    const location = useLocation();
    const [user] = useUser();
    const [conversationCounts] = useConversationCounts();
    const [messageCounts] = useMessageCounts();
    const [mailSettings] = useMailSettings();
    const [systemFolders] = useSystemFolders();
    const [labels] = useLabels();
    const [folders, loadingFolders] = useFolders();
    const numFolders = folders?.length || 0;
    const numLabels = labels?.length || 0;
    // Use user.ID or item because in the tests user ID is undefined
    const [displayFolders, toggleFolders] = useLocalState(numFolders > 0, `${user.ID || 'item'}-display-folders`);
    const [displayLabels, toggleLabels] = useLocalState(numLabels > 0, `${user.ID || 'item'}-display-labels`);
    const [displayMoreItems, toggleDisplayMoreItems] = useLocalState(false, `${user.ID || 'item'}-display-more-items`);
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

    const updateFocusItem = useCallback((item: string) => {
        setFocusedItem(item);
        const element = sidebarRef?.current?.querySelector(`[data-shortcut-target~="${item}"]`) as HTMLElement;
        // If the active element is already contained inside the item, don't re-focus the parent. This can happen when there's a button
        // inside the item which we want to take focus instead of the parent.
        if (element?.contains(document.activeElement) || document.activeElement === element) {
            return;
        }
        element?.focus();
        scrollIntoView(element, { block: 'nearest' });
    }, []);

    const counterMap = useDeepMemo(() => {
        if (!mailSettings || !labels || !folders || !conversationCounts || !messageCounts) {
            return {};
        }

        const all = [...labels, ...folders];
        const labelCounterMap = getCounterMap(all, conversationCounts, messageCounts, mailSettings);
        const unreadCounterMap = Object.entries(labelCounterMap).reduce<UnreadCounts>((acc, [id, labelCount]) => {
            acc[id] = labelCount?.Unread;
            return acc;
        }, {});
        return unreadCounterMap;
    }, [mailSettings, labels, folders, conversationCounts, messageCounts, location]);

    const totalMessagesMap = useDeepMemo(() => {
        if (!mailSettings || !labels || !folders || !conversationCounts || !messageCounts) {
            return {};
        }

        const all = [...labels, ...folders];
        const labelCounterMap = getCounterMap(all, conversationCounts, messageCounts, mailSettings);
        const unreadCounterMap = Object.entries(labelCounterMap).reduce<UnreadCounts>((acc, [id, labelCount]) => {
            acc[id] = labelCount?.Total;
            return acc;
        }, {});
        return unreadCounterMap;
    }, [messageCounts, conversationCounts, labels, folders, mailSettings, location]);

    const showScheduled = (totalMessagesMap[MAILBOX_LABEL_IDS.SCHEDULED] || 0) > 0;
    const visibleSystemFolders = systemFolders?.filter((systemFolder) => {
        if (systemFolder.ID === MAILBOX_LABEL_IDS.OUTBOX) {
            return false;
        }
        if (systemFolder.ID === MAILBOX_LABEL_IDS.ALL_SENT) {
            return hasBit(mailSettings?.ShowMoved || 0, SHOW_MOVED.SENT);
        }
        if (systemFolder.ID === MAILBOX_LABEL_IDS.SENT) {
            return !hasBit(mailSettings?.ShowMoved || 0, SHOW_MOVED.SENT);
        }
        if (systemFolder.ID === MAILBOX_LABEL_IDS.ALL_DRAFTS) {
            return hasBit(mailSettings?.ShowMoved || 0, SHOW_MOVED.DRAFTS);
        }
        if (systemFolder.ID === MAILBOX_LABEL_IDS.DRAFTS) {
            return !hasBit(mailSettings?.ShowMoved || 0, SHOW_MOVED.DRAFTS);
        }
        if (systemFolder.ID === MAILBOX_LABEL_IDS.SCHEDULED) {
            return showScheduled;
        }
        return true;
    });
    const sidebarListItems = useMemo(() => {
        const foldersArray = folders?.length ? reduceFolderTreeview : ['add-folder'];
        const labelsArray = labels?.length ? labels.map((f) => f.ID) : ['add-label'];
        const topSystemFolders: string[] = [];
        const bottomSystemFolders: string[] = [];

        visibleSystemFolders?.forEach((folder) => {
            const humanLabelID = LABEL_IDS_TO_HUMAN[folder.ID as MAILBOX_LABEL_IDS];

            if (folder.Display) {
                topSystemFolders.push(humanLabelID);
            } else {
                bottomSystemFolders.push(humanLabelID);
            }
        });

        return [
            topSystemFolders?.length && topSystemFolders,
            'toggle-more-items',
            displayMoreItems && bottomSystemFolders?.length && bottomSystemFolders,
            'toggle-folders',
            displayFolders && foldersArray,
            'toggle-labels',
            displayLabels && labelsArray,
        ]
            .flat(1)
            .filter(isTruthy);
    }, [
        reduceFolderTreeview,
        folders,
        labels,
        visibleSystemFolders,
        showScheduled,
        displayFolders,
        displayLabels,
        displayMoreItems,
    ]);

    const shortcutHandlers: HotkeyTuple[] = [
        [
            'ArrowUp',
            (e) => {
                e.preventDefault();
                const currentIndex = sidebarListItems.indexOf(focusedItem || '');
                const previousIndex = currentIndex !== -1 ? Math.max(0, currentIndex - 1) : sidebarListItems.length - 1;
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
                const currentIndex = sidebarListItems.indexOf(focusedItem || '');
                const nextIndex = currentIndex !== -1 ? Math.min(sidebarListItems.length - 1, currentIndex + 1) : 0;
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

    return (
        <LabelActionsContextProvider>
            <div ref={sidebarRef} tabIndex={-1} className="outline-none flex-item-grow-2">
                <SidebarList>
                    <MailSidebarSystemFolders
                        counterMap={counterMap}
                        currentLabelID={currentLabelID}
                        location={location}
                        mailSettings={mailSettings}
                        setFocusedItem={setFocusedItem}
                        totalMessagesMap={totalMessagesMap}
                        displayMoreItems={displayMoreItems}
                        showScheduled={showScheduled}
                        onToggleMoreItems={toggleDisplayMoreItems}
                    />
                    <SimpleSidebarListItemHeader
                        toggle={displayFolders}
                        onToggle={(display: boolean) => toggleFolders(display)}
                        text={c('Link').t`Folders`}
                        title={c('Link').t`Folders`}
                        id="toggle-folders"
                        onFocus={setFocusedItem}
                        right={<MailSidebarListActions type="folder" items={folders || []} />}
                        spaceAbove
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
                        onFocus={setFocusedItem}
                        right={<MailSidebarListActions type="label" items={labels || []} />}
                        spaceAbove
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
        </LabelActionsContextProvider>
    );
};

export default MailSidebarList;
