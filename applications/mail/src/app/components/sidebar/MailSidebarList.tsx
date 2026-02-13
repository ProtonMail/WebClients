import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import type { HotkeyTuple } from '@proton/components';
import { SidebarList, SimpleSidebarListItemHeader, useHotkeys, useLocalState } from '@proton/components';
import { useFolders, useLabels, useSystemFolders } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { SOURCE_EVENT } from '@proton/shared/lib/helpers/collapsibleSidebar';
import { scrollIntoView } from '@proton/shared/lib/helpers/dom';
import { buildTreeview } from '@proton/shared/lib/helpers/folder';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';
import type { Folder, FolderWithSubFolders } from '@proton/shared/lib/interfaces/Folder';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';
import { SHOW_MOVED } from '@proton/shared/lib/mail/mailSettings';
import isTruthy from '@proton/utils/isTruthy';

import { APPLY_LOCATION_TYPES } from 'proton-mail/hooks/actions/applyLocation/interface';
import { useApplyLocation } from 'proton-mail/hooks/actions/applyLocation/useApplyLocation';
import { useMailboxCounter } from 'proton-mail/hooks/useMailboxCounter';
import { getLocationCount } from 'proton-mail/hooks/useMailboxCounter.helpers';

import { useApplyLabels } from '../../hooks/actions/label/useApplyLabels';
import { useMoveToFolder } from '../../hooks/actions/move/useMoveToFolder';
import { LabelActionsContextProvider } from './EditLabelContext';
import { MailSidebarCollapsedButton } from './MailSidebarCollapsedButton';
import { MailSidebarCustomView } from './MailSidebarCustomView';
import MailSidebarListActions from './MailSidebarListActions';
import MailSidebarSystemFolders from './MailSidebarSystemFolders';
import SidebarFolders from './SidebarFolders';
import SidebarLabels from './SidebarLabels';

interface Props {
    postItems: ReactNode;
    collapsed?: boolean;
    onClickExpandNav?: (sourceEvent: SOURCE_EVENT) => void;
}

const formatFolderID = (folderID: string): string => `folder_expanded_state_${folderID}`;

const MailSidebarList = ({ postItems, collapsed = false, onClickExpandNav }: Props) => {
    const [user] = useUser();
    const [mailSettings] = useMailSettings();
    const [systemFolders] = useSystemFolders();
    const [labels] = useLabels();
    const [folders, loadingFolders] = useFolders();
    const [displayMoreItems, toggleDisplayMoreItems] = useLocalState(false, `${user.ID || 'item'}-display-more-items`);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const [focusedItem, setFocusedItem] = useState<string | null>(null);
    const [foldersUI, setFoldersUI] = useState<Folder[]>([]);
    const foldersTreeview = useMemo(() => buildTreeview(foldersUI), [foldersUI]);
    const { applyLabels, applyLabelsToAllModal } = useApplyLabels();
    const { applyLocation } = useApplyLocation();
    const { moveToFolder, moveScheduledModal, moveSnoozedModal, moveToSpamModal, selectAllMoveModal } =
        useMoveToFolder();

    const [counterMap] = useMailboxCounter();

    const numFolders = folders?.length || 0;
    const numLabels = labels?.length || 0;
    // Use user.ID or item because in the tests user ID is undefined
    const [displayFolders, toggleFolders] = useLocalState(numFolders > 0, `${user.ID || 'item'}-display-folders`);
    const [displayLabels, toggleLabels] = useLocalState(numLabels > 0, `${user.ID || 'item'}-display-labels`);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-1942A8
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

    const showScheduled = getLocationCount(counterMap, MAILBOX_LABEL_IDS.SCHEDULED).Total > 0;
    const showSnoozed = getLocationCount(counterMap, MAILBOX_LABEL_IDS.SNOOZED).Total > 0;
    const visibleSystemFolders = systemFolders?.filter((systemFolder) => {
        if (systemFolder.ID === MAILBOX_LABEL_IDS.OUTBOX) {
            return false;
        }
        if (systemFolder.ID === MAILBOX_LABEL_IDS.ALL_SENT) {
            return hasBit(mailSettings.ShowMoved, SHOW_MOVED.SENT);
        }
        if (systemFolder.ID === MAILBOX_LABEL_IDS.SENT) {
            return !hasBit(mailSettings.ShowMoved, SHOW_MOVED.SENT);
        }
        if (systemFolder.ID === MAILBOX_LABEL_IDS.ALL_DRAFTS) {
            return hasBit(mailSettings.ShowMoved, SHOW_MOVED.DRAFTS);
        }
        if (systemFolder.ID === MAILBOX_LABEL_IDS.DRAFTS) {
            return !hasBit(mailSettings.ShowMoved, SHOW_MOVED.DRAFTS);
        }
        if (systemFolder.ID === MAILBOX_LABEL_IDS.SCHEDULED) {
            return showScheduled;
        }
        if (systemFolder.ID === MAILBOX_LABEL_IDS.SNOOZED) {
            return showSnoozed;
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
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-2FF225
    }, [
        reduceFolderTreeview,
        folders,
        labels,
        visibleSystemFolders,
        showScheduled,
        showSnoozed,
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
            <div ref={sidebarRef} tabIndex={-1} className="outline-none grow-2">
                <SidebarList>
                    <MailSidebarSystemFolders
                        counterMap={counterMap}
                        setFocusedItem={setFocusedItem}
                        displayMoreItems={displayMoreItems}
                        showScheduled={showScheduled}
                        showSnoozed={showSnoozed}
                        onToggleMoreItems={toggleDisplayMoreItems}
                        collapsed={collapsed}
                        applyLabels={(params) =>
                            params.selectAll
                                ? applyLabels(params)
                                : applyLocation({
                                      type: APPLY_LOCATION_TYPES.APPLY_LABEL,
                                      changes: params.changes,
                                      elements: params.elements,
                                      destinationLabelID: params.destinationLabelID!, // TODO: Improve this when removing old apply labels function
                                      createFilters: params.createFilters,
                                  })
                        }
                        moveToFolder={(params) =>
                            params.selectAll
                                ? moveToFolder(params)
                                : applyLocation({
                                      type: APPLY_LOCATION_TYPES.MOVE,
                                      elements: params.elements,
                                      destinationLabelID: params.destinationLabelID!, // TODO: Improve this when removing old apply labels function
                                      createFilters: params.createFilters,
                                  })
                        }
                    />

                    <MailSidebarCustomView collapsed={collapsed} />

                    {collapsed ? (
                        <MailSidebarCollapsedButton
                            type="folders"
                            onClick={() => onClickExpandNav?.(SOURCE_EVENT.BUTTON_FOLDERS)}
                            title={c('Action').t`Expand navigation bar to see folders`}
                        />
                    ) : (
                        <>
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
                                    counterMap={counterMap}
                                    folders={folders || []}
                                    loadingFolders={loadingFolders}
                                    updateFocusItem={updateFocusItem}
                                    handleToggleFolder={handleToggleFolder}
                                    foldersTreeview={foldersTreeview}
                                    applyLabels={(params) =>
                                        params.selectAll
                                            ? applyLabels(params)
                                            : applyLocation({
                                                  type: APPLY_LOCATION_TYPES.APPLY_LABEL,
                                                  changes: params.changes,
                                                  elements: params.elements,
                                                  destinationLabelID: params.destinationLabelID!, // TODO: Improve this when removing old apply labels function
                                                  createFilters: params.createFilters,
                                              })
                                    }
                                    moveToFolder={(params) =>
                                        params.selectAll
                                            ? moveToFolder(params)
                                            : applyLocation({
                                                  type: APPLY_LOCATION_TYPES.MOVE,
                                                  elements: params.elements,
                                                  destinationLabelID: params.destinationLabelID!, // TODO: Improve this when removing old apply labels function
                                                  createFilters: params.createFilters,
                                              })
                                    }
                                />
                            )}
                        </>
                    )}

                    {collapsed ? (
                        <MailSidebarCollapsedButton
                            type="labels"
                            onClick={() => onClickExpandNav?.(SOURCE_EVENT.BUTTON_LABELS)}
                            title={c('Action').t`Expand navigation bar to see labels`}
                        />
                    ) : (
                        <>
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
                                    counterMap={counterMap}
                                    labels={labels || []}
                                    updateFocusItem={updateFocusItem}
                                    applyLabels={(params) =>
                                        params.selectAll
                                            ? applyLabels(params)
                                            : applyLocation({
                                                  type: APPLY_LOCATION_TYPES.APPLY_LABEL,
                                                  changes: params.changes,
                                                  elements: params.elements,
                                                  destinationLabelID: params.destinationLabelID!, // TODO: Improve this when removing old apply labels function
                                                  createFilters: params.createFilters,
                                              })
                                    }
                                    moveToFolder={(params) =>
                                        params.selectAll
                                            ? moveToFolder(params)
                                            : applyLocation({
                                                  type: APPLY_LOCATION_TYPES.MOVE,
                                                  elements: params.elements,
                                                  destinationLabelID: params.destinationLabelID!, // TODO: Improve this when removing old apply labels function
                                                  createFilters: params.createFilters,
                                              })
                                    }
                                />
                            )}
                        </>
                    )}

                    {postItems}
                </SidebarList>
            </div>
            {moveScheduledModal}
            {moveSnoozedModal}
            {moveToSpamModal}
            {selectAllMoveModal}
            {applyLabelsToAllModal}
        </LabelActionsContextProvider>
    );
};

export default MailSidebarList;
