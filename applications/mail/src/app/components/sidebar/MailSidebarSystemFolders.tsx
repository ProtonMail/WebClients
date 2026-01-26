import type { DragEvent, DragEventHandler } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { useRetentionPolicies } from '@proton/account/retentionPolicies/hooks';
import { SimpleSidebarListItemHeader } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import type { ApplyLabelsParams } from 'proton-mail/hooks/actions/label/interface';
import type { LocationCountMap } from 'proton-mail/hooks/useMailboxCounter';
import { getLocationCount } from 'proton-mail/hooks/useMailboxCounter.helpers';

import type { MoveParams } from '../../hooks/actions/move/useMoveToFolder';
import type { SystemFolder } from '../../hooks/useMoveSystemFolders';
import useMoveSystemFolders, { SYSTEM_FOLDER_SECTION } from '../../hooks/useMoveSystemFolders';
import { useCategoriesView } from '../categoryView/useCategoriesView';
import SidebarItem from './SidebarItem';

interface Props {
    counterMap: LocationCountMap;
    setFocusedItem: (id: string) => void;
    displayMoreItems: boolean;
    showScheduled: boolean;
    showSnoozed: boolean;
    onToggleMoreItems: (display: boolean) => void;
    collapsed?: boolean;
    moveToFolder: (params: MoveParams) => void;
    applyLabels: (params: ApplyLabelsParams) => void;
}

const DND_MORE_FOLDER_ID = 'DND_MORE_FOLDER_ID';

interface DnDWrapperProps extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
    isDnDAllowed: boolean;
    children: React.ReactElement;
}
const DnDElementWrapper = ({ isDnDAllowed, children, ...rest }: DnDWrapperProps) => {
    return isDnDAllowed ? (
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        <div role="presentation" {...rest}>
            {children}
        </div>
    ) : (
        children
    );
};

type HandleDragOver = (elementId: MAILBOX_LABEL_IDS | typeof DND_MORE_FOLDER_ID) => DragEventHandler<HTMLDivElement>;

const MailSidebarSystemFolders = ({
    counterMap,
    setFocusedItem,
    showScheduled,
    showSnoozed,
    displayMoreItems,
    onToggleMoreItems,
    collapsed = false,
    moveToFolder,
    applyLabels,
}: Props) => {
    const [retentionRules] = useRetentionPolicies();
    const showSoftDeletedFolder = !!retentionRules?.length;

    const [sidebarElements, moveSidebarElement] = useMoveSystemFolders({
        showScheduled,
        showSnoozed,
        showSoftDeletedFolder,
    });

    const { categoryViewAccess } = useCategoriesView();

    const lastDragTimeRef = useRef<number>();
    const isDragging = useRef<boolean>();
    const dragOverlay = useRef<HTMLDivElement>();
    const [draggedElementId, setDraggedElementId] = useState<MAILBOX_LABEL_IDS | undefined>();
    const [dragOveredElementId, setDragOveredElementId] = useState<string | undefined>();
    const [isOverMoreFolder, setIsOverMoreFolder] = useState<boolean>();

    const [mainElements, moreElements] = useMemo(() => {
        const mainElements: SystemFolder[] = [];
        const moreElements: SystemFolder[] = [];

        sidebarElements.forEach((item) => {
            if (item.display === SYSTEM_FOLDER_SECTION.MAIN) {
                mainElements.push(item);
            } else {
                moreElements.push(item);
            }
        });

        return [mainElements, moreElements];
    }, [sidebarElements]);

    const handleDragOver: HandleDragOver = (elementId) => (event) => {
        if (!isDragging.current) {
            event.preventDefault();
            return;
        }

        // "dragover" event must be prevented to allow "drop" event
        event.preventDefault();

        if (elementId === DND_MORE_FOLDER_ID && displayMoreItems === false) {
            setIsOverMoreFolder(true);
        } else {
            setIsOverMoreFolder(false);
        }

        setDragOveredElementId(elementId);
        lastDragTimeRef.current = Date.now();
    };

    const handleDragStart = (labelId: MAILBOX_LABEL_IDS) => (event: DragEvent<HTMLDivElement>) => {
        if (labelId === MAILBOX_LABEL_IDS.INBOX) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        const draggedSystemFolder = sidebarElements.find((element) => labelId === element.labelID);

        if (!draggedSystemFolder) {
            return;
        }
        const sidebarElementName = draggedSystemFolder.text;

        dragOverlay.current = document.createElement('div');
        // translator: This is the text overlay following the cursor when dragging a sidebar element. Ex: Move Inbox
        dragOverlay.current.innerHTML = c('Label').t`Move ${sidebarElementName}`;
        dragOverlay.current.className = 'absolute bg-weak text-white py-2 px-4 rounded';
        document.body.appendChild(dragOverlay.current);

        event.dataTransfer.setDragImage(dragOverlay.current, 0, 30);

        setDraggedElementId(labelId);

        isDragging.current = true;
    };

    const handleResetDragState = () => {
        isDragging.current = false;
        setDraggedElementId(undefined);
        setDragOveredElementId(undefined);
        setIsOverMoreFolder(undefined);
        if (dragOverlay.current) {
            document.body.removeChild(dragOverlay.current);
            lastDragTimeRef.current = undefined;
            isDragging.current = undefined;
            dragOverlay.current = undefined;
        }
    };

    type HandleDrop = (
        droppedId: MAILBOX_LABEL_IDS | 'MORE_FOLDER_ITEM',
        draggedId: MAILBOX_LABEL_IDS | undefined
    ) => DragEventHandler;
    const handleDrop: HandleDrop = (droppedId, draggedId) => (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();

        if (!isDragging.current || !draggedId) {
            return;
        }

        handleResetDragState();
        moveSidebarElement(draggedId, droppedId);
    };

    const getDnDClasses = (hoveredId: MAILBOX_LABEL_IDS, draggedId: MAILBOX_LABEL_IDS | undefined) => {
        if (dragOveredElementId !== hoveredId || hoveredId === draggedId || draggedId === MAILBOX_LABEL_IDS.INBOX) {
            return '';
        }

        const draggedElementOrder = sidebarElements.find((el) => el.labelID === draggedId)?.order;
        const hoveredElementOrder = sidebarElements.find((el) => el.labelID === hoveredId)?.order;

        if (!draggedElementOrder || !hoveredElementOrder) {
            return undefined;
        }

        const goesUp = draggedElementOrder > hoveredElementOrder;

        if (hoveredId === MAILBOX_LABEL_IDS.INBOX) {
            return 'border-bottom';
        }

        return goesUp ? 'border-top' : 'border-bottom';
    };

    // Set dragOveredElementId
    useEffect(() => {
        if (!dragOveredElementId) {
            return;
        }

        const interval = setInterval(() => {
            const lastDragTime = lastDragTimeRef.current || 0;
            const elapsedTime = Date.now() - lastDragTime;

            if (elapsedTime > 300) {
                setDragOveredElementId(undefined);
                lastDragTimeRef.current = undefined;
            }
        }, 150);

        return () => {
            clearInterval(interval);
        };
    }, [dragOveredElementId]);

    // Opens the "more" folder
    useEffect(() => {
        if (!isOverMoreFolder) {
            return;
        }

        const OPEN_FOLDER_AFTER = 1000;
        const now = Date.now();

        const timeout = setTimeout(() => {
            const lastDragOverTime = lastDragTimeRef.current || 0;
            if (now - 50 < lastDragOverTime) {
                onToggleMoreItems(true);
            }
        }, OPEN_FOLDER_AFTER);

        return () => {
            clearTimeout(timeout);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-1DDB20
    }, [isOverMoreFolder]);

    return (
        <>
            {mainElements.map((element) => {
                // When categories are enabled we show the unread count of the default category not the whole inbox
                const labelID =
                    categoryViewAccess && element.labelID === MAILBOX_LABEL_IDS.INBOX
                        ? MAILBOX_LABEL_IDS.CATEGORY_DEFAULT
                        : element.labelID;

                const locationCount = getLocationCount(counterMap, labelID);

                return (
                    <DnDElementWrapper
                        isDnDAllowed
                        key={element.ID}
                        onDragStart={handleDragStart(element.labelID)}
                        onDragEnd={handleResetDragState}
                        onDragOver={handleDragOver(element.labelID)}
                        onDrop={handleDrop(element.labelID, draggedElementId)}
                        className={clsx([getDnDClasses(element.labelID, draggedElementId)])}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <SidebarItem
                            labelID={element.labelID}
                            unreadCount={locationCount.Unread}
                            totalMessagesCount={locationCount.Total}
                            icon={element.icon}
                            id={element.ID}
                            hideCountOnHover={false}
                            isFolder={element.labelID !== MAILBOX_LABEL_IDS.STARRED}
                            onFocus={setFocusedItem}
                            shortcutText={element.shortcutText}
                            text={element.text}
                            collapsed={collapsed}
                            moveToFolder={moveToFolder}
                            applyLabels={applyLabels}
                        />
                    </DnDElementWrapper>
                );
            })}
            {!collapsed && (
                <DnDElementWrapper
                    isDnDAllowed
                    key={'MORE_FOLDER_ITEM'}
                    onDragOver={handleDragOver(DND_MORE_FOLDER_ID)}
                    onDrop={handleDrop('MORE_FOLDER_ITEM', draggedElementId)}
                >
                    <SimpleSidebarListItemHeader
                        toggle={displayMoreItems}
                        onToggle={(display: boolean) => onToggleMoreItems(display)}
                        text={displayMoreItems ? c('Link').t`Less` : c('Link').t`More`}
                        title={displayMoreItems ? c('Link').t`Less` : c('Link').t`More`}
                        id="toggle-more-items"
                        onFocus={setFocusedItem}
                        collapsed={collapsed}
                    />
                </DnDElementWrapper>
            )}

            {displayMoreItems
                ? moreElements.map((element) => {
                      const locationCount = getLocationCount(counterMap, element.labelID);

                      return (
                          <DnDElementWrapper
                              isDnDAllowed
                              onClick={(e) => e.stopPropagation()}
                              key={element.ID}
                              onDragStart={handleDragStart(element.labelID)}
                              onDragEnd={handleResetDragState}
                              onDragOver={handleDragOver(element.labelID)}
                              onDrop={handleDrop(element.labelID, draggedElementId)}
                              className={clsx([getDnDClasses(element.labelID, draggedElementId)])}
                          >
                              <SidebarItem
                                  labelID={element.labelID}
                                  unreadCount={locationCount.Unread}
                                  totalMessagesCount={locationCount.Total}
                                  icon={element.icon}
                                  id={element.ID}
                                  isFolder={element.labelID !== MAILBOX_LABEL_IDS.STARRED}
                                  hideCountOnHover={false}
                                  onFocus={setFocusedItem}
                                  shortcutText={element.shortcutText}
                                  text={element.text}
                                  collapsed={collapsed}
                                  moveToFolder={moveToFolder}
                                  applyLabels={applyLabels}
                              />
                          </DnDElementWrapper>
                      );
                  })
                : null}
        </>
    );
};

export default MailSidebarSystemFolders;
