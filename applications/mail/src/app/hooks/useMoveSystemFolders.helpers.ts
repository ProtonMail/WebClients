import { c } from 'ttag';

import { ACCENT_COLORS, LINKED_LABEL_IDS, MAILBOX_LABEL_IDS, SHOW_MOVED } from '@proton/shared/lib/constants';
import move from '@proton/utils/move';
import orderBy from '@proton/utils/orderBy';

import {
    BaseSystemFolder,
    SYSTEM_FOLDER_SECTION,
    SystemFolder,
    SystemFolderPayload,
    UseMoveSystemFoldersProps,
} from './useMoveSystemFolders';

interface MoveSystemFolders {
    (
        draggedID: MAILBOX_LABEL_IDS,
        droppedId: MAILBOX_LABEL_IDS | 'MORE_FOLDER_ITEM',
        systemFolders: SystemFolder[]
    ): SystemFolder[];
}

/**
 * If called for "MAIN" section, result will always have at least "inbox"
 * so null is not possible in this case
 */
function getLastSectionElementIndex(collection: SystemFolder[], section: SYSTEM_FOLDER_SECTION.MAIN): number;
function getLastSectionElementIndex(collection: SystemFolder[], section: SYSTEM_FOLDER_SECTION.MORE): null | number;
function getLastSectionElementIndex(collection: SystemFolder[], section: SYSTEM_FOLDER_SECTION): null | number {
    return collection.reduce<number | null>((acc, element, index) => {
        if (element.display === section && (acc === null || index > acc) && element.visible === true) {
            acc = index;
        }
        return acc;
    }, null);
}

const cloneItem = (item: SystemFolder): SystemFolder => ({ ...item, payloadExtras: { ...item.payloadExtras } });
const reorderItems = (collection: SystemFolder[]): SystemFolder[] =>
    collection.map((item, index) => {
        const nextItem = cloneItem(item);
        // Order is not 0 based index
        nextItem.order = index + 1;

        return nextItem;
    });

const moveItems = (systemFolders: SystemFolder[], draggedItemIndex: number, droppedItemIndex: number) => {
    const movedItems = move(systemFolders, draggedItemIndex, droppedItemIndex);
    const draggedID = systemFolders[draggedItemIndex].labelID;
    const linkedID = LINKED_LABEL_IDS[draggedID];

    if (linkedID) {
        const allSentIndex = systemFolders.findIndex((item) => item.labelID === linkedID);
        if (allSentIndex !== -1) {
            return move(movedItems, allSentIndex, droppedItemIndex);
        }
    }

    return movedItems;
};

export const moveSystemFolders: MoveSystemFolders = (draggedID, droppedId, systemFolders) => {
    if (draggedID === MAILBOX_LABEL_IDS.INBOX) {
        return systemFolders;
    }

    const droppedOver: 'ITEM' | 'INBOX' | 'MORE_FOLDER' = (() => {
        if (droppedId === MAILBOX_LABEL_IDS.INBOX) {
            return 'INBOX';
        }
        if (droppedId === 'MORE_FOLDER_ITEM') {
            return 'MORE_FOLDER';
        }

        return 'ITEM';
    })();

    const draggedItemIndex = systemFolders.findIndex((el) => el.labelID === draggedID);
    const droppedItemIndex = systemFolders.findIndex((el) => el.labelID === droppedId);

    if (droppedOver === 'ITEM') {
        if (draggedItemIndex === -1 || droppedItemIndex === -1 || draggedItemIndex === droppedItemIndex) {
            return systemFolders;
        }
        const droppedItem = systemFolders[droppedItemIndex];
        const movedItems = moveItems(systemFolders, draggedItemIndex, droppedItemIndex);
        const reorderedItems = reorderItems(movedItems);
        const nextItems = reorderedItems.map((item) => {
            const clonedItem = cloneItem(item);
            const isDraggedItem = clonedItem.labelID === draggedID;
            if (isDraggedItem) {
                const changedSection = clonedItem.display !== droppedItem.display;
                if (changedSection) {
                    clonedItem.display = droppedItem.display;
                }
            }
            return clonedItem;
        });
        return nextItems;
    }

    if (droppedOver === 'INBOX') {
        const inboxItemIndex = systemFolders.findIndex((item) => item.labelID === MAILBOX_LABEL_IDS.INBOX);
        if (draggedItemIndex === -1 || inboxItemIndex === -1) {
            return systemFolders;
        }
        const inboxItem = systemFolders[inboxItemIndex];
        const movedItems = moveItems(systemFolders, draggedItemIndex, inboxItemIndex + 1);
        const reorderedItems = reorderItems(movedItems);
        const nextItems = reorderedItems.map((item) => {
            const clonedItem = cloneItem(item);
            const isDraggedItem = clonedItem.labelID === draggedID;
            if (isDraggedItem) {
                const changedSection = clonedItem.display !== inboxItem.display;
                if (changedSection) {
                    clonedItem.display = inboxItem.display;
                }
            }
            return clonedItem;
        });
        return nextItems;
    }

    if (droppedOver === 'MORE_FOLDER') {
        if (draggedItemIndex === -1) {
            return systemFolders;
        }
        const draggedItem = systemFolders[draggedItemIndex];

        const lastMoreSectionItemIndex = getLastSectionElementIndex(systemFolders, SYSTEM_FOLDER_SECTION.MORE);
        const lastMainSectionItemIndex = getLastSectionElementIndex(systemFolders, SYSTEM_FOLDER_SECTION.MAIN);

        const movedItems = moveItems(
            systemFolders,
            draggedItemIndex,
            draggedItem.display === SYSTEM_FOLDER_SECTION.MAIN
                ? lastMoreSectionItemIndex || lastMainSectionItemIndex
                : lastMainSectionItemIndex + 1
        );
        const reorderedItems = reorderItems(movedItems);
        const nextItems = reorderedItems.map((item) => {
            const clonedItem = cloneItem(item);
            const isDraggedItem = clonedItem.labelID === draggedID;
            if (isDraggedItem) {
                const nextSection =
                    clonedItem.display === SYSTEM_FOLDER_SECTION.MORE
                        ? SYSTEM_FOLDER_SECTION.MAIN
                        : SYSTEM_FOLDER_SECTION.MORE;
                clonedItem.display = nextSection;
            }
            return clonedItem;
        });
        return nextItems;
    }

    return systemFolders;
};

export const getDefaultSytemFolders = (
    showMoved: UseMoveSystemFoldersProps['showMoved'],
    showScheduled: UseMoveSystemFoldersProps['showScheduled']
): BaseSystemFolder[] => [
    {
        labelID: MAILBOX_LABEL_IDS.INBOX,
        ID: 'inbox',
        icon: 'inbox',
        text: c('Link').t`Inbox`,
        shortcutText: '[G] [I]',
        visible: true,
        order: 1,
        display: SYSTEM_FOLDER_SECTION.MAIN,
    },
    {
        labelID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
        ID: 'drafts',
        icon: 'file-lines',
        text: c('Link').t`Drafts`,
        shortcutText: '[G] [D]',
        visible: !!(showMoved & SHOW_MOVED.DRAFTS),
        order: 2,
        display: SYSTEM_FOLDER_SECTION.MAIN,
    },
    {
        labelID: MAILBOX_LABEL_IDS.DRAFTS,
        ID: 'drafts',
        icon: 'file-lines',
        text: c('Link').t`Drafts`,
        shortcutText: '[G] [D]',
        visible: !(showMoved & SHOW_MOVED.DRAFTS),
        order: 3,
        display: SYSTEM_FOLDER_SECTION.MAIN,
    },
    {
        labelID: MAILBOX_LABEL_IDS.SCHEDULED,
        icon: 'clock',
        text: c('Link').t`Scheduled`,
        ID: 'scheduled',
        visible: !!showScheduled,
        order: 4,
        display: SYSTEM_FOLDER_SECTION.MAIN,
    },
    {
        labelID: MAILBOX_LABEL_IDS.ALL_SENT,
        ID: 'sent',
        icon: 'paper-plane',
        text: c('Link').t`Sent`,
        shortcutText: '[G] [E]',
        visible: !!(showMoved & SHOW_MOVED.SENT),
        order: 5,
        display: SYSTEM_FOLDER_SECTION.MAIN,
    },
    {
        labelID: MAILBOX_LABEL_IDS.SENT,
        ID: 'sent',
        icon: 'paper-plane',
        text: c('Link').t`Sent`,
        shortcutText: '[G] [E]',
        visible: !(showMoved & SHOW_MOVED.SENT),
        order: 6,
        display: SYSTEM_FOLDER_SECTION.MAIN,
    },
    {
        labelID: MAILBOX_LABEL_IDS.STARRED,
        icon: 'star',
        text: c('Link').t`Starred`,
        shortcutText: '[G] [*]',
        ID: 'starred',
        visible: true,
        order: 7,
        display: SYSTEM_FOLDER_SECTION.MAIN,
    },
    {
        labelID: MAILBOX_LABEL_IDS.ARCHIVE,
        icon: 'archive-box',
        text: c('Link').t`Archive`,
        shortcutText: '[G] [A]',
        ID: 'archive',
        visible: true,
        order: 8,
        display: SYSTEM_FOLDER_SECTION.MORE,
    },
    {
        labelID: MAILBOX_LABEL_IDS.SPAM,
        icon: 'fire',
        text: c('Link').t`Spam`,
        shortcutText: '[G] [S]',
        ID: 'spam',
        visible: true,
        order: 9,
        display: SYSTEM_FOLDER_SECTION.MORE,
    },
    {
        labelID: MAILBOX_LABEL_IDS.TRASH,
        icon: 'trash',
        text: c('Link').t`Trash`,
        shortcutText: '[G] [T]',
        ID: 'trash',
        visible: true,
        order: 10,
        display: SYSTEM_FOLDER_SECTION.MORE,
    },
    {
        labelID: MAILBOX_LABEL_IDS.ALL_MAIL,
        icon: 'envelopes',
        text: c('Link').t`All mail`,
        shortcutText: '[G] [M]',
        ID: 'allmail',
        visible: true,
        order: 11,
        display: SYSTEM_FOLDER_SECTION.MORE,
    },
    {
        labelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
        icon: 'envelopes',
        text: c('Link').t`All mail`,
        shortcutText: '[G] [M]',
        ID: 'almostallmail',
        visible: false,
        order: 13,
        display: SYSTEM_FOLDER_SECTION.MORE,
    },
    {
        /** Added for mapping with API, we dont display outbox */
        labelID: MAILBOX_LABEL_IDS.OUTBOX,
        icon: 'arrow-right',
        text: c('Link').t`Outbox`,
        ID: 'outbox',
        order: 12,
        visible: false,
        display: SYSTEM_FOLDER_SECTION.MORE,
    },
];

export const getSidebarNavItems = (
    showMoved: UseMoveSystemFoldersProps['showMoved'],
    showScheduled: UseMoveSystemFoldersProps['showScheduled'],
    sidebarNavItemsPayload: SystemFolderPayload[]
): SystemFolder[] => {
    const systemFolders = getDefaultSytemFolders(showMoved, showScheduled);

    /**
     * 1 - Fill the needed data from API
     */
    const formattedSystemFolders = systemFolders
        .map((systemFolder): SystemFolder | null => {
            const itemPayload = sidebarNavItemsPayload.find((pItem) => {
                return pItem.ID === systemFolder.labelID;
            });

            if (!itemPayload) {
                return null;
            }

            return {
                ...systemFolder,
                order: itemPayload.Order ?? systemFolder.order,
                display: itemPayload.Display ?? systemFolder.display,
                payloadExtras: {
                    // Voluntary override in order to guarantee a valid color
                    Color: ACCENT_COLORS[0],
                    Name: itemPayload.Name,
                },
            };
        })
        .filter((item): item is SystemFolder => item !== null);

    /**
     * 2 - Split list in two sections (MAIN and MORE) and order them by 'order' value
     */
    const mainSectionSystemFolders = orderBy(
        formattedSystemFolders.filter((item) => item.display === SYSTEM_FOLDER_SECTION.MAIN),
        'order'
    );
    const moreSectionSystemFolders = orderBy(
        formattedSystemFolders.filter((item) => item.display === SYSTEM_FOLDER_SECTION.MORE),
        'order'
    );

    /**
     * 3 - Merge previous ordered lists into 1 and update the order value based on the index
     */
    const reorderedSystemFolders = [...mainSectionSystemFolders, ...moreSectionSystemFolders].map((item, index) => ({
        ...item,
        order: index + 1,
    }));

    return reorderedSystemFolders;
};
