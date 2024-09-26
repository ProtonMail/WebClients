import type { DragEvent, DragEventHandler } from 'react';
import { useEffect, useRef, useState } from 'react';

import type { Location } from 'history';
import { c } from 'ttag';

import { SimpleSidebarListItemHeader } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { isConversationMode } from '../../helpers/mailSettings';
import type { MoveParams } from '../../hooks/actions/move/useMoveToFolder';
import useMoveSystemFolders, { SYSTEM_FOLDER_SECTION } from '../../hooks/useMoveSystemFolders';
import type { UnreadCounts } from './MailSidebarList';
import SidebarItem from './SidebarItem';

interface Props {
    counterMap: UnreadCounts;
    currentLabelID: string;
    location: Location;
    mailSettings: MailSettings;
    setFocusedItem: (id: string) => void;
    totalMessagesMap: UnreadCounts;
    displayMoreItems: boolean;
    showScheduled: boolean;
    showSnoozed: boolean;
    onToggleMoreItems: (display: boolean) => void;
    collapsed?: boolean;
    moveToFolder: (params: MoveParams) => void;
    applyLabels: (params: any) => void;
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

const MailSidebarSystemFolders = ({
    counterMap,
    currentLabelID,
    location,
    mailSettings,
    setFocusedItem,
    showScheduled,
    showSnoozed,
    totalMessagesMap,
    displayMoreItems,
    onToggleMoreItems,
    collapsed = false,
    moveToFolder,
    applyLabels,
}: Props) => {
    const { ShowMoved, AlmostAllMail } = mailSettings;
    const [sidebarElements, moveSidebarElement] = useMoveSystemFolders({
        showMoved: ShowMoved,
        showScheduled,
        showSnoozed,
        showAlmostAllMail: AlmostAllMail,
    });
    const isConversation = isConversationMode(currentLabelID, mailSettings, location);

    const lastDragTimeRef = useRef<number>();
    const isDragging = useRef<boolean>();
    const dragOverlay = useRef<HTMLDivElement>();
    const [draggedElementId, setDraggedElementId] = useState<MAILBOX_LABEL_IDS | undefined>();
    const [dragOveredElementId, setDragOveredElementId] = useState<string | undefined>();
    const [isOverMoreFolder, setIsOverMoreFolder] = useState<boolean>();

    const getCommonProps = (labelID: string) => ({
        currentLabelID,
        labelID,
        isConversation,
        unreadCount: counterMap[labelID],
        totalMessagesCount: totalMessagesMap[labelID] || 0,
    });

    type HandleDragOver = (
        elementId: MAILBOX_LABEL_IDS | typeof DND_MORE_FOLDER_ID
    ) => DragEventHandler<HTMLDivElement>;
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
    }, [isOverMoreFolder]);

    return (
        <>
            {sidebarElements
                .filter((element) => element.display === SYSTEM_FOLDER_SECTION.MAIN)
                .map((element) => (
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
                            {...getCommonProps(element.labelID)}
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
                ))}
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
                ? sidebarElements
                      .filter((element) => element.display === SYSTEM_FOLDER_SECTION.MORE)
                      .map((element) => (
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
                                  {...getCommonProps(element.labelID)}
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
                      ))
                : null}
        </>
    );
};

export default MailSidebarSystemFolders;
